# 영수증 트래커 (Receipt Tracker)

영수증 사진을 올리면 가게 이름·날짜·금액을 자동으로 인식해서 한 곳에서 관리해주는 웹 앱입니다.
Next.js 16 + Tailwind v4 + shadcn/ui 로 만들었고, OCR 은 [Upstage Information Extraction API](https://console.upstage.ai) 의 `receipt-extraction` 모델을 사용합니다.

> DB 없이 브라우저 `localStorage` 만으로 동작하므로, 클론 후 Upstage 키만 넣으면 바로 실행 / 배포할 수 있습니다.

---

## 주요 기능

- **자동 인식**: 영수증 사진 1장 → 가게·날짜·총액을 폼에 자동 채움 (편집 가능)
- **대시보드** (`/`): 이번 달 지출 합계 · 영수증 개수 · 월별 막대 차트 · 최근 영수증 그리드
- **업로드** (`/upload`): 드래그 & 드롭 또는 파일 선택 → 미리보기 → 분석
- **상세 보기** (`/receipts/[id]`): 원본 이미지 · 편집 폼 · Upstage 원본 응답 확인
- **다크 모드**: `next-themes` 기반 시스템 설정 자동 추종
- **API 키 보호**: Upstage 호출은 Next.js Route Handler 서버측에서만 실행 (클라이언트 노출 없음)

---

## 빠른 시작

### 1) Upstage API 키 발급

1. <https://console.upstage.ai> 에 가입 / 로그인
2. **API Keys** 메뉴에서 새 키 발급 (`up_...` 형식)

### 2) 환경변수 설정

저장소 루트에 `.env.local` 파일을 만들고 다음 한 줄을 넣습니다.

```bash
UPSTAGE_API_KEY=up_여기에_본인_키
```

`.env.local.example` 을 복사해도 됩니다.

> `.env.local` 은 `.gitignore` 에 포함되어 있어 GitHub 에 push 되지 않습니다.

### 3) 실행

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000> 접속.

---

## Vercel 배포

1. 이 저장소를 GitHub 에 push
2. <https://vercel.com/new> 에서 import (Next.js 자동 인식)
3. **Environment Variables** 에 `UPSTAGE_API_KEY` 추가
4. **Deploy** 클릭

DB·스토리지 등 추가 인프라 설정은 필요 없습니다.

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Route Handlers) |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS v4, shadcn/ui, lucide-react |
| 차트 | Recharts |
| 토스트 | Sonner |
| OCR | Upstage Information Extraction (`receipt-extraction`) |
| 저장소 | 브라우저 `localStorage` |

---

## 프로젝트 구조

```
app/
├── layout.tsx                # 한국어 lang, Sonner 토스트, 테마 프로바이더
├── page.tsx                  # 대시보드 (KPI + 월별 차트 + 카드 그리드)
├── upload/page.tsx           # 드래그 & 드롭 업로드 + 분석 + 저장
├── receipts/[id]/page.tsx    # 이미지 · 편집 폼 · 원본 데이터
└── api/extract/route.ts      # 서버측 Upstage 프록시 (키 보호 + 검증)

components/
├── ui/                       # shadcn 컴포넌트 (button, card, dialog, ...)
├── site-header.tsx
├── receipt-card.tsx
└── month-bar-chart.tsx       # recharts 막대 그래프

lib/
├── types.ts                  # Receipt, ExtractedField 타입
├── storage.ts                # localStorage CRUD
├── format.ts                 # KRW / 날짜 포맷터 (Intl API)
├── image.ts                  # 클라이언트 이미지 리사이즈 (최대 1600px)
├── parse-receipt.ts          # Upstage 응답 정규화
└── upstage.ts                # 서버 전용 Upstage fetch 래퍼
```

---

## 동작 흐름

```
[사용자 이미지 선택]
        │
        ▼
[클라이언트 리사이즈 (최대 1600px)]   ← localStorage 용량 절약
        │
        ▼
[POST /api/extract  (FormData)]
        │
        ▼
[Route Handler: 파일 검증 + Upstage API 호출]   ← UPSTAGE_API_KEY 사용
        │
        ▼
[parse-receipt: 응답 정규화 → 가게·날짜·총액 추출]
        │
        ▼
[업로드 폼 자동 채움 → 사용자 편집 → 저장]
        │
        ▼
[localStorage 에 영수증 추가 → 대시보드 갱신]
```

---

## 주의 사항 / 알려진 제약

- **데이터는 브라우저에만 저장됩니다.** 다른 기기·브라우저에서는 보이지 않으며 시크릿 모드 종료 / 캐시 삭제 시 사라집니다. 장기 보관 · 공유 용도가 아닙니다.
- `localStorage` 용량(약 5–10 MB) 한계 때문에 이미지는 업로드 시 자동으로 최대 1600px / JPEG 로 리사이즈됩니다.
- 업로드 파일 크기 상한은 서버측에서 **10 MB** 입니다 (`app/api/extract/route.ts`).
- Upstage 응답의 필드 키 이름이 달라질 경우 `lib/parse-receipt.ts` 의 `STORE_KEYS` / `DATE_KEYS` / `TOTAL_KEYS` 배열을 조정하세요.

---

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (`http://localhost:3000`) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |

`scripts/` 폴더에는 Upstage 응답 점검용 (`probe-upstage.mjs`) / 파싱 테스트용 (`test-parse.mjs`) / Playwright E2E (`e2e.mjs`, `smoke.mjs`) 스크립트가 있습니다.
