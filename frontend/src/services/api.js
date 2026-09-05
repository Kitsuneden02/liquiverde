export const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  // En producción detrás del reverse proxy de Nginx o en desarrollo con proxy de Vite
  return '/api';
};

export const API_BASE = getApiBase();

export const API_DOCS_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/docs`
  : (import.meta.env.PROD ? '/docs' : 'http://localhost:8000/docs');


export async function fetchProducts(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.category) query.append('category', params.category);
  if (params.eco_score) query.append('eco_score', params.eco_score);
  if (params.max_price) query.append('max_price', params.max_price);
  if (params.organic) query.append('organic', 'true');
  if (params.fair_trade) query.append('fair_trade', 'true');

  const res = await fetch(`${API_BASE}/products?${query.toString()}`);
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/products/categories`);
  if (!res.ok) throw new Error('Error al cargar categorías');
  return res.json();
}

export async function fetchProductByBarcode(barcode) {
  const res = await fetch(`${API_BASE}/products/barcode/${encodeURIComponent(barcode)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Producto no encontrado');
  }
  return res.json();
}

export async function fetchProductById(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

export async function optimizeKnapsack(payload) {
  const res = await fetch(`${API_BASE}/optimize/knapsack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error en optimización');
  }
  return res.json();
}

export async function fetchSubstitutes(productId) {
  const res = await fetch(`${API_BASE}/substitutes/${productId}`);
  if (!res.ok) throw new Error('Error al buscar sustitutos');
  return res.json();
}

export async function fetchStores() {
  const res = await fetch(`${API_BASE}/stores`);
  if (!res.ok) throw new Error('Error al cargar tiendas');
  return res.json();
}

export async function fetchImpactSummary() {
  const res = await fetch(`${API_BASE}/impact/summary`);
  if (!res.ok) throw new Error('Error al cargar resumen de impacto');
  return res.json();
}
