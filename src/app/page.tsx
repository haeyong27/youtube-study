"use client";

import { useState } from "react";
import ChannelSearch from "@/components/ChannelSearch";
import VideoList from "@/components/VideoList";
import PlaylistView from "@/components/PlaylistView";
import { ChannelInfo } from "@/types/youtube";

type ViewState =
  | { type: "search" }
  | { type: "channel"; channel: ChannelInfo }
  | { type: "playlist"; playlistId: string; playlistTitle: string };

export default function HomePage() {
  const [viewState, setViewState] = useState<ViewState>({ type: "search" });

  const handleChannelSelect = (channel: ChannelInfo) => {
    setViewState({ type: "channel", channel });
  };

  const handlePlaylistSelect = (playlistId: string, playlistTitle: string) => {
    setViewState({ type: "playlist", playlistId, playlistTitle });
  };

  const handleBackToSearch = () => {
    setViewState({ type: "search" });
  };

  const handleBackToChannel = () => {
    if (viewState.type === "playlist") {
      // 플레이리스트에서 뒤로가기 시 채널로 돌아가려면 채널 정보가 필요
      // 현재는 검색으로 돌아가도록 구현
      setViewState({ type: "search" });
    }
  };

  return (
    <div className="space-y-8">
      {viewState.type === "search" && (
        <ChannelSearch
          onChannelSelect={handleChannelSelect}
          onPlaylistSelect={handlePlaylistSelect}
        />
      )}

      {viewState.type === "channel" && (
        <VideoList
          channel={viewState.channel}
          onBack={handleBackToSearch}
          onPlaylistSelect={handlePlaylistSelect}
        />
      )}

      {viewState.type === "playlist" && (
        <PlaylistView
          playlistId={viewState.playlistId}
          playlistTitle={viewState.playlistTitle}
          onBack={handleBackToChannel}
        />
      )}
    </div>
  );
}
