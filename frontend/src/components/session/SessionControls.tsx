'use client';

import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/store/session';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, Phone, Settings } from 'lucide-react';

export function SessionControls() {
  const {
    isPresenter,
    isMuted,
    isVideoOff,
    isScreenSharing,
    localStream,
    setIsMuted,
    setIsVideoOff,
    setIsScreenSharing,
  } = useSessionStore();

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    // Placeholder - actual implementation will be in useWebRTC hook
    setIsScreenSharing(!isScreenSharing);
  };

  return (
    <div className="flex items-center gap-2 bg-black bg-opacity-60 backdrop-blur-sm rounded-full px-4 py-2">
      {/* Microphone */}
      <Button
        size="sm"
        variant={isMuted ? "destructive" : "secondary"}
        onClick={toggleMute}
        className="rounded-full w-10 h-10 p-0"
      >
        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      {/* Camera */}
      <Button
        size="sm"
        variant={isVideoOff ? "destructive" : "secondary"}
        onClick={toggleVideo}
        className="rounded-full w-10 h-10 p-0"
      >
        {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
      </Button>

      {/* Screen Share (Presenter only) */}
      {isPresenter && (
        <Button
          size="sm"
          variant={isScreenSharing ? "default" : "secondary"}
          onClick={toggleScreenShare}
          className="rounded-full w-10 h-10 p-0"
        >
          {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </Button>
      )}

      {/* Leave Session */}
      <Button
        size="sm"
        variant="destructive"
        onClick={() => window.close()}
        className="rounded-full w-10 h-10 p-0"
      >
        <Phone className="w-4 h-4 rotate-[225deg]" />
      </Button>

      {/* Settings */}
      <Button
        size="sm"
        variant="ghost"
        className="rounded-full w-10 h-10 p-0 text-white hover:text-black"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
