/**
 * AI 견적 컨설팅 API
 * POST /api/ai/quote-advice
 */

import { NextResponse } from 'next/server';
import { getQuoteAdvice } from '@/lib/ai-quote-advisor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectDescription, estimatedHours, industry, customerType } = body;

    // 유효성 검사
    if (!projectDescription || projectDescription.trim().length < 10) {
      return NextResponse.json(
        { error: 'Projektbeschreibung muss mindestens 10 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // AI 컨설팅 요청
    const advice = await getQuoteAdvice({
      projectDescription,
      estimatedHours,
      industry,
      customerType: customerType || 'business',
    });

    return NextResponse.json(advice);
  } catch (error) {
    console.error('AI quote advice error:', error);

    // API 키 오류 체크
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY nicht konfiguriert. Bitte in .env.local hinzufügen.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'AI-Beratung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}
