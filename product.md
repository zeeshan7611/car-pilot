# BACKEND — AI SALES & MARKETING OS

You are a senior backend architect and engineer.

We are building a SaaS platform for used-car dealerships first, but the architecture must remain generic enough to expand later to other inventory-based businesses.

## PRIMARY MVP GOAL

The first real-world pilot is for a used-car dealer.

The MVP must prove:

> Dealer uploads inventory → promotes existing car Reels on Facebook/Instagram → generates enquiries → captures leads → tracks lead conversion.

Do NOT build the entire long-term platform initially.

Focus on production-quality foundations and the following MVP:

1. Authentication
2. Multi-tenant organization
3. Users/RBAC
4. Inventory
5. Media storage
6. Facebook/Instagram OAuth connection
7. Instagram/Facebook publishing
8. Meta Ad Account connection
9. Promote existing Reel
10. Meta campaign creation
11. Basic AI Marketing Engine
12. Lead capture
13. Unified Facebook/Instagram inbox
14. Basic AI lead qualification
15. Follow-ups
16. Basic campaign analytics
17. Lead → Test Drive → Sale tracking

## TECH STACK

* Node.js
* TypeScript
* Express.js
* MongoDB
* Mongoose
* Redis
* BullMQ
* JWT
* REST APIs
* AWS S3
* FFmpeg
* Docker

Use strict TypeScript.

Avoid `any`.

Use environment variables for secrets.

Create `.env.example`.

Never commit secrets.

---

# ARCHITECTURE

Use a modular monolith initially.

Structure:

apps/api/src/

```text
config/
controllers/
services/
repositories/
models/
routes/
middlewares/
validators/
jobs/
queues/
integrations/
  meta/
    auth/
    instagram/
    facebook/
    ads/
ai/
storage/
utils/
types/
constants/
app.ts
server.ts
```

Keep:

Controller → Service → Repository → Database

External APIs must be isolated behind integration services.

Never call Meta APIs directly from controllers.

Never call AI providers directly from controllers.

---

# MULTI-TENANCY

Every business-owned resource must contain:

`organizationId`

Create:

* Organization
* User
* Role
* Permission

Initial roles:

* OWNER
* ADMIN
* SALES_MANAGER
* SALES_EXECUTIVE
* MARKETING_MANAGER

Every request must verify organization access.

Never allow cross-tenant data access.

---

# AUTHENTICATION

Implement:

* Register
* Login
* Logout
* Refresh token
* Password hashing
* Forgot password structure
* Reset password structure
* Email verification structure
* RBAC

Use secure JWT access/refresh token architecture.

---

# INVENTORY

Use a generic model:

`InventoryItem`

Fields:

```text
organizationId
title
description
category
brand
model
price
sellingPrice
purchasePrice
status
media
location
specifications
tags
createdBy
updatedBy
createdAt
updatedAt
```

Vehicle-specific data belongs inside `specifications`.

Example:

```text
registrationYear
manufacturingYear
fuelType
transmission
kilometers
ownership
color
engine
insurance
registrationNumber
city
```

Statuses:

```text
DRAFT
AVAILABLE
RESERVED
SOLD
ARCHIVED
```

Media:

```text
images
videos
documents
```

Store files in S3.

Store only metadata/keys/URLs in MongoDB.

---

# META INTEGRATION

This is a critical MVP module.

Use official Meta APIs only.

Never use:

* password automation
* browser automation
* WhatsApp Web automation
* QR scraping
* session scraping

Dealer must explicitly authorize the platform through OAuth.

The system should support:

```text
Facebook Page
Instagram Professional Account
Meta Ad Account
```

Create:

`SocialAccount`

Fields:

```text
organizationId
platform
accountId
accountName
accessTokenEncrypted
tokenExpiresAt
status
metadata
```

Never expose tokens to frontend.

Create:

`MetaIntegrationService`

Methods:

```text
getAuthorizationUrl()
handleOAuthCallback()
getConnectedPages()
getInstagramAccounts()
getAdAccounts()
publishPost()
publishReel()
getInsights()
createCampaign()
createAdSet()
createAdCreative()
createAd()
pauseCampaign()
updateCampaignBudget()
```

Keep all Meta-specific implementation inside:

```text
integrations/meta/
```

---

# SOCIAL PUBLISHING

Dealer should be able to select an existing Reel/content item and publish it.

Example:

```text
Inventory
↓
Existing Reel
↓
Publish
↓
Instagram
Facebook
```

Publishing must be asynchronous through BullMQ.

Create jobs:

```text
social-publishing
```

Jobs must be idempotent and retryable.

---

# META AD ENGINE

This is the primary USP of the MVP.

Dealer should be able to:

```text
Select Reel
↓
Promote Reel
↓
Choose budget
↓
Choose duration
↓
Choose location
↓
Choose campaign goal
↓
Launch
```

Example:

```text
Budget: ₹200/day
Duration: 7 days
Location: Nagpur
Goal: Messages/Leads
```

The backend should create the required Meta campaign structure through the Marketing API.

Conceptually:

```text
Campaign
  ↓
Ad Set
  ↓
Ad Creative
  ↓
Ad
```

The dealer's connected Meta Ad Account pays Meta directly.

Our SaaS must NOT hold or mix the advertising budget.

Our platform charges its own SaaS/marketing management fee separately.

---

# AI MARKETING ENGINE V1

Do not over-engineer AI initially.

Create an abstraction:

`AIMarketingService`

Responsibilities:

```text
selectProductsForPromotion()
recommendBudget()
generateAdCopy()
analyzeCampaignPerformance()
recommendBudgetAdjustment()
detectPoorPerformingCampaign()
```

Initial rules can be hybrid:

```text
Rules + campaign metrics + AI recommendations
```

Do NOT allow AI to blindly spend money.

All budget changes must respect:

```text
dailyBudgetLimit
campaignBudgetLimit
organizationBudgetLimit
```

Example:

```text
Good CPL
→ recommend/increase budget

Poor CPL
→ reduce/pause campaign

High engagement + low enquiries
→ recommend creative/CTA change
```

---

# CAMPAIGN ANALYTICS

Track:

```text
spend
impressions
reach
clicks
CTR
messages
leads
costPerLead
qualifiedLeads
testDrives
sales
```

Most important business metric:

```text
Ad Spend
↓
Leads
↓
Qualified Leads
↓
Test Drives
↓
Sales
```

Do not optimize only for impressions.

---

# LEADS

Create:

`Lead`

Fields:

```text
organizationId
name
phone
email
source
campaignId
inventoryItemId
status
temperature
assignedTo
budget
notes
lastContactAt
nextFollowUpAt
createdAt
updatedAt
```

Statuses:

```text
NEW
CONTACTED
QUALIFIED
APPOINTMENT_BOOKED
NEGOTIATION
WON
LOST
```

Temperature:

```text
HOT
WARM
COLD
```

Track campaign attribution.

Example:

```text
Instagram
→ Campaign X
→ Honda City
→ Rahul
```

---

# UNIFIED INBOX

MVP channels:

```text
INSTAGRAM
FACEBOOK
```

WhatsApp can be added later.

Create:

`Conversation`

```text
organizationId
leadId
channel
externalConversationId
assignedAgent
status
lastMessageAt
```

Create:

`Message`

```text
conversationId
senderType
senderId
messageType
content
media
metadata
createdAt
```

Sender types:

```text
CUSTOMER
AI
HUMAN
SYSTEM
```

The backend should normalize incoming Meta webhook events into our internal message format.

Flow:

```text
Instagram/Facebook Webhook
↓
Message Normalizer
↓
Conversation
↓
Lead
↓
AI/Human
```

---

# WEBHOOKS

Create secure webhook endpoints.

Example:

```text
GET /api/webhooks/meta
POST /api/webhooks/meta
```

Implement:

* verification
* signature validation
* idempotency
* duplicate event protection
* logging
* retry-safe processing

Incoming messages should create/update conversations and leads.

---

# AI SALES AGENT V1

Keep the first version simple.

AI should:

* understand inventory
* answer basic car questions
* identify interested vehicle
* ask budget
* ask location
* identify buying intent
* recommend relevant inventory
* ask about test drive
* qualify the lead
* escalate when uncertain

AI must not make unauthorized discounts or promises.

Create:

`AIAgentConfig`

```text
organizationId
enabled
businessName
tone
language
greeting
qualificationQuestions
escalationRules
allowedActions
businessRules
```

---

# HUMAN HANDOFF

AI must support:

```text
AI_HANDLING
HUMAN_HANDLING
```

Escalate when:

* customer asks for human
* negotiation
* angry customer
* complex question
* low AI confidence
* high-value lead

When salesperson takes over:

> AI must stop replying automatically.

---

# FOLLOW-UP ENGINE

Use BullMQ.

Do NOT use `setTimeout` for business-critical follow-ups.

Example:

```text
New enquiry
↓
Immediate response
↓
2 hours
↓
Next day
↓
3 days
↓
7 days
```

Create:

```text
FollowUpSequence
FollowUpStep
```

Queue:

```text
follow-up
```

---

# APPOINTMENTS

Create basic appointment support.

Types:

```text
TEST_DRIVE
MEETING
CALL
```

Fields:

```text
organizationId
leadId
inventoryItemId
assignedTo
scheduledAt
status
notes
```

Statuses:

```text
SCHEDULED
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW
```

---

# SALES TRACKING

Create a simple:

`Deal`

Fields:

```text
organizationId
leadId
inventoryItemId
salesperson
purchasePrice
sellingPrice
discount
expenses
profit
status
soldAt
```

Calculate:

```text
grossProfit = sellingPrice - purchasePrice
```

Track advertising cost and other expenses separately.

---

# BACKGROUND JOBS

Use BullMQ.

Queues:

```text
content-generation
reel-generation
social-publishing
meta-webhooks
lead-processing
ai-response
follow-up
analytics
campaign-optimization
notifications
```

All jobs:

* idempotent
* retryable
* observable
* failure-safe

Expensive operations must never block HTTP requests.

---

# DATABASE INDEXES

Important indexes:

```text
organizationId
organizationId + status
organizationId + createdAt
organizationId + assignedTo
organizationId + phone
organizationId + inventoryItemId
organizationId + nextFollowUpAt
organizationId + campaignId
```

Add only useful indexes.

Use timestamps.

Use transactions where business consistency requires them.

---

# API DESIGN

Use REST.

Examples:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

GET /api/inventory
POST /api/inventory
GET /api/inventory/:id
PATCH /api/inventory/:id

POST /api/inventory/:id/ai-content

GET /api/leads
GET /api/leads/:id
PATCH /api/leads/:id

GET /api/conversations
GET /api/conversations/:id/messages
POST /api/conversations/:id/messages

GET /api/integrations
POST /api/integrations/meta/connect
GET /api/integrations/meta/callback

POST /api/inventory/:id/publish
POST /api/inventory/:id/promote

GET /api/campaigns
GET /api/campaigns/:id
POST /api/campaigns
POST /api/campaigns/:id/pause
POST /api/campaigns/:id/resume

GET /api/analytics/campaigns
GET /api/analytics/leads
```

Response:

```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

Errors:

```json
{
  "success": false,
  "message": "...",
  "code": "...",
  "errors": []
}
```

---

# SECURITY

Implement:

* Helmet
* CORS
* Rate limiting
* Request validation
* Mongo sanitization
* RBAC
* tenant isolation
* file validation
* S3 security
* encrypted OAuth tokens
* centralized error handling
* structured logging

Never expose:

```text
passwords
OAuth tokens
API keys
internal credentials
```

---

# DEVELOPMENT PROCESS

Do NOT generate the entire backend blindly.

First:

1. Inspect repository.
2. Identify existing backend.
3. Identify package manager.
4. Identify existing architecture.
5. Identify dependencies.
6. Identify environment configuration.
7. Propose exact backend structure.

Then implement in this order:

### Phase A

* Foundation
* Auth
* Organization
* RBAC
* Inventory
* S3

### Phase B

* Meta OAuth
* Facebook/Instagram connection
* Publishing
* Webhooks

### Phase C

* Meta Ads
* Promote Reel
* Campaign engine
* Basic analytics

### Phase D

* Leads
* Unified inbox
* AI qualification
* Follow-ups

### Phase E

* Appointments
* Sales tracking
* Advanced optimization

After every phase:

* TypeScript check
* lint
* tests
* build
* verify imports
* verify routes
* verify database schemas

Do not leave fake functionality pretending to work.

For integrations requiring credentials, create clean adapters and development mocks.

---

# IMPORTANT

The first success metric is NOT:

> "The API works."

The first business success metric is:

```text
Ad Spend
→ Enquiries
→ Qualified Leads
→ Test Drives
→ Sales
```

Build the backend around proving this outcome.
