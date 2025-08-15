import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import QuantumSecurity from './pages/QuantumSecurity';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import Permissions from './pages/admin/Permissions';
import AuditLogs from './pages/admin/AuditLogs';
import QuantumControl from './pages/admin/QuantumControl';
import UserManagement from './pages/admin/UserManagement';
import ZeroTrust from './pages/admin/ZeroTrust';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quantum-security" element={<QuantumSecurity />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/roles" element={<Roles />} />
              <Route path="/admin/permissions" element={<Permissions />} />
              <Route path="/admin/audit-logs" element={<AuditLogs />} />
              <Route path="/admin/quantum-control" element={<QuantumControl />} />
              <Route path="/admin/user-management" element={<UserManagement />} />
              <Route path="/admin/zero-trust" element={<ZeroTrust />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
