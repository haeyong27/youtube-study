import { NextRequest, NextResponse } from "next/server";
import { youtubeAPI } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const pageToken = searchParams.get("pageToken");

    if (!channelId) {
      return NextResponse.json(
        { error: "채널 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await youtubeAPI.getChannelVideos(
      channelId,
      20,
      pageToken || undefined
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("채널 영상 목록 가져오기 실패:", error);
    return NextResponse.json(
      { error: "채널 영상 목록을 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
