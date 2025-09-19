'use client';

import { useEffect, useState } from 'react';
import { Session } from '@/types';
import { useSessionStore } from '@/store/session';
import { useUIStore } from '@/store/ui';
import { VideoConference } from './VideoConference';
import { QuestionsPanel } from './QuestionsPanel';
import { SessionControls } from './SessionControls';
import { SessionHeader } from './SessionHeader';
import { SessionSidebar } from './SessionSidebar';
import { AttendeesList } from './AttendeesList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  PanelRightOpen, 
  MessageSquare, 
  Users, 
  Settings,
  Maximize,
  Minimize
} from 'lucide-react';

interface SessionViewProps {
  session: Session;
}

export function SessionView({ session }: SessionViewProps) {
  const {
    sidebarOpen,
    questionsPanelOpen,
    fullscreen,
    toggleSidebar,
    toggleQuestionsPanel,
    toggleFullscreen,
  } = useUIStore();

  const {
    attendees,
    questions,
    currentUser,
    connectionStatus,
    isPresenter,
    localStream,
    webrtcPeers,
  } = useSessionStore();

  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply custom branding
  useEffect(() => {
    if (session.branding) {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          ${session.branding.backgroundColor ? `--session-bg: ${session.branding.backgroundColor};` : ''}
          ${session.branding.textColor ? `--session-text: ${session.branding.textColor};` : ''}
        }
        ${session.branding.customCss || ''}
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [session.branding]);

  const MainContent = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Session Header */}
      <SessionHeader session={session} />
      
      {/* Main Video/Content Area */}
      <div className="flex-1 relative bg-gray-900 overflow-hidden">
        {session.settings.webrtcEnabled ? (
          <VideoConference />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Welcome to {session.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {session.status === 'live' 
                    ? 'This session is live! Use the Q&A panel to ask questions.'
                    : session.status === 'scheduled'
                    ? 'This session is scheduled to start soon.'
                    : 'This session has ended.'
                  }
                </p>
                {session.allowQuestions && (
                  <Button
                    onClick={toggleQuestionsPanel}
                    variant="outline"
                    size="sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Q&A
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Session Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <SessionControls />
        </div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <div className={cn(
      "bg-background border-l border-border transition-all duration-300",
      isMobile ? "fixed inset-y-0 right-0 z-50 w-80" : "w-80",
      !sidebarOpen && (isMobile ? "translate-x-full" : "w-0")
    )}>
      <SessionSidebar>
        <div className="p-4 space-y-4">
          {/* Attendees List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" />
                Attendees ({attendees.length})
              </h3>
            </div>
            <AttendeesList attendees={attendees} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold">{attendees.length}</div>
              <div className="text-muted-foreground">Attendees</div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="font-semibold">{questions.length}</div>
              <div className="text-muted-foreground">Questions</div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="text-xs text-muted-foreground">
            Status: 
            <span className={cn(
              "ml-1 font-medium",
              connectionStatus === 'connected' ? "text-green-600" :
              connectionStatus === 'connecting' ? "text-yellow-600" :
              "text-red-600"
            )}>
              {connectionStatus === 'connected' ? '🟢 Connected' :
               connectionStatus === 'connecting' ? '🟡 Connecting' :
               '🔴 Disconnected'
              }
            </span>
          </div>
        </div>
      </SessionSidebar>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <MainContent />
        
        {/* Fullscreen Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
          >
            <Minimize className="w-4 h-4" />
          </Button>
          
          {session.allowQuestions && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleQuestionsPanel}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Questions Panel in Fullscreen */}
        {questionsPanelOpen && session.allowQuestions && (
          <div className="absolute top-0 right-0 h-full w-96 bg-background border-l border-border">
            <QuestionsPanel />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <MainContent />
      </div>

      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={toggleSidebar}>
          <SheetContent side="right" className="p-0 w-80">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {/* Questions Panel */}
      {questionsPanelOpen && session.allowQuestions && (
        <div className={cn(
          "bg-background border-l border-border",
          isMobile ? "fixed inset-y-0 right-0 z-40 w-80" : "w-96"
        )}>
          <QuestionsPanel />
        </div>
      )}

      {/* Mobile Controls FAB */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={toggleSidebar}
            className="rounded-full w-12 h-12 p-0"
          >
            <Users className="w-5 h-5" />
          </Button>
          
          {session.allowQuestions && (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleQuestionsPanel}
              className="rounded-full w-12 h-12 p-0"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={toggleFullscreen}
            className="rounded-full w-12 h-12 p-0"
          >
            <Maximize className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
