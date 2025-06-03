import { NextRequest, NextResponse } from "next/server";
import { youtubeAPI } from "@/lib/youtube";
import { parseYouTubeURL } from "@/utils/youtube-url-parser";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL이 필요합니다." }, { status: 400 });
    }

    const parsed = parseYouTubeURL(url);

    if (parsed.type === "unknown") {
      return NextResponse.json(
        { error: "유효하지 않은 YouTube URL입니다." },
        { status: 400 }
      );
    }

    let result: any = { type: parsed.type };

    switch (parsed.type) {
      case "video":
        if (parsed.videoId) {
          // 영상 정보와 채널 정보 모두 가져오기
          const [videoInfo, channelInfo] = await Promise.all([
            youtubeAPI.getVideoInfo(parsed.videoId),
            youtubeAPI.getChannelFromVideo(parsed.videoId),
          ]);

          result.video = videoInfo;
          result.channel = channelInfo;
          result.timestamp = parsed.timestamp;

          // 플레이리스트가 있다면 플레이리스트 정보도 가져오기
          if (parsed.playlistId) {
            const playlistInfo = await youtubeAPI.getPlaylistVideos(
              parsed.playlistId,
              10
            );
            result.playlist = {
              id: parsed.playlistId,
              title: playlistInfo.playlistTitle,
              videos: playlistInfo.videos,
            };
          }
        }
        break;

      case "channel":
        let channelInfo = null;
        if (parsed.channelId) {
          channelInfo = await youtubeAPI.getChannelInfo(parsed.channelId);
        } else if (parsed.channelHandle) {
          channelInfo = await youtubeAPI.getChannelByHandle(
            parsed.channelHandle
          );
        }
        result.channel = channelInfo;
        break;

      case "playlist":
        if (parsed.playlistId) {
          const playlistInfo = await youtubeAPI.getPlaylistVideos(
            parsed.playlistId,
            20
          );
          result.playlist = {
            id: parsed.playlistId,
            title: playlistInfo.playlistTitle,
            videos: playlistInfo.videos,
            nextPageToken: playlistInfo.nextPageToken,
          };
        }
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("URL 파싱 API 오류:", error);
    return NextResponse.json(
      { error: "URL 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
