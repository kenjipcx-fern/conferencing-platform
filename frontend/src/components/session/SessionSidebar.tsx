'use client';

import { ReactNode } from 'react';

interface SessionSidebarProps {
  children: ReactNode;
}

export function SessionSidebar({ children }: SessionSidebarProps) {
  return (
    <div className="h-full border-l border-border bg-background">
      {children}
    </div>
  );
}
