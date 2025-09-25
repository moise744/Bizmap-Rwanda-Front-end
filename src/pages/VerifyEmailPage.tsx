import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { authAPI } from '../lib/api';
import { CheckCircle2, Loader2, MailWarning, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser, refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying'|'success'|'error'>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email, please wait...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link.');
        return;
      }
      try {
        const resp: any = await authAPI.verifyEmail(token);
        // Save tokens and user
        if (resp?.access_token || resp?.access) {
          localStorage.setItem('auth_token', resp.access_token || resp.access);
          if (resp.refresh_token || resp.refresh) localStorage.setItem('refresh_token', resp.refresh_token || resp.refresh);
        }
        if (resp?.user) {
          localStorage.setItem('user_data', JSON.stringify(resp.user));
          // Ensure AuthContext is updated immediately so protected features (AI) work
          try { updateUser(resp.user); } catch {}
        }
        // As a fallback, try refreshing profile in context
        try { await refreshUser(); } catch {}
        setStatus('success');
        setMessage('Your email was verified successfully!');
        // Navigate to redirect_url or role-based page after short delay
        setTimeout(() => {
          const redirect = resp?.redirect_url;
          if (redirect) {
            navigate(redirect, { replace: true });
          } else {
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
            if (user?.user_type === 'business_owner') navigate('/business-dashboard', { replace: true });
            else if (user?.user_type === 'admin') navigate('/admin-dashboard', { replace: true });
            else navigate('/dashboard', { replace: true });
          }
        }, 1200);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };
    run();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'verifying' && <Loader2 className="h-5 w-5 animate-spin" />} 
            {status === 'success' && <ShieldCheck className="h-5 w-5 text-green-600" />} 
            {status === 'error' && <MailWarning className="h-5 w-5 text-red-600" />}
            Verify Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              <span>Your account is now active. Redirecting...</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/login')} className="w-full">Go to Login</Button>
              <Button variant="outline" onClick={() => navigate('/register')} className="w-full">Create New Account</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;


