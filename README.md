# 유튜브 영상 학습 서비스

## 기존 아이디어
1. 스크립트 추출 -> 질의응답
2. 이미지 까지 같이 추출 -> 내용정리 -> 질의응답

## 전체 프로세스

### 1. 채널 영상 목록 조회
- **기술**: YouTube Data API v3 (Google API Key 사용)
- **기능**: 특정 채널의 영상 리스트 가져오기
- **출력**: 영상 제목, 썸네일, 업로드 날짜, 영상 ID, 조회수 등

### 2. 영상 선택 및 정보 표시
- **기능**: 사용자가 관심있는 영상 선택
- **UI**: 영상 목록을 카드 형태로 표시
- **정보**: 제목, 썸네일, 설명, 길이, 업로드 날짜

### 3. 영상 스크립트 추출
- **기술**: yt-dlp 또는 YouTube Transcript API
- **기능**: 선택된 영상의 자막/스크립트 추출
- **처리**: 자동 생성 자막 또는 수동 자막 우선순위 처리

### 4. 내용 요약 및 분석
- **기술**: OpenAI API 또는 Google Gemini API
- **기능**: 
  - 스크립트 내용 요약
  - 주요 키워드 추출
  - 학습 포인트 정리
  - 챕터별 구분

### 5. 질의응답 시스템
- **기술**: LLM API (OpenAI/Google)
- **기능**:
  - 영상 내용 기반 질문 생성
  - 사용자 질문에 대한 답변
  - 관련 타임스탬프 제공
  - 추가 학습 자료 추천

### 6. 학습 관리
- **기능**:
  - 학습한 영상 목록 관리
  - 학습 진도 추적
  - 복습 알림
  - 노트 작성 및 저장

## 기술 스택 (예상)
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express 또는 Next.js API Routes
- **Database**: SQLite 또는 PostgreSQL
- **APIs**: 
  - YouTube Data API v3
  - OpenAI API
  - Google Gemini API
- **패키지 매니저**: bun
- **영상 처리**: yt-dlp

## 환경 변수
- `GOOGLE_API_KEY`: YouTube Data API 및 Gemini API
- `OPENAI_API_KEY`: OpenAI GPT API