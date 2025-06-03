"use client";

import { useState } from "react";
import ChannelSearch from "@/components/ChannelSearch";
import VideoList from "@/components/VideoList";
import { ChannelInfo } from "@/types/youtube";

export default function HomePage() {
  const [selectedChannel, setSelectedChannel] = useState<ChannelInfo | null>(
    null
  );

  const handleChannelSelect = (channel: ChannelInfo) => {
    setSelectedChannel(channel);
  };

  const handleBackToSearch = () => {
    setSelectedChannel(null);
  };

  return (
    <div className="space-y-8">
      {!selectedChannel ? (
        <ChannelSearch onChannelSelect={handleChannelSelect} />
      ) : (
        <VideoList channel={selectedChannel} onBack={handleBackToSearch} />
      )}
    </div>
  );
}
