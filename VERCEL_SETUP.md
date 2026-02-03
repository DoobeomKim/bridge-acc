# Vercel 배포 가이드

이 가이드는 bridge-acc 앱을 Vercel에 배포하는 방법을 안내합니다.

## 🚀 1단계: GitHub에 코드 푸시

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## 📦 2단계: Vercel 계정 생성 및 프로젝트 Import

1. [vercel.com](https://vercel.com) 접속
2. "Sign Up" → GitHub 계정으로 로그인
3. "Add New..." → "Project" 클릭
4. GitHub 저장소 선택 → "Import" 클릭
5. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (기본값)

**아직 배포하지 마세요!** 환경 변수를 먼저 설정해야 합니다.

## 🗄️ 3단계: Vercel Postgres 생성

1. Vercel 대시보드에서 프로젝트 선택
2. 상단 탭에서 **"Storage"** 클릭
3. **"Create Database"** → **"Postgres"** 선택
4. 데이터베이스 이름 입력 (예: `bridge-acc-db`)
5. Region 선택 (가까운 지역 선택, 예: Frankfurt)
6. **"Create"** 클릭

✅ 완료되면 `DATABASE_URL` 등이 자동으로 환경 변수에 추가됩니다.

## 📁 4단계: Vercel Blob Storage 활성화

1. Vercel 대시보드 → 프로젝트 선택
2. **"Storage"** 탭
3. **"Create Database"** → **"Blob"** 선택
4. Store 이름 입력 (예: `bridge-acc-files`)
5. **"Create"** 클릭

✅ 완료되면 `BLOB_READ_WRITE_TOKEN` 등이 자동으로 환경 변수에 추가됩니다.

## 🔑 5단계: 환경 변수 설정

1. Vercel 대시보드 → 프로젝트 선택
2. **"Settings"** → **"Environment Variables"** 탭
3. 다음 환경 변수들을 추가:

```
FINAPI_CLIENT_ID=your_client_id
FINAPI_CLIENT_SECRET=your_client_secret
FINAPI_BASE_URL=https://oba.prime.vivid.money
TOKEN_ENCRYPTION_KEY=your_32_character_random_string
ANTHROPIC_API_KEY=sk-ant-api03-your_key
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**주의**: `DATABASE_URL`과 `BLOB_READ_WRITE_TOKEN`은 3-4단계에서 자동으로 추가되었으므로 따로 추가할 필요 없습니다.

## 🚢 6단계: 배포

1. **"Deployments"** 탭으로 이동
2. **"Redeploy"** 클릭 (또는 Git push하면 자동 배포)
3. 배포 완료 대기 (약 2-3분)

## 🗃️ 7단계: 데이터베이스 마이그레이션

배포가 완료되면 데이터베이스에 테이블을 생성해야 합니다.

### 방법 1: 로컬에서 실행 (추천)

1. Vercel에서 환경 변수 다운로드:
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
```

2. Prisma 마이그레이션 실행:
```bash
npx prisma migrate deploy
```

### 방법 2: Vercel CLI로 직접 실행

```bash
vercel env pull .env.local
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## ✅ 8단계: 테스트

1. 배포된 URL 접속 (예: `https://your-project.vercel.app`)
2. 거래내역 CSV 업로드 테스트
3. 파일 첨부 테스트

## 🔄 자동 배포

이제부터 Git에 push하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

→ Vercel이 자동으로 빌드 & 배포!

## 💰 비용 안내

### 무료 플랜 (Hobby)
- Vercel Hosting: 무료
- Postgres: 256MB, 60시간 컴퓨팅/월
- Blob Storage: 1GB 저장, 100GB 전송/월

대부분의 개인 프로젝트는 무료로 충분합니다.

### 유료가 필요한 경우
- 트래픽이 매우 많을 때 (월 1000+ 사용자)
- DB 용량 256MB 초과
- 파일 저장 1GB 초과

## 🐛 문제 해결

### 빌드 에러
- **"Module not found"**: `npm install` 실행 후 다시 배포
- **"Prisma generate error"**: `package.json`에 `postinstall: "prisma generate"` 추가

### 데이터베이스 에러
- **"Connection refused"**: 환경 변수 `DATABASE_URL` 확인
- **"Table doesn't exist"**: 7단계 마이그레이션 실행

### 파일 업로드 에러
- **"Blob token not found"**: 4단계 Blob Storage 생성 확인
- **"403 Forbidden"**: `BLOB_READ_WRITE_TOKEN` 환경 변수 확인

## 📞 도움말

- Vercel 문서: https://vercel.com/docs
- Prisma 문서: https://www.prisma.io/docs
- Vercel Blob 문서: https://vercel.com/docs/storage/vercel-blob
