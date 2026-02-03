/**
 * AI 견적 컨설팅 (Claude 3.5 Haiku)
 * - 가격 제안
 * - 견적서 검토
 * - 협상 도우미
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Claude 3 Haiku - 가장 저렴하고 빠른 모델
// Input: $0.25/MTok, Output: $1.25/MTok
// 견적 1건당 비용: ~$0.0018 (약 2.4원)
const MODEL = 'claude-3-haiku-20240307';

export interface QuoteAdviceInput {
  projectDescription: string;
  estimatedHours?: number;
  industry?: string;
  customerType?: 'business' | 'individual';
}

export interface QuoteAdviceOutput {
  priceRange: {
    min: number;
    max: number;
  };
  recommendedPrice: number;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    reasoning: string;
  }>;
  hourlyRate: {
    min: number;
    max: number;
  };
  totalHours: number;
  advice: string;
  risks: string[];
}

/**
 * 가격 제안 (AI 컨설팅)
 */
export async function getQuoteAdvice(
  input: QuoteAdviceInput
): Promise<QuoteAdviceOutput> {
  const { projectDescription, estimatedHours, industry, customerType } = input;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.7,

    system: `Du bist ein Experte für Preisgestaltung und Angebotserstellung in Deutschland.
Du hilfst GmbH-Unternehmen bei der Kalkulation von Projektpreisen.

Wichtige Punkte:
- Berücksichtige den deutschen Markt und übliche Stundensätze
- Kalkuliere 19% MwSt. ein (B2B innerhalb Deutschlands)
- Sei konservativ aber fair
- Gib konkrete, umsetzbare Empfehlungen`,

    messages: [
      {
        role: 'user',
        content: `Projekt: ${projectDescription}

${estimatedHours ? `Geschätzte Stunden: ${estimatedHours}` : ''}
${industry ? `Branche: ${industry}` : ''}
${customerType ? `Kundentyp: ${customerType === 'business' ? 'B2B' : 'B2C'}` : ''}

Bitte erstelle:
1. Empfohlener Preis (Netto-Bereich in EUR)
2. Aufschlüsselung in 3-5 Positionen mit Einzelpreisen
3. Typische Stundensätze für diese Art von Projekt
4. Risiken und Hinweise zur Preisgestaltung

Antworte in JSON-Format:
{
  "priceRange": { "min": number, "max": number },
  "recommendedPrice": number,
  "items": [
    {
      "description": string,
      "quantity": number,
      "unit": string,
      "unitPrice": number,
      "reasoning": string
    }
  ],
  "hourlyRate": { "min": number, "max": number },
  "totalHours": number,
  "advice": string,
  "risks": string[]
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // JSON 파싱
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * 견적서 검토
 */
export async function reviewQuote(quote: {
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalNet: number;
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.5,

    system: `Du überprüfst Angebote auf Vollständigkeit, Klarheit und Wettbewerbsfähigkeit.`,

    messages: [
      {
        role: 'user',
        content: `Überprüfe dieses Angebot:

Positionen:
${quote.items.map((item) => `- ${item.description}: ${item.quantity}x ${item.unitPrice}€`).join('\n')}

Gesamt (netto): ${quote.totalNet}€

Gib Feedback zu:
1. Fehlende Positionen
2. Preisgestaltung (zu hoch/niedrig?)
3. Verbesserungsvorschläge
4. Formulierungshinweise`,
      },
    ],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}

/**
 * 협상 도우미
 */
export async function getNegotiationAdvice(input: {
  originalPrice: number;
  customerOffer: number;
  projectScope: string;
}): Promise<string> {
  const discount =
    ((input.originalPrice - input.customerOffer) / input.originalPrice) * 100;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    temperature: 0.7,

    messages: [
      {
        role: 'user',
        content: `Ein Kunde möchte ${discount.toFixed(1)}% Rabatt (von ${input.originalPrice}€ auf ${input.customerOffer}€).

Projekt: ${input.projectScope}

Gib mir:
1. Ist dieser Rabatt akzeptabel?
2. Gegenvorschlag (Preis oder reduzierter Leistungsumfang)
3. Formulierung für die Antwort an den Kunden`,
      },
    ],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '';
}
