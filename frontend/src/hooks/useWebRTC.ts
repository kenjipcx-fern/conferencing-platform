import { useEffect, useRef, useCallback, useState } from 'react';
import { useSessionStore } from '@/store/session';
import { useUIStore } from '@/store/ui';
import { WebRTCPeer } from '@/types';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC(socket: any) {
  const {
    webrtcPeers,
    localStream,
    screenShareStream,
    isPresenter,
    isMuted,
    isVideoOff,
    isScreenSharing,
    setLocalStream,
    setScreenShareStream,
    addWebRTCPeer,
    removeWebRTCPeer,
    updateWebRTCPeer,
    setIsMuted,
    setIsVideoOff,
    setIsScreenSharing,
  } = useSessionStore();

  const { addNotification } = useUIStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log('🎥 Initializing local media stream...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      
      // Apply current mute/video settings
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOff;
      });

      console.log('✅ Local media stream initialized');
      addNotification({
        type: 'success',
        title: 'Camera Ready',
        message: 'Your camera and microphone are ready',
        duration: 3000,
      });

      setIsInitialized(true);
      return stream;
    } catch (error) {
      console.error('💥 Failed to initialize local stream:', error);
      
      let message = 'Failed to access camera and microphone';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message = 'Please allow camera and microphone access';
        } else if (error.name === 'NotFoundError') {
          message = 'No camera or microphone found';
        }
      }

      addNotification({
        type: 'error',
        title: 'Media Access Error',
        message,
        duration: 8000,
        action: {
          label: 'Retry',
          onClick: () => initializeLocalStream(),
        },
      });

      return null;
    }
  }, [isMuted, isVideoOff, setLocalStream, addNotification]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      console.log('🖥️ Starting screen share...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true,
      });

      setScreenShareStream(stream);
      setIsScreenSharing(true);

      // Listen for screen share end (user clicks browser stop button)
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });

      console.log('✅ Screen sharing started');
      addNotification({
        type: 'success',
        title: 'Screen Sharing',
        message: 'Screen sharing started',
        duration: 3000,
      });

      // Replace video track for all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      peersRef.current.forEach(async (pc, peerId) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });

      return stream;
    } catch (error) {
      console.error('💥 Failed to start screen share:', error);
      
      addNotification({
        type: 'error',
        title: 'Screen Share Error',
        message: 'Failed to start screen sharing',
        duration: 5000,
      });
      
      return null;
    }
  }, [setScreenShareStream, setIsScreenSharing, addNotification]);

  // Stop screen sharing
  const stopScreenShare = useCallback(async () => {
    if (!screenShareStream) return;

    console.log('🖥️ Stopping screen share...');
    
    screenShareStream.getTracks().forEach(track => track.stop());
    setScreenShareStream(undefined);
    setIsScreenSharing(false);

    // Switch back to camera for all peer connections
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      peersRef.current.forEach(async (pc, peerId) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
    }

    console.log('✅ Screen sharing stopped');
    addNotification({
      type: 'info',
      title: 'Screen Sharing',
      message: 'Screen sharing stopped',
      duration: 3000,
    });
  }, [screenShareStream, localStream, setScreenShareStream, setIsScreenSharing, addNotification]);

  // Toggle microphone
  const toggleMute = useCallback(() => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    const newMutedState = !isMuted;
    
    audioTracks.forEach(track => {
      track.enabled = !newMutedState;
    });

    setIsMuted(newMutedState);
    
    console.log(newMutedState ? '🔇 Microphone muted' : '🔊 Microphone unmuted');
    
    addNotification({
      type: 'info',
      title: newMutedState ? 'Microphone Muted' : 'Microphone Unmuted',
      message: newMutedState ? 'You are now muted' : 'You are now unmuted',
      duration: 2000,
    });
  }, [localStream, isMuted, setIsMuted, addNotification]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    const newVideoOffState = !isVideoOff;
    
    videoTracks.forEach(track => {
      track.enabled = !newVideoOffState;
    });

    setIsVideoOff(newVideoOffState);
    
    console.log(newVideoOffState ? '📹 Camera turned off' : '📹 Camera turned on');
    
    addNotification({
      type: 'info',
      title: newVideoOffState ? 'Camera Off' : 'Camera On',
      message: newVideoOffState ? 'Your camera is now off' : 'Your camera is now on',
      duration: 2000,
    });
  }, [localStream, isVideoOff, setIsVideoOff, addNotification]);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean = false) => {
    console.log(`🤝 Creating peer connection with ${peerId} (initiator: ${isInitiator})`);
    
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle incoming stream
    pc.ontrack = (event) => {
      console.log(`📹 Received stream from ${peerId}`);
      const [remoteStream] = event.streams;
      
      updateWebRTCPeer(peerId, {
        stream: remoteStream,
        hasVideo: remoteStream.getVideoTracks().length > 0,
        hasAudio: remoteStream.getAudioTracks().length > 0,
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log(`🧊 Sending ICE candidate to ${peerId}`);
        socket.emit('webrtc:ice-candidate', {
          peerId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${peerId}:`, pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        addNotification({
          type: 'success',
          title: 'Connected',
          message: `Connected to ${peerId}`,
          duration: 3000,
        });
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        removeWebRTCPeer(peerId);
        peersRef.current.delete(peerId);
      }
    };

    peersRef.current.set(peerId, pc);
    
    // Create initial peer data
    const peer: WebRTCPeer = {
      id: peerId,
      connection: pc,
      isPresenter: false, // Will be updated based on signaling
      hasVideo: false,
      hasAudio: false,
    };
    
    addWebRTCPeer(peerId, peer);

    return pc;
  }, [localStream, socket, updateWebRTCPeer, removeWebRTCPeer, addWebRTCPeer, addNotification]);

  // Socket event handlers for WebRTC signaling
  useEffect(() => {
    if (!socket || !isInitialized) return;

    const handleOffer = async ({ peerId, offer }: { peerId: string; offer: RTCSessionDescriptionInit }) => {
      console.log(`📥 Received offer from ${peerId}`);
      
      const pc = createPeerConnection(peerId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('webrtc:answer', { peerId, answer });
    };

    const handleAnswer = async ({ peerId, answer }: { peerId: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`📥 Received answer from ${peerId}`);
      
      const pc = peersRef.current.get(peerId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleICECandidate = async ({ peerId, candidate }: { peerId: string; candidate: RTCIceCandidateInit }) => {
      console.log(`📥 Received ICE candidate from ${peerId}`);
      
      const pc = peersRef.current.get(peerId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleICECandidate);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleICECandidate);
    };
  }, [socket, isInitialized, createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all streams
      localStream?.getTracks().forEach(track => track.stop());
      screenShareStream?.getTracks().forEach(track => track.stop());
      
      // Close all peer connections
      peersRef.current.forEach(pc => pc.close());
      peersRef.current.clear();
    };
  }, [localStream, screenShareStream]);

  return {
    // State
    isInitialized,
    localStream,
    screenShareStream,
    webrtcPeers,
    isMuted,
    isVideoOff,
    isScreenSharing,
    
    // Actions
    initializeLocalStream,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    createPeerConnection,
  };
}
