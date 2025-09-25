import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../lib/types';
import { MapPin, User, Mail, Lock, Phone, Globe, UserCheck, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authAPI } from '../lib/api';

// Enhanced error handling function that matches your backend response format
const handleRegistrationError = (error: any): Record<string, string> => {
  console.log('Full error object:', error);
  
  const newErrors: Record<string, string> = {};
  
  // Handle your backend's success: false format
  if (error.response?.data?.success === false) {
    const backendErrors = error.response.data;
    
    if (backendErrors.message) {
      newErrors.general = backendErrors.message;
    }
    
    if (backendErrors.errors && typeof backendErrors.errors === 'object') {
      Object.keys(backendErrors.errors).forEach(field => {
        const fieldErrors = backendErrors.errors[field];
        if (Array.isArray(fieldErrors)) {
          const errorMessage = fieldErrors[0];
          
          // Map specific field errors to user-friendly messages
          if (field === 'email' && errorMessage.includes('already exists')) {
            newErrors[field] = 'This email address is already registered. Please use the login page.';
          } else if (field === 'phone_number' && errorMessage.includes('already exists')) {
            newErrors[field] = 'This phone number is already registered. Please use a different number.';
          } else if (field === 'phone_number' && errorMessage.includes('format')) {
            newErrors[field] = 'Please enter a valid Rwanda phone number format (+2507XXXXXXXX, 2507XXXXXXXX, or 07XXXXXXXX)';
          } else if (field === 'password' && errorMessage.includes("don't match")) {
            newErrors.confirm_password = 'Passwords do not match.';
          } else if (field === 'password') {
            newErrors.password = errorMessage;
          } else {
            newErrors[field] = errorMessage;
          }
        } else if (typeof fieldErrors === 'string') {
          newErrors[field] = fieldErrors;
        }
      });
    }
    
    return newErrors;
  }
  
  // Handle Django validation errors (old format)
  if (error.response?.data && typeof error.response.data === 'object') {
    const backendErrors = error.response.data;
    
    Object.keys(backendErrors).forEach(field => {
      if (Array.isArray(backendErrors[field])) {
        const errorMessage = backendErrors[field][0];
        
        if (field === 'email' && errorMessage.includes('already exists')) {
          newErrors[field] = 'This email address is already registered. Please use the login page.';
        } else if (field === 'phone_number' && errorMessage.includes('already exists')) {
          newErrors[field] = 'This phone number is already registered. Please use a different number.';
        } else if (field === 'phone_number' && errorMessage.includes('format')) {
          newErrors[field] = 'Please enter a valid Rwanda phone number format';
        } else if (errorMessage.includes("Passwords don't match")) {
          newErrors.confirm_password = 'Passwords do not match.';
        } else {
          newErrors[field] = errorMessage;
        }
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      return newErrors;
    }
  }
  
  // Handle network or other errors
  if (error.message) {
    if (error.message.includes('Network Error') || error.message.includes('Backend service is not available')) {
      return { general: 'Unable to connect to server. Please check your internet connection and try again.' };
    }
    return { general: error.message };
  }
  
  return { general: 'Registration failed. Please try again.' };
};

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: 'customer',
    preferred_language: 'rw'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phoneCheckStatus, setPhoneCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Debounced email availability check
  useEffect(() => {
    if (formData.email && formData.email.includes('@') && !errors.email) {
      const timer = setTimeout(async () => {
        try {
          setEmailCheckStatus('checking');
          const response = await authAPI.checkEmailAvailability(formData.email);
          
          if (response.success && response.available) {
            setEmailCheckStatus('available');
          } else if (response.available === false) {
            setEmailCheckStatus('taken');
            setErrors(prev => ({
              ...prev,
              email: response.message || 'This email is already registered'
            }));
          }
        } catch (error) {
          setEmailCheckStatus('idle');
          console.error('Email check failed:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setEmailCheckStatus('idle');
    }
  }, [formData.email, errors.email]);

  // Debounced phone availability check
  useEffect(() => {
    if (formData.phone_number && formData.phone_number.length > 8 && !errors.phone_number) {
      const timer = setTimeout(async () => {
        try {
          setPhoneCheckStatus('checking');
          const response = await authAPI.checkPhoneAvailability(formData.phone_number);
          
          if (response.success && response.available) {
            setPhoneCheckStatus('available');
          } else if (response.available === false) {
            setPhoneCheckStatus('taken');
            setErrors(prev => ({
              ...prev,
              phone_number: response.message || 'This phone number is already registered'
            }));
          }
        } catch (error) {
          setPhoneCheckStatus('idle');
          console.error('Phone check failed:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setPhoneCheckStatus('idle');
    }
  }, [formData.phone_number, errors.phone_number]);

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error when any field changes
    if (errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.general;
        return newErrors;
      });
    }
    
    // Clear registration result when form changes
    if (registrationResult) {
      setRegistrationResult(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Phone number validation - matches your backend exactly
    if (formData.phone_number && formData.phone_number.trim()) {
      const cleanedPhone = formData.phone_number.trim().replace(/[\s\-]/g, '');
      
      // Rwanda phone patterns - matching your backend validation
      const rwandaPhonePatterns = [
        /^\+250[7][0-9]{8}$/,  // +2507XXXXXXXX
        /^250[7][0-9]{8}$/,    // 2507XXXXXXXX
        /^0[7][0-9]{8}$/,      // 07XXXXXXXX
      ];
      
      if (!rwandaPhonePatterns.some(pattern => pattern.test(cleanedPhone))) {
        newErrors.phone_number = 'Phone number must be in Rwanda format: +2507XXXXXXXX, 2507XXXXXXXX, or 07XXXXXXXX';
      }
    }

    // Terms agreement
    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizePhoneNumber = (phone: string): string => {
    if (!phone || !phone.trim()) return '';
    
    // Remove spaces and dashes
    const cleaned = phone.trim().replace(/[\s\-]/g, '');
    
    // Convert to +250 format based on your backend logic
    if (cleaned.startsWith('07') && cleaned.length === 10) {
      return '+250' + cleaned.slice(1);
    } else if (cleaned.startsWith('250') && cleaned.length === 12) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('+250') && cleaned.length === 13) {
      return cleaned;
    }
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setErrors({});
      
      // Prepare registration data exactly as your backend expects
      const registrationData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        preferred_language: formData.preferred_language,
        user_type: formData.user_type,
      };
      
      // Handle phone number properly - your backend expects null for empty values
      if (formData.phone_number && formData.phone_number.trim()) {
        const normalizedPhone = normalizePhoneNumber(formData.phone_number);
        registrationData.phone_number = normalizedPhone;
      } else {
        // Send null instead of empty string to match your backend validation
        registrationData.phone_number = null;
      }
      
      console.log('Sending registration data:', registrationData);
      
      const response = await register(registrationData);
      console.log('Registration response:', response);
      
      // Handle successful registration
      if (response.success) {
        setRegistrationResult(response);
        
        // Store credentials for login page if needed
        localStorage.setItem('pending_login', JSON.stringify({
          email: registrationData.email,
          user_id: response.user_id
        }));
        
        // Navigate based on response
        if (response.requires_verification) {
          // User needs to verify email first
          navigate('/verification-required', { 
            state: { 
              email: registrationData.email,
              userId: response.user_id,
              fromRegistration: true,
              message: response.message
            } 
          });
        } else {
          // User is immediately logged in
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      const processedErrors = handleRegistrationError(error);
      setErrors(processedErrors);
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove non-digit characters except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Auto-format based on common patterns
    let formatted = cleaned;
    if (cleaned.startsWith('07') && cleaned.length <= 10) {
      formatted = cleaned;
    } else if (cleaned.startsWith('7') && cleaned.length <= 9) {
      formatted = '0' + cleaned;
    } else if (cleaned.startsWith('250') && cleaned.length <= 12) {
      formatted = '+' + cleaned;
    } else if (!cleaned.startsWith('+') && cleaned.length === 12 && cleaned.startsWith('250')) {
      formatted = '+' + cleaned;
    }
    
    handleInputChange('phone_number', formatted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D80F2] to-[#102654] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-white rounded-lg flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-[#0D80F2]" />
          </div>
          <h2 className="text-3xl font-bold text-white">Join BizMap Rwanda</h2>
          <p className="mt-2 text-sm text-blue-100">
            Create your account to discover local businesses
          </p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Show general error */}
            {errors.general && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Show registration success message */}
            {registrationResult && registrationResult.success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <p className="font-medium">Registration successful!</p>
                    <p className="text-sm">{registrationResult.message}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Type */}
              <div className="space-y-2">
                <Label htmlFor="user_type" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Account Type
                </Label>
                <Select
                  value={formData.user_type}
                  onValueChange={(value: 'customer' | 'business_owner') => 
                    handleInputChange('user_type', value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className={errors.user_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer - Find businesses</SelectItem>
                    <SelectItem value="business_owner">Business Owner - List my business</SelectItem>
                  </SelectContent>
                </Select>
                {errors.user_type && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.user_type}
                  </p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Jean"
                    className={errors.first_name ? 'border-red-500' : ''}
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.first_name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Damascene"
                    className={errors.last_name ? 'border-red-500' : ''}
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="jean@example.com"
                    className={`${errors.email ? 'border-red-500' : ''} ${
                      emailCheckStatus === 'available' ? 'border-green-500' : ''
                    } pr-10`}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {emailCheckStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {emailCheckStatus === 'available' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {emailCheckStatus === 'taken' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+250788123456 or 0788123456"
                    className={`${errors.phone_number ? 'border-red-500' : ''} ${
                      phoneCheckStatus === 'available' ? 'border-green-500' : ''
                    } pr-10`}
                    disabled={isLoading}
                    autoComplete="tel"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {phoneCheckStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {phoneCheckStatus === 'available' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {phoneCheckStatus === 'taken' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {errors.phone_number && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone_number}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Rwanda formats: +2507XXXXXXXX, 2507XXXXXXXX, or 07XXXXXXXX
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                    placeholder="••••••••"
                    className={errors.confirm_password ? 'border-red-500 pr-10' : 'pr-10'}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirm_password}
                  </p>
                )}
              </div>

              {/* Language Preference */}
              <div className="space-y-2">
                <Label htmlFor="preferred_language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Preferred Language
                </Label>
                <Select
                  value={formData.preferred_language}
                  onValueChange={(value: 'en' | 'rw' | 'fr') => 
                    handleInputChange('preferred_language', value)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className={errors.preferred_language ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rw">🇷🇼 Kinyarwanda</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  </SelectContent>
                </Select>
                {errors.preferred_language && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.preferred_language}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => {
                    setAgreedToTerms(checked as boolean);
                    if (errors.terms) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.terms;
                        return newErrors;
                      });
                    }
                  }}
                  disabled={isLoading}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#0D80F2] hover:underline" target="_blank">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#0D80F2] hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.terms}
                </p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-[#0D80F2] hover:bg-blue-700 text-white font-medium"
                disabled={isLoading || emailCheckStatus === 'taken' || phoneCheckStatus === 'taken'}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[#0D80F2] hover:text-blue-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-blue-100">
            By joining BizMap Rwanda, you're connecting with local businesses and helping grow the economy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;