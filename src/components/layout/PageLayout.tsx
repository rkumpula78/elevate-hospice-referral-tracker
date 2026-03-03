
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBack?: boolean;
  actions?: React.ReactNode;
}

const PageLayout = ({ title, subtitle, children, showBack, actions }: PageLayoutProps) => {
  const { displayName } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <SidebarInset className="flex-1 min-h-screen">
      {/* Mobile-Optimized Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className={`flex items-center gap-3 ${isMobile ? 'h-14 px-3' : 'h-16 px-6'}`}>
          {showBack && (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {!showBack && (
            <SidebarTrigger className={`touch-manipulation ${isMobile ? 'h-11 w-11 -ml-1' : '-ml-1 h-10 w-10'}`} />
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className={`font-semibold text-foreground truncate ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {title}
            </h1>
            {!isMobile && subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
            {!isMobile && !subtitle && title.toLowerCase().includes('dashboard') && (
              <p className="text-sm text-muted-foreground truncate">Welcome back, {displayName}</p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}

          <NotificationCenter />
          
          {/* Hide search on mobile - accessible via global search button */}
          {!isMobile && (
            <div className="flex-1 max-w-2xl">
              <GlobalSearchBar />
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Mobile optimized spacing */}
      <main className="flex-1 bg-background">
        <div className={`w-full ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}`}>
          <div className="w-full max-w-full">
            {children}
          </div>
        </div>
      </main>
    </SidebarInset>
  );
};

export default PageLayout;
