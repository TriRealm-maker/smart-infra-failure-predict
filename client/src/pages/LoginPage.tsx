import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AuthScene } from '../components/AuthScene';

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
    <AuthScene
      title={isLogin ? 'Welcome Back' : 'Create Account'}
      subtitle="Mission control for critical infrastructure resilience"
      footer={<span>Stay prepared. Stay safe.</span>}
    >
      {successMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
          {error.includes('verify') && (
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="ml-2 font-semibold underline transition-colors hover:text-red-900 dark:hover:text-red-200"
            >
              {resending ? 'Sending...' : 'Resend email'}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Your name"
              required={!isLogin}
            />
          </div>
        )}

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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
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

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
        >
          {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {isLogin && (
        <div className="mt-4 text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
          >
            Forgot Password?
          </Link>
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setSuccessMessage('');
          }}
          className="text-sm text-slate-600 transition-colors hover:text-primary dark:text-slate-400 dark:hover:text-primary-light"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </AuthScene>
  );
};
