import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; // Our API service

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent form from refreshing the page
    setError('');

    try {
      // Call the backend /api/auth/login endpoint
      const response = await apiClient.post('/auth/login', {
        username: username,
        password: password
      });

      // If login is successful
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userRole', response.data.role);
      window.location.href = '/dashboard';

    } catch (err) {
      // If login fails
      console.error(err);
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '300px', margin: '50px auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;