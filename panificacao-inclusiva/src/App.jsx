import { useState, useEffect } from 'react';
import './App.css'

function LandingPage() {
  // Número de WhatsApp da padaria (coloque o número real depois)
  const whatsappNumber = "5511999999999"; 
  const mensagem = "Olá! Gostaria de fazer uma encomenda de pães artesanais.";
  const linkWhatsapp = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`;

  return (
    <div className="landing-page">
      {/* CABEÇALHO */}
      <header className="header">
        <h1>🍞 Pão & Vida Inclusiva</h1>
        <p>Padaria Artesanal</p>
      </header>

      {/* SEÇÃO PRINCIPAL (HERO) */}
      <section className="hero">
        <h2>Sabor que acolhe, ingredientes que cuidam.</h2>
        <p>
          Pães de fermentação natural feitos especialmente para quem possui 
          restrições alimentares (sem glúten e sem lactose). 
          Coma sem medo e com muito prazer!
        </p>
        <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
          Faça sua Encomenda
        </a>
      </section>

      {/* CATÁLOGO DE PRODUTOS */}
      <section className="produtos">
        <h3>Nossos Pães Especiais</h3>
        <div className="cards-container">
          
          <div className="card">
            <div className="icone">🥖</div>
            <h4>Baguete Rústica</h4>
            <p>Sem glúten, crocante por fora e macia por dentro.</p>
            <span className="preco">R$ 18,00</span>
          </div>

          <div className="card">
            <div className="icone">🍞</div>
            <h4>Pão de Forma Tradicional</h4>
            <p>100% livre de lactose e fermentação prolongada.</p>
            <span className="preco">R$ 22,00</span>
          </div>

          <div className="card">
            <div className="icone">🍪</div>
            <h4>Cookies Funcionais</h4>
            <p>Sem açúcar refinado, sem glúten e com gotas de chocolate 70%.</p>
            <span className="preco">R$ 12,00</span>
          </div>

        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="footer">
        <p>© 2026 Pão & Vida Inclusiva.</p>
        {/* Link escondido para a dona da padaria acessar o painel */}
        <a href="#admin" style={{color: '#ccc', textDecoration: 'none', fontSize: '0.8rem'}}>Área da Vendedora</a>
      </footer>
    </div>
  );
}

// ----------------------------------------------------
// 2. TELA DO PAINEL ADMIN (A novidade!)
// ----------------------------------------------------
function AdminPanel() {
  const [logado, setLogado] = useState(false);
  const [pin, setPin] = useState('');

  // Simulação de login para testar o visual
  const handleLogin = (e) => {
    e.preventDefault();
    // SEU AMIGO VAI CONECTAR AQUI: POST /api/admin/login
    if (pin === '1234') {
      setLogado(true);
    } else {
      alert('PIN incorreto!');
    }
  };

  // Se não estiver logado, mostra a tela de digitar o PIN
  if (!logado) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-box">
          <h2>🔒 Acesso Restrito</h2>
          <p>Área exclusiva da vendedora</p>
          <form onSubmit={handleLogin}>
            <input 
              type="password" 
              placeholder="Digite seu PIN" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
            <button type="submit" className="btn-entrar">Entrar</button>
          </form>
          <a href="#" className="voltar-link">← Voltar ao Site</a>
        </div>
      </div>
    );
  }

  // Se estiver logado, mostra o Painel de Controle (CRUD)
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Painel de Controle 🥖</h2>
        <a href="#" onClick={() => setLogado(false)} className="btn-sair">Sair</a>
      </div>
      
      <div className="admin-content">
        <div className="admin-card">
          <h3>Adicionar Novo Produto</h3>
          {/* SEU AMIGO VAI CONECTAR AQUI: POST /api/admin/produtos */}
          <form className="form-produto">
            <input type="text" placeholder="Nome do Produto" />
            <input type="text" placeholder="Preço (Ex: 15.00)" />
            <textarea placeholder="Descrição do pão..."></textarea>
            <div className="checkboxes">
              <label><input type="checkbox" /> Sem Glúten</label>
              <label><input type="checkbox" /> Sem Lactose</label>
            </div>
            <button type="button" className="btn-salvar">Salvar Produto</button>
          </form>
        </div>

        <div className="admin-card">
          <h3>Produtos Cadastrados</h3>
          {/* SEU AMIGO VAI CONECTAR AQUI: GET /api/admin/produtos */}
          <ul className="lista-produtos">
            <li>
              <span><strong>Baguete Rústica</strong> - R$ 18,00</span>
              <div className="acoes">
                <button className="btn-acao editar">Editar</button>
                <button className="btn-acao ocultar">Ocultar</button>
                <button className="btn-acao apagar">Apagar</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. CONTROLE CENTRAL (Roteamento via Hash)
// ----------------------------------------------------
function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const atualizaHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", atualizaHash);
    return () => window.removeEventListener("hashchange", atualizaHash);
  }, []);

  // Se a URL terminar com #admin, mostra o painel. Se não, mostra o site.
  if (hash === '#admin') {
    return <AdminPanel />;
  }

  return <LandingPage />;
}


export default App
