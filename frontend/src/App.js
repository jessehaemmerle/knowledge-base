import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PageList from './components/PageList';
import PageEditor from './components/PageEditor';
import { login } from './api';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = e.target.elements;
    try {
      const data = await login(username.value, password.value);
      setToken(data.token);
      // Benutzerinformationen können aus dem Token geparst werden
      setUser({ username: username.value });
    } catch (error) {
      alert('Anmeldung fehlgeschlagen');
    }
  };

  return (
    <Router>
      <nav>
        <Link to="/">Seiten</Link> | <Link to="/editor">Neuer Eintrag</Link>
      </nav>
      {!token ? (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <div>
            <label>Username: <input name="username" /></label>
          </div>
          <div>
            <label>Password: <input name="password" type="password" /></label>
          </div>
          <button type="submit">Anmelden</button>
        </form>
      ) : (
        <Routes>
          <Route path="/" element={<PageList />} />
          <Route path="/editor" element={<PageEditor token={token} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
