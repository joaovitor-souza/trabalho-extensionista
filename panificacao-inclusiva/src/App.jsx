// src/App.jsx
import { lazy, Suspense, useState, useEffect } from 'react';

// Importando os componentes que você acabou de criar
import LandingPage from './components/LandingPage';

// O painel da vendedora só é baixado quando alguém abre #admin — o visitante
// público não paga o peso do AdminPanel nem do admin.css no primeiro load.
const AdminPanel = lazy(() => import('./components/AdminPanel'));

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
    return (
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    );
  }

  return <LandingPage />;
}

export default App;