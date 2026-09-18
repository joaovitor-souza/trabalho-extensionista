// src/components/AdminPanel.jsx
import { useState } from 'react';

function AdminPanel() {
  const [logado, setLogado] = useState(false);
  const [pin, setPin] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // SEU AMIGO VAI CONECTAR AQUI: POST /api/admin/login
    if (pin === '1234') {
      setLogado(true);
    } else {
      alert('PIN incorreto!');
    }
  };

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

export default AdminPanel;