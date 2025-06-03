import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId가 필요합니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // YouTube Data API를 사용하여 영상 상세 정보 가져오기
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics,contentDetails&` +
        `id=${videoId}&` +
        `key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error("YouTube API 요청 실패");
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "영상을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const statistics = item.statistics;
    const contentDetails = item.contentDetails;

    // 영상 시간 포맷팅 (ISO 8601 duration을 읽기 쉬운 형태로 변환)
    const formatDuration = (duration: string): string => {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return "0:00";

      const hours = parseInt(match[1] || "0");
      const minutes = parseInt(match[2] || "0");
      const seconds = parseInt(match[3] || "0");

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
      } else {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
    };

    const video = {
      id: item.id,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
      publishedAt: snippet.publishedAt,
      duration: formatDuration(contentDetails.duration),
      viewCount: parseInt(statistics.viewCount || "0"),
      likeCount: parseInt(statistics.likeCount || "0"),
      commentCount: parseInt(statistics.commentCount || "0"),
      url: `https://www.youtube.com/watch?v=${item.id}`,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
    };

    return NextResponse.json({ video });
  } catch (error) {
    console.error("영상 상세 정보 가져오기 오류:", error);
    return NextResponse.json(
      { error: "영상 정보를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
