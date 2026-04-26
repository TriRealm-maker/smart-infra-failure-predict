import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { AuthScene } from '../components/AuthScene';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const result = await api.auth.verifyEmail(token);
        if (result.message && result.message.includes('successfully')) {
          setStatus('success');
          setMessage(result.message);
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed. Your token may be expired or invalid.');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const result = await api.auth.resendVerification(email);
      if (result.message) {
        setResendSuccess(true);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScene title="Email Verification" subtitle="Authenticate your identity to activate your command center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-slate-600 dark:text-slate-300">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">Email Verified!</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-300">{message}</p>
            <Link to="/" className="auth-submit inline-block w-full">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircleIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">Verification Failed</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-300">{message}</p>

            {!resendSuccess ? (
              <>
                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                  Enter your email to request a new verification link:
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input mb-3"
                  placeholder="you@example.com"
                />
                <button onClick={handleResend} disabled={resending || !email} className="auth-submit">
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </>
            ) : (
              <p className="mb-4 text-green-600 dark:text-green-400">
                If an account exists, a verification email has been sent.
              </p>
            )}

            <Link to="/" className="mt-4 inline-block w-full rounded-xl bg-slate-700/90 py-3 font-bold text-white transition-colors hover:bg-slate-700">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </AuthScene>
  );
};
