import { NextRequest, NextResponse } from "next/server";
import { youtubeAPI } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const maxResults = parseInt(searchParams.get("maxResults") || "20");
    const pageToken = searchParams.get("pageToken") || undefined;

    if (!channelId) {
      return NextResponse.json(
        { error: "채널 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await youtubeAPI.getChannelVideos(
      channelId,
      maxResults,
      pageToken
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("영상 목록 API 오류:", error);
    return NextResponse.json(
      { error: "영상 목록을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
