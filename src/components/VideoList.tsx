"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Eye,
  Clock,
  Calendar,
  List,
  Video as VideoIcon,
} from "lucide-react";
import { ChannelInfo, VideoItem, PlaylistInfo } from "@/types/youtube";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface VideoListProps {
  channel: ChannelInfo;
  onBack: () => void;
  onPlaylistSelect?: (playlistId: string, playlistTitle: string) => void;
}

export default function VideoList({
  channel,
  onBack,
  onPlaylistSelect,
}: VideoListProps) {
  const [activeTab, setActiveTab] = useState<"videos" | "playlists">("videos");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "videos") {
      loadVideos();
    } else {
      loadPlaylists();
    }
  }, [channel.id, activeTab]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        channelId: channel.id,
      });

      const response = await fetch(`/api/youtube/videos?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "영상 목록을 가져오는데 실패했습니다.");
      }

      setVideos(data.videos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        channelId: channel.id,
      });

      const response = await fetch(`/api/youtube/playlists?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "플레이리스트 목록을 가져오는데 실패했습니다."
        );
      }

      setPlaylists(data.playlists);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>뒤로가기</span>
        </button>

        <div className="flex items-center space-x-4">
          <img
            src={channel.thumbnail}
            alt={channel.title}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {channel.title}
            </h1>
            <p className="text-gray-600">
              구독자 {formatNumber(channel.subscriberCount)}명 • 동영상{" "}
              {formatNumber(channel.videoCount)}개
            </p>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("videos")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "videos"
                ? "border-youtube-red text-youtube-red"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <VideoIcon className="w-4 h-4" />
              <span>영상</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "playlists"
                ? "border-youtube-red text-youtube-red"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>플레이리스트</span>
            </div>
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 영상 목록 */}
      {activeTab === "videos" && (
        <div className="space-y-4">
          {videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => {
                    // TODO: 영상 선택 시 스크립트 추출 페이지로 이동
                    window.open(video.url, "_blank");
                  }}
                >
                  {/* 썸네일 */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                      {video.duration}
                    </div>
                  </div>

                  {/* 영상 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-2">
                      {video.title}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(video.viewCount)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                    </div>

                    {video.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12">
                <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">영상이 없습니다.</p>
              </div>
            )
          )}
        </div>
      )}

      {/* 플레이리스트 목록 */}
      {activeTab === "playlists" && (
        <div className="space-y-4">
          {playlists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() =>
                    onPlaylistSelect?.(playlist.id, playlist.title)
                  }
                >
                  <div className="relative">
                    <img
                      src={playlist.thumbnail}
                      alt={playlist.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <List className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                      {playlist.videoCount}개 영상
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {playlist.title}
                  </h3>

                  {playlist.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">플레이리스트가 없습니다.</p>
              </div>
            )
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-youtube-red mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {activeTab === "videos" ? "영상을" : "플레이리스트를"} 불러오는
            중...
          </p>
        </div>
      )}
    </div>
  );
}
