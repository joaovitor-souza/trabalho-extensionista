// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';

// Importando os componentes que você acabou de criar
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  // Escuta as mudanças na URL (quando clica em links com #)
  useEffect(() => {
    const atualizaHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", atualizaHash);
    return () => window.removeEventListener("hashchange", atualizaHash);
  }, []);

  // Controle Central: Se a URL terminar com #admin, mostra o painel. Se não, mostra o site.
  if (hash === '#admin') {
    return <AdminPanel />;
  }

  return <LandingPage />;
}

export default App;