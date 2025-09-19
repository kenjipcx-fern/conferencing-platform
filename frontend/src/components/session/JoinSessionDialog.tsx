'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Session, AttendeeJoinFormData } from '@/types';
import { Users, Clock, Video, MessageSquare, Shield } from 'lucide-react';

interface JoinSessionDialogProps {
  session: Session | undefined;
  isOpen: boolean;
  onJoin: (data: AttendeeJoinFormData) => void;
  isLoading: boolean;
}

export function JoinSessionDialog({ session, isOpen, onJoin, isLoading }: JoinSessionDialogProps) {
  const [formData, setFormData] = useState<AttendeeJoinFormData>({
    name: '',
    email: '',
  });
  const [isAnonymous, setIsAnonymous] = useState(false);

  if (!session) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const joinData: AttendeeJoinFormData = {};
    
    if (!isAnonymous) {
      if (formData.name?.trim()) joinData.name = formData.name.trim();
      if (formData.email?.trim()) joinData.email = formData.email.trim();
    }
    
    onJoin(joinData);
  };

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'live':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: session.branding?.backgroundColor || '#3b82f6' }}
            />
            Join Session
          </DialogTitle>
          <DialogDescription>
            You're about to join an interactive virtual conference session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{session.title}</CardTitle>
                  {session.description && (
                    <CardDescription className="mt-2">
                      {session.description}
                    </CardDescription>
                  )}
                </div>
                <Badge 
                  variant={session.status === 'live' ? 'default' : 'secondary'}
                  className={session.status === 'live' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {getStatusLabel(session.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{session.maxAttendees} max</span>
                </div>
                
                {session.scheduledAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(session.scheduledAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}
                
                {session.settings.webrtcEnabled && (
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span>Video</span>
                  </div>
                )}
                
                {session.allowQuestions && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span>Q&A</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mt-4 flex flex-wrap gap-2">
                {session.settings.screenShareEnabled && (
                  <Badge variant="outline" className="text-xs">
                    Screen Sharing
                  </Badge>
                )}
                {session.allowAnonymousQuestions && (
                  <Badge variant="outline" className="text-xs">
                    Anonymous Q&A
                  </Badge>
                )}
                {session.moderateQuestions && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Moderated
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Join Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How would you like to join?</CardTitle>
              <CardDescription>
                Choose your participation preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Anonymous Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="anonymous" className="text-sm">
                    Join anonymously
                  </Label>
                </div>

                {!isAnonymous && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter your name"
                          className="mt-1"
                          required={!session.allowAnonymousQuestions}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">
                          Email {!session.requireRegistration && '(optional)'}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter your email"
                          className="mt-1"
                          required={session.requireRegistration}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Notice */}
                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <p>
                    By joining this session, you agree to participate in a virtual conference. 
                    {session.enableRecording && " This session may be recorded."}
                    {session.settings.webrtcEnabled && " Video and audio features may be used."}
                  </p>
                </div>

                {/* Join Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-medium"
                  disabled={isLoading || session.status === 'ended'}
                  style={{ 
                    backgroundColor: session.branding?.backgroundColor || undefined,
                    color: session.branding?.textColor || undefined 
                  }}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Joining Session...
                    </>
                  ) : session.status === 'ended' ? (
                    'Session Ended'
                  ) : (
                    <>
                      Join Session
                      {session.status === 'live' && (
                        <span className="ml-2 animate-pulse">🔴</span>
                      )}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
