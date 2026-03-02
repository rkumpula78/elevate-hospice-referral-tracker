import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Building, 
  Phone, 
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Activity,
  ChevronDown,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import AIQuickHelp from "@/components/dashboard/AIQuickHelp";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTabletOrMobile } from "@/hooks/use-responsive";

const primaryItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Referrals", url: "/referrals", icon: Phone },
  { title: "Organizations", url: "/organizations", icon: Building },
  { title: "Schedule", url: "/schedule", icon: Calendar },
];

const insightsItems = [
  { title: "KPI Dashboard", url: "/kpi", icon: Activity },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Reports", url: "/reports", icon: FileText },
];

const AppSidebar = () => {
  const location = useLocation();
  const { signOut, displayName, user, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const isTabletOrMobile = useIsTabletOrMobile();
  const { setOpenMobile, isMobile: sidebarIsMobile, open } = useSidebar();

  const insightsActive = insightsItems.some(i => location.pathname === i.url);
  const [insightsOpen, setInsightsOpen] = useState(insightsActive);

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLinkClick = () => {
    if (isTabletOrMobile && sidebarIsMobile) {
      setOpenMobile(false);
    }
  };

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-lg transition-all touch-manipulation ${
      isMobile ? 'px-3 py-3 min-h-[44px]' : 'px-3 py-2'
    } ${
      isActive
        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium'
        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
    }`;

  return (
    <>
      {isTabletOrMobile && open && sidebarIsMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out"
          onClick={() => setOpenMobile(false)}
          aria-hidden="true"
        />
      )}
      
      <Sidebar className="bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border" collapsible="offcanvas">
        <SidebarHeader className={`border-b border-sidebar-border ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/69cccced-0ccf-4626-b1ab-7712c36cfd7f.png" 
              alt="Elevate Hospice & Palliative Care" 
              className={`w-auto ${isMobile ? 'h-10' : 'h-12'}`}
            />
          </div>
          <h2 className={`font-bold text-sidebar-foreground mt-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            Elevate Hospice
          </h2>
          <p className="text-sm text-muted-foreground">CRM Dashboard</p>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium">Search & AI</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className={`space-y-2 ${isMobile ? 'px-2 py-1' : 'px-2 py-2'}`}>
                <GlobalSearchBar />
                <AIQuickHelp fullWidth variant="sidebar" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-medium">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryItems.map((item) => {
                  const isActive = location.pathname === item.url || 
                    (item.url === '/organizations' && location.pathname.startsWith('/organizations/'));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url} onClick={handleLinkClick} className={linkClass(isActive)}>
                          <item.icon className="w-5 h-5" />
                          <span className={isMobile ? 'text-base' : ''}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

                {/* Insights collapsible group */}
                <Collapsible open={insightsOpen || insightsActive} onOpenChange={setInsightsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <button
                        className={`flex items-center gap-3 rounded-lg transition-all touch-manipulation w-full ${
                          isMobile ? 'px-3 py-3 min-h-[44px]' : 'px-3 py-2'
                        } ${
                          insightsActive
                            ? 'text-sidebar-primary-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <TrendingUp className="w-5 h-5" />
                        <span className={`flex-1 text-left ${isMobile ? 'text-base' : ''}`}>Insights</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${insightsOpen || insightsActive ? 'rotate-180' : ''}`} />
                      </button>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    {insightsItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link to={item.url} onClick={handleLinkClick} className={`${linkClass(isActive)} ml-4`}>
                              <item.icon className="w-4 h-4" />
                              <span className={isMobile ? 'text-base' : 'text-sm'}>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>

                {/* Settings */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/settings'}>
                    <Link to="/settings" onClick={handleLinkClick} className={linkClass(location.pathname === '/settings')}>
                      <Settings className="w-5 h-5" />
                      <span className={isMobile ? 'text-base' : ''}>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/admin/users'}>
                      <Link to="/admin/users" onClick={handleLinkClick} className={linkClass(location.pathname === '/admin/users')}>
                        <Shield className="w-5 h-5" />
                        <span className={isMobile ? 'text-base' : ''}>User Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className={`border-t border-sidebar-border ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-sidebar-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm font-semibold text-sidebar-primary-foreground">{getInitials(displayName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size={isMobile ? "default" : "sm"}
            onClick={handleSignOut} 
            className={`w-full touch-manipulation ${isMobile ? 'h-11' : ''}`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
