"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Eye, Calendar, List, Clock } from "lucide-react";
import { VideoItem } from "@/types/youtube";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface PlaylistViewProps {
  playlistId: string;
  playlistTitle?: string;
  onBack: () => void;
}

export default function PlaylistView({
  playlistId,
  playlistTitle,
  onBack,
}: PlaylistViewProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(playlistTitle || "");

  useEffect(() => {
    loadPlaylistVideos();
  }, [playlistId]);

  const loadPlaylistVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/youtube/parse-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: `https://www.youtube.com/playlist?list=${playlistId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "플레이리스트를 가져오는데 실패했습니다."
        );
      }

      if (data.playlist) {
        setVideos(data.playlist.videos);
        setTitle(data.playlist.title || title);
      }
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

  const getTotalDuration = (): string => {
    const totalSeconds = videos.reduce((total, video) => {
      const [minutes, seconds] = video.duration.split(":").map(Number);
      return total + minutes * 60 + (seconds || 0);
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
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
          <List className="w-8 h-8 text-youtube-red" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>{videos.length}개 영상</span>
              {videos.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>총 {getTotalDuration()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 영상 목록 */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-3">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  // TODO: 영상 선택 시 스크립트 추출 페이지로 이동
                  window.open(video.url, "_blank");
                }}
              >
                {/* 순서 번호 */}
                <div className="flex-shrink-0 w-8 text-center">
                  <span className="text-sm font-medium text-gray-500">
                    {index + 1}
                  </span>
                </div>

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

                  <p className="text-sm text-gray-600 mb-2">
                    {video.channelTitle}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && videos.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-youtube-red mx-auto"></div>
          <p className="mt-4 text-gray-600">플레이리스트를 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}
