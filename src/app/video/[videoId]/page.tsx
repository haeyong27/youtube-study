"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Eye,
  Calendar,
  Clock,
  Download,
  MessageCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { VideoItem } from "@/types/youtube";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import ChatInterface from "@/components/ChatInterface";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.videoId as string;

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (videoId) {
      loadVideoDetails();
    }
  }, [videoId]);

  const loadVideoDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/youtube/video-detail?videoId=${videoId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "영상 정보를 가져오는데 실패했습니다.");
      }

      setVideo(data.video);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTranscript = async () => {
    if (!video) return;

    setTranscriptLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/youtube/transcript?videoId=${videoId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "스크립트를 가져오는데 실패했습니다.");
      }

      setTranscript(data.transcript);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "스크립트를 가져오는데 실패했습니다."
      );
    } finally {
      setTranscriptLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-youtube-red mx-auto mb-4" />
          <p className="text-gray-600">영상 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 mb-4">
              {error || "영상을 찾을 수 없습니다."}
            </p>
            <button onClick={() => router.back()} className="btn-secondary">
              뒤로가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.open(video.url, "_blank")}
              className="btn-secondary flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>YouTube에서 보기</span>
            </button>

            <button
              onClick={() => setShowChat(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>AI와 채팅</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 영상 정보 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-48 h-28 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                    {video.title}
                  </h1>

                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>조회수 {formatNumber(video.viewCount)}회</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(video.publishedAt)}</span>
                    </div>
                  </div>

                  {video.description && (
                    <div className="text-gray-700">
                      <h3 className="font-semibold mb-2">설명</h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {video.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 스크립트 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>영상 스크립트</span>
                </h2>

                {!transcript && (
                  <button
                    onClick={loadTranscript}
                    disabled={transcriptLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {transcriptLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>
                      {transcriptLoading
                        ? "가져오는 중..."
                        : "스크립트 가져오기"}
                    </span>
                  </button>
                )}
              </div>

              {transcript ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {transcript}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>스크립트를 가져오려면 위의 버튼을 클릭하세요.</p>
                  <p className="text-sm mt-2">
                    yt-dlp를 사용하여 영상의 자막/스크립트를 추출합니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 빠른 액션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">빠른 액션</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowChat(true)}
                  className="w-full btn-primary flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>AI와 채팅하기</span>
                </button>

                <button
                  onClick={loadTranscript}
                  disabled={transcriptLoading}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  {transcriptLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>
                    {transcriptLoading ? "가져오는 중..." : "스크립트 가져오기"}
                  </span>
                </button>

                <button
                  onClick={() => window.open(video.url, "_blank")}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>YouTube에서 보기</span>
                </button>
              </div>
            </div>

            {/* 학습 팁 */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-3">💡 학습 팁</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>
                  • 스크립트를 먼저 가져온 후 AI와 채팅하면 더 정확한 분석을
                  받을 수 있습니다
                </li>
                <li>• "핵심 내용 요약해줘"라고 물어보세요</li>
                <li>• "학습 포인트 정리해줘"로 중요한 부분을 파악하세요</li>
                <li>• "이해하기 어려운 부분 설명해줘"로 도움을 받으세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* AI 채팅 인터페이스 */}
      {showChat && (
        <ChatInterface
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          context={{
            type: "video",
            data: {
              video,
              transcript: transcript || undefined,
            },
          }}
        />
      )}
    </div>
  );
}
