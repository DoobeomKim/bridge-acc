# Refined Precision — Design System

Next.js + Tailwind CSS 기반 프로젝트를 위한 디자인 시스템. zinc 계열 뉴트럴 톤을 중심으로 정밀하고 절제된 UI를 목표로 한다.

---

## 1. 색상 체계

베이스는 Tailwind의 **zinc** 스케일. 액센트 색상은 의미 전달 용도로만 사용한다.

| 용도 | 클래스 |
|---|---|
| 페이지 배경 | `bg-zinc-50` |
| 카드/패널 배경 | `bg-white` |
| 보조 배경 (테이블 푸터 등) | `bg-zinc-50/50` |
| 기본 텍스트 | `text-zinc-900` |
| 보조 텍스트 | `text-zinc-500` |
| 비활성 텍스트 | `text-zinc-400` |
| 기본 보더 | `border-zinc-200` |
| 구분선 | `border-zinc-100` |

### 의미 색상

| 상태 | 배경 | 텍스트 | 보더 |
|---|---|---|---|
| 성공 / 결제완료 | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| 경고 / 발송됨 | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| 오류 / 거절 | `bg-red-50` | `text-red-600` | `border-red-100` |
| 비활성 / 취소 | `bg-zinc-100` | `text-zinc-400` | `border-zinc-200` |

---

## 2. 레이아웃

```tsx
// 페이지 래퍼
<div className="min-h-screen bg-zinc-50">
  <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
    {/* 콘텐츠 */}
  </div>
</div>

// 2/3 + 1/3 사이드바 그리드
<div className="grid lg:grid-cols-3 gap-5">
  <div className="lg:col-span-2 space-y-5">{/* 메인 */}</div>
  <div className="space-y-5">{/* 사이드바 */}</div>
</div>
```

---

## 3. 카드 (Card)

모든 콘텐츠 블록의 기본 단위.

```tsx
// 기본 카드
<div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
  {/* 헤더 */}
  <div className="px-5 py-4 border-b border-zinc-100">
    <h2 className="text-sm font-semibold text-zinc-900">제목</h2>
  </div>
  {/* 바디 */}
  <div className="p-5">
    {/* 내용 */}
  </div>
</div>

// 헤더에 액션 버튼이 있는 카드
<div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
  <h2 className="text-sm font-semibold text-zinc-900">제목</h2>
  <button className="...">액션</button>
</div>
```

---

## 4. 타이포그래피

### 레이블 (ALL CAPS)
```tsx
const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'

<p className={labelClass}>항목 이름</p>
// 또는 form label
<label className={`${labelClass} mb-1.5 block`}>항목 이름</label>
```

### 텍스트 계층

```tsx
// 페이지 제목
<h1 className="text-xl font-semibold text-zinc-900 tracking-tight">제목</h1>

// 인보이스 번호 등 모노 강조
<h1 className="text-xl font-semibold text-zinc-900 tracking-tight font-mono">BM-2026-001</h1>

// 섹션 제목
<h2 className="text-sm font-semibold text-zinc-900">섹션명</h2>

// 본문
<p className="text-xs text-zinc-600">내용</p>

// 보조 설명
<p className="text-[11px] text-zinc-400 italic">부가 설명</p>

// 데이터 값
<p className="text-xs font-medium text-zinc-700">값</p>

// 숫자 (tabular)
<span className="text-xs tabular-nums text-zinc-700">1.234,56</span>
```

---

## 5. 폼 요소

```tsx
// 공통 input 클래스
const inputClass = 'w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200'

// text / date / number input
<input type="text" className={inputClass} />

// select
<select className={inputClass}>
  <option value="19">19%</option>
</select>

// textarea
<textarea className={`${inputClass} resize-none`} rows={3} />

// 힌트 텍스트
<p className="text-[11px] text-zinc-400 mt-1">설명 텍스트</p>
```

### shadcn Input (기존 컴포넌트 사용 시)
```tsx
const inputClass = 'h-8 text-xs border-zinc-200 focus-visible:ring-zinc-900'
<Input className={inputClass} />
```

### select (shadcn 미사용)
```tsx
const selectClass = 'h-8 text-xs border border-zinc-200 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full'
```

---

## 6. 버튼

```tsx
// Primary (검정)
<button className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors">
  저장
</button>

// Secondary (아웃라인)
<button className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all">
  편집
</button>

// Danger (삭제)
<button className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all">
  삭제
</button>

// Success (결제완료 등)
<button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">
  완료
</button>

// Disabled 공통 추가
disabled:opacity-50

// 아이콘 크기
<Icon className="w-3 h-3" />  // 버튼 내 아이콘
<Icon className="w-4 h-4" />  // 헤더 내비 아이콘
```

---

## 7. 상태 배지 (Status Badge)

```tsx
// 배지 기본 구조
<span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusStyle}`}>
  {label}
</span>

// 상태별 스타일 맵 예시
const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-zinc-100 text-zinc-500 border-zinc-200',
  sent:      'bg-amber-50 text-amber-700 border-amber-200',
  paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:   'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-zinc-100 text-zinc-400 border-zinc-200',
}
```

---

## 8. 테이블

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-zinc-100">
      <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
        컬럼명
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-zinc-50">
    <tr className="hover:bg-zinc-50/70 transition-colors">
      <td className="px-5 py-3 text-xs text-zinc-700">값</td>
    </tr>
  </tbody>
</table>

// 테이블 하단 합계 영역
<div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50/50">
  {/* 합계 */}
</div>
```

---

## 9. 알림 배너 (Alert / Banner)

```tsx
// 정보
<div className="flex items-start gap-2.5 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-xl">
  <Info className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
  <p className="text-xs text-zinc-700">메시지</p>
</div>

// 경고
<div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
  <p className="text-xs text-amber-700">메시지</p>
</div>

// 오류
<div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
  <p className="text-xs font-medium text-red-700">메시지</p>
</div>

// 편집 모드 배너
<div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
  <Pencil className="w-3 h-3 text-amber-600 flex-shrink-0" />
  <p className="text-xs font-medium text-amber-700">편집 모드</p>
</div>
```

---

## 10. 모달 / 다이얼로그

```tsx
// 오버레이
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  {/* 패널 */}
  <div className="bg-white rounded-xl border border-zinc-200 shadow-xl w-full max-w-md mx-4">
    {/* 헤더 */}
    <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-zinc-900">제목</h2>
      <button className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
    {/* 바디 */}
    <div className="p-5 space-y-4">
      {/* 내용 */}
    </div>
    {/* 푸터 */}
    <div className="px-5 py-4 border-t border-zinc-100 flex gap-3">
      <button className="flex-1 ...">취소</button>
      <button className="flex-1 ...">확인</button>
    </div>
  </div>
</div>
```

---

## 11. 로딩 스켈레톤

```tsx
// 페이지 로딩
<div className="min-h-screen bg-zinc-50">
  <div className="max-w-4xl mx-auto px-6 py-10 space-y-5">
    <div className="h-6 w-24 bg-zinc-100 rounded animate-pulse" />
    <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-3 bg-zinc-100 rounded animate-pulse"
          style={{ width: `${40 + i * 15}%` }} />
      ))}
    </div>
  </div>
</div>
```

---

## 12. 아이콘 사용 원칙

- 라이브러리: `lucide-react`
- 버튼 내 아이콘: `w-3 h-3`
- 헤더/내비 아이콘: `w-4 h-4`
- 배너 아이콘: `w-3.5 h-3.5 flex-shrink-0`
- 이모지 사용 금지 — 모든 아이콘은 Lucide로 대체

---

## 13. 네비게이션 뒤로가기

```tsx
<Link href="/목록" className="mt-0.5 p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
  <ArrowLeft className="w-4 h-4" />
</Link>
```

---

## 14. 주요 패턴 상수 (복붙용)

```tsx
// 페이지 공통
const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-zinc-400'
const inputClass = 'w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg bg-white text-zinc-800 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200'
const selectClass = 'h-8 text-xs border border-zinc-200 rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 w-full'

// 카드
const card = 'bg-white rounded-xl border border-zinc-200 overflow-hidden'
const cardHeader = 'px-5 py-4 border-b border-zinc-100'
const cardBody = 'p-5'

// 버튼
const btnPrimary = 'flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50'
const btnSecondary = 'flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-lg hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50'
const btnDanger = 'flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 text-zinc-500 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all'
```

---

## 15. 핵심 원칙

1. **여백은 일정하게** — 카드 내부 패딩은 `p-5`, 헤더는 `px-5 py-4`
2. **텍스트는 작게** — 본문 `text-xs`, 라벨 `text-[10px]`, 보조 `text-[11px]`
3. **보더는 얇게** — `border-zinc-200` (기본), `border-zinc-100` (구분선)
4. **호버는 부드럽게** — `transition-all` 또는 `transition-colors`
5. **의미 없는 색상 금지** — 색상은 상태 표현 목적으로만
6. **이모지 없음** — Lucide 아이콘으로 대체
7. **둥글기 통일** — 카드 `rounded-xl`, 버튼/인풋 `rounded-lg`, 작은 배지 `rounded-md`
