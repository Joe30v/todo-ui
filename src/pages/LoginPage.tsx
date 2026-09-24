import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);  // Toggle between login/register
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isRegister ? "/register" : "/login";
    const method = "POST";

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to ${isRegister ? "register" : "login"}`);
        return;
      }

      if (isRegister) {
        // Registration successful, switch to login
        setError(null);
        setUsername("");
        setPassword("");
        setIsRegister(false);
        alert("Registration successful! Please log in.");
        return;
      }

      // Login successful - save token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId.toString());
      onLogin(data.token);
      navigate("/todos");
    } catch (err) {
      setError("Network error. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto", padding: "2rem" }}>
      <h1>{isRegister ? "Create Account" : "Login"}</h1>

      {error && (
        <div
          style={{
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#cc0000",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: isLoading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            marginBottom: "1rem"
          }}
        >
          {isLoading ? "Loading..." : isRegister ? "Create Account" : "Login"}
        </button>
      </form>

      <p style={{ textAlign: "center", color: "#666" }}>
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{
            backgroundColor: "transparent",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline"
          }}
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
    </div>
  );
}