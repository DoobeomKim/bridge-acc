'use client';

/**
 * AI 견적 컨설팅 다이얼로그
 */

import { useState } from 'react';

interface AIAdvice {
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (items: any[]) => void;
}

export function AIAdvisorDialog({ isOpen, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);

  const [projectDescription, setProjectDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [industry, setIndustry] = useState('');

  const handleGetAdvice = async () => {
    if (!projectDescription || projectDescription.length < 10) {
      setError('Bitte geben Sie eine Projektbeschreibung ein (mindestens 10 Zeichen)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/quote-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectDescription,
          estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
          industry: industry || undefined,
          customerType: 'business',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get advice');
      }

      const data = await res.json();
      setAdvice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!advice) return;

    const items = advice.items.map((item) => ({
      description: item.description,
      additionalInfo: item.reasoning, // AI 부가설명 저장
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      vatRate: 19,
    }));

    onApply(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🤖 AI Preisberatung</h2>
              <p className="text-sm text-gray-600 mt-1">
                Claude 3.5 Haiku가 적정 가격을 제안합니다
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {!advice ? (
            <>
              {/* 입력 폼 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Projektbeschreibung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="z.B. E-Commerce Website mit React, Backend API, Datenbank, Admin-Panel..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Je detaillierter, desto besser die Empfehlung
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Geschätzte Stunden (optional)
                    </label>
                    <input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      min="1"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="z.B. 40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branche (optional)
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="z.B. E-Commerce, SaaS, etc."
                    />
                  </div>
                </div>
              </div>

              {/* 에러 */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* 버튼 */}
              <button
                onClick={handleGetAdvice}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? '🤔 AI analysiert...' : '🤖 AI Empfehlung holen'}
              </button>
            </>
          ) : (
            <>
              {/* AI 결과 */}
              <div className="space-y-6">
                {/* 가격 범위 */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h3 className="font-semibold mb-2">💡 Empfohlener Preis</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {advice.recommendedPrice.toLocaleString('de-DE')} €
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Bereich: {advice.priceRange.min.toLocaleString('de-DE')} € -{' '}
                    {advice.priceRange.max.toLocaleString('de-DE')} €
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Stundensatz: {advice.hourlyRate.min} € - {advice.hourlyRate.max} € |{' '}
                    Geschätzte Stunden: {advice.totalHours}h
                  </p>
                </div>

                {/* 항목 */}
                <div>
                  <h3 className="font-semibold mb-3">📝 Vorgeschlagene Positionen</h3>
                  <div className="space-y-3">
                    {advice.items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium">{item.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.reasoning}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold">
                              {(item.quantity * item.unitPrice).toLocaleString('de-DE')} €
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} {item.unit} × {item.unitPrice} €
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 조언 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <h3 className="font-semibold mb-2">💡 Hinweis</h3>
                  <p className="text-sm">{advice.advice}</p>
                </div>

                {/* 리스크 */}
                {advice.risks.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-4">
                    <h3 className="font-semibold mb-2">⚠️ Risiken & Überlegungen</h3>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {advice.risks.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-4">
                <button
                  onClick={handleApply}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 font-medium"
                >
                  ✅ Positionen übernehmen
                </button>
                <button
                  onClick={() => setAdvice(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded hover:bg-gray-300 font-medium"
                >
                  🔄 Neue Anfrage
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
