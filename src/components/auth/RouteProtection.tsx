// src/components/auth/RouteProtection.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// ProtectedRoute - For routes that require full authentication
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// UnverifiedRoute - For routes that are accessible during verification process
export const UnverifiedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user, verificationStatus } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user at all, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is fully authenticated, allow access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If user exists but email is not verified, allow access to verification-related pages
  // but redirect away from other protected pages
  const allowedUnverifiedPaths = ['/verify-email', '/verify-phone', '/verification-required'];
  const isVerificationRoute = allowedUnverifiedPaths.some(path => 
    location.pathname.startsWith(path)
  );

  if (!isVerificationRoute && user && !verificationStatus.email_verified) {
    return <Navigate to="/verification-required" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// PublicRoute - For routes that should only be accessible when not authenticated
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect authenticated users away from public pages like login/register
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};