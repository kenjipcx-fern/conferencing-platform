'use client';

import { Session } from '@/types';
import { useSessionStore } from '@/store/session';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PanelRightOpen, 
  MessageSquare, 
  Users, 
  Settings, 
  Maximize, 
  Clock,
  Radio
} from 'lucide-react';

interface SessionHeaderProps {
  session: Session;
}

export function SessionHeader({ session }: SessionHeaderProps) {
  const { attendees, questions, connectionStatus } = useSessionStore();
  const { 
    sidebarOpen, 
    questionsPanelOpen, 
    toggleSidebar, 
    toggleQuestionsPanel,
    toggleFullscreen 
  } = useUIStore();

  const getStatusIcon = () => {
    switch (session.status) {
      case 'live':
        return <Radio className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getStatusLabel = () => {
    switch (session.status) {
      case 'live':
        return 'Live';
      case 'scheduled':
        return 'Scheduled';
      case 'ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  return (
    <header className="bg-background border-b border-border px-4 py-3 flex items-center justify-between">
      {/* Left: Session Info */}
      <div className="flex items-center gap-4">
        {/* Session Logo/Avatar */}
        {session.branding?.logoUrl && (
          <Avatar className="h-10 w-10">
            <AvatarImage src={session.branding.logoUrl} alt={session.title} />
            <AvatarFallback>{session.title.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-lg truncate">
              {session.title}
            </h1>
            
            <Badge 
              variant={session.status === 'live' ? 'default' : 'secondary'}
              className={`flex items-center gap-1 ${
                session.status === 'live' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : ''
              }`}
            >
              {getStatusIcon()}
              {getStatusLabel()}
            </Badge>
          </div>
          
          {session.description && (
            <p className="text-sm text-muted-foreground truncate max-w-md">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} />
          <span className="capitalize">{connectionStatus}</span>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{attendees.length}</span>
          </div>
          
          {session.allowQuestions && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{questions.length}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {session.allowQuestions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleQuestionsPanel}
              className={questionsPanelOpen ? 'bg-muted' : ''}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Q&A</span>
              {questions.filter(q => q.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {questions.filter(q => q.status === 'pending').length}
                </Badge>
              )}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={sidebarOpen ? 'bg-muted' : ''}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">People</span>
            <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
              {attendees.length}
            </Badge>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Fullscreen</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
