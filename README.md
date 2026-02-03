# Bridge Acc - 독일 GmbH 회계 관리 시스템

독일 GmbH 회사를 위한 회계자료 제출 및 관리 웹 애플리케이션

## 주요 기능

### ✅ 구현 완료 (MVP)

1. **은행 거래내역 가져오기**
   - Vivid 은행 CSV 업로드
   - 중복 거래 자동 감지
   - 다양한 날짜/금액 형식 지원

2. **거래내역 관리**
   - 거래내역 조회 및 필터링
   - 카테고리 분류 (수입/지출)
   - VAT 세율 설정 (0%, 7%, 19%)
   - 거래 검색 및 정렬

3. **Dashboard**
   - 이번 달 수입/지출 현황
   - VAT 납부 예정액
   - 카테고리별 지출 Top 10
   - 최근 거래내역

4. **리포트 생성**
   - 기간별 리포트 생성
   - Excel/CSV 내보내기
   - 회계사 제출용 패키지
   - 요약 정보 포함

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Libraries**:
  - `papaparse`: CSV 파싱
  - `exceljs`: Excel 파일 생성
  - `date-fns`: 날짜 처리
  - `react-hook-form` + `zod`: 폼 처리

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 설정

Prisma 마이그레이션이 이미 완료되어 있습니다. 데이터베이스는 `prisma/dev.db`에 생성됩니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 방법

### 1. CSV 업로드

1. 상단 메뉴에서 "거래내역 (Transaktionen)" 클릭
2. "CSV 업로드" 섹션에서 Vivid 은행 CSV 파일을 드래그하거나 선택
3. 업로드가 완료되면 거래내역이 자동으로 추가됩니다

**CSV 형식 예시:**
```csv
Booking Date,Value Date,Description,Counterparty,Amount,Currency
15.01.2024,15.01.2024,Rechnung #12345,Kunde GmbH,1500.00,EUR
16.01.2024,16.01.2024,Office Supplies,Amazon EU,-89.99,EUR
```

### 2. 거래내역 분류

1. 거래내역 목록에서 "편집" 버튼 클릭
2. 카테고리 선택 (예: "판매 수입", "사무실 비용" 등)
3. VAT 세율 선택 (0%, 7%, 19%)
4. 필요시 메모 추가
5. 저장

### 3. 리포트 생성

1. 상단 메뉴에서 "리포트 (Berichte)" 클릭
2. 기간 선택 (이번 달, 지난 달, 또는 커스텀)
3. "미리보기" 버튼 클릭하여 요약 확인
4. Excel 또는 CSV 형식으로 다운로드

## 프로젝트 구조

```
/
├── app/
│   ├── api/
│   │   ├── transactions/     # 거래내역 API
│   │   ├── dashboard/         # Dashboard API
│   │   └── reports/           # 리포트 API
│   ├── transactions/          # 거래내역 페이지
│   ├── reports/               # 리포트 페이지
│   └── page.tsx               # Dashboard
├── components/
│   ├── ui/                    # shadcn/ui 컴포넌트
│   ├── layout/                # 레이아웃 컴포넌트
│   └── transactions/          # 거래내역 컴포넌트
├── lib/
│   ├── db.ts                  # Prisma client
│   ├── csv-parser.ts          # CSV 파서
│   ├── report-generator.ts    # 리포트 생성
│   └── utils-accounting.ts    # 회계 유틸리티
├── prisma/
│   └── schema.prisma          # DB 스키마
└── types/
    └── index.ts               # TypeScript 타입 정의
```

## 카테고리

### 수입 (Einnahmen)
- 판매 수입 (Umsatz)
- 서비스 수입 (Dienstleistung)

### 지출 (Ausgaben)
- 사무실 비용 (Bürobedarf)
- 출장비 (Reisekosten)
- 마케팅 (Marketing)
- 소프트웨어 (Software)
- 임대료 (Miete)
- 보험 (Versicherung)
- 공과금 (Nebenkosten)
- 기타 지출 (Sonstige)

### 세금 (Steuern)
- 부가세 (MwSt)
- 소득세 (Einkommensteuer)

## 독일 회계 규정

- **VAT 세율**: 0%, 7% (reduced), 19% (standard)
- **날짜 형식**: DD.MM.YYYY
- **통화**: EUR (€)
- **숫자 형식**: 1.234,56 (독일 형식)

## 향후 개선사항

### Phase 4: 인증 시스템
- 멀티 유저 지원
- NextAuth.js 통합

### Phase 5: 송장 관리
- 송장 생성 및 PDF 다운로드
- 거래내역 매칭

### Phase 6: 영수증 관리
- 파일 업로드 및 저장
- 거래내역 매칭
- OCR 자동 인식

### Phase 7: 고급 기능
- 차트 및 분석
- Open Banking API 연동
- 이메일 발송
- 다국어 지원
