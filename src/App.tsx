import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { Toaster } from './components/ui/sonner';

// Page imports
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BusinessesPage from './pages/BusinessesPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ReviewsPage from './pages/ReviewsPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StaticPage from './pages/StaticPage';
import ManageBusinessPage from './pages/ManageBusinessPage';
import VerificationRequiredPage from './pages/VerificationRequiredPage';
import NotFoundPage from './pages/NotFoundPage';
import BusinessRegistrationPage from './pages/BusinessRegistrationPage';

// Layout components
import { Layout as MainLayout } from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Route Protection Components
interface RouteProtectionProps {
  children: React.ReactNode;
}

// Public Route - only accessible when not authenticated
const PublicRoute: React.FC<RouteProtectionProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  
  if (token) {
    // If not verified, send to verification-required
    if (!user?.email_verified) return <Navigate to="/verification-required" replace />;
    // Redirect based on user type
    if (user?.user_type === 'business_owner') return <Navigate to="/business-dashboard" replace />;
    if (user?.user_type === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Protected Route - requires authentication
const ProtectedRoute: React.FC<RouteProtectionProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if email is verified (except for email verification routes)
  if (!user?.email_verified && !window.location.pathname.includes('/verify-email') && !window.location.pathname.includes('/verification-required')) {
    return <Navigate to="/verification-required" replace />;
  }
  
  return <>{children}</>;
};

// Unverified Route - for users who need to verify email
const UnverifiedRoute: React.FC<RouteProtectionProps> = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  const temporaryToken = localStorage.getItem('temporary_token');
  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  
  // Allow access if: user is unverified OR has temporary token OR is visiting verify-email route
  const isVerifyRoute = window.location.pathname.includes('/verify-email');
  if (!token && !temporaryToken && !isVerifyRoute) {
    return <Navigate to="/login" replace />;
  }

  if (user?.email_verified && !isVerifyRoute) {
    // Redirect to appropriate dashboard based on user type
    if (user?.user_type === 'business_owner') return <Navigate to="/business-dashboard" replace />;
    if (user?.user_type === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Role-based Route Protection
interface RoleRouteProps extends RouteProtectionProps {
  allowedRoles: Array<'customer' | 'business_owner' | 'admin'>;
  requireVerification?: boolean;
}

const RoleRoute: React.FC<RoleRouteProps> = ({ 
  children, 
  allowedRoles, 
  requireVerification = true 
}) => {
  const token = localStorage.getItem('auth_token');
  const user = JSON.parse(localStorage.getItem('user_data') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireVerification && !user?.email_verified) {
    return <Navigate to="/verification-required" replace />;
  }
  
  if (!allowedRoles.includes(user?.user_type)) {
    // Redirect to appropriate dashboard based on user type
    if (user?.user_type === 'business_owner') return <Navigate to="/business-dashboard" replace />;
    if (user?.user_type === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes - Accessible without authentication */}
              <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
              <Route path="/businesses" element={<BusinessesPage />} />
              <Route path="/business/:id" element={<BusinessDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              
              {/* Static Pages */}
              <Route path="/privacy" element={<StaticPage title="Privacy Policy">Privacy policy content.</StaticPage>} />
              <Route path="/terms" element={<StaticPage title="Terms of Service">Terms content.</StaticPage>} />
              <Route path="/help" element={<StaticPage title="Help Center">Help content.</StaticPage>} />

              {/* Authentication Routes - Only accessible when not logged in */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <LoginPage />
                    </AuthLayout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <RegisterPage />
                    </AuthLayout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <ForgotPasswordPage />
                    </AuthLayout>
                  </PublicRoute>
                } 
              />
              <Route 
                path="/reset-password/:token" 
                element={
                  <PublicRoute>
                    <AuthLayout>
                      <ResetPasswordPage />
                    </AuthLayout>
                  </PublicRoute>
                } 
              />

              {/* Email Verification Routes */}
              <Route 
                path="/verify-email/:token" 
                element={
                  <UnverifiedRoute>
                    <AuthLayout>
                      <VerifyEmailPage />
                    </AuthLayout>
                  </UnverifiedRoute>
                } 
              />
              <Route 
                path="/verification-required" 
                element={
                  <UnverifiedRoute>
                    <AuthLayout>
                      <VerificationRequiredPage />
                    </AuthLayout>
                  </UnverifiedRoute>
                } 
              />

              {/* Protected Routes - Require authentication */}
              <Route 
                path="/dashboard" 
                element={
                  <RoleRoute allowedRoles={['customer', 'business_owner', 'admin']}>
                    <MainLayout>
                      <HomePage />
                    </MainLayout>
                  </RoleRoute>
                } 
              />
              
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ChatPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProfilePage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/favorites" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <FavoritesPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <HistoryPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <NotificationsPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/reviews" 
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ReviewsPage />
                    </MainLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Business Owner Specific Routes */}
              <Route 
                path="/business-dashboard" 
                element={
                  <RoleRoute allowedRoles={['business_owner', 'admin']}>
                    <MainLayout>
                      <BusinessDashboardPage />
                    </MainLayout>
                  </RoleRoute>
                } 
              />
              
              <Route 
                path="/manage-business" 
                element={
                  <RoleRoute allowedRoles={['business_owner', 'admin']}>
                    <MainLayout>
                      <ManageBusinessPage />
                    </MainLayout>
                  </RoleRoute>
                } 
              />
              
              <Route 
                path="/manage-business/:id" 
                element={
                  <RoleRoute allowedRoles={['business_owner', 'admin']}>
                    <MainLayout>
                      <ManageBusinessPage />
                    </MainLayout>
                  </RoleRoute>
                } 
              />

                <Route 
                  path="/register-business" 
                  element={
                    <RoleRoute allowedRoles={['business_owner', 'admin']}>
                      <MainLayout>
                        <BusinessRegistrationPage />
                      </MainLayout>
                    </RoleRoute>
                  } 
                />

              {/* Admin Only Routes */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <RoleRoute allowedRoles={['admin']}>
                    <MainLayout>
                      <AdminDashboardPage />
                    </MainLayout>
                  </RoleRoute>
                } 
              />

              {/* 404 Page */}
              <Route path="/404" element={<NotFoundPage />} />
              
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
            
            {/* Toast notifications */}
            <Toaster position="top-right" richColors />
          </div>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;