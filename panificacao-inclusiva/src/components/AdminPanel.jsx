import { useEffect, useState } from 'react';
import { api } from '../api';
import '../styles/admin.css';
import AdminProdutos from './admin/AdminProdutos';
import AdminConteudo from './admin/AdminConteudo';

function AdminConfig({ senhaObrigatoria = false, onSenhaTrocada }) {
  const [form, setForm] = useState({ nome_loja: '', whatsapp: '', nova_senha: '' });
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .get('/api/config')
      .then((c) => setForm({ nome_loja: c.nome_loja, whatsapp: c.whatsapp, nova_senha: '' }))
      .catch((e) => setErro(e.message));
  }, []);

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');
    if (senhaObrigatoria && !form.nova_senha) {
      setErro('Defina uma nova senha para continuar usando o painel.');
      setSalvando(false);
      return;
    }
    try {
      const payload = { nome_loja: form.nome_loja, whatsapp: form.whatsapp };
      if (form.nova_senha) {
        payload.nova_senha = form.nova_senha;
      }
      await api.put('/api/admin/config', payload);
      setMensagem('Configurações salvas com sucesso.');
      setForm((atual) => ({ ...atual, nova_senha: '' }));
      if (form.nova_senha && onSenhaTrocada) {
        onSenhaTrocada();
      }
      setTimeout(() => setMensagem(''), 4000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="admin-card-subtitle">Geral & Segurança</span>
          <h3 className="admin-card-title">Configurações da Loja</h3>
        </div>
      </div>

      {senhaObrigatoria && (
        <div className="admin-alert admin-alert-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>A senha atual é provisória. Defina uma nova senha antes de gerenciar a loja.</span>
        </div>
      )}
      {erro && (
        <div className="admin-alert admin-alert-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{erro}</span>
        </div>
      )}
      {mensagem && (
        <div className="admin-alert admin-alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>{mensagem}</span>
        </div>
      )}

      <form className="admin-form" onSubmit={salvar}>
        <div className="admin-field-group">
          <label className="admin-field-label">
            Nome da Loja
            <span className="admin-field-required">*</span>
          </label>
          <input
            type="text"
            className="admin-input"
            placeholder="Ex: Natural Pani"
            value={form.nome_loja}
            onChange={(e) => setForm((a) => ({ ...a, nome_loja: e.target.value }))}
            required
          />
          <span className="admin-field-hint">Exibido no cabeçalho e nos avisos do site.</span>
        </div>

        <div className="admin-field-group">
          <label className="admin-field-label">
            WhatsApp para Pedidos
            <span className="admin-field-required">*</span>
          </label>
          <input
            type="text"
            className="admin-input"
            placeholder="5522981535778 (DDI + DDD + Número)"
            value={form.whatsapp}
            onChange={(e) => setForm((a) => ({ ...a, whatsapp: e.target.value }))}
            required
          />
          <span className="admin-field-hint">Apenas números com DDI e DDD para links automáticos no WhatsApp.</span>
        </div>

        <div className="admin-field-divider"></div>

        <div className="admin-field-group">
          <label className="admin-field-label">
            Alterar Senha de Acesso Administrativo
          </label>
          <input
            type="password"
            className="admin-input"
            placeholder={senhaObrigatoria ? 'Digite a nova senha' : 'Digite uma nova senha (deixe vazio para manter a atual)'}
            value={form.nova_senha}
            onChange={(e) => setForm((a) => ({ ...a, nova_senha: e.target.value }))}
            required={senhaObrigatoria}
          />
          <span className="admin-field-hint">Defina uma nova senha para entrar no painel administrativo (mínimo 4 caracteres).</span>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={salvando}>
            {salvando ? (
              <>
                <span className="admin-btn-spinner"></span>
                Salvando Alterações...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminPanel() {
  const [carregando, setCarregando] = useState(true);
  const [logado, setLogado] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [entrando, setEntrando] = useState(false);
  const [aba, setAba] = useState('produtos');
  const [totalProdutos, setTotalProdutos] = useState(0);

  useEffect(() => {
    api
      .get('/api/admin/me')
      .then((me) => {
        const precisaTrocar = Boolean(me.must_change_password);
        setLogado(true);
        setMustChangePassword(precisaTrocar);
        if (precisaTrocar) {
          setAba('config');
        } else {
          carregarContadores();
        }
      })
      .catch(() => setLogado(false))
      .finally(() => setCarregando(false));
  }, []);

  const carregarContadores = () => {
    api
      .get('/api/admin/produtos')
      .then((prods) => setTotalProdutos(prods.length))
      .catch(() => {});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErroLogin('');
    setEntrando(true);
    try {
      const sessao = await api.post('/api/admin/login', { usuario, senha });
      const precisaTrocar = Boolean(sessao.must_change_password);
      setLogado(true);
      setMustChangePassword(precisaTrocar);
      if (precisaTrocar) {
        setAba('config');
      } else {
        carregarContadores();
      }
    } catch (err) {
      setErroLogin(err.message || 'Usuário ou senha incorretos.');
    } finally {
      setEntrando(false);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/logout');
    } catch {}
    setLogado(false);
    setMustChangePassword(false);
    setUsuario('');
    setSenha('');
    setAba('produtos');
  };

  if (carregando) {
    return (
      <div className="admin-login-screen">
        <div className="admin-loading-pulse">
          <img src="/brand/stamp_clean_transparent.png" alt="Natural Pani" className="admin-pulse-stamp" />
          <p>Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!logado) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-backdrop"></div>
        <div className="admin-login-modal">
          <div className="admin-login-header">
            <div className="admin-stamp-circle">
              <img src="/brand/stamp_clean_transparent.png" alt="Natural Pani" className="admin-login-stamp-img" />
            </div>
            <div className="admin-login-badge">ACESSO RESTRITO • ATELIÊ</div>
            <h2 className="admin-login-title">Natural Pani</h2>
            <p className="admin-login-subtitle">
              Insira seu usuário e senha para gerenciar produtos, preços e pedidos da loja.
            </p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-login-fields">
              <div className="admin-login-group">
                <label className="admin-login-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>Usuário ou E-mail</span>
                </label>
                <div className="admin-login-input-box">
                  <span className="admin-login-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    type="text"
                    className="admin-login-input"
                    placeholder="Digite seu usuário"
                    value={usuario}
                    onChange={(e) => {
                      setUsuario(e.target.value);
                      setErroLogin('');
                    }}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="admin-login-group">
                <label className="admin-login-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>Senha de Acesso</span>
                </label>
                <div className="admin-login-input-box">
                  <span className="admin-login-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    className={`admin-login-input ${erroLogin ? 'input-error' : ''}`}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      setErroLogin('');
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="admin-login-eye-btn"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                    tabIndex="-1"
                  >
                    {mostrarSenha ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {erroLogin && (
                <div className="admin-login-error-msg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{erroLogin}</span>
                </div>
              )}
            </div>

            <button type="submit" className="admin-btn-login" disabled={entrando || !usuario || !senha}>
              {entrando ? (
                <>
                  <span className="admin-btn-spinner"></span>
                  Autenticando...
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                  Entrar no Painel
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <p className="admin-login-restricted">Acesso restrito à vendedora do ateliê.</p>
            <a href="#" className="admin-back-store-link">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Voltar à Loja
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* HEADER ELEGANTE DO ATELIÊ */}
      <header className="admin-header">
        <div className="admin-header-left">
          <a href="#" className="admin-header-brand" title="Voltar à página inicial">
            <img
              src="/brand/logo_light_transparent.png"
              alt="Natural Pani"
              className="admin-header-logo"
            />
          </a>
          <span className="admin-header-divider"></span>
          <span className="admin-header-tag">Ateliê & Gestão</span>
        </div>

        <div className="admin-header-right">
          <a href="#" className="admin-preview-btn" title="Visualizar loja ao vivo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Ver Loja
          </a>
          <button type="button" onClick={handleLogout} className="admin-logout-btn" title="Encerrar sessão">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      </header>

      {/* BARRA DE NAVEGAÇÃO POR ABAS COM DESIGN DE ATELIÊ */}
      <div className="admin-nav-bar">
        <div className="admin-nav-container">
          <nav className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${aba === 'produtos' ? 'active' : ''}`}
              onClick={() => !mustChangePassword && setAba('produtos')}
              disabled={mustChangePassword}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
              <span>Cardápio de Pães</span>
              {totalProdutos > 0 && <span className="admin-tab-count">{totalProdutos}</span>}
            </button>

            <button
              type="button"
              className={`admin-tab ${aba === 'conteudo' ? 'active' : ''}`}
              onClick={() => !mustChangePassword && setAba('conteudo')}
              disabled={mustChangePassword}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Conteúdo do Site</span>
            </button>

            <button
              type="button"
              className={`admin-tab ${aba === 'config' ? 'active' : ''}`}
              onClick={() => setAba('config')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Configurações</span>
            </button>
          </nav>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO CONTEÚDO */}
      <main className="admin-content">
        {aba === 'produtos' && !mustChangePassword && <AdminProdutos onAtualizarContador={carregarContadores} />}
        {aba === 'conteudo' && !mustChangePassword && <AdminConteudo />}
        {aba === 'config' && (
          <AdminConfig
            senhaObrigatoria={mustChangePassword}
            onSenhaTrocada={() => {
              setMustChangePassword(false);
              carregarContadores();
            }}
          />
        )}
      </main>
    </div>
  );
}

export default AdminPanel;

