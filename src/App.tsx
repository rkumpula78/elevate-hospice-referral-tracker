
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import AppSidebar from "@/components/layout/AppSidebar";
import { useBreakpoint } from "@/hooks/use-responsive";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ReferralsPage from "./pages/ReferralsPage";
import PatientsPage from "./pages/PatientsPage";
import SchedulePage from "./pages/SchedulePage";
import CompliancePage from "./pages/CompliancePage";
import SettingsPage from "./pages/SettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import PatientDetail from "./pages/PatientDetail";
import ReferralDetail from "./pages/ReferralDetail";
import OrganizationDetail from "./pages/OrganizationDetail";
import TrainingPage from "./pages/TrainingPage";
import NotFound from "./pages/NotFound";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import MarketingPage from "./pages/MarketingPage";
import KPIPage from "./pages/KPIPage";

const queryClient = new QueryClient();

const ProtectedLayout = () => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';

  return (
    <SidebarProvider defaultOpen={isDesktop}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
          <div className="flex-1">
            <Routes>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="referrals" element={<ReferralsPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="marketing" element={<MarketingPage />} />
              <Route path="kpi" element={<KPIPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin/users" element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              } />
              <Route path="patient/:id" element={<PatientDetail />} />
              <Route path="referral/:id" element={<ReferralDetail />} />
              <Route path="organizations/:id" element={<OrganizationDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <MobileFAB />
        </div>
      </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
