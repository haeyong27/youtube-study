# YouTube Study

YouTube 채널, 플레이리스트, 영상을 분석하고 AI와 채팅할 수 있는 학습 도구입니다.

## 주요 기능

- **YouTube 콘텐츠 검색**: 채널명이나 YouTube URL로 검색
- **전체 데이터 로드**: 모든 영상과 플레이리스트를 한번에 가져오기
- **AI 채팅 기능**: 
  - 채널 전체에 대한 분석 및 추천
  - 플레이리스트 학습 계획 수립
  - 개별 영상 내용 분석 및 요약
  - 일반적인 학습 상담

## 설치 및 실행

1. 의존성 설치:
```bash
bun install
```

2. 환경 변수 설정:
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google YouTube API Key
GOOGLE_API_KEY=your_google_api_key_here

# OpenAI API Key for AI Chat
OPENAI_API_KEY=your_openai_api_key_here
```

3. 개발 서버 실행:
```bash
bun run dev
```

## API 키 발급 방법

### Google YouTube API Key
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. YouTube Data API v3 활성화
4. 사용자 인증 정보에서 API 키 생성

### OpenAI API Key
1. [OpenAI Platform](https://platform.openai.com/)에 접속
2. API Keys 섹션에서 새 API 키 생성
3. 생성된 키를 안전하게 보관

## 사용 방법

### 기본 검색
1. 메인 페이지에서 채널명 또는 YouTube URL 입력
2. 검색 결과에서 원하는 채널 선택

### AI 채팅 기능
- **일반 채팅**: 메인 페이지 좌하단의 파란색 채팅 버튼 클릭
- **채널 분석**: 채널 페이지에서 "AI와 채팅" 버튼 클릭
- **플레이리스트 분석**: 플레이리스트 페이지에서 "AI와 채팅" 버튼 클릭
- **개별 영상 분석**: 
  - 영상에 마우스 호버 시 나타나는 채팅 버튼 클릭
  - 또는 Shift + 클릭으로 영상 채팅 열기

### AI 채팅 예시 질문
- **채널 분석**: "이 채널의 특징을 분석해주세요", "추천 영상을 골라주세요"
- **플레이리스트**: "학습 순서를 추천해주세요", "각 영상의 주요 내용을 설명해주세요"
- **개별 영상**: "이 영상의 핵심 내용을 요약해주세요", "학습 포인트를 정리해주세요"

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI**: Vercel AI SDK, OpenAI GPT-4
- **API**: YouTube Data API v3
- **Package Manager**: Bun

## 주요 변경사항

### v2.0 - AI 채팅 기능 추가
- Vercel AI SDK를 사용한 실시간 스트리밍 채팅
- 컨텍스트 기반 AI 분석 (채널, 플레이리스트, 영상별)
- 개별 영상에 대한 상세 분석 기능
- 학습 계획 수립 및 추천 시스템

### v1.0 - 기본 기능
- YouTube 채널/플레이리스트 검색
- 모든 영상 데이터 한번에 로드
- 반응형 UI 디자인