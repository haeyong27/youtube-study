"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Eye, Clock, Calendar } from "lucide-react";
import { ChannelInfo, VideoItem } from "@/types/youtube";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface VideoListProps {
  channel: ChannelInfo;
  onBack: () => void;
}

export default function VideoList({ channel, onBack }: VideoListProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  useEffect(() => {
    loadVideos();
  }, [channel.id]);

  const loadVideos = async (pageToken?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        channelId: channel.id,
        maxResults: "20",
      });

      if (pageToken) {
        params.append("pageToken", pageToken);
      }

      const response = await fetch(`/api/youtube/videos?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "영상 목록을 가져오는데 실패했습니다.");
      }

      if (pageToken) {
        setVideos((prev) => [...prev, ...data.videos]);
      } else {
        setVideos(data.videos);
      }

      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMoreVideos = () => {
    if (nextPageToken && !loading) {
      loadVideos(nextPageToken);
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 영상 목록 */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">최신 영상</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  // TODO: 영상 선택 시 스크립트 추출 페이지로 이동
                  window.open(video.url, "_blank");
                }}
              >
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {video.title}
                  </h3>

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
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 더 보기 버튼 */}
          {nextPageToken && (
            <div className="text-center">
              <button
                onClick={loadMoreVideos}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "로딩 중..." : "더 보기"}
              </button>
            </div>
          )}
        </div>
      )}

      {loading && videos.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-youtube-red mx-auto"></div>
          <p className="mt-4 text-gray-600">영상 목록을 불러오는 중...</p>
        </div>
      )}
    </div>
  );
}
