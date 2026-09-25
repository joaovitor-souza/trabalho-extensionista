import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api, resolverImagem } from '../api';
import { DEFAULT_CONTEUDO } from '../constants/defaultConteudo';
import {
  DEFAULT_CONFIG,
  cicloFocoDrawer,
  configEfetiva,
  conteudoEfetivo,
  heroPatternTileUrl,
  isHeroPatternImagem,
  produtosEfetivos,
  urlWhatsapp,
} from '../landingFallback';
import { scrollCatalogCarousel } from '../catalogCarouselScroll';
import '../styles/landing.css';

const NAV_SECTIONS = ["inicio", "essencia", "produtos", "espaco", "contato"];
const MENSAGEM_PEDIDO = "Olá! Gostaria de fazer uma encomenda no cardápio da Natural Pani.";
const LARGURA_DESKTOP_NAV = 640;

function LinkWhatsapp({ numero, mensagem, className, children, title }) {
  const href = urlWhatsapp(numero, mensagem);
  if (!href) {
    return (
      <span className={`${className} is-disabled`.trim()} aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={title}>
      {children}
    </a>
  );
}

function ImagemOuPlaceholder({
  src,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  style,
  ...rest
}) {
  if (!src) {
    return <div className={`img-placeholder ${className || ""}`.trim()} role="img" aria-label={alt} />;
  }
  // Reserva o espaço da imagem a partir das dimensões intrínsecas — sem isso o
  // layout "pula" quando a imagem chega (CLS). O hero sobrescreve este default.
  const aspectRatio = rest.width && rest.height ? `${rest.width} / ${rest.height}` : undefined;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      style={aspectRatio ? { aspectRatio, ...style } : style}
      {...rest}
    />
  );
}

function formatarTelefone(numero) {
  if (!numero) return '';
  const semDDI = numero.startsWith('55') && numero.length > 11 ? numero.slice(2) : numero;
  const ddd = semDDI.slice(0, 2);
  const resto = semDDI.slice(2);
  if (resto.length === 9) return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
  if (resto.length === 8) return `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
  return numero;
}

function hrefTelefone(numero) {
  const digits = String(numero || '').replace(/\D/g, '');
  if (!digits) return undefined;
  const comDDI = digits.startsWith('55') ? digits : `55${digits}`;
  return `tel:+${comDDI}`;
}

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function LandingPage() {
  const [activeSection, setActiveSection] = useState("inicio");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [produtos, setProdutos] = useState([]);
  const [conteudo, setConteudo] = useState(DEFAULT_CONTEUDO);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [menuAberto, setMenuAberto] = useState(false);

  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const linkRefs = useRef({});
  const indicatorRef = useRef(null);
  const sliderRef = useRef(null);

  useEffect(() => {
    const carregar = async () => {
      const resultados = await Promise.allSettled([
        api.get('/api/produtos'),
        api.get('/api/conteudo'),
        api.get('/api/config'),
      ]);
      const [produtosRes, conteudoRes, configRes] = resultados;
      const listaApi = produtosRes.status === 'fulfilled' ? produtosRes.value : null;
      setProdutos(produtosEfetivos(listaApi));
      setConteudo(conteudoEfetivo(conteudoRes.status === 'fulfilled' ? conteudoRes.value : {}));
      setConfig(configEfetiva(configRes.status === 'fulfilled' ? configRes.value : {}));
    };
    carregar();
  }, []);

  useEffect(() => {
    if (!menuAberto) return undefined;
    const drawer = navRef.current;
    const toggle = toggleRef.current;
    const focaveis = [toggle, ...Array.from(drawer?.querySelectorAll('a') || [])].filter(Boolean);
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    drawer?.querySelector('a')?.focus();

    const onKey = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAberto(false);
        toggle?.focus();
        return;
      }
      cicloFocoDrawer(evento, primeiro, ultimo, document.activeElement);
    };
    const overflowAntes = document.body.style.overflow;
    if (window.innerWidth <= LARGURA_DESKTOP_NAV) {
      document.body.style.overflow = 'hidden';
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflowAntes;
      document.removeEventListener('keydown', onKey);
    };
  }, [menuAberto]);

  useEffect(() => {
    const fecharNoDesktop = () => {
      if (window.innerWidth > LARGURA_DESKTOP_NAV) setMenuAberto(false);
    };
    window.addEventListener("resize", fecharNoDesktop);
    return () => window.removeEventListener("resize", fecharNoDesktop);
  }, []);

  const c = (chave) => conteudo[chave] || DEFAULT_CONTEUDO[chave] || '';
  const heroImagemChave = c('hero_imagem');
  const heroImagemResolvida = resolverImagem(heroImagemChave);
  const heroUsaPattern =
    isHeroPatternImagem(heroImagemChave) || isHeroPatternImagem(heroImagemResolvida);
  const heroPatternBg = heroUsaPattern ? heroPatternTileUrl(heroImagemResolvida) : '';
  const whatsappNumber = config.whatsapp;
  const telefoneHref = hrefTelefone(whatsappNumber);
  const fecharMenu = () => setMenuAberto(false);

  // Categorias derivadas dos produtos cadastrados — a dona cria uma categoria
  // nova só digitando o nome dela no cadastro do produto, sem mexer em código.
  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];

  const displayedProducts = selectedFilter === "todos"
    ? produtos
    : produtos.filter((item) => item.categoria === selectedFilter);

  const scrollSlider = (direction) => {
    scrollCatalogCarousel(sliderRef.current, direction);
  };

  useLayoutEffect(() => {
    const moveIndicator = () => {
      const link = linkRefs.current[activeSection];
      const nav = navRef.current;
      const indicator = indicatorRef.current;
      if (!link || !nav || !indicator) return;
      const linkRect = link.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      indicator.style.left = `${linkRect.left - navRect.left}px`;
      indicator.style.width = `${linkRect.width}px`;
    };

    moveIndicator();
    window.addEventListener("resize", moveIndicator);
    return () => window.removeEventListener("resize", moveIndicator);
  }, [activeSection]);

  useEffect(() => {
    const sections = NAV_SECTIONS.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    const handleScroll = () => {
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveSection(NAV_SECTIONS[NAV_SECTIONS.length - 1]);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
    <div className="bakery-container">
      <a href="#conteudo-principal" className="skip-link">Ir para o conteúdo principal</a>
      {/* BARRA SUPERIOR INSTITUCIONAL */}
      <div className="top-banner">
        <div className="top-banner-inner">
          <span className="top-shipping">{c('top_aviso')}</span>
          <div className="top-links">
            {telefoneHref ? (
              <a href={telefoneHref} className="contact-item contact-item--phone">
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                {formatarTelefone(whatsappNumber)}
              </a>
            ) : (
              <span className="contact-item contact-item--phone">
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                {formatarTelefone(whatsappNumber)}
              </span>
            )}
            <span className="contact-item contact-item--address">
              <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {c('endereco')}
            </span>
            <div className="social-icons">
              <LinkWhatsapp numero={whatsappNumber} mensagem={MENSAGEM_PEDIDO} className="whatsapp-top-link" title="Fale conosco no WhatsApp">
                <img src="/whatsapp_logo.png" alt="" className="whatsapp-icon-img" />
                <span className="whatsapp-top-label">WhatsApp</span>
              </LinkWhatsapp>
            </div>
          </div>
        </div>
      </div>

      {/* HEADER PRINCIPAL COM LOGO TRANSPARENTE */}
      <header className="main-header">
        <div className="header-inner">
          <a href="#inicio" className="brand-logo-link">
            <img
              src="/brand/logo_dark_transparent.png"
              alt={config.nome_loja || 'Natural Pani'}
              className="brand-logo-img"
            />
          </a>

          <button
            type="button"
            ref={toggleRef}
            className="nav-toggle"
            aria-expanded={menuAberto}
            aria-controls="menu-principal"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            <span className="nav-toggle-bars" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <nav
            id="menu-principal"
            className={`nav-menu ${menuAberto ? "is-open" : ""}`}
            ref={navRef}
            aria-label="Navegação Principal"
          >
            <a href="#inicio" ref={(el) => (linkRefs.current.inicio = el)} className={activeSection === "inicio" ? "active" : ""} onClick={fecharMenu}>INÍCIO</a>
            <a href="#essencia" ref={(el) => (linkRefs.current.essencia = el)} className={activeSection === "essencia" ? "active" : ""} onClick={fecharMenu}>ESSÊNCIA</a>
            <a href="#produtos" ref={(el) => (linkRefs.current.produtos = el)} className={activeSection === "produtos" ? "active" : ""} onClick={fecharMenu}>PRODUTOS</a>
            <a href="#espaco" ref={(el) => (linkRefs.current.espaco = el)} className={activeSection === "espaco" ? "active" : ""} onClick={fecharMenu}>NOSSO ESPAÇO</a>
            <a href="#contato" ref={(el) => (linkRefs.current.contato = el)} className={activeSection === "contato" ? "active" : ""} onClick={fecharMenu}>CONTATO</a>
            <span className="nav-indicator" ref={indicatorRef} aria-hidden="true" />
          </nav>

          <div className="header-cta">
            <LinkWhatsapp
              numero={whatsappNumber}
              mensagem={MENSAGEM_PEDIDO}
              className="btn-pill-primary header-order-btn"
              title="Pedir agora via WhatsApp"
            >
              <img src="/whatsapp_icon_white.png" alt="" className="btn-whatsapp-icon header-order-icon" />
              <span className="header-order-label">PEDIR AGORA</span>
            </LinkWhatsapp>
          </div>
        </div>
      </header>
      {menuAberto && (
        <button
          type="button"
          className="nav-backdrop"
          tabIndex={-1}
          aria-label="Fechar menu"
          onClick={fecharMenu}
        />
      )}

      <main id="conteudo-principal" tabIndex={-1}>
      {/* HERO SECTION */}
      <section id="inicio" className="hero-editorial">
        <div className="hero-frame">
          <div
            className={`hero-banner-image-wrapper${heroUsaPattern ? ' hero-banner--pattern' : ''}`}
            style={
              heroUsaPattern && heroPatternBg
                ? { '--hero-pattern-url': `url("${heroPatternBg}")` }
                : undefined
            }
          >
            {!heroUsaPattern && (
              <ImagemOuPlaceholder
                src={heroImagemResolvida}
                alt={config.nome_loja || 'Natural Pani'}
                className="hero-banner-bg"
                loading="eager"
                fetchPriority="high"
                width={1600}
                height={900}
              />
            )}
            <div className="hero-center-card">
              <div className="hero-badge-stamp">
                <img
                  src="/brand/stamp_clean_transparent.png"
                  alt="Selo Oficial"
                  className="stamp-mini-img"
                />
              </div>
              <span className="hero-kicker">{c('hero_kicker')}</span>
              <h1 className="hero-headline">{c('hero_titulo')}</h1>
              <p className="hero-text">{c('hero_texto')}</p>
              <LinkWhatsapp numero={whatsappNumber} mensagem={MENSAGEM_PEDIDO} className="btn-pill-primary hero-btn">
                <img src="/whatsapp_icon_white.png" alt="" className="btn-whatsapp-icon" />
                FAZER PEDIDO VIA WHATSAPP
              </LinkWhatsapp>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO ESSÊNCIA */}
      <section id="essencia" className="brand-story-section">
        <div className="brand-story-grid">
          <div className="story-image-col">
            <div className="story-img-container">
              <ImagemOuPlaceholder
                src={resolverImagem(c('essencia_imagem'))}
                alt="Avental da Natural Pani com pães de fermentação natural"
                className="story-main-img"
              />
              <div className="story-stamp-badge">
                <img src="/brand/brand_monogram_dark.png" alt="Monograma" />
              </div>
            </div>
          </div>
          <div className="story-content-col">
            <span className="sub-tag">{c('essencia_tag')}</span>
            <h2 className="story-title">{c('essencia_titulo')}</h2>
            <p className="story-text">{c('essencia_texto')}</p>
            <div className="brand-pillars">
              <div className="pillar-item">
                <span className="pillar-dot" style={{ backgroundColor: 'var(--color-moss)' }}></span>
                <div>
                  <h4>{c('pilar1_titulo')}</h4>
                  <p>{c('pilar1_texto')}</p>
                </div>
              </div>
              <div className="pillar-item">
                <span className="pillar-dot" style={{ backgroundColor: 'var(--color-dark-brown)' }}></span>
                <div>
                  <h4>{c('pilar2_titulo')}</h4>
                  <p>{c('pilar2_texto')}</p>
                </div>
              </div>
              <div className="pillar-item">
                <span className="pillar-dot" style={{ backgroundColor: 'var(--color-medium-brown)' }}></span>
                <div>
                  <h4>{c('pilar3_titulo')}</h4>
                  <p>{c('pilar3_texto')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO PRODUTOS / CATÁLOGO COMPLETO COM SCROLL HORIZONTAL */}
      <section id="produtos" className="why-choose-us catalog-section">
        <div className="section-decor">
          <img 
            src="/brand/logo_dark_transparent.png" 
            alt="Natural Pani - Fermentação Natural" 
            className="section-brand-logo"
          />
        </div>
        <h2 className="section-title">Nosso Cardápio Completo</h2>
        <p className="section-subtitle">
          Explore todas as nossas fornadas artesanais. Deslize para o lado para conhecer cada receita feita com fermentação natural.
        </p>

        <div className="catalog-toolbar">
          <div className="catalog-filter-tabs">
            <button
              type="button"
              className={`filter-btn ${selectedFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('todos')}
            >
              Todos ({produtos.length})
            </button>
            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                className={`filter-btn ${selectedFilter === categoria ? 'active' : ''}`}
                onClick={() => setSelectedFilter(categoria)}
              >
                {categoria} ({produtos.filter((p) => p.categoria === categoria).length})
              </button>
            ))}
          </div>

          <div className="slider-nav-buttons">
            <button type="button" className="slider-arrow-btn" onClick={() => scrollSlider('left')} aria-label="Rolar para a esquerda">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button type="button" className="slider-arrow-btn" onClick={() => scrollSlider('right')} aria-label="Rolar para a direita">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <div className="catalog-carousel-container">
          {displayedProducts.length === 0 ? (
            <div className="catalog-empty" role="status">
              <p>O cardápio está sendo atualizado. Fale conosco pelo WhatsApp para encomendar.</p>
              <LinkWhatsapp numero={whatsappNumber} mensagem={MENSAGEM_PEDIDO} className="btn-pill-primary">
                Pedir pelo WhatsApp
              </LinkWhatsapp>
            </div>
          ) : (
          <div className="catalog-carousel-track" ref={sliderRef}>
            {displayedProducts.map((item) => (
              <div key={item.id} className="catalog-product-card">
                <div className="catalog-img-wrapper">
                  <ImagemOuPlaceholder src={resolverImagem(item.imagem_url)} alt={item.nome} loading="lazy" />
                  {item.badge && <span className="catalog-badge">{item.badge}</span>}
                  {item.peso && <span className="catalog-weight-tag">{item.peso}</span>}
                </div>
                <div className="catalog-body">
                  {item.categoria && <span className="catalog-cat-sub">{item.categoria}</span>}
                  <h3 className="catalog-title">{item.nome}</h3>
                  <p className="catalog-desc">{item.descricao}</p>
                  {item.preco_detalhe && (
                    <span className="catalog-price-sub">{item.preco_detalhe}</span>
                  )}
                  <div className="catalog-footer">
                    <div className="catalog-price-container">
                      {item.preco_detalhe && (
                        <span className="catalog-price-prefix">A partir de</span>
                      )}
                      <span className="catalog-price tabular-nums">{formatarPreco(item.preco)}</span>
                    </div>
                    <LinkWhatsapp
                      numero={whatsappNumber}
                      mensagem={`Olá! Gostaria de pedir o ${item.nome} (${item.preco_detalhe ? 'A partir de ' : ''}${formatarPreco(item.preco)}) do cardápio Natural Pani.`}
                      className="btn-pill-primary catalog-btn"
                    >
                      <img src="/whatsapp_icon_white.png" alt="" className="btn-whatsapp-icon-sm" />
                      PEDIR
                    </LinkWhatsapp>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          {displayedProducts.length > 0 && (
          <div className="scroll-hint-bar">
            <span>← Arraste para os lados para ver mais opções →</span>
          </div>
          )}
        </div>
      </section>

      {/* BANNER VERDE INSTITUCIONAL */}
      <section className="media-kit-banner-section">
        <div className="brand-moss-banner">
          <img
            src="/brand/logo_light_transparent.png"
            alt="Natural Pani - Fermentação Natural"
            className="moss-banner-logo"
          />
        </div>
      </section>

      {/* SEÇÃO NOSSO ESPAÇO */}
      <section id="espaco" className="visit-us-section">
        <div className="visit-us-container">
          <div className="visit-text-col">
            <div className="launch-pill">
              <span className="launch-pulse"></span>
              {c('espaco_selo')}
            </div>
            <h2 className="visit-title">{c('espaco_titulo')}</h2>
            <p className="visit-desc">{c('espaco_texto')}</p>

            <div className="launch-card-box">
              <div className="launch-header-info">
                <strong>Previsão de Inauguração</strong>
                <span className="launch-year">{c('espaco_ano')}</span>
              </div>
              <p className="launch-detail-text">{c('espaco_detalhe')}</p>
              <div className="location-preview">
                <svg className="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>{c('endereco')}</span>
              </div>
            </div>

            <LinkWhatsapp numero={whatsappNumber} mensagem={MENSAGEM_PEDIDO} className="btn-pill-primary visit-btn">
              <img src="/whatsapp_icon_white.png" alt="" className="btn-whatsapp-icon" />
              RECEBER AVISO DE INAUGURAÇÃO
            </LinkWhatsapp>
          </div>

          <div className="visit-media-col">
            <div className="collage-wrapper">
              <ImagemOuPlaceholder
                src={resolverImagem(c('espaco_imagem'))}
                alt="Futura loja Natural Pani"
                className="visit-collage-img"
              />
              <div className="media-overlay-badge">
                <span>Projeto Conceito {c('espaco_ano')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO GALERIA FOTOGRÁFICA */}
      <section className="gallery-section">
        <div className="gallery-grid">
          <div className="gallery-item item-portrait">
            <ImagemOuPlaceholder src={resolverImagem(c('galeria1_imagem'))} alt={c('galeria1_titulo')} />
            <div className="gallery-caption">
              <h4>{c('galeria1_titulo')}</h4>
              <p>{c('endereco')}</p>
            </div>
          </div>

          <div className="gallery-item item-tall">
            <ImagemOuPlaceholder src={resolverImagem(c('galeria2_imagem'))} alt={c('galeria2_titulo')} />
            <div className="gallery-caption">
              <h4>{c('galeria2_titulo')}</h4>
              <p>{c('galeria2_texto')}</p>
            </div>
          </div>

          <div className="gallery-item item-wide">
            <ImagemOuPlaceholder src={resolverImagem(c('galeria3_imagem'))} alt={c('galeria3_titulo')} />
            <div className="gallery-caption">
              <h4>{c('galeria3_titulo')}</h4>
              <p>{c('galeria3_texto')}</p>
            </div>
          </div>
        </div>
      </section>

      </main>
      {/* RODAPÉ */}
      <footer id="contato" className="editorial-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <img
              src="/brand/logo_light_transparent.png"
              alt={config.nome_loja || 'Natural Pani'}
              className="footer-logo-img"
            />
            <p>{c('footer_texto')}</p>
          </div>
          <div className="footer-nav-block">
            <h4>Navegação</h4>
            <a href="#inicio">Início</a>
            <a href="#essencia">Essência</a>
            <a href="#produtos">Produtos</a>
            <a href="#espaco">Nosso Espaço</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="footer-nav-block">
            <h4>Atendimento & Encomendas</h4>
            <LinkWhatsapp numero={whatsappNumber} mensagem={MENSAGEM_PEDIDO} className="footer-whatsapp-link">
              <img src="/whatsapp_icon_white.png" alt="" className="btn-whatsapp-icon-sm" />
              {formatarTelefone(whatsappNumber)}
            </LinkWhatsapp>
            <span>{c('endereco')}</span>
            <a href={`mailto:${c('footer_email')}`}>{c('footer_email')}</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{c('copyright')}</p>
          <a href="#admin" className="admin-discrete-link">Painel da Vendedora</a>
        </div>
      </footer>
    </div>

    <LinkWhatsapp numero={whatsappNumber} mensagem={MENSAGEM_PEDIDO} className="floating-whatsapp-btn" title="Fazer pedido no WhatsApp">
      <img src="/whatsapp_logo.png" alt="" className="floating-whatsapp-img" />
      <span className="floating-whatsapp-tooltip">Peça pelo WhatsApp</span>
    </LinkWhatsapp>
    </>
  );
}

export default LandingPage;
