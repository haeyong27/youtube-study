import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// 최대 30초까지 스트리밍 응답 허용
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    // 컨텍스트가 있으면 시스템 메시지에 포함
    let systemMessage = `당신은 YouTube 콘텐츠 분석 전문가입니다. 사용자가 제공한 YouTube 영상이나 플레이리스트 정보를 바탕으로 도움을 드립니다.

다음과 같은 도움을 제공할 수 있습니다:
- 영상 내용 요약 및 분석
- 학습 계획 수립
- 관련 주제 추천
- 영상 시청 순서 제안
- 핵심 포인트 정리

항상 한국어로 친근하고 도움이 되는 답변을 제공해주세요.`;

    if (context) {
      systemMessage += `\n\n현재 분석 중인 콘텐츠 정보:\n${JSON.stringify(
        context,
        null,
        2
      )}`;
    }

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemMessage,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("채팅 API 오류:", error);
    return new Response("채팅 처리 중 오류가 발생했습니다.", { status: 500 });
  }
}
