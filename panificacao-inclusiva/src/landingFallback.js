import { DEFAULT_CONTEUDO, R2_BRAND_BASE } from "./constants/defaultConteudo.js";
import { DEFAULT_PRODUTOS } from "./constants/defaultProdutos.js";

export { DEFAULT_CONTEUDO, DEFAULT_PRODUTOS, R2_BRAND_BASE };

export const WHATSAPP_FALLBACK = "5522981535778";

export const DEFAULT_CONFIG = {
  nome_loja: "Natural Pani",
  whatsapp: WHATSAPP_FALLBACK,
};

export const conteudoEfetivo = (parcial) => {
  const origem = parcial && typeof parcial === "object" ? parcial : {};
  const resultado = { ...DEFAULT_CONTEUDO };
  for (const [chave, valor] of Object.entries(origem)) {
    if (typeof valor === "string" && valor.trim() !== "") {
      resultado[chave] = valor;
    }
  }
  return resultado;
};

export const configEfetiva = (parcial) => {
  const origem = parcial && typeof parcial === "object" ? parcial : {};
  return {
    nome_loja: origem.nome_loja?.trim() || DEFAULT_CONFIG.nome_loja,
    whatsapp: origem.whatsapp?.trim() || DEFAULT_CONFIG.whatsapp,
  };
};

/** Usa o cardápio padrão só quando a chamada à API falhou (rejected), não quando retorna []. */
export const produtosEfetivos = (listaApi) => (
  Array.isArray(listaApi) ? listaApi : DEFAULT_PRODUTOS
);

const soDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

export const numeroWhatsappEfetivo = (numero) => soDigitos(numero) || WHATSAPP_FALLBACK;

export const urlWhatsapp = (numero, texto) => {
  const efetivo = numeroWhatsappEfetivo(numero);
  return `https://wa.me/${efetivo}?text=${encodeURIComponent(texto ?? "")}`;
};

export const cicloFocoDrawer = (evento, primeiro, ultimo, ativo) => {
  if (evento.key !== "Tab" || !primeiro || !ultimo) return false;
  if (evento.shiftKey && ativo === primeiro) {
    evento.preventDefault();
    ultimo.focus();
    return true;
  }
  if (!evento.shiftKey && ativo === ultimo) {
    evento.preventDefault();
    primeiro.focus();
    return true;
  }
  return false;
};

const LOCAL_PARA_R2 = {
  "/brand/photo_storefront_awning.png": `${R2_BRAND_BASE}/photo_storefront_awning.webp`,
  "/brand/photo_storefront_awning.jpg": `${R2_BRAND_BASE}/photo_storefront_awning.webp`,
  "/brand/photo_storefront_awning.webp": `${R2_BRAND_BASE}/photo_storefront_awning.webp`,
  "/brand/photo_store_window.png": `${R2_BRAND_BASE}/photo_store_window.webp`,
  "/brand/photo_store_window.jpg": `${R2_BRAND_BASE}/photo_store_window.webp`,
  "/brand/photo_store_window.webp": `${R2_BRAND_BASE}/photo_store_window.webp`,
  "/brand/photo_circular_sign.png": `${R2_BRAND_BASE}/photo_circular_sign.webp`,
  "/brand/photo_circular_sign.jpg": `${R2_BRAND_BASE}/photo_circular_sign.webp`,
  "/brand/photo_circular_sign.webp": `${R2_BRAND_BASE}/photo_circular_sign.webp`,
  "/brand/photo_packaging_bread.png": `${R2_BRAND_BASE}/photo_packaging_bread.webp`,
  "/brand/photo_packaging_bread.jpg": `${R2_BRAND_BASE}/photo_packaging_bread.webp`,
  "/brand/photo_packaging_bread.webp": `${R2_BRAND_BASE}/photo_packaging_bread.webp`,
  "/brand/photo_baker_apron.png": `${R2_BRAND_BASE}/photo_baker_apron.webp`,
  "/brand/photo_baker_apron.jpg": `${R2_BRAND_BASE}/photo_baker_apron.webp`,
  "/brand/photo_baker_apron.webp": `${R2_BRAND_BASE}/photo_baker_apron.webp`,
  "/brand/photo_hero_store.png": `${R2_BRAND_BASE}/photo_hero_store.webp`,
  "/brand/photo_hero_store.jpg": `${R2_BRAND_BASE}/photo_hero_store.webp`,
  "/brand/photo_hero_store.webp": `${R2_BRAND_BASE}/photo_hero_store.webp`,
  "/brand/brand_pattern_hero.webp": `${R2_BRAND_BASE}/brand_pattern_hero.webp`,
  "/brand/brand_pattern_hero_tile.webp": `${R2_BRAND_BASE}/brand_pattern_hero_tile.webp`,
};

export const isHeroPatternImagem = (caminho) => /brand_pattern/i.test(String(caminho ?? ""));

/** Tile unit (170×174) for seamless CSS repeat when hero uses brand_pattern_hero. */
export const heroPatternTileUrl = (resolvedUrl) => {
  if (!resolvedUrl || !isHeroPatternImagem(resolvedUrl)) return resolvedUrl;
  if (/brand_pattern_hero_tile/.test(resolvedUrl)) return resolvedUrl;
  return resolvedUrl.replace(/brand_pattern_hero(?=\.\w+$)/, "brand_pattern_hero_tile");
};

export const srcImagem = (caminho, apiUrl = "") => {
  if (!caminho) return "";
  const local = LOCAL_PARA_R2[caminho] || caminho;
  if (local.startsWith("http://") || local.startsWith("https://")) return local;
  if (local.startsWith("/uploads/") && apiUrl) return `${apiUrl}${local}`;
  return local;
};
