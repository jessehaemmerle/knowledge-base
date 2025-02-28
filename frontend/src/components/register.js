import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('viewer');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL.replace('/api', '')}/api/auth/register`, {
        username,
        password,
        role
      });
      if (response.data.token) {
        navigate('/'); // Nach erfolgreicher Registrierung ggf. Login-Seite aufrufen oder direkt anmelden
      }
    } catch (error) {
      alert('Registrierung fehlgeschlagen: ' + error.response.data.message);
    }
  };

  return (
    <div className="register-container">
      <h2>Registrieren</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Username:</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Rolle:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit">Registrieren</button>
      </form>
    </div>
  );
}

export default Register;
