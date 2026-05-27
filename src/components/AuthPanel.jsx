import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthPanel() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  async function signIn(event) {
    event.preventDefault();
    setMessage('');

    if (!supabase) {
      setMessage('Supabase is not configured yet.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    setMessage(error ? error.message : 'Check your email for a secure sign-in link.');
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Secure Access</p>
        <h1>Sign in to save private loan scenarios.</h1>
        <p>LoanIQ Pro stores each scenario behind Supabase Auth and database-level Row-Level Security.</p>
        <form onSubmit={signIn}>
          <label>
            Email
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button className="primary-action" type="submit">
            <LogIn size={18} />
            Send magic link
          </button>
        </form>
        {message ? <p className="auth-message">{message}</p> : null}
      </section>
    </main>
  );
}
