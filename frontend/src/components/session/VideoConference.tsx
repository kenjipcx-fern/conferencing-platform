'use client';

import { useSessionStore } from '@/store/session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff } from 'lucide-react';

export function VideoConference() {
  const {
    localStream,
    screenShareStream,
    webrtcPeers,
    isPresenter,
    isMuted,
    isVideoOff,
    isScreenSharing,
  } = useSessionStore();

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Main Video Area */}
      <div className="relative w-full h-full flex items-center justify-center">
        {screenShareStream || localStream ? (
          <video
            ref={(video) => {
              if (video && (screenShareStream || localStream)) {
                video.srcObject = screenShareStream || localStream!;
              }
            }}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white text-center">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Camera Not Available</h3>
            <p className="text-gray-300 mb-4">
              Your camera is not accessible or turned off
            </p>
            <Button variant="outline" size="sm">
              Enable Camera
            </Button>
          </div>
        )}

        {/* Presenter Badge */}
        {isPresenter && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            🎤 Presenter
          </div>
        )}

        {/* Video Status Indicators */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isScreenSharing && (
            <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              🖥️ Sharing Screen
            </div>
          )}
          
          {isMuted && (
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              🔇 Muted
            </div>
          )}
          
          {isVideoOff && (
            <div className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              📹 Camera Off
            </div>
          )}
        </div>
      </div>

      {/* Participant Videos (Grid) */}
      {webrtcPeers.size > 0 && (
        <div className="absolute bottom-20 right-4 flex gap-2">
          {Array.from(webrtcPeers.entries()).map(([peerId, peer]) => (
            <div key={peerId} className="relative">
              <video
                ref={(video) => {
                  if (video && peer.stream) {
                    video.srcObject = peer.stream;
                  }
                }}
                autoPlay
                playsInline
                muted={peer.id === 'local'}
                className="w-32 h-24 bg-gray-800 rounded-lg object-cover border border-gray-600"
              />
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                {peer.isPresenter ? '🎤' : '👤'} {peer.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
