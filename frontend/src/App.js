import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PageList from './components/PageList';
import PageEditor from './components/PageEditor';
import PageDetail from './components/PageDetail';
import Register from './components/Register';
import { login } from './api';

function App() {
  const [token, setToken] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = e.target.elements;
    try {
      const data = await login(username.value, password.value);
      setToken(data.token);
    } catch (error) {
      alert('Anmeldung fehlgeschlagen');
    }
  };

  return (
    <Router>
      <nav>
        <Link to="/">Seiten</Link> | <Link to="/editor">Neuer Eintrag</Link> | <Link to="/register">Registrieren</Link>
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
          <Route path="/page/:id" element={<PageDetail />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
