"use client";

import { useState } from "react";
import { Search, Users, Video, Link, AlertCircle } from "lucide-react";
import { ChannelInfo } from "@/types/youtube";
import { isYouTubeURL } from "@/utils/youtube-url-parser";

interface ChannelSearchProps {
  onChannelSelect: (channel: ChannelInfo) => void;
  onPlaylistSelect?: (playlistId: string, playlistTitle: string) => void;
}

export default function ChannelSearch({
  onChannelSelect,
  onPlaylistSelect,
}: ChannelSearchProps) {
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInfo, setUrlInfo] = useState<any>(null);

  const searchChannels = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setUrlInfo(null);

    try {
      // YouTube URL인지 확인
      if (isYouTubeURL(query)) {
        await handleYouTubeURL(query);
      } else {
        // 일반 검색
        const response = await fetch(
          `/api/youtube/channels?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "채널 검색에 실패했습니다.");
        }

        setChannels(data.channels);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleYouTubeURL = async (url: string) => {
    try {
      const response = await fetch("/api/youtube/parse-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "URL 처리에 실패했습니다.");
      }

      setUrlInfo(data);

      // 채널 정보가 있으면 채널 목록에 추가
      if (data.channel) {
        setChannels([data.channel]);
      }

      // 플레이리스트 URL인 경우 직접 플레이리스트 뷰로 이동
      if (data.type === "playlist" && data.playlist && onPlaylistSelect) {
        onPlaylistSelect(data.playlist.id, data.playlist.title);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchChannels();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const renderURLInfo = () => {
    if (!urlInfo) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Link className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">URL 분석 결과</h4>

            {urlInfo.type === "video" && urlInfo.video && (
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>영상:</strong> {urlInfo.video.title}
                </p>
                {urlInfo.timestamp && (
                  <p className="text-sm text-blue-800">
                    <strong>타임스탬프:</strong>{" "}
                    {Math.floor(urlInfo.timestamp / 60)}:
                    {(urlInfo.timestamp % 60).toString().padStart(2, "0")}
                  </p>
                )}
                {urlInfo.playlist && (
                  <div className="space-y-1">
                    <p className="text-sm text-blue-800">
                      <strong>플레이리스트:</strong> {urlInfo.playlist.title} (
                      {urlInfo.playlist.videos.length}개 영상)
                    </p>
                    {onPlaylistSelect && (
                      <button
                        onClick={() =>
                          onPlaylistSelect(
                            urlInfo.playlist.id,
                            urlInfo.playlist.title
                          )
                        }
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        플레이리스트 보기 →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {urlInfo.type === "playlist" && urlInfo.playlist && (
              <div className="space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>플레이리스트:</strong> {urlInfo.playlist.title}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>영상 수:</strong> {urlInfo.playlist.videos.length}개
                </p>
                <p className="text-sm text-green-700 font-medium">
                  ✓ 플레이리스트 페이지로 자동 이동됩니다
                </p>
              </div>
            )}

            {urlInfo.channel && (
              <p className="text-sm text-blue-800">
                <strong>채널:</strong> {urlInfo.channel.title}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          유튜브 채널 검색
        </h2>
        <p className="text-gray-600">
          채널명을 검색하거나 YouTube URL을 입력해보세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="채널명, 영상 URL, 플레이리스트 URL (예: 생활코딩, https://youtube.com/@nomadcoders)"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube-red focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "처리 중..." : "검색"}
        </button>
      </form>

      {/* URL 정보 표시 */}
      {renderURLInfo()}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {channels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isYouTubeURL(query) ? "채널 정보" : "검색 결과"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <div
                key={channel.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onChannelSelect(channel)}
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {channel.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {channel.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(channel.subscriberCount)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Video className="w-4 h-4" />
                        <span>{formatNumber(channel.videoCount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
