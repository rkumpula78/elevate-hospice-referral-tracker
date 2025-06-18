
import React from 'react';
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import { useAuth } from "@/hooks/useAuth";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const PageLayout = ({ title, subtitle, children }: PageLayoutProps) => {
  const { displayName } = useAuth();

  return (
    <SidebarInset className="flex-1">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="flex h-16 items-center px-6 gap-4">
          <SidebarTrigger className="-ml-1" />
          
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            {!subtitle && title.toLowerCase().includes('dashboard') && (
              <p className="text-sm text-gray-600">Welcome back, {displayName}</p>
            )}
          </div>
          
          <div className="flex-1 max-w-2xl">
            <GlobalSearchBar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </SidebarInset>
  );
};

export default PageLayout;
