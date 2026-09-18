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

export default LandingPage;