# 작업 내역

영수증 트래커 — 앱 초기 개발부터 GitHub 레포 생성, Vercel 배포, Neon + Blob 마이그레이션, 프로덕션 디버깅까지.

---

## 0. 영수증 트래커 앱 초기 개발 (이전 4개 세션, 11:37 ~ 14:17)

> 본 섹션은 `~/.claude/projects/.../` 의 세션 트랜스크립트 (JSONL × 4개) 에서 실제 user 메시지와 주요 작성 파일을 추출해 재구성한 내용입니다.

### 0-1. 프로젝트 킥오프 + GitHub MCP 등록 (Session 1, 11:37 ~)

**사용자 요청 (시간순, 원문):**
> "영수증 지출관리 앱을 만들 거야. vercel에 배포할거야. 대신에 로컬에서 테스트도 가능하게 해주고, 테스트 끝나면 vercel에 배포할거야. 화면은 영수증 업로드, 대시보드, 상세보기로 간단하게 만들자."

이어서:
- "github mcp 서버 등록해줘. 이 프로젝트에서만 적용되도록."
- "깃허브 PAT 생성하는 방법 알려줘" → "토큰 복사했어 어떻게 해?" → "그냥 mcp json에 넣는 방식으로 할게"
- "토큰 넣었어 클로드 재시작 한번 해야해?"

**진행한 작업:**
- 프로젝트 스코프 합의 — Next.js + Vercel, 3개 화면 (업로드 / 대시보드 / 상세), 로컬 테스트 가능
- GitHub PAT 발급 절차 안내 → `.mcp.json` 생성 + `GITHUB_PERSONAL_ACCESS_TOKEN` 환경 변수에 토큰 주입 (project-local 격리)

---

### 0-2. 추가 MCP 등록 + .gitignore (Session 2, 11:42 ~)

**사용자 요청:**
- "context7 mcp 등록해줘, 이 프로젝트에서만 사용" — 라이브러리 문서 조회용
- ".gitignore에 .mcp.json 추가해줘" — PAT 누설 방지
- "Playwright MCP 등록해줘, 이 프로젝트에서만 사용" — UI 검증용

**진행한 작업:**
- `.mcp.json` 에 `context7` + `playwright` 추가 (모두 `npx -y` 실행 방식)
- `.gitignore` 에 `.mcp.json` 추가

**의미:** 코드 작성 전에 **"개발 중 무엇을 쓸 것인가"** 를 먼저 못 박음 — GitHub (저장소 조작) / context7 (문서) / Playwright (UI 자동화).

---

### 0-3. MCP 인증 방식 검토 (Session 3, 13:27 ~)

**사용자 요청:**
- "깃허브 MCP 등록 PAT 방식이 좋아?" / "나는 지금 어떻게 되어있어?"
- (코드와 무관한 대화 — 오리역 근처 맛집 추천 등 → auto-memory 에 "기혼 / 오리역 거주" 적재됨)

**진행한 작업:**
- PAT vs OAuth 비교 후 현 PAT 방식 유지 결정
- `memory/user_personal.md` 생성

---

### 0-4. 단일 풀빌드 + 검증 (Session 4, 14:17 ~ , 메인 빌드 세션)

**사용자 요청 (시간순):**
1. **재진술 + OCR 스펙 명시:**
   > "영수증 지출관리 앱… 화면은 업로드/대시보드/상세보기. **OCR API는 Upstage Information Extraction API 이용**. 등록된 MCP도 함께 활용해서 개발해."
2. "현재 완성된 화면 보여줘"
3. "브라우저에서 보고싶은데"
4. "upstage api key를 발급 받았어. 내가 어디에 넣으면 될까?"
5. (실키 직접 붙여넣음 → `.env.local` 생성됨)
6. "이제 API 테스트 한번 해봐. 영수증 이미지는 `images` 폴더에 2개 넣어놨어. 결과 잘 받아오는지."
7. "브라우저에서 UI 플로우도 테스트 해봐"

**한 턴 풀빌드 — 생성된 파일 (S4 첫 응답):**

| 그룹 | 파일 |
|---|---|
| 골격 | `package.json`, `README.md`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json` |
| 레이아웃 | `app/layout.tsx` (한국어 lang, Geist 폰트, Sonner Toaster) |
| 페이지 | `app/page.tsx` (대시보드 KPI + 차트 + 그리드), `app/upload/page.tsx` (드래그&드롭), `app/receipts/[id]/page.tsx` (이미지 + 편집 폼) |
| API | `app/api/extract/route.ts` (Route Handler, 키 보호) |
| 라이브러리 | `lib/types.ts`, `lib/format.ts` (Intl KRW/날짜), `lib/storage.ts` (localStorage CRUD), `lib/image.ts` (1600px JPEG 리사이즈), `lib/parse-receipt.ts`, `lib/upstage.ts` (server-only) |
| 컴포넌트 | `components/site-header.tsx`, `components/receipt-card.tsx`, `components/month-bar-chart.tsx`, `components/ui/*` (shadcn × 10) |

dev 서버 + Playwright 스크린샷으로 키 없이도 UI 셸 동작 확인.

---

### 0-5. ⚠️ Upstage 모델 피벗 (S4 후반의 비자명한 결정)

실키 통합 직후 `POST /api/extract` 가 `invalid_request_body` 반복 실패. 원인 진단을 위해 `scripts/probe-upstage.mjs` 로 라우트 우회한 직접 호출 시도.

**진단 결과:**
- 초기 가정 — **prebuilt `receipt-extraction`** 모델 (multipart 업로드)
- 실제 — 사용자 계정에 prebuilt 모델 비활성

**전환한 결과:**
- **universal `information-extract`** 모델로 전면 재작성
- OpenAI chat-completion 호환 포맷 (`messages[].content[].image_url.url`)
- `response_format.type = "json_schema"` 로 `vendor_name` / `transaction_date` / `total_amount` / `currency` / `items[]` 강제
- 이미지는 base64 데이터 URL 로 인라인

**영향 받은 파일 재작성:**
- `lib/upstage.ts` — endpoint + body 포맷 변경
- `lib/parse-receipt.ts` — 응답이 `choices[0].message.content` 의 JSON 문자열이라 `JSON.parse` + `flatten()` 평탄화 + alias 매핑 (`vendor_name` / `total_amount` 등) 추가
- `lib/types.ts` — `ExtractResponse` 타입을 OpenAI-호환 `choices[]` 구조로

이 피벗은 단순한 키 누락이 아니라 **API 모델 자체를 갈아낀** 비자명한 결정. 현재 코드의 형태(`information-extract` + chat 호환 body)는 이 피벗의 결과물.

---

### 0-6. UI E2E 검증 (S4 마무리)

`scripts/smoke.mjs` (Playwright 헤드리스) 로 전 플로우 자동화:
- 대시보드 (빈 상태) → 업로드 (드래그&드롭) → 분석 → 상세 → 편집 → 대시보드 갱신 → 삭제
- 데스크탑 + 모바일 viewport 둘 다 스크린샷

샘플 영수증 2장 (`images/receipt3.png` — GS25, `images/receipt4.png` — 메가커피) 로 실측:
- 대시보드 KPI: **₩12,300 / 2건 / 평균 ₩6,150**
- 월별 차트 / 카드 그리드 / 다크 모드 / 토스트 / 빈 상태 모두 정상

검증 스크립트 4종 정착:
- `scripts/probe-upstage.mjs` — Upstage 응답 직접 확인
- `scripts/test-parse.mjs` — 파싱 로직 단위 테스트
- `scripts/smoke.mjs` — Playwright 스모크
- `scripts/e2e.mjs` — 더 긴 E2E 시나리오

---

### 0-7. 초기 개발 요약 narrative

1. **스코프 선언** — 3개 화면, DB 없음, 단순함 우선.
2. **도구 환경 먼저 셋업** — 코드 전에 MCP 3종 (GitHub / context7 / Playwright) 을 프로젝트 로컬에 격리.
3. **인증 방식 합리화** + 사용자 컨텍스트 메모리화 (코드와 분리된 트랙).
4. **단일 턴 풀빌드** — 한 프롬프트로 lib/api/pages/components 전체 생성, localStorage 영속화로 DB 없음을 충족.
5. **시각 확인** — dev 서버 + Playwright 스크린샷, 키 없이도 UI 셸 동작.
6. **실키 통합 시 모델 미스매치 발견** → probe 로 진단 → **OCR 어댑터 전면 재작성** (prebuilt → universal).
7. **자동화된 검증** — smoke / probe / parse-test / e2e 네 종류 스크립트로 빌드·OCR·파서·UI 격리 테스트.

**기조:** "세 화면뿐" 단순 제약 + "이미 등록된 MCP 활용" 명시 + 실키 발급 직후 즉시 통합 테스트. 사용자가 한국어 한 줄로 다음 단계를 트리거하면 Claude 가 큰 덩어리를 만들고 다음 사용자 트리거에서 검증하는 리듬.

---

## 1. GitHub 레포 생성 + .gitignore + 첫 push

**사용자 요청:**
> 깃허브에 레파지토리 만들가. .gitignore 파일 신경써서 작성하고, 푸시해라.

**진행한 작업:**

- 프로젝트 구조 점검 — `.env.local` (Upstage API 키), `.mcp.json` (GitHub PAT), `.claude/` 등 민감 파일 확인
- `.gitignore` 강화:
  - 기본 Next.js 항목 + 환경변수 (`.env`, `.env*.local`)
  - 에이전트 설정 (`.mcp.json`, `.claude/`, `CLAUDE.local.md`)
  - IDE/OS 클러터 (`.idea/`, `.vscode/`, `Thumbs.db`, `desktop.ini`)
  - 키 파일 패턴 (`*.pem`, `*.key`, `*.p12`, `*.pfx`)
  - 로컬 아티팩트 (`/dev.log`, `/scripts/screenshots/`)
- MCP 의 GitHub 토큰이 repo 생성 권한이 없어, 사용자가 직접 `hakjun7/receipt-tracker` 를 private 으로 생성
- `git init -b main` → 47 파일 첫 커밋 (`66ab5b7`) → `git push -u origin main`
- 민감 파일 누출 없음 확인 (`git ls-files | grep` 으로 검증)

**결과:** https://github.com/hakjun7/receipt-tracker

---

## 2. README 한국어 재작성

**사용자 요청:**
> README도 한국어로 다시 써줘

**진행한 작업:**

- 기존 README 가 이미 한국어였으나, 더 정돈된 형태로 재작성
- 추가/개선한 섹션:
  - 한 줄 요약 + 주요 기능 불릿
  - 기술 스택 표 (Next.js 16, Tailwind v4, shadcn/ui, Upstage, ...)
  - 동작 흐름 다이어그램 (이미지 → 리사이즈 → 서버 프록시 → 파싱 → 저장)
  - `npm` 스크립트 표
  - 파일 크기 상한(10MB), 리사이즈 한도(1600px) 등 실제 제약치 명시

**결과:** 커밋 `3480870`

---

## 3. Vercel 배포 가이드 (`ref/image1.png` 확인)

**사용자 요청:**
> vercel 에 배포할건데, ref/image1.png 파일 확인해서, 내가 어떻게 설정해야할지 알려줘.

**진행한 작업:**

- Vercel "New Project" 임포트 화면 스크린샷 분석:
  - 프로젝트: `hakjun7/receipt-tracker` (main)
  - Application Preset: **Next.js** 자동 감지 ✓
  - Root Directory: `./` ✓
- 핵심 안내: **Environment Variables 펼치기 → `UPSTAGE_API_KEY` 추가** 후 Deploy
- 빼먹으면 빌드는 성공해도 `/upload` 에서 OCR 호출 시 500 + "Upstage API 키가 유효하지 않습니다" 발생함을 설명
- 키 회전 시 Settings → Env Vars 수정 후 **Redeploy** 필요함 (env 는 빌드 시점에 주입)

---

## 4. 환경변수 Value 입력 안내

**사용자 요청:**
> Environment Value 값도 넣어야 한다느데 어떻게 해? / value 값이 뭐야? / 어디서 나온거야?

**진행한 작업:**

- Vercel UI 에서 Key/Value 입력 방법 안내 (`UPSTAGE_API_KEY` / `up_...`)
- 값의 출처 설명 — 로컬 `.env.local` 파일의 `UPSTAGE_API_KEY=` 뒷부분
- ⚠️ 대화/스크린샷에 API 키가 노출되었으므로 **Upstage 콘솔에서 Revoke + 새 키 발급** 강력 권장

---

## 5. 배포 완료

**사용자 보고:** 배포 완료

**진행한 작업:**

- 배포 후 점검 체크리스트 안내:
  - `/upload` 에서 영수증 1장 OCR 동작 확인
  - 에러 시 Vercel Logs 탭에서 `/api/extract` 호출 로그 확인
- 보안 — 노출된 키 폐기 + 새 키 발급 + Vercel env 교체 + Redeploy 절차 재안내

---

## 6. Neon + Vercel Blob 으로 저장소 전환 (대규모 리팩터링)

**사용자 요청:**
> vercel의 neon과 blob을 연결했어. 여기에 맞게 수정개발하도록 해라.

**현황 (변경 전):**

- 메타데이터 → 브라우저 `localStorage`
- 이미지 → base64 dataURL (localStorage 안에 함께)
- 다른 기기/브라우저에서 데이터 안 보임, localStorage 5-10MB 한도

**진행한 작업:**

### 6-1. 패키지 설치
- `@neondatabase/serverless@^1.1.0`
- `@vercel/blob@^2.4.0`

### 6-2. 신규 라이브러리
- `lib/db.ts` (server-only) — Neon 클라이언트 + `receipts` CRUD (list/get/create/update/delete)
- `lib/blob.ts` (server-only) — `put` / `del` 헬퍼

### 6-3. API 라우트 추가
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/receipts` | 목록 조회 |
| POST | `/api/receipts` | 생성 (Blob 업로드 + DB INSERT) |
| GET | `/api/receipts/[id]` | 단건 조회 |
| PATCH | `/api/receipts/[id]` | 부분 수정 |
| DELETE | `/api/receipts/[id]` | DB 삭제 + Blob 이미지 삭제 |

### 6-4. 타입/유틸 수정
- `lib/types.ts` — `imageDataUrl` (base64) → `imageUrl` (Blob URL), `date` 를 nullable 로
- `lib/image.ts` — `resizeToDataUrl` 제거, `resizeToFile` 추가 (업로드용 `File` 반환)
- `lib/storage.ts` — localStorage 직접 접근 → `fetch('/api/receipts')` 래퍼로 전면 재작성

### 6-5. 페이지 리팩터링
- `app/page.tsx` — `getAll()` 이 비동기 fetch 가 됨, 에러 토스트 처리 추가
- `app/upload/page.tsx` — `save()` → `create()` (FormData 로 이미지 + 메타데이터 POST)
- `app/receipts/[id]/page.tsx` — async fetch + PATCH/DELETE 호출, 저장/삭제 중 로딩 인디케이터
- `components/receipt-card.tsx` — `imageDataUrl` → `imageUrl` 사용

### 6-6. DB 마이그레이션 스크립트
- `scripts/init-db.mjs` — `.env.local` 자동 로드 + `receipts` 테이블/인덱스 idempotent 생성
- `package.json` 에 `npm run db:init` 추가

### 6-7. 환경변수/문서
- `.env.local.example` — `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` 추가
- README — Neon + Blob 셋업, `vercel env pull`, 데이터 모델(SQL), API 라우트 표, 새 동작 흐름도 추가

### 6-8. 빌드 검증 + push
- `npm run build` 통과 (TypeScript 통과, 7 라우트 등록)
- 커밋 `7120adc`

**스키마:**
```sql
create table receipts (
  id          uuid primary key default gen_random_uuid(),
  store       text not null default '',
  date        date,
  total       integer not null default 0,
  memo        text,
  image_url   text,
  raw_fields  jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
```

---

## 7. 프로덕션 디버깅 — Blob private store + DB 스키마 누락

**사용자 요청:**
> vercel 에서 배포는 완료되었는데, 영수증 업로드하다가 에러가 났어. err폴더에 log 파일 넣어놨어. 디버깅 정보가 부족하면, 디버깅할수 있는 코드를 작성해라.

**Vercel 로그 분석 (`err/` 의 JSON):**

```
[1] GET /api/receipts → 500
    NeonDbError: relation "receipts" does not exist  (code 42P01)

[2] POST /api/receipts → 500
    Vercel Blob: Cannot use public access on a private store.
    The store is configured with private access.
```

**원인:**

1. production Neon 에 `npm run db:init` 미적용 → 테이블 없음
2. Vercel Blob 스토어를 private 으로 생성했는데 코드는 `put({ access: "public" })` 호출

**진행한 작업:**

### 7-1. DB 스키마 셋업을 production 에서 직접 — `/api/setup`
- `app/api/setup/route.ts` — GET/POST 둘 다 받음
- idempotent (`create ... if not exists`), 결과를 statement 단위로 리포트
- 마지막에 `receipts` row count 도 반환 (정상 동작 확인용)

### 7-2. Blob private store 지원
- **방향 결정:** 사용자 Vercel UI 손대지 않고 코드로 해결
- `lib/blob.ts` — `access: 'private'` 으로 변경, `getReceiptImageStream` (`get()` 래퍼) 추가
- **신규:** `app/api/receipts/[id]/image/route.ts` — 영수증 ID → DB 조회 → `get()` 으로 Blob stream → 클라이언트로 스트리밍
- `components/receipt-card.tsx` 와 `app/receipts/[id]/page.tsx` — `<img src={receipt.imageUrl}>` → `<img src={'/api/receipts/' + id + '/image'}>` 로 교체

### 7-3. 에러 응답 디버깅 정보 강화
- `/api/receipts` 의 500 응답에 `detail` 필드 추가 (`err.name: err.message` 앞 400자)
- `lib/storage.ts` 클라이언트 — `error + detail` 합쳐 throw → 토스트에 실제 원인 표시
- 다음 번 에러부터는 Vercel 로그 안 봐도 UI 토스트만으로 원인 파악 가능

### 7-4. 기타
- `.gitignore` 에 `/err/` 추가 (디버그 로그 폴더가 실수로 커밋된 것 untrack)
- README 에 `/api/setup` 호출법 + private Blob 동작 방식 명시

**커밋:**
- `ae1d457` — 메인 수정 (setup 엔드포인트 + private Blob + 이미지 프록시 + 에러 detail)
- `daabd82` — `/err/` gitignore 추가 + 로그 파일 untrack

---

## 8. 검증 — `curl /api/setup` + 업로드 재시도

**사용자 요청:**
> curl로 setup 호출하고 다시 업로드 시도해볼게

→ POST `/api/setup` 으로 production Neon 에 `receipts` 테이블/인덱스 생성

**결과:**
> 업로드 잘되었어

- OCR (Upstage) → 가게/날짜/금액 추출
- Vercel Blob (private) → 이미지 업로드
- `/api/receipts/[id]/image` 프록시 → 이미지 표시
- Neon Postgres → 다기기 동기화

---

## 최종 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│  Vercel (Next.js 16, App Router)                        │
│                                                          │
│  /upload  ─→  /api/extract  ──→  Upstage OCR            │
│      │                                                   │
│      └─→  /api/receipts (POST FormData)                 │
│              ├─→  put() → Vercel Blob (private)         │
│              └─→  INSERT → Neon receipts                 │
│                                                          │
│  /          ←─  GET /api/receipts        ←─ Neon SELECT │
│  /receipts/[id]                                          │
│      ├─ src=/api/receipts/[id]/image  ←─ get() proxy   │
│      ├─ PATCH /api/receipts/[id]      → Neon UPDATE    │
│      └─ DELETE /api/receipts/[id]     → Neon DEL + del()│
└─────────────────────────────────────────────────────────┘
```

## 환경변수

| Key | 출처 | 용도 |
|---|---|---|
| `UPSTAGE_API_KEY` | 수동 입력 | Upstage OCR |
| `DATABASE_URL` | Vercel Neon 통합 자동 주입 | Postgres 연결 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 통합 자동 주입 | Blob 인증 |

## 1회성 셋업 절차

배포 후 한 번만:
```bash
curl -X POST https://<배포URL>/api/setup
```

→ `receipts` 테이블/인덱스 생성. 이후 `/upload` 정상 동작.

## 남은 개선 거리

- **보안 — 노출된 Upstage 키 폐기 필요** (대화/스크린샷에 노출됨)
- **인증/멀티유저 분리 없음** — URL 만 알면 누구나 추가/수정 가능. 공유 비추천. 필요 시 NextAuth 추가.
- `scripts/smoke.mjs` — 옛 localStorage 시드 방식이라 더 이상 동작 안 함 (운영 코드 아니므로 손대지 않음)
