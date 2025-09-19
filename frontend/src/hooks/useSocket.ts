import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';
import { useSessionStore } from '@/store/session';
import { useUIStore } from '@/store/ui';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(sessionId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const {
    addAttendee,
    removeAttendee,
    updateAttendee,
    addQuestion,
    updateQuestion,
    setConnectionStatus,
  } = useSessionStore();
  const { addNotification } = useUIStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('🔌 Connecting to socket server...');
    setConnectionStatus('connecting');

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      retries: 3,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      setConnectionStatus('connected');
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time features are active',
        duration: 3000,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server:', reason);
      setConnectionStatus('disconnected');
      addNotification({
        type: 'warning',
        title: 'Disconnected',
        message: 'Attempting to reconnect...',
        duration: 5000,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('💥 Socket connection error:', error);
      setConnectionStatus('disconnected');
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Failed to connect to server',
        duration: 5000,
      });
    });

    // Session events
    socket.on('session:attendee-joined', ({ attendee }) => {
      console.log('👋 Attendee joined:', attendee.name || 'Anonymous');
      addAttendee(attendee);
      addNotification({
        type: 'info',
        title: 'New Attendee',
        message: `${attendee.name || 'Someone'} joined the session`,
        duration: 3000,
      });
    });

    socket.on('session:attendee-left', ({ attendeeId }) => {
      console.log('👋 Attendee left:', attendeeId);
      removeAttendee(attendeeId);
    });

    socket.on('session:status-changed', ({ sessionId: sid, status }) => {
      console.log(`📊 Session ${sid} status changed to:`, status);
      if (sessionId === sid) {
        useSessionStore.getState().updateSession({ status });
        
        let message = '';
        switch (status) {
          case 'live':
            message = 'Session is now live!';
            break;
          case 'ended':
            message = 'Session has ended';
            break;
          case 'scheduled':
            message = 'Session is scheduled';
            break;
        }

        addNotification({
          type: status === 'live' ? 'success' : 'info',
          title: 'Session Status',
          message,
          duration: 5000,
        });
      }
    });

    // Question events
    socket.on('question:new', ({ question }) => {
      console.log('❓ New question:', question.content.substring(0, 50) + '...');
      addQuestion(question);
      addNotification({
        type: 'info',
        title: 'New Question',
        message: `From ${question.authorName || 'Anonymous'}`,
        duration: 4000,
      });
    });

    socket.on('question:voted', ({ questionId, upvotes, downvotes }) => {
      console.log(`🗳️ Question ${questionId} voted: ${upvotes}↑ ${downvotes}↓`);
      updateQuestion(questionId, { upvotes, downvotes });
    });

    socket.on('question:answered', ({ question }) => {
      console.log('💬 Question answered:', question.id);
      updateQuestion(question.id, question);
      addNotification({
        type: 'success',
        title: 'Question Answered',
        message: 'A question has been answered',
        duration: 4000,
      });
    });

    socket.on('question:status-changed', ({ questionId, status }) => {
      console.log(`❓ Question ${questionId} status:`, status);
      updateQuestion(questionId, { status });
    });

    // WebRTC signaling events (will be implemented with WebRTC hook)
    socket.on('webrtc:offer', ({ peerId, offer }) => {
      console.log('📹 Received WebRTC offer from:', peerId);
      // Will be handled by useWebRTC hook
    });

    socket.on('webrtc:answer', ({ peerId, answer }) => {
      console.log('📹 Received WebRTC answer from:', peerId);
      // Will be handled by useWebRTC hook
    });

    socket.on('webrtc:ice-candidate', ({ peerId, candidate }) => {
      console.log('🧊 Received ICE candidate from:', peerId);
      // Will be handled by useWebRTC hook
    });

    socket.on('webrtc:peer-connected', ({ peerId, isPresenter }) => {
      console.log(`📹 Peer connected: ${peerId} (presenter: ${isPresenter})`);
      addNotification({
        type: 'info',
        title: isPresenter ? 'Presenter Connected' : 'Attendee Connected',
        message: `${isPresenter ? 'The presenter' : 'An attendee'} joined the video`,
        duration: 3000,
      });
    });

    socket.on('webrtc:peer-disconnected', ({ peerId }) => {
      console.log('📹 Peer disconnected:', peerId);
    });
  }, [sessionId, addAttendee, removeAttendee, updateAttendee, addQuestion, updateQuestion, setConnectionStatus, addNotification]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from socket server...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    }
  }, [setConnectionStatus]);

  const joinSession = useCallback((sessionId: string, attendeeInfo: any) => {
    if (!socketRef.current) {
      console.error('Socket not connected');
      return;
    }

    console.log('🎯 Joining session:', sessionId);
    socketRef.current.emit('session:join', { sessionId, attendeeInfo });
  }, []);

  const leaveSession = useCallback((sessionId: string, attendeeId: string) => {
    if (!socketRef.current) return;

    console.log('👋 Leaving session:', sessionId);
    socketRef.current.emit('session:leave', { sessionId, attendeeId });
  }, []);

  const submitQuestion = useCallback((question: any) => {
    if (!socketRef.current) return;

    console.log('❓ Submitting question');
    socketRef.current.emit('question:submit', { question });
  }, []);

  const voteQuestion = useCallback((questionId: string, voteType: 'up' | 'down') => {
    if (!socketRef.current) return;

    console.log(`🗳️ Voting ${voteType} on question:`, questionId);
    socketRef.current.emit('question:vote', { questionId, voteType });
  }, []);

  // WebRTC signaling methods (will be used by useWebRTC hook)
  const sendWebRTCOffer = useCallback((peerId: string, offer: RTCSessionDescriptionInit) => {
    if (!socketRef.current) return;
    socketRef.current.emit('webrtc:offer', { peerId, offer });
  }, []);

  const sendWebRTCAnswer = useCallback((peerId: string, answer: RTCSessionDescriptionInit) => {
    if (!socketRef.current) return;
    socketRef.current.emit('webrtc:answer', { peerId, answer });
  }, []);

  const sendICECandidate = useCallback((peerId: string, candidate: RTCIceCandidateInit) => {
    if (!socketRef.current) return;
    socketRef.current.emit('webrtc:ice-candidate', { peerId, candidate });
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    joinSession,
    leaveSession,
    submitQuestion,
    voteQuestion,
    sendWebRTCOffer,
    sendWebRTCAnswer,
    sendICECandidate,
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };
}
