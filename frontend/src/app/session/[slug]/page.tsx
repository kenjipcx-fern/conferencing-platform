'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SessionView } from '@/components/session/SessionView';
import { JoinSessionDialog } from '@/components/session/JoinSessionDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSessionStore } from '@/store/session';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { apiClient } from '@/lib/api';
import { AttendeeJoinFormData } from '@/types';

export default function SessionPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(true);
  
  const { session, currentUser, setSession, setCurrentUser, reset } = useSessionStore();
  const { connect, disconnect, joinSession, socket } = useSocket(session?.id);
  const webrtc = useWebRTC(socket);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiClient.getSessionBySlug(slug);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to load session');
        }
        
        setSession(response.data);
        console.log('✅ Session loaded:', response.data.title);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load session';
        setError(errorMessage);
        console.error('💥 Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadSession();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
      reset();
    };
  }, [slug, setSession, disconnect, reset]);

  // Handle joining the session
  const handleJoinSession = async (formData: AttendeeJoinFormData) => {
    if (!session) return;

    try {
      setIsLoading(true);
      
      // Join via API
      const response = await apiClient.joinSession(session.id, formData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to join session');
      }
      
      setCurrentUser(response.data.attendee);
      setShowJoinDialog(false);
      
      // Connect to socket and join session
      connect();
      
      // Wait a moment for socket connection, then join session
      setTimeout(() => {
        joinSession(session.id, response.data.attendee);
      }, 1000);
      
      // Initialize WebRTC for video if enabled
      if (session.settings.webrtcEnabled) {
        await webrtc.initializeLocalStream();
      }
      
      console.log('✅ Successfully joined session');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join session';
      setError(errorMessage);
      console.error('💥 Failed to join session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Loading Session...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Preparing your virtual conference experience
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Session Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <JoinSessionDialog
          session={session}
          isOpen={showJoinDialog}
          onJoin={handleJoinSession}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <SessionView session={session} />
    </ErrorBoundary>
  );
}
