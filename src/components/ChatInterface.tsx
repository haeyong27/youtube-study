"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Minimize2, Maximize2 } from "lucide-react";
import { VideoItem, PlaylistInfo, ChannelInfo } from "@/types/youtube";

interface ChatInterfaceProps {
  context?: {
    type: "video" | "playlist" | "channel";
    data: VideoItem | PlaylistInfo | ChannelInfo;
    videos?: VideoItem[];
  };
  onClose?: () => void;
}

export default function ChatInterface({
  context,
  onClose,
}: ChatInterfaceProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      body: {
        context: context
          ? {
              type: context.type,
              data: context.data,
              videos: context.videos || [],
            }
          : null,
      },
    });

  const getContextTitle = () => {
    if (!context) return "AI 어시스턴트";

    switch (context.type) {
      case "video":
        return `영상: ${(context.data as VideoItem).title}`;
      case "playlist":
        return `플레이리스트: ${(context.data as PlaylistInfo).title}`;
      case "channel":
        return `채널: ${(context.data as ChannelInfo).title}`;
      default:
        return "AI 어시스턴트";
    }
  };

  const getContextSummary = () => {
    if (!context) return null;

    switch (context.type) {
      case "video":
        const video = context.data as VideoItem;
        return `영상 길이: ${
          video.duration
        } | 조회수: ${video.viewCount.toLocaleString()}회`;
      case "playlist":
        const playlist = context.data as PlaylistInfo;
        return `${context.videos?.length || 0}개 영상`;
      case "channel":
        const channel = context.data as ChannelInfo;
        return `구독자 ${channel.subscriberCount.toLocaleString()}명 | 영상 ${channel.videoCount.toLocaleString()}개`;
      default:
        return null;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-youtube-red text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* 헤더 */}
      <div className="bg-youtube-red text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold text-sm">{getContextTitle()}</h3>
            {getContextSummary() && (
              <p className="text-xs text-red-100">{getContextSummary()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white hover:text-red-200 transition-colors"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm">
              {context
                ? "이 콘텐츠에 대해 궁금한 것을 물어보세요!"
                : "무엇을 도와드릴까요?"}
            </p>
            {context && (
              <div className="mt-4 text-xs text-gray-400">
                <p>예시 질문:</p>
                <ul className="mt-2 space-y-1">
                  {context.type === "video" && (
                    <>
                      <li>• 이 영상의 핵심 내용을 요약해주세요</li>
                      <li>• 학습 포인트를 정리해주세요</li>
                    </>
                  )}
                  {context.type === "playlist" && (
                    <>
                      <li>• 이 플레이리스트의 학습 순서를 추천해주세요</li>
                      <li>• 각 영상의 주요 내용을 설명해주세요</li>
                    </>
                  )}
                  {context.type === "channel" && (
                    <>
                      <li>• 이 채널의 특징을 분석해주세요</li>
                      <li>• 추천 영상을 골라주세요</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`flex-1 p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-gray-100">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-youtube-red focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-youtube-red text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
