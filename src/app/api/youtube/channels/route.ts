import { NextRequest, NextResponse } from "next/server";
import { youtubeAPI } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "검색어가 필요합니다." },
        { status: 400 }
      );
    }

    const channels = await youtubeAPI.searchChannels(query);

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("채널 검색 API 오류:", error);
    return NextResponse.json(
      { error: "채널 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
