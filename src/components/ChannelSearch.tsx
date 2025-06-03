"use client";

import { useState } from "react";
import { Search, Users, Video } from "lucide-react";
import { ChannelInfo } from "@/types/youtube";

interface ChannelSearchProps {
  onChannelSelect: (channel: ChannelInfo) => void;
}

export default function ChannelSearch({ onChannelSelect }: ChannelSearchProps) {
  const [query, setQuery] = useState("");
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchChannels = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/youtube/channels?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "채널 검색에 실패했습니다.");
      }

      setChannels(data.channels);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          유튜브 채널 검색
        </h2>
        <p className="text-gray-600">
          학습하고 싶은 유튜브 채널을 검색해보세요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="채널명을 입력하세요 (예: 생활코딩, 노마드 코더)"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube-red focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {channels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">검색 결과</h3>
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
