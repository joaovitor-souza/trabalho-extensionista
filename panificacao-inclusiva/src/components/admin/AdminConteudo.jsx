import { useEffect, useState } from 'react';
import { api, resolverImagem } from '../../api';

const GRUPOS = [
  {
    titulo: 'Topo do Site',
    campos: [
      { chave: 'top_aviso', label: 'Aviso da barra superior', tipo: 'texto' },
      { chave: 'endereco', label: 'Endereço (usado em várias seções da página)', tipo: 'texto' },
    ],
  },
  {
    titulo: 'Início (Hero)',
    campos: [
      { chave: 'hero_kicker', label: 'Frase de destaque pequena', tipo: 'texto' },
      { chave: 'hero_titulo', label: 'Título principal', tipo: 'textarea' },
      { chave: 'hero_texto', label: 'Texto de apoio', tipo: 'textarea' },
      { chave: 'hero_imagem', label: 'Foto de fundo', tipo: 'imagem' },
    ],
  },
  {
    titulo: 'Essência da Marca',
    campos: [
      { chave: 'essencia_tag', label: 'Etiqueta pequena', tipo: 'texto' },
      { chave: 'essencia_titulo', label: 'Título', tipo: 'texto' },
      { chave: 'essencia_texto', label: 'Texto', tipo: 'textarea' },
      { chave: 'essencia_imagem', label: 'Foto', tipo: 'imagem' },
      { chave: 'pilar1_titulo', label: 'Benefício 1 — título', tipo: 'texto' },
      { chave: 'pilar1_texto', label: 'Benefício 1 — texto', tipo: 'textarea' },
      { chave: 'pilar2_titulo', label: 'Benefício 2 — título', tipo: 'texto' },
      { chave: 'pilar2_texto', label: 'Benefício 2 — texto', tipo: 'textarea' },
      { chave: 'pilar3_titulo', label: 'Benefício 3 — título', tipo: 'texto' },
      { chave: 'pilar3_texto', label: 'Benefício 3 — texto', tipo: 'textarea' },
    ],
  },
  {
    titulo: 'Nosso Espaço',
    campos: [
      { chave: 'espaco_selo', label: 'Selo (Ex: EM BREVE • LANÇAMENTO EM 2027)', tipo: 'texto' },
      { chave: 'espaco_titulo', label: 'Título', tipo: 'texto' },
      { chave: 'espaco_texto', label: 'Texto', tipo: 'textarea' },
      { chave: 'espaco_ano', label: 'Ano previsto', tipo: 'texto' },
      { chave: 'espaco_detalhe', label: 'Texto do card de detalhe', tipo: 'textarea' },
      { chave: 'espaco_imagem', label: 'Foto', tipo: 'imagem' },
    ],
  },
  {
    titulo: 'Galeria de Fotos',
    campos: [
      { chave: 'galeria1_imagem', label: 'Foto 1', tipo: 'imagem' },
      { chave: 'galeria1_titulo', label: 'Foto 1 — título', tipo: 'texto', nota: 'A legenda usa o Endereço da seção "Topo do Site".' },
      { chave: 'galeria2_imagem', label: 'Foto 2', tipo: 'imagem' },
      { chave: 'galeria2_titulo', label: 'Foto 2 — título', tipo: 'texto' },
      { chave: 'galeria2_texto', label: 'Foto 2 — legenda', tipo: 'texto' },
      { chave: 'galeria3_imagem', label: 'Foto 3', tipo: 'imagem' },
      { chave: 'galeria3_titulo', label: 'Foto 3 — título', tipo: 'texto' },
      { chave: 'galeria3_texto', label: 'Foto 3 — legenda', tipo: 'texto' },
    ],
  },
  {
    titulo: 'Rodapé',
    campos: [
      { chave: 'footer_texto', label: 'Texto sobre a loja', tipo: 'textarea' },
      { chave: 'footer_email', label: 'E-mail de contato', tipo: 'texto' },
      { chave: 'copyright', label: 'Linha de direitos autorais', tipo: 'texto' },
    ],
  },
];

function AdminConteudo() {
  const [valores, setValores] = useState({});
  const [enviando, setEnviando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/api/conteudo').then(setValores).catch((e) => setErro(e.message));
  }, []);

  const atualizarCampo = (chave, valor) => setValores((atual) => ({ ...atual, [chave]: valor }));

  const enviarImagem = async (chave, arquivo) => {
    setEnviando(chave);
    setErro('');
    try {
      const { url } = await api.upload('/api/admin/upload', arquivo);
      atualizarCampo(chave, url);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(null);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    setMensagem('');
    try {
      const atualizado = await api.put('/api/admin/conteudo', { valores });
      setValores(atualizado);
      setMensagem('Conteúdo salvo — já está no ar.');
      setTimeout(() => setMensagem(''), 4000);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="admin-space-stack">
      {GRUPOS.map((grupo, idx) => (
        <div className="admin-card" key={grupo.titulo}>
          <div className="admin-card-header">
            <div>
              <span className="admin-card-subtitle">Seção {idx + 1}</span>
              <h3 className="admin-card-title">{grupo.titulo}</h3>
            </div>
          </div>

          <div className="admin-form">
            {grupo.campos.map((campo) => (
              <div className="admin-field-group" key={campo.chave}>
                <label className="admin-field-label">
                  {campo.label}
                </label>
                {campo.nota && <span className="admin-field-hint">{campo.nota}</span>}

                {campo.tipo === 'texto' && (
                  <input
                    type="text"
                    className="admin-input"
                    value={valores[campo.chave] || ''}
                    onChange={(e) => atualizarCampo(campo.chave, e.target.value)}
                  />
                )}

                {campo.tipo === 'textarea' && (
                  <textarea
                    className="admin-textarea"
                    rows="3"
                    value={valores[campo.chave] || ''}
                    onChange={(e) => atualizarCampo(campo.chave, e.target.value)}
                  />
                )}

                {campo.tipo === 'imagem' && (
                  <div className="admin-upload-zone">
                    {valores[campo.chave] ? (
                      <div className="admin-upload-preview-box">
                        <img
                          src={resolverImagem(valores[campo.chave])}
                          alt=""
                          className="admin-upload-thumb"
                        />
                        <div className="admin-upload-info">
                          <span className="admin-upload-status">Foto da seção salva</span>
                          <label className="admin-upload-change-btn">
                            {enviando === campo.chave ? 'Enviando...' : 'Trocar foto'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              onChange={(e) => e.target.files[0] && enviarImagem(campo.chave, e.target.files[0])}
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
                            {enviando === campo.chave ? 'Enviando...' : 'Clique para selecionar foto'}
                          </span>
                          <span className="admin-upload-hint">PNG, JPG ou WEBP</span>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={(e) => e.target.files[0] && enviarImagem(campo.chave, e.target.files[0])}
                          hidden
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* BARRA FIXA / FLUTUANTE DE SALVAMENTO */}
      <div className="admin-sticky-save-bar">
        <div className="admin-sticky-save-inner">
          <div className="admin-sticky-status">
            {erro && (
              <span className="admin-sticky-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {erro}
              </span>
            )}
            {mensagem && (
              <span className="admin-sticky-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                {mensagem}
              </span>
            )}
            {!erro && !mensagem && (
              <span className="admin-sticky-info">
                Alterações nos textos e fotos são publicadas instantaneamente no site.
              </span>
            )}
          </div>

          <button
            type="button"
            className="admin-btn-primary admin-btn-sticky"
            onClick={salvar}
            disabled={salvando || Boolean(enviando)}
          >
            {salvando ? (
              <>
                <span className="admin-btn-spinner"></span>
                Publicando Alterações...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Salvar Todo o Conteúdo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminConteudo;

