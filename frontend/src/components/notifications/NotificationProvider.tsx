'use client';

import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useUIStore } from '@/store/ui';
import { toast } from 'sonner';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, removeNotification } = useUIStore();

  useEffect(() => {
    // Handle new notifications
    notifications.forEach((notification) => {
      if (notification.id) {
        // Show toast notification
        const toastId = toast[notification.type](notification.title, {
          description: notification.message,
          duration: notification.duration || 5000,
          action: notification.action ? {
            label: notification.action.label,
            onClick: notification.action.onClick,
          } : undefined,
          onDismiss: () => removeNotification(notification.id),
          onAutoClose: () => removeNotification(notification.id),
        });
        
        // Remove from store immediately since sonner handles the display
        setTimeout(() => removeNotification(notification.id), 100);
      }
    });
  }, [notifications, removeNotification]);

  return (
    <>
      {children}
      <Toaster 
        richColors
        position="top-right"
        expand={false}
        visibleToasts={5}
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </>
  );
}
