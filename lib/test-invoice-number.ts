/**
 * 번호 생성 테스트 스크립트
 */

import {
  generateInvoiceNumber,
  generateQuoteNumber,
  generateCustomerNumber,
  getCurrentSequence,
} from './invoice-number';

async function testNumberGeneration() {
  console.log('🧪 번호 생성 테스트 시작\n');

  try {
    // 1. 고객 번호 생성
    console.log('📋 고객 번호 생성 테스트:');
    const customer1 = await generateCustomerNumber();
    console.log(`  - 첫 번째: ${customer1}`);
    const customer2 = await generateCustomerNumber();
    console.log(`  - 두 번째: ${customer2}`);
    const customer3 = await generateCustomerNumber();
    console.log(`  - 세 번째: ${customer3}`);
    console.log(`  ✅ 현재 시퀀스: ${await getCurrentSequence('customer')}\n`);

    // 2. 견적서 번호 생성
    console.log('📝 견적서 번호 생성 테스트:');
    const quote1 = await generateQuoteNumber();
    console.log(`  - 첫 번째: ${quote1}`);
    const quote2 = await generateQuoteNumber();
    console.log(`  - 두 번째: ${quote2}`);
    const quote3 = await generateQuoteNumber();
    console.log(`  - 세 번째: ${quote3}`);
    console.log(`  ✅ 현재 시퀀스: ${await getCurrentSequence('quote')}\n`);

    // 3. 인보이스 번호 생성
    console.log('💰 인보이스 번호 생성 테스트:');
    const invoice1 = await generateInvoiceNumber();
    console.log(`  - 첫 번째: ${invoice1}`);
    const invoice2 = await generateInvoiceNumber();
    console.log(`  - 두 번째: ${invoice2}`);
    const invoice3 = await generateInvoiceNumber();
    console.log(`  - 세 번째: ${invoice3}`);
    console.log(`  ✅ 현재 시퀀스: ${await getCurrentSequence('invoice')}\n`);

    // 4. 동시성 테스트
    console.log('⚡ 동시성 테스트 (10개 동시 생성):');
    const promises = Array.from({ length: 10 }, () => generateInvoiceNumber());
    const results = await Promise.all(promises);
    console.log(`  생성된 번호들:`);
    results.forEach((num, i) => console.log(`    ${i + 1}. ${num}`));

    // 중복 체크
    const uniqueNumbers = new Set(results);
    if (uniqueNumbers.size === results.length) {
      console.log(`  ✅ 중복 없음 (${uniqueNumbers.size}개 고유 번호)`);
    } else {
      console.log(`  ❌ 중복 발견! (${uniqueNumbers.size}개 고유 번호, ${results.length}개 생성)`);
    }

    console.log('\n✅ 모든 테스트 통과!');
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

// 실행
testNumberGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
