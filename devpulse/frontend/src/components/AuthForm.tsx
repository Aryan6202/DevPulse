import { useState, type FormEvent } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../styles/AuthForm.css';

export default function AuthForm() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', githubUsername: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res =
        mode === 'login'
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form);
      login(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form panel" onSubmit={handleSubmit}>
      <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

      {mode === 'register' && (
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        minLength={8}
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      {mode === 'register' && (
        <input
          placeholder="GitHub username (optional)"
          value={form.githubUsername}
          onChange={(e) => setForm({ ...form, githubUsername: e.target.value })}
        />
      )}

      {error && <p className="auth-form__error">{error}</p>}

      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
      </button>

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
      </button>
    </form>
  );
}
