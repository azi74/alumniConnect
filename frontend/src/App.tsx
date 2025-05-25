import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AlumniPortal from "./pages/AlumniPortal";
import AlumniProfile from "./pages/AlumniProfile";
import AIChat from "./pages/AIChat";
import StudentPortal from "./pages/StudentPortal";
import StudentProfile from "./pages/StudentProfile";
import Events from "./pages/Events";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { NavigationDebugger } from "./components/NavigationDebugger";
import { AuthInitializer } from "./components/AuthInitializer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <AuthInitializer>
        <NavigationDebugger />
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Protected Alumni Routes */}
          <Route path="/alumni-portal" element={
            <ProtectedRoute allowedRoles={['alumni']}> {/* Add allowedRoles */}
              <AlumniPortal />
            </ProtectedRoute>
          } />
          <Route path="/alumni-profile" element={
            <ProtectedRoute allowedRoles={['alumni']}> {/* Add allowedRoles */}
              <AlumniProfile />
            </ProtectedRoute>
          } />
          
          {/* Protected Student Routes */}
          <Route path="/student-portal" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentPortal />
            </ProtectedRoute>
          } />
          <Route path="/student-portal/chat/:alumniId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentPortal />
            </ProtectedRoute>
          } />
          <Route path="/student-profile" element={
            <ErrorBoundary fallback={<div>Error in ProfileForm</div>}>
              <ProtectedRoute allowedRoles={['student']}> {/* Add allowedRoles */}
                <StudentProfile />
              </ProtectedRoute>
            </ErrorBoundary>
          } />
          
          {/* Public Routes */}
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/events" element={<Events />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;