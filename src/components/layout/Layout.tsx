import React from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  sidebarOpen?: boolean;
}

export function Layout({ header, sidebar, children, sidebarOpen = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {header}
      <div className="flex h-[calc(100vh-4rem)]">
        <div
          className={cn(
            "transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0",
            "hidden md:block overflow-hidden"
          )}
        >
          {sidebar}
        </div>
        <main className="flex-1 overflow-auto">
          <div className="container py-6 px-4 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}