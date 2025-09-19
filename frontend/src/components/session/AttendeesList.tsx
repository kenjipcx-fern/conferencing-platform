'use client';

import { Attendee } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AttendeesListProps {
  attendees: Attendee[];
}

export function AttendeesList({ attendees }: AttendeesListProps) {
  const getStatusColor = (status: Attendee['status']) => {
    switch (status) {
      case 'joined':
        return 'bg-green-500';
      case 'waiting':
        return 'bg-yellow-500';
      case 'left':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (attendees.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">No attendees yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {attendees.map((attendee) => (
          <div
            key={attendee.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={attendee.avatar} />
                <AvatarFallback className="text-xs">
                  {attendee.name ? attendee.name.charAt(0).toUpperCase() : '?'}
                </AvatarFallback>
              </Avatar>
              
              <div 
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(attendee.status)}`}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {attendee.name || 'Anonymous'}
              </p>
              {attendee.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {attendee.email}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge 
                variant={attendee.status === 'joined' ? 'default' : 'secondary'} 
                className="text-xs h-5"
              >
                {attendee.status}
              </Badge>
              
              {attendee.isAnonymous && (
                <Badge variant="outline" className="text-xs h-5">
                  Anon
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
