import { useEffect, useState } from 'react';
import { api, resolverImagem } from '../../api';

const PRODUTO_VAZIO = {
  nome: '',
  categoria: '',
  badge: '',
  peso: '',
  descricao: '',
  preco: '',
  preco_detalhe: '',
  imagem_url: '',
};

const CATEGORIAS_SUGERIDAS = ['Pão Salgado', 'Pão Doce', 'Focaccia', 'Baguete'];
const SELOS_SUGERIDOS = ['Fermentação Natural', 'Lactose Free', 'Linha Gourmet', 'Especial', 'Doce Artesanal'];

function AdminProdutos({ onAtualizarContador }) {
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState(PRODUTO_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarProdutos = () => {
    api
      .get('/api/admin/produtos')
      .then((prods) => {
        setProdutos(prods);
        if (onAtualizarContador) onAtualizarContador();
      })
      .catch((e) => setErro(e.message));
  };

  useEffect(carregarProdutos, []);

  const atualizarCampo = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const enviarImagem = async (arquivo) => {
    setEnviandoImagem(true);
    setErro('');
    try {
      const { url } = await api.upload('/api/admin/upload', arquivo);
      atualizarCampo('imagem_url', url);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviandoImagem(false);
    }
  };

  const editarProduto = (produto) => {
    setEditandoId(produto.id);
    setForm({ ...produto, preco: String(produto.preco) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setForm(PRODUTO_VAZIO);
  };

  const salvarProduto = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    const payload = { ...form, preco: Number(form.preco) };
    try {
      if (editandoId) {
        await api.put(`/api/admin/produtos/${editandoId}`, payload);
      } else {
        await api.post('/api/admin/produtos', payload);
      }
      cancelarEdicao();
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarDisponibilidade = async (produto) => {
    try {
      await api.patch(`/api/admin/produtos/${produto.id}/disponibilidade`, {
        disponivel: !produto.disponivel,
      });
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    }
  };

  const excluirProduto = async (produto) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${produto.nome}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/api/admin/produtos/${produto.id}`);
      carregarProdutos();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div className="admin-space-stack">
      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
      <div className={`admin-card ${editandoId ? 'admin-card-editing' : ''}`}>
        <div className="admin-card-header">
          <div>
            <span className="admin-card-subtitle">
              {editandoId ? 'Atualização de Item' : 'Novo Item do Cardápio'}
            </span>
            <h3 className="admin-card-title">
              {editandoId ? `Editar: ${form.nome || 'Produto'}` : 'Cadastrar Fornada / Pão'}
            </h3>
          </div>
          {editandoId && (
            <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={cancelarEdicao}>
              Cancelar Edição
            </button>
          )}
        </div>

        {erro && (
          <div className="admin-alert admin-alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{erro}</span>
          </div>
        )}

        <form className="admin-form" onSubmit={salvarProduto}>
          {/* NOME DO PRODUTO */}
          <div className="admin-field-group">
            <label className="admin-field-label">
              Nome do Produto
              <span className="admin-field-required">*</span>
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="Ex: Brioche Artesanal, Pão de Gorgonzola e Mel"
              value={form.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
              required
            />
          </div>

          {/* GRID: CATEGORIA, SELO E PESO */}
          <div className="admin-form-grid-3">
            <div className="admin-field-group">
              <label className="admin-field-label">Categoria</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: Pão Salgado"
                value={form.categoria}
                onChange={(e) => atualizarCampo('categoria', e.target.value)}
              />
              <div className="admin-quick-tags">
                {CATEGORIAS_SUGERIDAS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`admin-tag-btn ${form.categoria === cat ? 'active' : ''}`}
                    onClick={() => atualizarCampo('categoria', cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Selo em Destaque</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: Lactose Free"
                value={form.badge}
                onChange={(e) => atualizarCampo('badge', e.target.value)}
              />
              <div className="admin-quick-tags">
                {SELOS_SUGERIDOS.slice(0, 3).map((selo) => (
                  <button
                    key={selo}
                    type="button"
                    className={`admin-tag-btn ${form.badge === selo ? 'active' : ''}`}
                    onClick={() => atualizarCampo('badge', selo)}
                  >
                    {selo}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Peso / Porção</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: 500g, Unidade"
                value={form.peso}
                onChange={(e) => atualizarCampo('peso', e.target.value)}
              />
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="admin-field-group">
            <label className="admin-field-label">Descrição e Ingredientes</label>
            <textarea
              className="admin-textarea"
              placeholder="Descreva a fermentação prolongada, textura, aromas ou notas especiais deste pão..."
              value={form.descricao}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
            />
          </div>

          {/* PREÇO E DETALHE */}
          <div className="admin-form-grid-2">
            <div className="admin-field-group">
              <label className="admin-field-label">
                Preço Base (R$)
                <span className="admin-field-required">*</span>
              </label>
              <div className="admin-input-prefix-wrapper">
                <span className="admin-input-prefix">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="admin-input admin-input-has-prefix"
                  placeholder="22.00"
                  value={form.preco}
                  onChange={(e) => atualizarCampo('preco', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="admin-field-group">
              <label className="admin-field-label">Detalhe de Preço (Opcional)</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: R$ 22 (Comum) / R$ 25 (Multi grãos)"
                value={form.preco_detalhe}
                onChange={(e) => atualizarCampo('preco_detalhe', e.target.value)}
              />
              <span className="admin-field-hint">Ativa o rótulo "A partir de" automaticamente.</span>
            </div>
          </div>

          {/* UPLOAD DE IMAGEM */}
          <div className="admin-field-group">
            <label className="admin-field-label">Fotografia do Produto</label>
            <div className="admin-upload-zone">
              {form.imagem_url ? (
                <div className="admin-upload-preview-box">
                  <img src={resolverImagem(form.imagem_url)} alt="Prévia" className="admin-upload-thumb" />
                  <div className="admin-upload-info">
                    <span className="admin-upload-status">Foto selecionada</span>
                    <label className="admin-upload-change-btn">
                      {enviandoImagem ? 'Enviando foto...' : 'Substituir imagem'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => e.target.files[0] && enviarImagem(e.target.files[0])}
                        hidden
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="admin-upload-empty-box">
                  <div className="admin-upload-icon-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div>
                    <span className="admin-upload-cta">
                      {enviandoImagem ? 'Carregando foto...' : 'Clique para escolher a foto do pão'}
                    </span>
                    <span className="admin-upload-hint">PNG, JPG ou WEBP (recomendado proporção quadrada)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) => e.target.files[0] && enviarImagem(e.target.files[0])}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>

          {/* BOTÕES DE SUBMIT */}
          <div className="admin-form-actions">
            {editandoId && (
              <button type="button" className="admin-btn-secondary" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
            <button type="submit" className="admin-btn-primary" disabled={salvando || enviandoImagem}>
              {salvando ? (
                <>
                  <span className="admin-btn-spinner"></span>
                  Salvando no Cardápio...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                  {editandoId ? 'Atualizar Produto' : 'Adicionar ao Cardápio'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE PRODUTOS CADASTRADOS */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-card-subtitle">Estoque & Disponibilidade</span>
            <h3 className="admin-card-title">Produtos Cadastrados ({produtos.length})</h3>
          </div>
        </div>

        {produtos.length === 0 ? (
          <div className="admin-empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
            <p>Nenhum produto cadastrado ainda.</p>
            <span>Preencha o formulário acima para adicionar sua primeira fornada.</span>
          </div>
        ) : (
          <div className="admin-product-table">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className={`admin-product-row ${!produto.disponivel ? 'is-disabled' : ''}`}
              >
                <div className="admin-product-cell-media">
                  {produto.imagem_url ? (
                    <img
                      src={resolverImagem(produto.imagem_url)}
                      alt={produto.nome}
                      className="admin-product-row-thumb"
                    />
                  ) : (
                    <div className="admin-product-thumb-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/></svg>
                    </div>
                  )}
                </div>

                <div className="admin-product-cell-main">
                  <div className="admin-product-row-title-bar">
                    <h4 className="admin-product-row-name">{produto.nome}</h4>
                    {produto.badge && (
                      <span className="admin-pill-badge">{produto.badge}</span>
                    )}
                    {produto.disponivel ? (
                      <span className="admin-status-pill is-active">Ativo no site</span>
                    ) : (
                      <span className="admin-status-pill is-hidden">Oculto</span>
                    )}
                  </div>
                  <div className="admin-product-row-meta">
                    {produto.categoria && <span>{produto.categoria}</span>}
                    {produto.peso && <span>• {produto.peso}</span>}
                    <span className="admin-product-row-price">
                      • R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </span>
                    {produto.preco_detalhe && (
                      <span className="admin-product-row-price-detail">({produto.preco_detalhe})</span>
                    )}
                  </div>
                </div>

                <div className="admin-product-cell-actions">
                  <button
                    type="button"
                    className="admin-action-btn edit"
                    onClick={() => editarProduto(produto)}
                    title="Editar informações"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    className={`admin-action-btn toggle ${produto.disponivel ? 'is-visible' : 'is-muted'}`}
                    onClick={() => alternarDisponibilidade(produto)}
                    title={produto.disponivel ? 'Ocultar do site' : 'Exibir no site'}
                  >
                    {produto.disponivel ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span>Ativar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="admin-action-btn delete"
                    onClick={() => excluirProduto(produto)}
                    title="Excluir produto"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProdutos;

