// YouTube URL 파싱 유틸리티

export interface ParsedYouTubeURL {
  type: "video" | "channel" | "playlist" | "unknown";
  videoId?: string;
  channelId?: string;
  channelHandle?: string;
  playlistId?: string;
  timestamp?: number;
}

export function parseYouTubeURL(url: string): ParsedYouTubeURL {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube 도메인 확인
    if (!hostname.includes("youtube.com") && !hostname.includes("youtu.be")) {
      return { type: "unknown" };
    }

    // youtu.be 단축 URL 처리
    if (hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1);
      const timestamp = parseTimestamp(urlObj.searchParams.get("t"));
      return {
        type: "video",
        videoId,
        timestamp,
      };
    }

    // youtube.com URL 처리
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // 영상 URL (/watch?v=...)
    if (pathname === "/watch" && searchParams.has("v")) {
      const videoId = searchParams.get("v")!;
      const playlistId = searchParams.get("list") || undefined;
      const timestamp = parseTimestamp(searchParams.get("t"));

      return {
        type: "video",
        videoId,
        playlistId,
        timestamp,
      };
    }

    // 채널 URL (/channel/..., /c/..., /@...)
    if (pathname.startsWith("/channel/")) {
      const channelId = pathname.split("/channel/")[1];
      return {
        type: "channel",
        channelId,
      };
    }

    if (pathname.startsWith("/c/") || pathname.startsWith("/@")) {
      const channelHandle = pathname.startsWith("/c/")
        ? pathname.split("/c/")[1]
        : pathname.split("/@")[1];
      return {
        type: "channel",
        channelHandle,
      };
    }

    // 플레이리스트 URL (/playlist?list=...)
    if (pathname === "/playlist" && searchParams.has("list")) {
      const playlistId = searchParams.get("list")!;
      return {
        type: "playlist",
        playlistId,
      };
    }

    return { type: "unknown" };
  } catch (error) {
    console.error("URL 파싱 오류:", error);
    return { type: "unknown" };
  }
}

function parseTimestamp(timestampStr: string | null): number | undefined {
  if (!timestampStr) return undefined;

  // 숫자만 있는 경우 (초 단위)
  if (/^\d+$/.test(timestampStr)) {
    return parseInt(timestampStr);
  }

  // 1h2m3s 형태
  const match = timestampStr.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (match) {
    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");
    return hours * 3600 + minutes * 60 + seconds;
  }

  return undefined;
}

export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function isYouTubeURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes("youtube.com") || hostname.includes("youtu.be");
  } catch {
    return false;
  }
}
