import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';
import { AuthScene } from '../components/AuthScene';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await api.auth.forgotPassword(email);
      if (result.message) {
        setMessage(result.message);
      } else {
        setError(result.message || 'Failed to send reset email');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScene title="Reset Password" subtitle="Generate a secure reset link to regain access">
      {message ? (
        <div className="text-center">
          <EnvelopeIcon className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-white">Check Your Email</h2>
          <p className="mb-6 text-slate-600 dark:text-slate-300">{message}</p>
          <Link to="/" className="auth-submit inline-block w-full">
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-slate-600 dark:text-slate-300">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
            >
              Back to Login
            </Link>
          </div>
        </>
      )}
    </AuthScene>
  );
};
