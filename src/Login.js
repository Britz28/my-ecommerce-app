import { useState } from 'react';

// Login page component for the storefront.
function Login({ onLogin }) {
  // Local form state for the login page.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle the login form submission.
  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate that both fields are filled.
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    onLogin({ email: email.trim() });
  };

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>Sign in to Skye Cosmetics</h1>
        <p>Enter your credentials to continue shopping and checkout with PayNow.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {/* Show validation errors when the user submits invalid input. */}
          {error && <p className="status-message">{error}</p>}

          <button type="submit" className="login-button">
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;
