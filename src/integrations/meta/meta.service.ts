import axios from 'axios';
import { CryptoUtil } from '../../utils/crypto.js';
import { SocialAccount, ISocialAccount } from '../../models/SocialAccount.js';
import mongoose from 'mongoose';

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
}

export interface MetaAdAccount {
  id: string; // act_<id>
  name: string;
  account_status: number;
  currency: string;
}

export interface PublishReelParams {
  organizationId: mongoose.Types.ObjectId;
  videoUrl: string;
  caption: string;
}

export interface PromoteReelParams {
  organizationId: mongoose.Types.ObjectId;
  reelVideoUrl: string;
  caption: string;
  dailyBudget: number; // e.g. in INR or target currency
  durationDays: number;
  locationName: string;
  targetRadiusKm?: number;
  goal: 'LEADS' | 'MESSAGES';
}

export class MetaIntegrationService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly redirectUri: string;
  private readonly graphApiVersion = 'v20.0';
  private readonly baseUrl = 'https://graph.facebook.com';

  constructor() {
    this.appId = process.env.META_APP_ID || 'mock_meta_app_id';
    this.appSecret = process.env.META_APP_SECRET || 'mock_meta_app_secret';
    this.redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:5000/api/integrations/meta/callback';
  }

  /**
   * Generates official Meta OAuth URL for Dealer connection
   */
  getAuthorizationUrl(state: string): string {
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_messages',
      'ads_management',
      'ads_read',
    ].join(',');

    return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code`;
  }

  /**
   * Exchanges OAuth code for long-lived User Access Token & syncs accounts
   */
  async handleOAuthCallback(code: string, organizationId: mongoose.Types.ObjectId): Promise<{ success: boolean; accountsConnected: number }> {
    // Development / Mock fallback when credentials are not yet configured in env
    if (this.appId === 'mock_meta_app_id' || code.startsWith('mock_')) {
      return this.syncMockDealerAccounts(organizationId);
    }

    try {
      // 1. Exchange authorization code for User Access Token
      const tokenRes = await axios.get(`${this.baseUrl}/${this.graphApiVersion}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code,
        },
      });

      const userAccessToken = tokenRes.data.access_token;

      // 2. Exchange for Long-Lived Token
      const longLivedRes = await axios.get(`${this.baseUrl}/${this.graphApiVersion}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: userAccessToken,
        },
      });
      const longLivedToken = longLivedRes.data.access_token;

      // 3. Fetch connected Pages & IG Business Accounts
      const pagesRes = await axios.get(`${this.baseUrl}/${this.graphApiVersion}/me/accounts`, {
        params: {
          access_token: longLivedToken,
          fields: 'id,name,access_token,category,instagram_business_account{id,username}',
        },
      });

      const pages: MetaPage[] = pagesRes.data.data || [];
      let count = 0;

      for (const page of pages) {
        // Save Facebook Page
        await SocialAccount.findOneAndUpdate(
          { organizationId, platform: 'FACEBOOK', accountId: page.id },
          {
            organizationId,
            platform: 'FACEBOOK',
            accountId: page.id,
            accountName: page.name,
            accessTokenEncrypted: CryptoUtil.encrypt(page.access_token),
            status: 'ACTIVE',
            metadata: { category: page.category },
          },
          { upsert: true, new: true },
        );
        count++;

        // If page has linked Instagram Business Account, save it
        if (page.instagram_business_account) {
          await SocialAccount.findOneAndUpdate(
            { organizationId, platform: 'INSTAGRAM', accountId: page.instagram_business_account.id },
            {
              organizationId,
              platform: 'INSTAGRAM',
              accountId: page.instagram_business_account.id,
              accountName: page.instagram_business_account.username || `${page.name} Instagram`,
              accessTokenEncrypted: CryptoUtil.encrypt(page.access_token), // Page token manages linked IG
              status: 'ACTIVE',
              metadata: { linkedPageId: page.id },
            },
            { upsert: true, new: true },
          );
          count++;
        }
      }

      // 4. Fetch Meta Ad Accounts
      const adAccountsRes = await axios.get(`${this.baseUrl}/${this.graphApiVersion}/me/adaccounts`, {
        params: {
          access_token: longLivedToken,
          fields: 'id,name,account_status,currency',
        },
      });

      const adAccounts: MetaAdAccount[] = adAccountsRes.data.data || [];
      for (const adAcc of adAccounts) {
        await SocialAccount.findOneAndUpdate(
          { organizationId, platform: 'META_ADS', accountId: adAcc.id },
          {
            organizationId,
            platform: 'META_ADS',
            accountId: adAcc.id,
            accountName: adAcc.name || `Ad Account (${adAcc.id})`,
            accessTokenEncrypted: CryptoUtil.encrypt(longLivedToken),
            status: 'ACTIVE',
            metadata: { currency: adAcc.currency, accountStatus: adAcc.account_status },
          },
          { upsert: true, new: true },
        );
        count++;
      }

      return { success: true, accountsConnected: count };
    } catch (error: any) {
      console.error('Error handling Meta OAuth callback:', error.response?.data || error.message);
      throw new Error(`Meta OAuth connection failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Publishes Reel to connected Instagram Business Account
   */
  async publishReel(params: PublishReelParams): Promise<{ mediaId: string; status: string }> {
    const igAccount = await SocialAccount.findOne({
      organizationId: params.organizationId,
      platform: 'INSTAGRAM',
      status: 'ACTIVE',
    });

    if (!igAccount) {
      // Mock publish if in test mode
      return {
        mediaId: `mock_reel_${Date.now()}`,
        status: 'PUBLISHED_MOCK',
      };
    }

    const accessToken = CryptoUtil.decrypt(igAccount.accessTokenEncrypted);

    try {
      // Step 1: Create IG Container for Reel
      const containerRes = await axios.post(
        `${this.baseUrl}/${this.graphApiVersion}/${igAccount.accountId}/media`,
        null,
        {
          params: {
            media_type: 'REELS',
            video_url: params.videoUrl,
            caption: params.caption,
            access_token: accessToken,
          },
        },
      );

      const creationId = containerRes.data.id;

      // Step 2: Publish Container
      const publishRes = await axios.post(
        `${this.baseUrl}/${this.graphApiVersion}/${igAccount.accountId}/media_publish`,
        null,
        {
          params: {
            creation_id: creationId,
            access_token: accessToken,
          },
        },
      );

      return {
        mediaId: publishRes.data.id,
        status: 'PUBLISHED',
      };
    } catch (error: any) {
      console.error('Failed to publish Reel to Instagram:', error.response?.data || error.message);
      throw new Error(`Instagram Reel publish error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * MVP USP: Promotes an existing car Reel with Campaign -> Ad Set -> Creative -> Ad
   */
  async promoteReel(params: PromoteReelParams): Promise<{ campaignId: string; adSetId: string; adId: string; status: string }> {
    const adAccount = await SocialAccount.findOne({
      organizationId: params.organizationId,
      platform: 'META_ADS',
      status: 'ACTIVE',
    });

    // Guard: Ad account check or mock response
    if (!adAccount || this.appId === 'mock_meta_app_id') {
      const mockId = `mock_meta_camp_${Date.now()}`;
      return {
        campaignId: mockId,
        adSetId: `mock_adset_${Date.now()}`,
        adId: `mock_ad_${Date.now()}`,
        status: 'ACTIVE',
      };
    }

    const accessToken = CryptoUtil.decrypt(adAccount.accessTokenEncrypted);
    const actId = adAccount.accountId.startsWith('act_') ? adAccount.accountId : `act_${adAccount.accountId}`;

    try {
      // 1. Create Campaign
      const campaignRes = await axios.post(`${this.baseUrl}/${this.graphApiVersion}/${actId}/campaigns`, null, {
        params: {
          name: `Reel Promo - ${params.locationName} (${new Date().toLocaleDateString()})`,
          objective: params.goal === 'MESSAGES' ? 'OUTCOME_ENGAGEMENT' : 'OUTCOME_LEADS',
          status: 'ACTIVE',
          special_ad_categories: '[]',
          access_token: accessToken,
        },
      });
      const campaignId = campaignRes.data.id;

      // 2. Create Ad Set with Daily Budget
      // Meta daily budget is in subunit (cents / paise)
      const dailyBudgetSubunits = Math.round(params.dailyBudget * 100);
      const adSetRes = await axios.post(`${this.baseUrl}/${this.graphApiVersion}/${actId}/adsets`, null, {
        params: {
          name: `AdSet - ${params.locationName} - Radius ${params.targetRadiusKm || 25}km`,
          campaign_id: campaignId,
          daily_budget: dailyBudgetSubunits,
          billing_event: 'IMPRESSIONS',
          optimization_goal: params.goal === 'MESSAGES' ? 'CONVERSATIONS' : 'LEAD_GENERATION',
          bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
          targeting: JSON.stringify({
            geo_locations: {
              cities: [{ name: params.locationName, radius: params.targetRadiusKm || 25, distance_unit: 'kilometer' }],
            },
            age_min: 22,
            age_max: 60,
          }),
          status: 'ACTIVE',
          access_token: accessToken,
        },
      });
      const adSetId = adSetRes.data.id;

      // 3. Create Ad Creative & Ad
      const creativeRes = await axios.post(`${this.baseUrl}/${this.graphApiVersion}/${actId}/adcreatives`, null, {
        params: {
          name: `Creative - Car Reel Promo`,
          object_story_spec: JSON.stringify({
            page_id: (await SocialAccount.findOne({ organizationId: params.organizationId, platform: 'FACEBOOK' }))?.accountId,
            video_data: {
              video_url: params.reelVideoUrl,
              message: params.caption,
              call_to_action: {
                type: params.goal === 'MESSAGES' ? 'SEND_MESSAGE' : 'SIGN_UP',
              },
            },
          }),
          access_token: accessToken,
        },
      });
      const creativeId = creativeRes.data.id;

      const adRes = await axios.post(`${this.baseUrl}/${this.graphApiVersion}/${actId}/ads`, null, {
        params: {
          name: `Ad - Car Reel`,
          adset_id: adSetId,
          creative: JSON.stringify({ creative_id: creativeId }),
          status: 'ACTIVE',
          access_token: accessToken,
        },
      });

      return {
        campaignId,
        adSetId,
        adId: adRes.data.id,
        status: 'ACTIVE',
      };
    } catch (error: any) {
      console.error('Failed to create Meta campaign structure:', error.response?.data || error.message);
      throw new Error(`Meta Ad Engine creation error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Fallback mock sync for local development without live Meta credentials
   */
  private async syncMockDealerAccounts(organizationId: mongoose.Types.ObjectId): Promise<{ success: boolean; accountsConnected: number }> {
    await SocialAccount.findOneAndUpdate(
      { organizationId, platform: 'FACEBOOK', accountId: 'mock_fb_page_101' },
      {
        organizationId,
        platform: 'FACEBOOK',
        accountId: 'mock_fb_page_101',
        accountName: 'Premium Motors Dealership',
        accessTokenEncrypted: CryptoUtil.encrypt('mock_fb_token_xyz'),
        status: 'ACTIVE',
        metadata: { category: 'Car Dealership' },
      },
      { upsert: true, new: true },
    );

    await SocialAccount.findOneAndUpdate(
      { organizationId, platform: 'INSTAGRAM', accountId: 'mock_ig_account_202' },
      {
        organizationId,
        platform: 'INSTAGRAM',
        accountId: 'mock_ig_account_202',
        accountName: 'premiummotors_cars',
        accessTokenEncrypted: CryptoUtil.encrypt('mock_ig_token_xyz'),
        status: 'ACTIVE',
        metadata: { linkedPageId: 'mock_fb_page_101' },
      },
      { upsert: true, new: true },
    );

    await SocialAccount.findOneAndUpdate(
      { organizationId, platform: 'META_ADS', accountId: 'act_999000111' },
      {
        organizationId,
        platform: 'META_ADS',
        accountId: 'act_999000111',
        accountName: 'Premium Motors Ads Manager',
        accessTokenEncrypted: CryptoUtil.encrypt('mock_ad_token_xyz'),
        status: 'ACTIVE',
        metadata: { currency: 'INR', accountStatus: 1 },
      },
      { upsert: true, new: true },
    );

    return { success: true, accountsConnected: 3 };
  }
}
