/**
 * Settings 초기화 스크립트
 * 처음 실행 시 기본 설정 생성
 */

import { prisma } from '@/lib/db';

export async function initializeSettings() {
  const existing = await prisma.settings.findFirst();

  if (existing) {
    console.log('Settings already exist:', existing);
    return existing;
  }

  const settings = await prisma.settings.create({
    data: {
      companyName: 'Bridge Company',
      defaultVatRate: 19,
      fiscalYearStart: 1,
      quotePrefix: 'BM-ANB',
      invoicePrefix: 'BM',
      numberFormat: 'YEAR',
      numberPadding: 3,
    },
  });

  console.log('Settings initialized:', settings);
  return settings;
}

// CLI 실행
if (require.main === module) {
  initializeSettings()
    .then(() => {
      console.log('✅ Settings initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Settings initialization failed:', error);
      process.exit(1);
    });
}
