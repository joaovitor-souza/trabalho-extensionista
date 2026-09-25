import { srcImagem } from "./landingFallback.js";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8123";

async function request(path, options = {}) {
  const ehFormData = options.body instanceof FormData;
  // Content-Type só quando há corpo: mandar "application/json" num GET sem body
  // dispara preflight CORS (OPTIONS) à toa, custando um round-trip por chamada.
  const headers =
    ehFormData || options.body == null
      ? options.headers
      : { "Content-Type": "application/json", ...options.headers };
  const resposta = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || `Erro ${resposta.status}`);
  }
  if (resposta.status === 204) return null;
  return resposta.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
  upload: (path, arquivo) => {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    return request(path, { method: "POST", body: formData });
  },
};

// Imagens enviadas pelo painel: /uploads no backend (dev) ou URL https do R2.
export function resolverImagem(caminho) {
  return srcImagem(caminho, API_URL);
}
