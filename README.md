# 영수증 트래커

Next.js 16 + Tailwind v4 + shadcn/ui 로 만든 간단한 영수증 지출 관리 앱.
Upstage Information Extraction API (prebuilt `receipt-extraction` 모델) 로 영수증에서 가게/날짜/금액을 자동 추출합니다.

- **3개 화면**: 대시보드 (`/`) / 업로드 (`/upload`) / 상세보기 (`/receipts/[id]`)
- **저장**: 브라우저 `localStorage` — DB 셋업 없이 바로 배포 가능
- **OCR 키**: Next.js Route Handler 서버측에서만 사용 (클라이언트 노출 없음)

---

## 1. 로컬 실행

### Upstage API 키 발급

1. <https://console.upstage.ai> 에 가입 / 로그인
2. **API Keys** 메뉴에서 새 키 발급 (`up_xxx...`)

### `.env.local` 파일 생성

저장소 루트에 `.env.local` 파일을 만들고:

```bash
UPSTAGE_API_KEY=up_본인의키
```

> `.env.local` 은 `.gitignore` 에 포함되어 있어 GitHub 에 푸시되지 않습니다.

### 실행

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000> 접속.

---

## 2. Vercel 배포

1. GitHub repo 로 푸시
2. <https://vercel.com/new> 에서 해당 repo import (Next.js 자동 인식)
3. **Environment Variables** 에 `UPSTAGE_API_KEY` 추가 후 Deploy
4. 발급된 URL 로 접속

> 추가 인프라(DB / Storage) 설정 불필요.

---

## 3. 구조

```
app/
├── layout.tsx                # 한국어 lang, Sonner 토스트
├── page.tsx                  # 대시보드 (KPI + 월별 차트 + 카드 그리드)
├── upload/page.tsx           # 드래그&드롭 업로드 + 분석
├── receipts/[id]/page.tsx    # 이미지 + 편집 폼 + 원본 데이터
└── api/extract/route.ts      # 서버측 Upstage 프록시 (키 보호)

components/
├── ui/                       # shadcn 컴포넌트
├── site-header.tsx
├── receipt-card.tsx
└── month-bar-chart.tsx       # recharts 막대 그래프

lib/
├── types.ts                  # Receipt, ExtractedField
├── storage.ts                # localStorage CRUD
├── format.ts                 # KRW / 날짜 포맷터 (Intl)
├── image.ts                  # 클라이언트 이미지 리사이즈
├── parse-receipt.ts          # Upstage 응답 정규화
└── upstage.ts                # 서버 전용 Upstage fetch
```

---

## 4. 주의 사항

- **데이터는 브라우저에만 보관됩니다**: 다른 기기/브라우저에서는 보이지 않습니다. 장기 보관·공유 용도가 아닙니다.
- localStorage 한도(약 5–10 MB) 때문에 이미지는 업로드 시 자동으로 최대 1600px 로 리사이즈됩니다.
- Upstage 응답 필드 키 이름이 다를 경우 `lib/parse-receipt.ts` 의 `STORE_KEYS` / `DATE_KEYS` / `TOTAL_KEYS` 배열을 조정하세요.
