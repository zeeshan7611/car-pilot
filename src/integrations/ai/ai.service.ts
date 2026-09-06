export interface AIService {
  generateProductCopy(specs: {
    title: string;
    brand: string;
    model: string;
    price: number;
    specifications?: Record<string, unknown>;
  }): Promise<{
    title: string;
    description: string;
    socialCaption: string;
    hashtags: string;
    whatsappMessage: string;
    adCopy: string;
  }>;

  respondToLead(context: {
    customerMessage: string;
    leadName: string;
    inventoryDetails?: string;
    conversationHistory?: string[];
    allowedDiscountPercent?: number;
  }): Promise<{
    reply: string;
    action: 'REPLY' | 'ESCALATE_TO_HUMAN' | 'BOOK_TEST_DRIVE';
    qualificationScore?: number;
    intent?: string;
  }>;
}

export class MockAIService implements AIService {
  async generateProductCopy(specs: {
    title: string;
    brand: string;
    model: string;
    price: number;
    specifications?: Record<string, unknown>;
  }) {
    const km = (specs.specifications as { kilometers?: number })?.kilometers || 35000;
    const fuel = (specs.specifications as { fuelType?: string })?.fuelType || 'Petrol';
    const formattedPrice = `₹${(specs.price / 100000).toFixed(2)} Lakh`;

    return {
      title: specs.title,
      description: `Pristine condition ${specs.title}. Meticulously maintained, verified paperwork, and certified mechanical inspection. Featuring ${fuel} powertrain and only ${km.toLocaleString('en-IN')} kilometers on the road.`,
      socialCaption: `🔥 JUST ARRIVED: ${specs.title}\n💰 Asking Price: ${formattedPrice}\n⚙️ ${fuel} | ${km.toLocaleString('en-IN')} km\n✅ Certified Pre-Owned & Ready for Delivery\n📍 Visit showroom or message us directly to reserve!`,
      hashtags: `#UsedCars #${specs.brand} #${specs.model} #CarSale #PreOwnedCars #CertifiedCars`,
      whatsappMessage: `Hi there! Thank you for inquiring about the ${specs.title} (${formattedPrice}). Are you looking for a test drive or financing options?`,
      adCopy: `Drive home the ${specs.title} for just ${formattedPrice}! Certified quality with simple financing approvals. Tap below to claim this deal before it is gone!`,
    };
  }

  async respondToLead(context: {
    customerMessage: string;
    leadName: string;
    inventoryDetails?: string;
    conversationHistory?: string[];
    allowedDiscountPercent?: number;
  }) {
    const msg = context.customerMessage.toLowerCase();

    // Check frustration or negotiation escalation
    if (msg.includes('human') || msg.includes('manager') || msg.includes('bad') || msg.includes('scam')) {
      return {
        reply: `I understand completely, ${context.leadName}. Let me instantly hand you over to our senior dealership sales manager right now.`,
        action: 'ESCALATE_TO_HUMAN' as const,
        intent: 'FRUSTRATION_ESCALATION',
      };
    }

    // Heavy negotiation check
    if (msg.includes('lowest') || msg.includes('discount') || msg.includes('offer')) {
      return {
        reply: `We offer competitive, certified pre-inspected pricing. I can offer up to a ${context.allowedDiscountPercent || 5}% on-the-spot closing courtesy, or connect you with our financing desk. Would you like to schedule a quick test drive first?`,
        action: 'REPLY' as const,
        qualificationScore: 85,
        intent: 'PRICE_NEGOTIATION',
      };
    }

    if (msg.includes('test drive') || msg.includes('available') || msg.includes('see the car')) {
      return {
        reply: `Yes, it is currently in our showroom and available! We have slots open this afternoon and tomorrow morning. Which time suits you best for a test drive?`,
        action: 'BOOK_TEST_DRIVE' as const,
        qualificationScore: 95,
        intent: 'HIGH_BUYING_INTENT',
      };
    }

    return {
      reply: `Hello ${context.leadName}! Thank you for contacting our dealership. How can I best assist you with your car search today?`,
      action: 'REPLY' as const,
      qualificationScore: 70,
      intent: 'GENERAL_INQUIRY',
    };
  }
}
