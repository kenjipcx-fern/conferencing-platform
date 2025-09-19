'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api';
import { Session } from '@/types';
import { Video, Users, Clock, MessageSquare, Radio } from 'lucide-react';

// Ensure this is client-side only
if (typeof window === 'undefined') {
  console.log('Server-side rendering - API calls will be skipped');
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        
        // Only run on client-side
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        // Load sessions from real API
        const response = await apiClient.getSessions();
        setSessions(response.data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure hydration is complete
    const timer = setTimeout(loadSessions, 100);
    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'live':
        return <Radio className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getStatusLabel = (status: Session['status']) => {
    switch (status) {
      case 'live':
        return 'Live Now';
      case 'scheduled':
        return 'Scheduled';
      case 'ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Professional
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}Virtual Conferences
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Host engaging virtual presentations with real-time video, interactive Q&A, 
            and seamless audience participation. No downloads required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>WebRTC Video</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Real-time Q&A</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>No Registration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Available Sessions
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading sessions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Failed to load sessions
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No sessions available
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Check back later for upcoming conferences
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 mb-2">
                          {session.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {session.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={session.status === 'live' ? 'default' : 'secondary'}
                        className={`ml-2 flex-shrink-0 ${session.status === 'live' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(session.status)}
                          {getStatusLabel(session.status)}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Max {session.maxAttendees}</span>
                      </div>
                      
                      {session.scheduledAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(session.scheduledAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {session.settings.webrtcEnabled && (
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          <span>Video</span>
                        </div>
                      )}
                      
                      {session.allowQuestions && (
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Q&A</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {session.settings.screenShareEnabled && (
                        <Badge variant="outline" className="text-xs">
                          Screen Share
                        </Badge>
                      )}
                      {session.allowAnonymousQuestions && (
                        <Badge variant="outline" className="text-xs">
                          Anonymous
                        </Badge>
                      )}
                      {session.enableRecording && (
                        <Badge variant="outline" className="text-xs">
                          Recorded
                        </Badge>
                      )}
                    </div>
                    
                    <Link href={`/session/${session.slug}`}>
                      <Button 
                        className="w-full"
                        disabled={session.status === 'ended'}
                        style={{
                          backgroundColor: session.branding?.backgroundColor || undefined,
                          color: session.branding?.textColor || undefined
                        }}
                      >
                        {session.status === 'ended' ? 'Session Ended' : 'Join Session'}
                        {session.status === 'live' && (
                          <span className="ml-2 animate-pulse">🔴</span>
                        )}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-12 border-t border-gray-200 dark:border-gray-700">
          <p>
            Powered by WebRTC • Built with Next.js • Real-time Socket.io
          </p>
        </div>
      </div>
    </div>
  );
}
