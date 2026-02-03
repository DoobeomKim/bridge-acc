/**
 * 간단한 번호 생성 테스트
 */

import {
  generateInvoiceNumber,
  generateQuoteNumber,
  generateCustomerNumber,
} from './invoice-number';

async function test() {
  console.log('🧪 번호 생성 테스트\n');

  try {
    // 고객
    console.log('고객 번호:');
    console.log('  1:', await generateCustomerNumber());
    console.log('  2:', await generateCustomerNumber());
    console.log('  3:', await generateCustomerNumber());

    // 견적서
    console.log('\n견적서 번호:');
    console.log('  1:', await generateQuoteNumber());
    console.log('  2:', await generateQuoteNumber());
    console.log('  3:', await generateQuoteNumber());

    // 인보이스
    console.log('\n인보이스 번호:');
    console.log('  1:', await generateInvoiceNumber());
    console.log('  2:', await generateInvoiceNumber());
    console.log('  3:', await generateInvoiceNumber());

    console.log('\n✅ 모든 테스트 통과!');
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

test()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
