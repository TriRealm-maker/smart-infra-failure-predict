import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid reset link. No token provided.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Invalid reset link');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await api.auth.resetPassword(token, password);
      if (result.message && result.message.includes('successful')) {
        setStatus('success');
        setMessage(result.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'Failed to reset password');
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred');
    } finally {
      setLoading(false);
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
          <p className="text-slate-400 mt-2">Reset Your Password</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">Loading...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Password Reset!</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
              <p className="text-slate-500 text-sm mb-4">Redirecting to login...</p>
              <Link
                to="/login"
                className="inline-block w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Reset Failed</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
              <Link
                to="/forgot-password"
                className="inline-block w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Request New Reset Link
              </Link>
            </div>
          )}

          {status === 'idle' && (
            <>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Enter your new password below.
              </p>

              {message && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
