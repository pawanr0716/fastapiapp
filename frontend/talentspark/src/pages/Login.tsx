import { useState } from "react";
import { login } from "../Services/AuthService";

type Props = {
  onLogin: (token: string) => void;
  onSwitchToRegister: () => void;
};

function Login({ onLogin, onSwitchToRegister }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login({ email, password });
      onLogin(response.access_token);
    } catch (error: any) {
      console.error("Error during login:", error);
      const message = error?.response?.data?.detail ?? error?.message ?? "Login failed";
      alert(`Login failed: ${message}`);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
        <p className="auth-switch">
          Don't have an account?{" "}
          <button type="button" onClick={onSwitchToRegister}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;