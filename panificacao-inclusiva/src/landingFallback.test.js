import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_CONFIG,
  DEFAULT_CONTEUDO,
  WHATSAPP_FALLBACK,
  configEfetiva,
  conteudoEfetivo,
  cicloFocoDrawer,
  DEFAULT_PRODUTOS,
  produtosEfetivos,
  srcImagem,
  urlWhatsapp,
} from "./landingFallback.js";
import { DEFAULT_CONTEUDO as CONTEUDO_LOCAL } from "./constants/defaultConteudo.js";

describe("conteudoEfetivo", () => {
  it("usa o padrão do site quando a API não responde", () => {
    const resultado = conteudoEfetivo({});
    assert.equal(resultado.hero_titulo, DEFAULT_CONTEUDO.hero_titulo);
    assert.ok(resultado.hero_imagem.startsWith("https://pub-7f81cf4ca4e246129e38af571fcf5533.r2.dev/brand/"));
    assert.notEqual(resultado.hero_imagem, "");
  });

  it("preenche só as chaves vazias da API com o padrão", () => {
    const resultado = conteudoEfetivo({ hero_titulo: "Título da API", hero_imagem: "" });
    assert.equal(resultado.hero_titulo, "Título da API");
    assert.equal(resultado.hero_imagem, DEFAULT_CONTEUDO.hero_imagem);
  });
});

describe("configEfetiva", () => {
  it("mantém nome e WhatsApp padrão se a API falhar", () => {
    const resultado = configEfetiva({ nome_loja: "", whatsapp: "" });
    assert.equal(resultado.nome_loja, DEFAULT_CONFIG.nome_loja);
    assert.equal(resultado.whatsapp, DEFAULT_CONFIG.whatsapp);
  });
});

describe("urlWhatsapp", () => {
  it("usa o número de fallback quando a API não manda WhatsApp", () => {
    assert.equal(
      urlWhatsapp("", "Oi"),
      "https://wa.me/5522981535778?text=Oi",
    );
    assert.equal(
      urlWhatsapp(null, "Oi"),
      "https://wa.me/5522981535778?text=Oi",
    );
    assert.equal(WHATSAPP_FALLBACK, "5522981535778");
  });

  it("nunca monta wa.me sem dígitos no caminho", () => {
    const vazio = urlWhatsapp("", "Oi");
    const nulo = urlWhatsapp(null, "Oi");
    const lixo = urlWhatsapp("abc", "Oi");
    for (const href of [vazio, nulo, lixo]) {
      assert.match(href, /^https:\/\/wa\.me\/\d+\?/);
      assert.notEqual(href.startsWith("https://wa.me/?"), true);
    }
  });

  it("monta o link com o número informado quando ele existe", () => {
    assert.equal(
      urlWhatsapp("5522981535778", "Olá"),
      "https://wa.me/5522981535778?text=Ol%C3%A1",
    );
  });
});

describe("defaultConteudo", () => {
  const chavesVisiveis = [
    "top_aviso",
    "endereco",
    "hero_kicker",
    "hero_titulo",
    "hero_texto",
    "hero_imagem",
    "essencia_tag",
    "essencia_titulo",
    "essencia_texto",
    "essencia_imagem",
    "pilar1_titulo",
    "pilar1_texto",
    "pilar2_titulo",
    "pilar2_texto",
    "pilar3_titulo",
    "pilar3_texto",
    "espaco_selo",
    "espaco_titulo",
    "espaco_texto",
    "espaco_ano",
    "espaco_detalhe",
    "espaco_imagem",
    "galeria1_imagem",
    "galeria1_titulo",
    "galeria2_imagem",
    "galeria2_titulo",
    "galeria2_texto",
    "galeria3_imagem",
    "galeria3_titulo",
    "galeria3_texto",
    "footer_texto",
    "footer_email",
    "copyright",
  ];

  it("espelha as chaves da landing para a página nunca nascer em branco", () => {
    for (const chave of chavesVisiveis) {
      assert.equal(typeof CONTEUDO_LOCAL[chave], "string");
      assert.notEqual(CONTEUDO_LOCAL[chave].trim(), "");
      assert.equal(DEFAULT_CONTEUDO[chave], CONTEUDO_LOCAL[chave]);
    }
  });

  it("mantém as fotos padrão no R2 público da vitrine", () => {
    const base = "https://pub-7f81cf4ca4e246129e38af571fcf5533.r2.dev/brand";
    assert.equal(CONTEUDO_LOCAL.hero_imagem, `${base}/brand_pattern_hero.webp`);
    assert.equal(CONTEUDO_LOCAL.essencia_imagem, `${base}/photo_baker_apron.webp`);
  });
});

describe("produtosEfetivos", () => {
  it("usa o cardápio padrão quando a API não responde", () => {
    const resultado = produtosEfetivos(null);
    assert.equal(resultado.length, DEFAULT_PRODUTOS.length);
    assert.equal(resultado.length, 22);
  });

  it("respeita lista vazia da API quando a chamada teve sucesso", () => {
    assert.deepEqual(produtosEfetivos([]), []);
  });

  it("usa a lista da API quando ela veio preenchida", () => {
    const daApi = [{ id: 99, nome: "Teste", categoria: "X", preco: 1, disponivel: true }];
    assert.deepEqual(produtosEfetivos(daApi), daApi);
  });
});

describe("cicloFocoDrawer", () => {
  it("manda o Tab do último item de volta ao primeiro", () => {
    const primeiro = { focusCalls: 0, focus() { this.focusCalls += 1; } };
    const ultimo = { focusCalls: 0, focus() { this.focusCalls += 1; } };
    const evento = {
      key: "Tab",
      shiftKey: false,
      prevented: false,
      preventDefault() { this.prevented = true; },
    };
    const moveu = cicloFocoDrawer(evento, primeiro, ultimo, ultimo);
    assert.equal(moveu, true);
    assert.equal(evento.prevented, true);
    assert.equal(primeiro.focusCalls, 1);
  });

  it("manda Shift+Tab do primeiro item para o último", () => {
    const primeiro = { focusCalls: 0, focus() { this.focusCalls += 1; } };
    const ultimo = { focusCalls: 0, focus() { this.focusCalls += 1; } };
    const evento = {
      key: "Tab",
      shiftKey: true,
      prevented: false,
      preventDefault() { this.prevented = true; },
    };
    const moveu = cicloFocoDrawer(evento, primeiro, ultimo, primeiro);
    assert.equal(moveu, true);
    assert.equal(ultimo.focusCalls, 1);
  });
});

describe("srcImagem", () => {
  it("devolve vazio quando não há caminho — o JSX não deve renderizar img", () => {
    assert.equal(srcImagem(""), "");
    assert.equal(srcImagem(null), "");
  });

  it("repassa URL absoluta https do R2 sem prefixar a API", () => {
    assert.equal(
      srcImagem("https://cdn.exemplo.test/foto.jpg"),
      "https://cdn.exemplo.test/foto.jpg",
    );
  });

  it("prefixa só uploads locais com a URL da API", () => {
    assert.equal(
      srcImagem("/uploads/foto.jpg", "http://localhost:8123"),
      "http://localhost:8123/uploads/foto.jpg",
    );
  });

  it("troca PNG/JPG locais conhecidos pela URL pública do R2", () => {
    const base = "https://pub-7f81cf4ca4e246129e38af571fcf5533.r2.dev/brand";
    assert.equal(srcImagem("/brand/photo_storefront_awning.png"), `${base}/photo_storefront_awning.webp`);
    assert.equal(srcImagem("/brand/photo_baker_apron.jpg"), `${base}/photo_baker_apron.webp`);
  });
});
