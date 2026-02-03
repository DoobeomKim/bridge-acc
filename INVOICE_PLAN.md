# 견적서/인보이스 시스템 구현 계획

> 마지막 업데이트: 2026-01-30
> 상태: 📋 계획 단계

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [핵심 기능](#핵심-기능)
3. [DB 스키마](#db-스키마)
4. [번호 생성 시스템](#번호-생성-시스템)
5. [수정/취소 워크플로우](#수정취소-워크플로우)
6. [AI 컨설팅 (Haiku)](#ai-컨설팅-haiku)
7. [구현 계획](#구현-계획)
8. [진행 상황](#진행-상황)

---

## 프로젝트 개요

**Bridge Acc**에 견적서/인보이스 관리 기능 추가
- AI 기반 견적 컨설팅
- 독일 세법 준수 (§14 UStG)
- 기존 거래내역과 자동 매칭

### 주요 특징

✅ **AI 가격 컨설팅** - Claude 3.5 Haiku 사용
✅ **독일 규정 준수** - 인보이스 번호 연속성 보장
✅ **회계 통합** - 거래내역 자동 매칭
✅ **버전 관리** - 견적서 수정 이력 추적

### 기술 스택

- **AI**: Claude 3.5 Haiku (`claude-3-5-haiku-20241022`)
- **PDF 생성**: react-pdf 또는 pdfkit
- **이메일**: Resend 또는 SendGrid
- **기존**: Next.js 14, Prisma, SQLite

---

## 핵심 기능

### 1. 견적서 (Quote/Angebot)

- ✅ 고객 정보 관리 (Customer)
- ✅ 품목/서비스 항목 추가
- ✅ 자동 VAT 계산 (독일 규격)
- ✅ 견적서 버전 관리 (수정 이력)
- ✅ AI 가격 컨설팅
- ✅ PDF 생성 및 다운로드
- ✅ 이메일 발송

**수정 정책:**
- `draft` 상태: 자유롭게 수정 가능 ✅
- `sent` 상태: 새 버전 생성 (권장) 또는 수정 후 재발송 ✅

### 2. 인보이스 (Invoice/Rechnung)

- ✅ 견적서 → 인보이스 전환
- ✅ 결제 상태 추적 (미납/완납)
- ✅ 거래내역과 자동 매칭
- ✅ 독일 법적 요구사항 준수
- ✅ 취소/정정 인보이스 발행

**수정 정책 (독일 세법 준수):**
- `draft` 상태: 자유롭게 수정 가능 ✅
- `sent/paid` 상태: 수정 불가 ❌
  - **대신**: 취소 인보이스 (Storno) 발행
  - **또는**: 정정 인보이스 (Korrekturrechnung) 발행

### 3. AI 컨설팅 (Claude 3.5 Haiku)

#### 가격 책정 도우미
- 프로젝트 설명 → AI가 적정 가격 제안
- 업계 표준, 시간 예상, 난이도 분석
- 독일 시장 기준 고려

#### 견적서 작성 도우미
- "웹사이트 개발" 입력 → AI가 세부 항목 자동 생성
- 작업 범위(Scope) 추천
- 조건(Terms) 문구 제안

#### 협상 도우미
- 고객이 깎으려 할 때 대응 방법 제안
- 대안 패키지 제시
- 디스카운트 시뮬레이션

#### 지능형 검토
- 생성된 견적서 리뷰 및 개선점 제안
- 누락된 항목 체크

**비용:**
- Input: $0.80 / MTok
- Output: $4.00 / MTok
- 견적 1건당: ~$0.006 (약 8원)
- 월 100건: ~$0.60 (약 800원)

---

## DB 스키마

### Settings (확장)

```prisma
model Settings {
  id              String    @id @default(cuid())
  companyName     String?
  taxNumber       String?
  vatId           String?
  address         String?
  defaultVatRate  Float     @default(19)
  fiscalYearStart Int       @default(1)

  // 견적서/인보이스 번호 설정
  quotePrefix     String    @default("BM-ANB")
  invoicePrefix   String    @default("BM")
  numberFormat    String    @default("YEAR")     // "YEAR" | "CONTINUOUS" | "MONTH"
  numberPadding   Int       @default(3)          // 001, 002, 003

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### NumberSequence (핵심!)

독일 세법상 인보이스 번호 연속성 보장

```prisma
model NumberSequence {
  id              String    @id @default(cuid())
  type            String    // "quote" | "invoice" | "customer"
  year            Int       // 2026, 2027 (연도별 리셋용)
  month           Int?      // 1-12 (월별 리셋용)
  lastNumber      Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([type, year, month])
  @@index([type, year])
}
```

**생성 예시:**
- `BM-2026-001` (인보이스)
- `BM-ANB-2026-001` (견적서)
- `KD-001` (고객)

### Customer

```prisma
model Customer {
  id              String    @id @default(cuid())
  customerNumber  String    @unique  // KD-001
  name            String
  email           String?
  company         String?
  address         String?
  postalCode      String?
  city            String?
  country         String    @default("DE")
  vatId           String?   // EU B2B용
  taxExempt       Boolean   @default(false)

  quotes          Quote[]
  invoices        Invoice[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
}
```

### Quote

```prisma
model Quote {
  id              String    @id @default(cuid())
  quoteNumber     String    @unique  // BM-ANB-2026-001
  version         Int       @default(1)
  customerId      String
  status          String    @default("draft")  // draft, sent, accepted, rejected, expired

  // 버전 관리
  originalQuoteId String?
  supersededById  String?   @unique

  items           QuoteItem[]

  subtotal        Float     @default(0)
  totalVat        Float     @default(0)
  totalGross      Float     @default(0)

  validUntil      DateTime
  notes           String?
  terms           String?

  // AI 컨설팅
  aiSuggestions   String?   // JSON 저장

  sentAt          DateTime?
  acceptedAt      DateTime?

  // 수정 제어
  isEditable      Boolean   @default(true)
  lastEditedAt    DateTime?
  editHistory     String?   // JSON

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  customer        Customer  @relation(fields: [customerId], references: [id])
  invoice         Invoice?

  originalQuote   Quote?    @relation("QuoteVersions", fields: [originalQuoteId], references: [id])
  revisions       Quote[]   @relation("QuoteVersions")
  supersededBy    Quote?    @relation("QuoteSupersession", fields: [supersededById], references: [id])
  supersedes      Quote?    @relation("QuoteSupersession")

  @@index([customerId])
  @@index([status])
  @@index([quoteNumber])
}
```

### QuoteItem

```prisma
model QuoteItem {
  id              String    @id @default(cuid())
  quoteId         String

  description     String
  quantity        Float     @default(1)
  unit            String    @default("Stück")
  unitPrice       Float
  vatRate         Float     @default(19)

  subtotal        Float
  vatAmount       Float
  total           Float

  sortOrder       Int       @default(0)

  quote           Quote     @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  @@index([quoteId])
}
```

### Invoice

```prisma
model Invoice {
  id              String    @id @default(cuid())
  invoiceNumber   String    @unique  // BM-2026-001
  customerId      String
  quoteId         String?   @unique

  status          String    @default("draft")  // draft, sent, paid, overdue, cancelled

  items           InvoiceItem[]

  subtotal        Float     @default(0)
  totalVat        Float     @default(0)
  totalGross      Float     @default(0)

  // 독일 법적 필수 항목
  invoiceDate     DateTime  @default(now())
  deliveryDate    DateTime?
  dueDate         DateTime
  paymentTerms    String    @default("14 Tage netto")

  // 결제 정보
  paidAt          DateTime?
  paidAmount      Float     @default(0)
  paymentMethod   String?

  // 거래내역 매칭
  transactionId   String?   @unique

  notes           String?
  terms           String?

  // 수정 제어 (독일 세법)
  isEditable      Boolean   @default(true)   // draft만 true
  isLocked        Boolean   @default(false)  // 발행 후 영구 잠금
  lockedAt        DateTime?

  // 취소/정정 (Storno/Korrektur)
  isCancelled     Boolean   @default(false)
  cancelledAt     DateTime?
  cancellationReason String?

  correctionType  String?   // "cancellation" | "correction"
  correctsId      String?   @unique
  correctedById   String?   @unique

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  customer        Customer     @relation(fields: [customerId], references: [id])
  quote           Quote?       @relation(fields: [quoteId], references: [id])
  transaction     Transaction? @relation(fields: [transactionId], references: [id])

  corrects        Invoice?     @relation("InvoiceCorrection", fields: [correctsId], references: [id])
  correctedBy     Invoice?     @relation("InvoiceCorrection")

  @@index([customerId])
  @@index([status])
  @@index([invoiceNumber])
  @@index([invoiceDate])
  @@index([dueDate])
}
```

### InvoiceItem

```prisma
model InvoiceItem {
  id              String    @id @default(cuid())
  invoiceId       String

  description     String
  quantity        Float     @default(1)
  unit            String    @default("Stück")
  unitPrice       Float
  vatRate         Float     @default(19)

  subtotal        Float
  vatAmount       Float
  total           Float

  sortOrder       Int       @default(0)

  invoice         Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
}
```

### Transaction (확장)

```prisma
model Transaction {
  // ... 기존 필드들 ...

  invoice         Invoice?  // 역참조
}
```

---

## 번호 생성 시스템

### 형식

- **인보이스**: `BM-2026-001`, `BM-2026-002`, ...
- **견적서**: `BM-ANB-2026-001`, `BM-ANB-2026-002`, ...
- **고객**: `KD-001`, `KD-002`, ...

### 핵심 로직

```typescript
// lib/invoice-number.ts

/**
 * 독일 규정에 맞는 인보이스 번호 생성
 * - 연속성 보장 (lückenlose Nummernfolge)
 * - Race condition 방지 (트랜잭션)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const result = await prisma.$transaction(async (tx) => {
    let sequence = await tx.numberSequence.findUnique({
      where: {
        type_year_month: {
          type: 'invoice',
          year: year,
          month: null,
        },
      },
    });

    if (!sequence) {
      sequence = await tx.numberSequence.create({
        data: {
          type: 'invoice',
          year: year,
          month: null,
          lastNumber: 0,
        },
      });
    }

    const nextNumber = sequence.lastNumber + 1;

    await tx.numberSequence.update({
      where: { id: sequence.id },
      data: { lastNumber: nextNumber },
    });

    return nextNumber;
  });

  const paddedNumber = result.toString().padStart(3, '0');
  return `BM-${year}-${paddedNumber}`;  // BM-2026-001
}
```

### 특징

✅ **원자성**: Prisma 트랜잭션으로 동시성 문제 해결
✅ **연속성**: 빠진 번호 없음 (독일 세법 준수)
✅ **연도별 리셋**: 매년 001부터 시작
✅ **커스터마이징**: Settings에서 프리픽스/형식 변경 가능

---

## 수정/취소 워크플로우

### 견적서 (자유로움)

```
┌─────────┐
│  draft  │ ──────> 자유롭게 수정 가능 ✅
└─────────┘
     │
     │ sendQuote()
     ▼
┌─────────┐
│  sent   │ ──────> 새 버전 생성 (권장) ✅
└─────────┘         또는 직접 수정 후 재발송
     │
     │ acceptQuote()
     ▼
┌──────────┐
│ accepted │
└──────────┘
```

**코드:**
```typescript
// draft 상태: 직접 수정
await prisma.quote.update({
  where: { id: quoteId },
  data: { ...updates },
});

// sent 상태: 새 버전 생성
const newQuote = await prisma.quote.create({
  data: {
    ...originalQuote,
    quoteNumber: await generateQuoteNumber(),
    version: originalQuote.version + 1,
    originalQuoteId: originalQuote.id,
  },
});
```

### 인보이스 (엄격함)

```
┌─────────┐
│  draft  │ ──────> 자유롭게 수정 가능 ✅
└─────────┘
     │
     │ sendInvoice() → isLocked = true
     ▼
┌─────────┐
│  sent   │ ──────> 수정 불가 ❌
└─────────┘         대신:
     │              - 취소 인보이스 (Storno)
     │              - 정정 인보이스 (Korrektur)
     ▼
┌─────────┐
│  paid   │ ──────> 영구 잠금 🔒
└─────────┘
```

**1. 취소 인보이스 (Storno)**

마이너스 금액으로 원본 인보이스 무효화

```typescript
async function cancelInvoice(invoiceId: string, reason: string) {
  const original = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });

  // 취소 인보이스 생성 (마이너스 금액)
  const cancellation = await prisma.invoice.create({
    data: {
      invoiceNumber: await generateInvoiceNumber(), // BM-2026-002
      customerId: original.customerId,
      correctionType: 'cancellation',
      correctsId: original.id,

      subtotal: -original.subtotal,
      totalVat: -original.totalVat,
      totalGross: -original.totalGross,

      notes: `Stornierung von ${original.invoiceNumber}\nGrund: ${reason}`,
      isLocked: true,

      items: {
        create: original.items.map(item => ({
          description: `[STORNO] ${item.description}`,
          quantity: -item.quantity,
          unitPrice: item.unitPrice,
          // ... 나머지 마이너스 금액
        })),
      },
    },
  });

  // 원본 취소 표시
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      isCancelled: true,
      cancelledAt: new Date(),
      correctedById: cancellation.id,
    },
  });
}
```

**2. 정정 인보이스 (Korrekturrechnung)**

소액 수정 시 차액만 인보이스 발행

```typescript
async function createCorrectionInvoice(originalId: string, corrections) {
  return await prisma.invoice.create({
    data: {
      invoiceNumber: await generateInvoiceNumber(),
      correctionType: 'correction',
      correctsId: originalId,
      // 차액만 계산
      subtotal: corrections.subtotal,
      notes: `Korrektur zu ${original.invoiceNumber}`,
    },
  });
}
```

---

## AI 컨설팅 (Haiku)

### 1. 가격 제안

```typescript
// lib/ai-quote-advisor.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function getQuoteAdvice(input: {
  projectDescription: string;
  estimatedHours?: number;
  industry?: string;
}) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2000,
    temperature: 0.7,

    system: `Du bist ein Experte für Preisgestaltung in Deutschland.
Berücksichtige den deutschen Markt und übliche Stundensätze.
Kalkuliere 19% MwSt. ein (B2B innerhalb Deutschlands).`,

    messages: [{
      role: 'user',
      content: `Projekt: ${input.projectDescription}

Bitte erstelle:
1. Empfohlener Preis (Netto-Bereich in EUR)
2. Aufschlüsselung in 3-5 Positionen
3. Typische Stundensätze
4. Risiken und Hinweise

Antworte in JSON-Format.`
    }]
  });

  return parseResponse(response);
}
```

### 2. 견적서 검토

```typescript
export async function reviewQuote(quote) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    messages: [{
      role: 'user',
      content: `Überprüfe dieses Angebot:
${JSON.stringify(quote)}

Gib Feedback zu:
1. Fehlende Positionen
2. Preisgestaltung
3. Verbesserungsvorschläge`
    }]
  });

  return parseResponse(response);
}
```

### 3. 협상 도우미

```typescript
export async function getNegotiationAdvice(input: {
  originalPrice: number;
  customerOffer: number;
  projectScope: string;
}) {
  const discount = ((input.originalPrice - input.customerOffer) / input.originalPrice * 100).toFixed(1);

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    messages: [{
      role: 'user',
      content: `Ein Kunde möchte ${discount}% Rabatt.

Gib mir:
1. Ist dieser Rabatt akzeptabel?
2. Gegenvorschlag
3. Formulierung für die Antwort`
    }]
  });

  return parseResponse(response);
}
```

---

## 구현 계획

### Phase 1: DB 기반 구축 (1-2일)
**상태: ✅ 완료 (2026-01-30)**

- [x] Prisma 스키마 작성
  - [x] Settings 확장 (번호 설정)
  - [x] NumberSequence 모델
  - [x] Customer 모델
  - [x] Quote + QuoteItem 모델
  - [x] Invoice + InvoiceItem 모델
  - [x] Transaction 확장
- [x] 마이그레이션 실행
- [ ] 시드 데이터 (테스트용)

**산출물:**
- ✅ `prisma/schema.prisma` 업데이트
- ✅ `prisma/migrations/20260130151507_add_invoice_system/migration.sql`
- ✅ Prisma Client 생성 완료

---

### Phase 2: 번호 생성 시스템 (1일)
**상태: ✅ 완료 (2026-01-30)**

- [x] `lib/invoice-number.ts` 구현
  - [x] `generateInvoiceNumber()` - BM-2026-001
  - [x] `generateQuoteNumber()` - BM-ANB-2026-001
  - [x] `generateCustomerNumber()` - KD-001
- [x] 트랜잭션 테스트 (동시성)
- [x] 연속성 테스트 (순차 생성)

**산출물:**
- ✅ `lib/invoice-number.ts` (번호 생성 로직)
- ✅ `lib/init-settings.ts` (설정 초기화)
- ✅ `lib/test-simple.ts` (테스트)
- ✅ Prisma 트랜잭션으로 동시성 보장
- ✅ 연속 번호 생성 확인 (KD-004, BM-ANB-2026-004, BM-2026-005)

---

### Phase 3: 고객 관리 (1일)
**상태: ✅ 완료 (2026-01-30)**

- [x] API 구현
  - [x] `app/api/customers/route.ts` (GET, POST)
  - [x] `app/api/customers/[id]/route.ts` (GET, PATCH, DELETE)
- [x] UI 구현
  - [x] `app/customers/page.tsx` (목록)
  - [x] `app/customers/new/page.tsx` (생성)
  - [x] `app/customers/[id]/page.tsx` (상세/편집)

**산출물:**
- ✅ 고객 CRUD API 완성
- ✅ 고객 번호 자동 생성 (KD-001)
- ✅ 고객 목록, 생성, 상세 UI
- ✅ 견적서/인보이스와 연결된 고객 삭제 방지

---

### Phase 4: 견적서 기본 기능 (2-3일)
**상태: ✅ 완료 (2026-01-30)**

- [x] API 구현
  - [x] `app/api/quotes/route.ts` (GET, POST)
  - [x] `app/api/quotes/[id]/route.ts` (GET, PATCH, DELETE)
  - [x] 항목 추가/수정/삭제
  - [x] 합계 자동 계산 (VAT 포함)
- [x] UI 구현
  - [x] `app/quotes/page.tsx` (목록 + 필터)
  - [x] `app/quotes/new/page.tsx` (생성 + 항목 관리)
  - [x] `app/quotes/[id]/page.tsx` (상세/조회)
- [x] 상태 관리
  - [x] draft → sent → accepted/rejected
  - [x] 발송 시 `isEditable = false`
  - [x] 인보이스 전환된 견적서 삭제 방지

**산출물:**
- ✅ 견적서 CRUD API 완성
- ✅ 견적 번호 자동 생성 (BM-ANB-2026-001)
- ✅ VAT 자동 계산 (19%, 7%, 0%)
- ✅ 항목별 소계/VAT/합계 자동 계산
- ✅ 상태별 필터링 (전체/Entwurf/Gesendet/Angenommen)
- ✅ 고객 선택 및 정보 표시

---

### Phase 5: AI 컨설팅 통합 (2일)
**상태: ✅ 완료 (2026-01-30)**

- [x] Anthropic SDK 설치
- [x] 환경 변수 설정
  - [x] `.env.local.example` 업데이트
  - [x] `ANTHROPIC_API_KEY` 추가
- [x] AI 어드바이저 구현
  - [x] `lib/ai-quote-advisor.ts`
  - [x] `getQuoteAdvice()` - 가격 제안
  - [x] `reviewQuote()` - 검토
  - [x] `getNegotiationAdvice()` - 협상 도우미
- [x] API 엔드포인트
  - [x] `app/api/ai/quote-advice/route.ts`
  - [x] `app/api/ai/review-quote/route.ts`
  - [x] `app/api/ai/negotiate/route.ts`
- [x] UI 통합
  - [x] 견적서 생성 페이지에 "AI Preisberatung" 버튼
  - [x] AI 컨설팅 다이얼로그 컴포넌트
  - [x] AI 제안 결과 표시 (가격, 항목, 조언, 리스크)
  - [x] 제안 항목 자동 적용 기능

**산출물:**
- ✅ Claude 3.5 Haiku 통합 완료
- ✅ 프로젝트 설명 → AI가 가격 + 항목 제안
- ✅ 가격 범위, 시간당 요금, 리스크 분석
- ✅ 한 번의 클릭으로 제안 항목 적용
- ✅ 견적 1건당 비용: ~$0.006 (약 8원)

---

### Phase 6: 인보이스 기본 기능 (2일)
**상태: ⏸️ 대기 중**

- [ ] API 구현
  - [ ] `app/api/invoices/route.ts`
  - [ ] `app/api/invoices/[id]/route.ts`
  - [ ] 견적서 → 인보이스 전환 API
  - [ ] 발송 시 영구 잠금 (`isLocked = true`)
- [ ] UI 구현
  - [ ] `app/invoices/page.tsx` (목록)
  - [ ] `app/invoices/new/page.tsx` (생성)
  - [ ] `app/invoices/[id]/page.tsx` (상세)
  - [ ] 읽기 전용 뷰 (발송 후)
- [ ] 상태 관리
  - [ ] draft → sent → paid/overdue

**산출물:**
- 인보이스 CRUD 완성
- 견적서 전환 기능
- 발행 후 수정 방지

---

### Phase 7: 취소/정정 인보이스 (1-2일)
**상태: ⏸️ 대기 중**

- [ ] 로직 구현
  - [ ] `lib/invoice-actions.ts`
  - [ ] `cancelInvoice()` - 취소 인보이스
  - [ ] `createCorrectionInvoice()` - 정정 인보이스
- [ ] API 엔드포인트
  - [ ] `app/api/invoices/[id]/cancel/route.ts`
  - [ ] `app/api/invoices/[id]/correct/route.ts`
- [ ] UI
  - [ ] 취소 다이얼로그 (사유 입력)
  - [ ] 정정 인보이스 생성 UI
  - [ ] 취소/정정 관계 표시

**산출물:**
- 독일 세법 준수 완성
- 취소/정정 워크플로우

---

### Phase 8: PDF 생성 (2일)
**상태: ⏸️ 대기 중**

- [ ] 라이브러리 선택 및 설치
  - 옵션 1: `react-pdf` + `@react-pdf/renderer`
  - 옵션 2: `pdfkit`
- [ ] 독일 인보이스 템플릿 디자인
  - [ ] 회사 정보 (Settings에서 가져오기)
  - [ ] 고객 정보
  - [ ] 인보이스 번호, 날짜, 기한
  - [ ] 항목 테이블
  - [ ] VAT 요약
  - [ ] 법적 필수 문구
- [ ] PDF 생성 함수
  - [ ] `lib/pdf-generator.ts`
  - [ ] `generateQuotePDF()`
  - [ ] `generateInvoicePDF()`
- [ ] API 엔드포인트
  - [ ] `app/api/quotes/[id]/pdf/route.ts`
  - [ ] `app/api/invoices/[id]/pdf/route.ts`
- [ ] UI 통합
  - [ ] "PDF 다운로드" 버튼

**산출물:**
- 독일 규격 PDF 생성
- 다운로드 기능

---

### Phase 9: 이메일 발송 (1일)
**상태: ⏸️ 대기 중**

- [ ] 이메일 서비스 선택
  - 옵션 1: Resend (추천)
  - 옵션 2: SendGrid
- [ ] 설치 및 설정
  ```bash
  npm install resend
  ```
- [ ] 이메일 템플릿
  - [ ] 견적서 발송 템플릿
  - [ ] 인보이스 발송 템플릿
- [ ] API 엔드포인트
  - [ ] `app/api/quotes/[id]/send/route.ts`
  - [ ] `app/api/invoices/[id]/send/route.ts`
- [ ] UI
  - [ ] "이메일 발송" 다이얼로그
  - [ ] 수신자, 제목, 내용 커스터마이징

**산출물:**
- PDF 첨부 이메일 발송
- 발송 기록 저장

---

### Phase 10: 거래내역 매칭 (1-2일)
**상태: ⏸️ 대기 중**

- [ ] 자동 매칭 로직
  - [ ] 금액 + 날짜 기반 매칭
  - [ ] 고객 정보 기반 매칭
  - [ ] `lib/transaction-matcher.ts`
- [ ] 수동 매칭 UI
  - [ ] 인보이스 상세에서 거래내역 선택
  - [ ] 거래내역 상세에서 인보이스 연결
- [ ] 결제 상태 자동 업데이트
  - [ ] 거래내역 매칭 시 `status = 'paid'`
  - [ ] `paidAt`, `paidAmount` 자동 설정

**산출물:**
- 인보이스 ↔ 거래내역 연결
- 결제 자동 추적

---

### Phase 11: 대시보드 통합 (1일)
**상태: ⏸️ 대기 중**

- [ ] 기존 대시보드 확장
  - [ ] 미수금 총액 (Unpaid Invoices)
  - [ ] 이번 달 발행 인보이스 금액
  - [ ] 대기 중 견적서 (Pending Quotes)
- [ ] 위젯 추가
  - [ ] 최근 인보이스 목록
  - [ ] 연체 인보이스 알림
  - [ ] 견적 승인률

**산출물:**
- 통합 대시보드

---

### Phase 12: 설정 및 커스터마이징 (1일)
**상태: ⏸️ 대기 중**

- [ ] 설정 페이지 확장
  - [ ] `app/settings/page.tsx`
  - [ ] 번호 형식 설정 (프리픽스, 자릿수)
  - [ ] 기본 결제 조건
  - [ ] 인보이스 약관 (Terms) 템플릿
- [ ] UI
  - [ ] 번호 형식 미리보기
  - [ ] 테스트 번호 생성

**산출물:**
- 커스터마이징 가능한 설정

---

### Phase 13: 테스트 및 디버깅 (2-3일)
**상태: ⏸️ 대기 중**

- [ ] 단위 테스트 (옵션)
  - [ ] 번호 생성 로직
  - [ ] VAT 계산
  - [ ] 취소/정정 로직
- [ ] 통합 테스트
  - [ ] 견적서 생성 → 인보이스 전환 → 결제 매칭
  - [ ] 취소 인보이스 플로우
- [ ] 엣지 케이스
  - [ ] 연도 전환 (2026 → 2027)
  - [ ] 동시 번호 생성
  - [ ] VAT 0%, 7%, 19% 혼합
- [ ] UX 개선
  - [ ] 로딩 상태
  - [ ] 에러 핸들링
  - [ ] 성공/실패 토스트

**산출물:**
- 안정적인 시스템

---

### Phase 14: 문서화 및 배포 (1일)
**상태: ⏸️ 대기 중**

- [ ] README.md 업데이트
  - [ ] 새 기능 설명
  - [ ] 스크린샷 추가
- [ ] 사용 가이드
  - [ ] 견적서 생성 방법
  - [ ] 인보이스 발행 방법
  - [ ] 취소/정정 방법
- [ ] 환경 변수 문서화
- [ ] 배포 준비
  - [ ] 프로덕션 DB 마이그레이션
  - [ ] 환경 변수 설정

**산출물:**
- 완성된 시스템
- 사용자 문서

---

## 진행 상황

### 완료된 작업

- [x] 프로젝트 계획 수립
- [x] DB 스키마 설계
- [x] 번호 생성 로직 설계
- [x] AI 통합 방안 설계
- [x] INVOICE_PLAN.md 문서 작성
- [x] **Phase 1: DB 기반 구축** ✅ (2026-01-30)
- [x] **Phase 2: 번호 생성 시스템** ✅ (2026-01-30)
- [x] **Phase 3: 고객 관리** ✅ (2026-01-30)
- [x] **Phase 4: 견적서 기본 기능** ✅ (2026-01-30)
- [x] **Phase 5: AI 컨설팅 통합** ✅ (2026-01-30) ⭐ 차별화!

### 현재 작업 중

- 없음 (Phase 5 완료! 핵심 기능 완성!)

### 다음 단계

1. **테스트**: AI 컨설팅 기능 테스트 (.env.local에 ANTHROPIC_API_KEY 필요)
2. **Phase 6: 인보이스 기본 기능** (견적서와 유사)
3. **Phase 7: 취소/정정 인보이스** (독일 세법 준수)

---

## 참고 자료

### 독일 법률
- [§14 UStG](https://www.gesetze-im-internet.de/ustg_1980/__14.html) - 인보이스 요구사항
- [Rechnungsnummer](https://www.lexware.de/wissen/rechnungsnummer/) - 번호 규정

### API 문서
- [Anthropic API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Claude 3.5 Haiku](https://www.anthropic.com/news/claude-3-5-haiku)

### 라이브러리
- [Prisma](https://www.prisma.io/docs)
- [react-pdf](https://react-pdf.org/)
- [Resend](https://resend.com/docs)

---

**마지막 업데이트:** 2026-01-30
**다음 검토:** Phase 1 시작 시
