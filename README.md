# VibeLRS

AI 기반 학습 자료 관리 시스템입니다.
PDF 문서를 업로드하면 AI가 내용을 분석하고, 문서를 기반으로 질문하거나 AI 채팅을 통해 학습할 수 있습니다.

---

## 주요 기능

- **문서 관리** — PDF 업로드, 폴더(카테고리)별 분류, 삭제
- **AI 문서 분석** — 업로드된 PDF를 Gemini 멀티모달로 분석해 텍스트·표·이미지 내용 추출
- **RAG 기반 질의응답** — 문서 내용을 벡터로 저장하고 유사도 검색으로 관련 내용만 참고해 답변
- **AI 채팅** — 세션 단위 채팅, 선택한 폴더 내 문서를 컨텍스트로 활용
- **문서 뷰어** — PDF 직접 열람 + 해당 문서 전용 AI 채팅 패널
- **회원 인증** — 회원가입/로그인, 마이페이지(정보 수정, 비밀번호 변경)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프론트엔드** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **백엔드** | FastAPI, Python |
| **데이터베이스** | Supabase (PostgreSQL + pgvector) |
| **스토리지** | Supabase Storage |
| **AI** | Google Gemini (gemini-3.1-flash-lite, gemini-embedding-001) |
| **인증** | bcrypt 비밀번호 해시 + localStorage |

---

## 프로젝트 구조

```
hackathon/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # FastAPI 라우터 (auth, documents, chat, categories)
│   │   ├── core/           # 설정, Supabase 클라이언트, Gemini 클라이언트
│   │   ├── models/         # Pydantic 요청/응답 스키마
│   │   └── services/       # 비즈니스 로직 (auth, chat, document, RAG)
│   ├── main.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/            # 백엔드 API 호출 함수
        ├── app/            # Next.js 페이지 (/, /register, /mypage)
        ├── components/     # UI 컴포넌트
        ├── hooks/          # 커스텀 훅 (useAuth, useChat, useAppData 등)
        ├── types/          # TypeScript 타입 정의
        └── utils/          # 유틸리티 함수
```

---

## 시작하기

### 사전 준비

- [Supabase](https://supabase.com) 프로젝트 생성 및 API 키 발급
- [Google AI Studio](https://aistudio.google.com) Gemini API 키 발급
- Node.js 18+, Python 3.10+

### 1. 백엔드 실행

```bash
cd backend

# 가상환경 설정
python -m venv venv
source venv/bin/activate        # Mac/Linux
# .\venv\Scripts\Activate.ps1  # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에 아래 값 입력
# SUPABASE_URL=...
# SUPABASE_KEY=...
# GEMINI_API_KEY=...

# 서버 실행
uvicorn main:app --reload --port 8000
```

API 문서: http://localhost:8000/docs

### 2. 프론트엔드 실행

```bash
cd frontend

npm install
npm run dev
```

브라우저: http://localhost:3000

> 백엔드가 먼저 실행되어 있어야 합니다.

---

## 환경변수

`backend/.env` 파일에 아래 항목을 설정합니다.

| 변수명 | 설명 |
|--------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `GEMINI_API_KEY` | Google Gemini API 키 |

---

## 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/auth/register` | 회원가입 |
| `POST` | `/auth/login` | 로그인 |
| `POST` | `/documents/upload` | PDF 업로드 |
| `POST` | `/chat/ask` | AI 채팅 질문 |
| `POST` | `/documents/{id}/ask` | 문서 기반 질문 |
| `GET` | `/categories/{user_id}` | 폴더 목록 조회 |

전체 API 문서는 서버 실행 후 `/docs`에서 확인할 수 있습니다.
