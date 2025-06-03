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
  ChevronDown,
  ChevronUp,
  ExternalLink,
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
  const [showTranscript, setShowTranscript] = useState(false);

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
      setShowTranscript(true); // 스크립트를 가져오면 자동으로 열기
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* 왼쪽 영역: 영상 정보 + 스크립트 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>뒤로가기</span>
          </button>

          <button
            onClick={() => window.open(video.url, "_blank")}
            className="btn-primary flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>YouTube에서 보기</span>
          </button>
        </div>

        {/* 영상 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-64 h-36 object-cover rounded-lg"
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
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{video.duration}</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                채널: {video.channelTitle}
              </p>
            </div>
          </div>

          {video.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold mb-2 text-gray-900">영상 설명</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed line-clamp-3">
                {video.description}
              </p>
            </div>
          )}
        </div>

        {/* 스크립트 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>영상 스크립트</span>
                {transcript && (
                  <span className="text-sm font-normal text-green-600">
                    (로드됨)
                  </span>
                )}
              </h2>

              <div className="flex items-center space-x-3">
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

                {transcript && (
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    {showTranscript ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span>{showTranscript ? "숨기기" : "보기"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {transcript && showTranscript && (
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                  {transcript}
                </pre>
              </div>
            </div>
          )}

          {!transcript && !transcriptLoading && (
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="mb-2">
                  스크립트를 가져와서 더 정확한 AI 분석을 받아보세요
                </p>
                <p className="text-sm">
                  yt-dlp를 사용하여 영상의 자막/스크립트를 추출합니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 학습 팁 */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>💡 AI 채팅 활용 팁</span>
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • 스크립트를 먼저 가져온 후 AI와 채팅하면 더 정확한 분석을 받을 수
              있습니다
            </li>
            <li>• "핵심 내용을 3줄로 요약해줘"라고 물어보세요</li>
            <li>
              • "학습해야 할 중요한 포인트를 정리해줘"로 핵심을 파악하세요
            </li>
            <li>• "이해하기 어려운 개념을 쉽게 설명해줘"로 도움을 받으세요</li>
            <li>
              • "시간대별로 중요한 부분을 알려줘"로 효율적인 학습이 가능합니다
            </li>
          </ul>
        </div>
      </div>

      {/* 오른쪽 영역: AI 채팅 (메인) */}
      <div className="w-[600px] flex-shrink-0">
        <div className="h-full p-6">
          <div className="h-full">
            <ChatInterface
              isOpen={true}
              context={{
                type: "video",
                data: {
                  video,
                  transcript: transcript || undefined,
                },
              }}
              onClose={undefined} // 닫기 버튼 제거 (항상 열려있음)
            />
          </div>
        </div>
      </div>
    </div>
  );
}
