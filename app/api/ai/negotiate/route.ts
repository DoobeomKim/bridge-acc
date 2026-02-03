/**
 * AI 협상 도우미 API
 * POST /api/ai/negotiate
 */

import { NextResponse } from 'next/server';
import { getNegotiationAdvice } from '@/lib/ai-quote-advisor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalPrice, customerOffer, projectScope } = body;

    if (!originalPrice || !customerOffer || !projectScope) {
      return NextResponse.json(
        { error: 'Fehlende Daten' },
        { status: 400 }
      );
    }

    const advice = await getNegotiationAdvice({
      originalPrice,
      customerOffer,
      projectScope,
    });

    return NextResponse.json({ advice });
  } catch (error) {
    console.error('AI negotiation error:', error);
    return NextResponse.json(
      { error: 'Verhandlungsberatung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
