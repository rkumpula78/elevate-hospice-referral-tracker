
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppSidebar from "@/components/layout/AppSidebar";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ReferralsPage from "./pages/ReferralsPage";
import SchedulePage from "./pages/SchedulePage";
import CompliancePage from "./pages/CompliancePage";
import SettingsPage from "./pages/SettingsPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import PatientDetail from "./pages/PatientDetail";
import ReferralDetail from "./pages/ReferralDetail";
import OrganizationDetail from "./pages/OrganizationDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <Routes>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="referrals" element={<ReferralsPage />} />
                        <Route path="organizations" element={<OrganizationsPage />} />
                        <Route path="schedule" element={<SchedulePage />} />
                        <Route path="compliance" element={<CompliancePage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="patient/:id" element={<PatientDetail />} />
                        <Route path="referral/:id" element={<ReferralDetail />} />
                        <Route path="organization/:id" element={<OrganizationDetail />} />
                      </Routes>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <Dashboard />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/referrals" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <ReferralsPage />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/organizations" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <OrganizationsPage />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/schedule" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <SchedulePage />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/compliance" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <CompliancePage />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <SettingsPage />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/patient/:id" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <PatientDetail />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/referral/:id" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <ReferralDetail />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/organization/:id" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1">
                      <OrganizationDetail />
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
