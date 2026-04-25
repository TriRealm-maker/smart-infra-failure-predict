import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CrisisGuard AI</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300">Verifying your email...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Email Verified!</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
                <Link
                  to="/login"
                  className="inline-block w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Go to Login
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verification Failed</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{message}</p>
                
                {!resendSuccess ? (
                  <>
                    <p className="text-slate-500 text-sm mb-2">Enter your email to request a new verification link:</p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white mb-3"
                      placeholder="you@example.com"
                    />
                    <button
                      onClick={handleResend}
                      disabled={resending || !email}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </>
                ) : (
                  <p className="text-green-600 dark:text-green-400 mb-4">
                    If an account exists, a verification email has been sent.
                  </p>
                )}
                
                <Link
                  to="/login"
                  className="inline-block w-full py-3 mt-4 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                >
                  Back to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
