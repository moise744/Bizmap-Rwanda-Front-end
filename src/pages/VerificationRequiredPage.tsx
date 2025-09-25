import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const VerificationRequiredPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { resendEmailVerification } = useAuth();

  const email = location?.state?.email || JSON.parse(localStorage.getItem('user_data') || '{}')?.email;
  const userId = location?.state?.userId || JSON.parse(localStorage.getItem('registration_data') || '{}')?.user_id;

  const handleResend = async () => {
    try {
      await resendEmailVerification(email, userId);
    } catch {
      // noop; toast handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Email verification required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We have sent a verification link to {email || 'your email'}. Please click the link to verify
            your account before continuing.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/login', { replace: true })}>Back to Login</Button>
            <Button variant="outline" onClick={handleResend}>Resend Verification Email</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationRequiredPage;


