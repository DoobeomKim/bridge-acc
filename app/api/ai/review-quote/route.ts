/**
 * AI 견적서 검토 API
 * POST /api/ai/review-quote
 */

import { NextResponse } from 'next/server';
import { reviewQuote } from '@/lib/ai-quote-advisor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, totalNet } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Keine Positionen vorhanden' },
        { status: 400 }
      );
    }

    const feedback = await reviewQuote({ items, totalNet });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('AI review error:', error);
    return NextResponse.json(
      { error: 'Überprüfung fehlgeschlagen' },
      { status: 500 }
    );
  }
}
