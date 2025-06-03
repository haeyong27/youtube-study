import axios from "axios";
import {
  YouTubeSearchResponse,
  YouTubeChannelResponse,
  VideoItem,
  ChannelInfo,
  PlaylistInfo,
} from "@/types/youtube";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

class YouTubeAPI {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_API_KEY가 설정되지 않았습니다.");
    }
  }

  // 영상 ID로 영상 정보 가져오기
  async getVideoInfo(videoId: string): Promise<VideoItem | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: "snippet,statistics,contentDetails",
        },
      });

      const video = response.data.items[0];
      if (!video) return null;

      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail:
          video.snippet.thumbnails.high?.url ||
          video.snippet.thumbnails.medium?.url,
        publishedAt: video.snippet.publishedAt,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount || "0"),
        channelTitle: video.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${video.id}`,
      };
    } catch (error) {
      console.error("영상 정보 가져오기 실패:", error);
      throw error;
    }
  }

  // 영상 ID로 채널 정보 가져오기
  async getChannelFromVideo(videoId: string): Promise<ChannelInfo | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: "snippet",
        },
      });

      const video = response.data.items[0];
      if (!video) return null;

      const channelId = video.snippet.channelId;
      return await this.getChannelInfo(channelId);
    } catch (error) {
      console.error("영상으로부터 채널 정보 가져오기 실패:", error);
      throw error;
    }
  }

  // 채널 핸들(@username)로 채널 정보 가져오기
  async getChannelByHandle(handle: string): Promise<ChannelInfo | null> {
    try {
      // @ 제거
      const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          key: this.apiKey,
          forHandle: cleanHandle,
          part: "snippet,statistics",
        },
      });

      const channel = response.data.items[0];
      if (!channel) return null;

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail:
          channel.snippet.thumbnails.high?.url ||
          channel.snippet.thumbnails.medium?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
        videoCount: parseInt(channel.statistics.videoCount || "0"),
      };
    } catch (error) {
      console.error("채널 핸들로 정보 가져오기 실패:", error);
      // 핸들로 찾지 못하면 검색으로 시도
      try {
        const searchResults = await this.searchChannels(handle);
        return searchResults[0] || null;
      } catch (searchError) {
        console.error("채널 검색도 실패:", searchError);
        throw error;
      }
    }
  }

  // 채널의 플레이리스트 목록 가져오기 (모든 플레이리스트를 한번에 가져오기)
  async getChannelPlaylists(
    channelId: string,
    maxResults: number = 50,
    pageToken?: string,
    allPlaylists: PlaylistInfo[] = []
  ): Promise<{ playlists: PlaylistInfo[]; nextPageToken?: string }> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/playlists`, {
        params: {
          key: this.apiKey,
          channelId,
          part: "snippet,contentDetails",
          maxResults,
          pageToken,
        },
      });

      const playlists: PlaylistInfo[] = response.data.items.map(
        (playlist: any) => ({
          id: playlist.id,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          thumbnail:
            playlist.snippet.thumbnails.high?.url ||
            playlist.snippet.thumbnails.medium?.url,
          videoCount: parseInt(playlist.contentDetails.itemCount || "0"),
          channelTitle: playlist.snippet.channelTitle,
          channelId: playlist.snippet.channelId,
        })
      );

      const combinedPlaylists = [...allPlaylists, ...playlists];

      // 다음 페이지가 있으면 재귀적으로 모든 데이터 가져오기
      if (response.data.nextPageToken) {
        return await this.getChannelPlaylists(
          channelId,
          maxResults,
          response.data.nextPageToken,
          combinedPlaylists
        );
      }

      return {
        playlists: combinedPlaylists,
        nextPageToken: undefined, // 모든 데이터를 가져왔으므로 nextPageToken은 undefined
      };
    } catch (error) {
      console.error("채널 플레이리스트 목록 가져오기 실패:", error);
      throw error;
    }
  }

  // 플레이리스트 정보 가져오기 (모든 영상을 한번에 가져오기)
  async getPlaylistVideos(
    playlistId: string,
    maxResults: number = 50,
    pageToken?: string,
    allVideos: VideoItem[] = []
  ): Promise<{
    videos: VideoItem[];
    nextPageToken?: string;
    playlistTitle?: string;
  }> {
    try {
      // 플레이리스트 정보 가져오기 (첫 번째 호출에서만)
      let playlistTitle: string | undefined;
      if (!pageToken) {
        const playlistResponse = await axios.get(
          `${YOUTUBE_API_BASE_URL}/playlists`,
          {
            params: {
              key: this.apiKey,
              id: playlistId,
              part: "snippet",
            },
          }
        );
        playlistTitle = playlistResponse.data.items[0]?.snippet?.title;
      }

      // 플레이리스트 아이템 가져오기
      const itemsResponse = await axios.get(
        `${YOUTUBE_API_BASE_URL}/playlistItems`,
        {
          params: {
            key: this.apiKey,
            playlistId,
            part: "snippet",
            maxResults,
            pageToken,
          },
        }
      );

      const videoIds = itemsResponse.data.items.map(
        (item: any) => item.snippet.resourceId.videoId
      );

      // 영상 상세 정보 가져오기
      const videosResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds.join(","),
          part: "snippet,statistics,contentDetails",
        },
      });

      const videos: VideoItem[] = videosResponse.data.items.map(
        (video: any) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail:
            video.snippet.thumbnails.high?.url ||
            video.snippet.thumbnails.medium?.url,
          publishedAt: video.snippet.publishedAt,
          duration: this.parseDuration(video.contentDetails.duration),
          viewCount: parseInt(video.statistics.viewCount || "0"),
          channelTitle: video.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${video.id}`,
        })
      );

      const combinedVideos = [...allVideos, ...videos];

      // 다음 페이지가 있으면 재귀적으로 모든 데이터 가져오기
      if (itemsResponse.data.nextPageToken) {
        const nextResult = await this.getPlaylistVideos(
          playlistId,
          maxResults,
          itemsResponse.data.nextPageToken,
          combinedVideos
        );
        return {
          videos: nextResult.videos,
          nextPageToken: undefined, // 모든 데이터를 가져왔으므로 nextPageToken은 undefined
          playlistTitle: playlistTitle || nextResult.playlistTitle,
        };
      }

      return {
        videos: combinedVideos,
        nextPageToken: undefined, // 모든 데이터를 가져왔으므로 nextPageToken은 undefined
        playlistTitle,
      };
    } catch (error) {
      console.error("플레이리스트 영상 목록 가져오기 실패:", error);
      throw error;
    }
  }

  // 채널 정보 가져오기
  async getChannelInfo(channelId: string): Promise<ChannelInfo | null> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
        params: {
          key: this.apiKey,
          id: channelId,
          part: "snippet,statistics",
        },
      });

      const channel = response.data.items[0];
      if (!channel) return null;

      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.high.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
        videoCount: parseInt(channel.statistics.videoCount || "0"),
      };
    } catch (error) {
      console.error("채널 정보 가져오기 실패:", error);
      throw error;
    }
  }

  // 채널의 영상 목록 가져오기 (페이지네이션 지원)
  async getChannelVideos(
    channelId: string,
    maxResults: number = 20,
    pageToken?: string
  ): Promise<{ videos: VideoItem[]; nextPageToken?: string }> {
    try {
      // 1. 채널의 업로드 플레이리스트 ID 가져오기
      const channelResponse = await axios.get(
        `${YOUTUBE_API_BASE_URL}/channels`,
        {
          params: {
            key: this.apiKey,
            id: channelId,
            part: "contentDetails",
          },
        }
      );

      const uploadsPlaylistId =
        channelResponse.data.items[0]?.contentDetails?.relatedPlaylists
          ?.uploads;
      if (!uploadsPlaylistId) {
        throw new Error("업로드 플레이리스트를 찾을 수 없습니다.");
      }

      // 2. 플레이리스트의 영상 목록 가져오기
      const playlistResponse = await axios.get(
        `${YOUTUBE_API_BASE_URL}/playlistItems`,
        {
          params: {
            key: this.apiKey,
            playlistId: uploadsPlaylistId,
            part: "snippet",
            maxResults,
            pageToken,
            order: "date",
          },
        }
      );

      const videoIds = playlistResponse.data.items.map(
        (item: any) => item.snippet.resourceId.videoId
      );

      // 3. 영상 상세 정보 가져오기
      const videosResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds.join(","),
          part: "snippet,statistics,contentDetails",
        },
      });

      const videos: VideoItem[] = videosResponse.data.items.map(
        (video: any) => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail:
            video.snippet.thumbnails.high?.url ||
            video.snippet.thumbnails.medium?.url,
          publishedAt: video.snippet.publishedAt,
          duration: this.parseDuration(video.contentDetails.duration),
          viewCount: parseInt(video.statistics.viewCount || "0"),
          channelTitle: video.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${video.id}`,
        })
      );

      return {
        videos,
        nextPageToken: playlistResponse.data.nextPageToken,
      };
    } catch (error) {
      console.error("채널 영상 목록 가져오기 실패:", error);
      throw error;
    }
  }

  // 채널 ID로 검색 (채널명으로 검색할 때 사용)
  async searchChannels(query: string): Promise<ChannelInfo[]> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          key: this.apiKey,
          q: query,
          type: "channel",
          part: "snippet",
          maxResults: 10,
        },
      });

      const channelIds = response.data.items.map(
        (item: any) => item.id.channelId
      );

      // 채널 상세 정보 가져오기
      const channelsResponse = await axios.get(
        `${YOUTUBE_API_BASE_URL}/channels`,
        {
          params: {
            key: this.apiKey,
            id: channelIds.join(","),
            part: "snippet,statistics",
          },
        }
      );

      return channelsResponse.data.items.map((channel: any) => ({
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail:
          channel.snippet.thumbnails.high?.url ||
          channel.snippet.thumbnails.medium?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
        videoCount: parseInt(channel.statistics.videoCount || "0"),
      }));
    } catch (error) {
      console.error("채널 검색 실패:", error);
      throw error;
    }
  }

  // YouTube 지속시간 파싱 (PT4M13S -> 4:13)
  private parseDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1]?.replace("H", "") || "0");
    const minutes = parseInt(match[2]?.replace("M", "") || "0");
    const seconds = parseInt(match[3]?.replace("S", "") || "0");

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

export const youtubeAPI = new YouTubeAPI();
