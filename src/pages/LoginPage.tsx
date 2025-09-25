import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../lib/types';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<any>(null);
  
  const { login, isAuthenticated, resendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default routes
  const getRedirectPath = (userType?: string, loginResponse?: any) => {
    // Check for redirect from protected route
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login') {
      return from;
    }

    // Check if backend provided redirect URL
    if (loginResponse?.redirect_url) {
      return loginResponse.redirect_url;
    }

    // Default routes based on user type
    switch (userType) {
      case 'business_owner':
        return '/business-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/dashboard';
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const redirectPath = getRedirectPath(userData.user_type);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Autofill from pending registration or previous login attempt
  useEffect(() => {
    try {
      const pending = localStorage.getItem('pending_login');
      const registration = localStorage.getItem('registration_data');
      
      if (pending) {
        const creds = JSON.parse(pending);
        setFormData({ 
          email: creds.email || '', 
          password: '' // Don't prefill password for security
        });
      } else if (registration) {
        const regData = JSON.parse(registration);
        setFormData({ 
          email: regData.email || '', 
          password: '' 
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors[field] || errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        delete newErrors.general;
        return newErrors;
      });
    }
    // Clear login result if user changes form data
    if (loginResult) {
      setLoginResult(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enhanced handleSubmit with improved verification flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      
      const response = await login(formData);
      console.log('Login response in component:', response);
      
      // Handle successful login with full authentication
      if (response.success && (response.access_token || response.access)) {
        // User is fully authenticated - redirect immediately
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const redirectPath = getRedirectPath(userData.user_type, response);
        navigate(redirectPath, { replace: true });
      }
      // Handle case where user needs email verification - redirect to verification-required route
      else if (response.requires_verification || response.requiresVerificationRedirect) {
        setLoginResult(response);
        
        // Automatically redirect to verification page after showing the message
        setTimeout(() => {
          navigate('/verification-required', { 
            state: { 
              email: response.email || formData.email,
              userId: response.user_id,
              fromLogin: true,
              temporaryToken: response.temporary_token
            } 
          });
        }, 1000); // Reduced to 1 second for better UX
      }
      else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrors({ general: error.message || 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced resend verification with proper error handling
  const handleResendVerification = async () => {
    try {
      if (loginResult?.email || formData.email) {
        await resendEmailVerification(
          loginResult?.email || formData.email, 
          loginResult?.user_id
        );
      }
    } catch (error) {
      console.error('Failed to resend verification:', error);
      setErrors({ general: 'Failed to resend verification email. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-[#0D80F2] to-[#102654] items-center justify-center p-12">
        <div className="max-w-lg text-center text-white">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to BizMap Rwanda</h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Discover Rwanda's best businesses with our AI-powered platform. 
              Connect with local services and grow your network.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#EBA910]">1000+</div>
              <div className="text-sm text-blue-200">Businesses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#EBA910]">50k+</div>
              <div className="text-sm text-blue-200">Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#EBA910]">100%</div>
              <div className="text-sm text-blue-200">Verified</div>
            </div>
          </div>
          
          <div className="mt-12">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1635249475387-6230016cf06c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMGRpc2NvdmVyeSUyMGhlcm8lMjBpbWFnZXxlbnwxfHx8fDE3NTgyNzg3NjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Business Discovery Platform"
              className="w-full h-64 object-cover rounded-lg opacity-90"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo for Mobile */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-[#0D80F2] rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">BizMap</span>
            </div>
          </div>

          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-center text-3xl font-bold text-[#0D80F2] mb-2">
                Welcome back
              </CardTitle>
              <p className="text-gray-600 font-normal text-base text-center">
                Sign in to your account to continue
              </p>
            </CardHeader>

            <CardContent>
              {/* Enhanced verification required message */}
              {(loginResult?.requires_verification || loginResult?.requiresVerificationRedirect) && (
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <div className="space-y-3">
                      <p className="font-medium">Email verification required</p>
                      <p className="text-sm">
                        Please check your email ({loginResult.email || formData.email}) for verification instructions.
                        Redirecting to verification page...
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/verification-required', { 
                            state: { 
                              email: loginResult.email || formData.email,
                              userId: loginResult.user_id,
                              fromLogin: true,
                              temporaryToken: loginResult.temporary_token
                            } 
                          })}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          Continue to Verification Now
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResendVerification}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          Resend Email
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Show general error */}
              {errors.general && !(loginResult?.requires_verification || loginResult?.requiresVerificationRedirect) && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`h-12 ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-[#0D80F2]'}`}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`h-12 pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-[#0D80F2]'}`}
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#0D80F2] hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0D80F2] hover:bg-blue-700 text-white font-medium rounded-lg"
                  disabled={isLoading || !!(loginResult?.requires_verification || loginResult?.requiresVerificationRedirect)}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </Button>

                {/* Demo Accounts */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Demo Accounts:</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Customer: customer@demo.com / demo123</div>
                    <div>Business: business@demo.com / demo123</div>
                  </div>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-[#0D80F2] hover:text-blue-700 hover:underline"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-4">
              <Link to="/privacy" className="hover:text-[#0D80F2] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#0D80F2] transition-colors">
                Terms of Service
              </Link>
              <Link to="/help" className="hover:text-[#0D80F2] transition-colors">
                Help Center
              </Link>
            </div>
            
            <p className="text-xs text-gray-400">
              © 2025 BizMap Rwanda. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;