# 영수증 트래커 (Receipt Tracker)

영수증 사진을 올리면 가게 이름·날짜·금액을 자동으로 인식해서 한 곳에서 관리해주는 웹 앱입니다.
Next.js 16 + Tailwind v4 + shadcn/ui 로 만들었고, OCR 은 [Upstage Information Extraction API](https://console.upstage.ai) 의 `information-extract` 모델을 사용합니다.

**저장소**: Neon Postgres (메타데이터) + Vercel Blob (영수증 이미지).

---

## 주요 기능

- **자동 인식**: 영수증 사진 1장 → 가게·날짜·총액을 폼에 자동 채움 (편집 가능)
- **대시보드** (`/`): 이번 달 지출 합계 · 영수증 개수 · 월별 막대 차트 · 최근 영수증 그리드
- **업로드** (`/upload`): 드래그 & 드롭 또는 파일 선택 → 미리보기 → 분석 → 저장
- **상세 보기** (`/receipts/[id]`): 원본 이미지 · 편집 폼 (가게/날짜/금액/메모) · Upstage 원본 응답 확인
- **다크 모드**: `next-themes` 기반 시스템 설정 자동 추종
- **API 키 보호**: Upstage 호출은 Next.js Route Handler 서버측에서만 실행

---

## 빠른 시작

### 1) Vercel 통합 셋업

이 프로젝트는 Vercel 의 **Neon Postgres** + **Blob** 스토리지에 의존합니다.
배포 환경에서는 Vercel 대시보드 → 프로젝트 → **Storage** 에서 두 가지를 Connect 하면 환경변수가 자동 주입됩니다:

| 환경변수 | 용도 |
|---|---|
| `UPSTAGE_API_KEY` | Upstage OCR API 키 — 본인이 직접 입력 |
| `DATABASE_URL` | Neon Postgres 연결 (Vercel 통합 시 자동) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 토큰 (Vercel 통합 시 자동) |

### 2) 로컬 환경변수

Vercel 프로젝트를 로컬과 연결하고 환경변수를 받아옵니다:

```bash
npx vercel link
npx vercel env pull .env.local
```

또는 `.env.local.example` 을 복사해 직접 채워넣습니다.

### 3) DB 스키마 초기화

처음 한 번 (또는 새 Neon 인스턴스를 연결할 때마다):

```bash
npm install
npm run db:init
```

> `receipts` 테이블 + 인덱스를 idempotent 하게 만듭니다 (이미 있으면 건너뜀).

### 4) 개발 서버 실행

```bash
npm run dev
```

브라우저에서 <http://localhost:3000> 접속.

---

## Vercel 배포

1. GitHub repo push
2. <https://vercel.com/new> 에서 import (Next.js 자동 감지)
3. **Storage** 탭에서 **Neon** + **Blob** Connect
4. **Environment Variables** 에 `UPSTAGE_API_KEY` 추가
5. Deploy 후 한 번만 로컬에서 `npm run db:init` 실행 (또는 Vercel CLI 로 production env 가져와서)

---

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Route Handlers) |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS v4, shadcn/ui, lucide-react |
| 차트 | Recharts |
| 토스트 | Sonner |
| OCR | Upstage Information Extraction (`information-extract`) |
| DB | Neon Postgres (`@neondatabase/serverless`) |
| 이미지 저장 | Vercel Blob (`@vercel/blob`) |

---

## 프로젝트 구조

```
app/
├── layout.tsx                # 한국어 lang, Sonner 토스트
├── page.tsx                  # 대시보드 (KPI + 월별 차트 + 카드 그리드)
├── upload/page.tsx           # 드래그 & 드롭 업로드 → /api/extract → /api/receipts
├── receipts/[id]/page.tsx    # 이미지 · 편집 폼 · 원본 데이터
└── api/
    ├── extract/route.ts      # Upstage 프록시 (키 보호 + 검증)
    └── receipts/
        ├── route.ts          # GET (list) / POST (create + Blob 업로드)
        └── [id]/route.ts     # GET / PATCH / DELETE (+ Blob 삭제)

components/
├── ui/                       # shadcn 컴포넌트 (button, card, dialog, ...)
├── site-header.tsx
├── receipt-card.tsx
└── month-bar-chart.tsx       # recharts 막대 그래프

lib/
├── types.ts                  # Receipt, ExtractedField 타입
├── db.ts                     # server-only — Neon 쿼리 (list/get/create/update/delete)
├── blob.ts                   # server-only — Vercel Blob 업로드/삭제
├── storage.ts                # client — API fetch 래퍼 (getAll/get/create/update/remove)
├── format.ts                 # KRW / 날짜 포맷터 (Intl API)
├── image.ts                  # 클라이언트 이미지 리사이즈 (최대 1600px JPEG)
├── parse-receipt.ts          # Upstage 응답 정규화
└── upstage.ts                # 서버 전용 Upstage fetch 래퍼

scripts/
└── init-db.mjs               # receipts 테이블/인덱스 생성 (idempotent)
```

---

## 데이터 모델

`receipts` 테이블 (Neon Postgres):

```sql
create table receipts (
  id          uuid primary key default gen_random_uuid(),
  store       text not null default '',
  date        date,
  total       integer not null default 0,
  memo        text,
  image_url   text,           -- Vercel Blob URL
  raw_fields  jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index receipts_date_idx on receipts (date desc nulls last);
create index receipts_created_at_idx on receipts (created_at desc);
```

---

## 동작 흐름

```
[사용자 이미지 선택]
        │
        ▼
[POST /api/extract  (FormData: image)]
        │
        ▼
[Route Handler: 파일 검증 → Upstage 호출]   ← UPSTAGE_API_KEY
        │
        ▼
[parse-receipt: 응답 정규화 → 가게·날짜·총액 추출]
        │
        ▼
[클라이언트 리사이즈 (최대 1600px JPEG)]
        │
        ▼
[POST /api/receipts  (FormData: image + 추출 데이터)]
        │
        ├──→ [Vercel Blob: 이미지 업로드 → URL]   ← BLOB_READ_WRITE_TOKEN
        │
        └──→ [Neon: receipts INSERT]              ← DATABASE_URL
        │
        ▼
[/receipts/[id] 로 리디렉트 → 사용자 편집 → PATCH]
```

---

## API 라우트

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/extract` | 이미지 → OCR 결과 (저장 X) |
| GET | `/api/receipts` | 전체 영수증 목록 |
| POST | `/api/receipts` | 새 영수증 생성 (Blob 업로드 + DB INSERT) |
| GET | `/api/receipts/[id]` | 단건 조회 |
| PATCH | `/api/receipts/[id]` | 부분 수정 (store/date/total/memo) |
| DELETE | `/api/receipts/[id]` | DB 삭제 + Blob 이미지 삭제 |

---

## 주의 사항 / 알려진 제약

- 업로드 파일 크기 상한은 **10 MB** 입니다 (`app/api/receipts/route.ts`, `app/api/extract/route.ts`). Vercel Hobby 의 함수 요청 본문 한도(4.5 MB)에 걸리지 않도록 클라이언트에서 1600px JPEG 로 리사이즈한 뒤 업로드합니다.
- 인증/멀티유저 분리는 구현돼 있지 않습니다. 단일 사용자 / 개인 용도 기준.
- Upstage 응답의 필드 키 이름이 달라질 경우 `lib/parse-receipt.ts` 의 `vendor_name` / `transaction_date` / `total_amount` 매핑을 조정하세요.

---

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 (`http://localhost:3000`) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run db:init` | Neon 에 `receipts` 테이블/인덱스 생성 (idempotent) |
