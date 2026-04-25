import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { api } from '../services/api';

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(email, password);
        
        if (result.success) {
          navigate('/');
        } else {
          if (result.message?.includes('verify')) {
            setError(result.message);
          } else {
            setError(result.message || 'Authentication failed');
          }
        }
      } else {
        const result = await register(email, password, name);
        
        if (result.success) {
          navigate('/');
        } else if (result.message?.includes('check your email')) {
          setSuccessMessage(result.message);
          setIsLogin(true);
          setPassword('');
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setResending(true);
    setError('');
    
    try {
      const result = await api.auth.resendVerification(email);
      if (result.message) {
        setSuccessMessage(result.message);
      } else {
        setError(result.message || 'Failed to resend verification email');
      }
    } catch {
      setError('An error occurred');
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
          <p className="text-slate-400 mt-2">Your Emergency Response Companion</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
              {error.includes('verify') && (
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="ml-2 underline font-semibold hover:text-red-800 dark:hover:text-red-300"
                >
                  {resending ? 'Sending...' : 'Resend email'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
              className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Stay prepared. Stay safe.
        </p>
      </div>
    </div>
  );
};
