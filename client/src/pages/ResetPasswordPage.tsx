import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { AuthScene } from '../components/AuthScene';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
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
        setTimeout(() => navigate('/'), 2500);
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
    <AuthScene title="Set New Password" subtitle="Create a fresh secure credential for your account">
      {status === 'success' && (
        <div className="text-center">
          <CheckCircleIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">Password Reset!</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-300">{message}</p>
          <p className="mb-4 text-sm text-slate-500">Redirecting to login...</p>
          <Link to="/" className="auth-submit inline-block w-full">
            Go to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <XCircleIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">Reset Failed</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-300">{message}</p>
          <Link to="/forgot-password" className="auth-submit inline-block w-full">
            Request New Reset Link
          </Link>
        </div>
      )}

      {status === 'idle' && (
        <>
          <p className="mb-6 text-slate-600 dark:text-slate-300">Enter your new password below.</p>

          {message && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </AuthScene>
  );
};
