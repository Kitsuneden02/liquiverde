import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import ProductDetailModal from './components/ProductDetailModal';
import CartFloatingButton from './components/CartFloatingButton';
import CartDrawer from './components/CartDrawer';
import CatalogPage from './pages/CatalogPage';
import OptimizerPage from './pages/OptimizerPage';
import ComparatorPage from './pages/ComparatorPage';
import DashboardPage from './pages/DashboardPage';
import StoreMapPage from './pages/StoreMapPage';
import { Leaf, ExternalLink } from 'lucide-react';
import { API_DOCS_URL, fetchProducts } from './services/api';

const VALID_TABS = ['catalog', 'optimizer', 'comparator', 'dashboard', 'map', 'stores'];

function getTabFromHash() {
  if (typeof window === 'undefined') return 'catalog';
  const raw = window.location.hash.replace('#', '').toLowerCase();
  if (raw === 'stores') return 'map';
  return VALID_TABS.includes(raw) ? raw : 'catalog';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [compareProduct, setCompareProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [optimizerConfig, setOptimizerConfig] = useState(null);
  const [scannedProductDiff, setScannedProductDiff] = useState(null);

  const handleTabChange = useCallback((tab) => {
    const target = tab === 'stores' ? 'map' : tab;
    setActiveTab(target);
    if (window.location.hash !== `#${target}`) {
      window.location.hash = target;
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) {
      window.location.hash = 'catalog';
    }
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Cart State with LocalStorage persistence
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('liquiverde_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const merged = [];
      for (const item of parsed) {
        if (!item || !item.product) continue;
        const existing = merged.find((m) => m.product.id === item.product.id);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
        } else {
          merged.push({ ...item, quantity: item.quantity || 1 });
        }
      }
      return merged;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('liquiverde_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Derived metrics & backwards-compatible basket IDs
  const basketProductIds = useMemo(() => cartItems.map((item) => item.product.id), [cartItems]);
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleAddToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const index = prev.findIndex((item) => item.product.id === product.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        return next;
      } else {
        return [...prev, { product, quantity }];
      }
    });
  };

  const handleToggleBasket = (product) => {
    setCartItems((prev) => {
      const exists = prev.some((item) => item.product.id === product.id);
      if (exists) {
        return prev.filter((item) => item.product.id !== product.id);
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSelectForCompare = (product) => {
    setCompareProduct(product);
    handleTabChange('comparator');
  };

  const handleGoToOptimizerFromCart = (items, totalAmount) => {
    // Determine suggested budget: round up to nearest 1000 and clamp to slider range [3000, 50000]
    const rounded = Math.ceil(totalAmount / 1000) * 1000;
    const suggestedBudget = Math.min(50000, Math.max(3000, rounded));
    setOptimizerConfig({
      onlyUseBasket: true,
      budget: suggestedBudget,
      trigger: Date.now()
    });
    handleTabChange('optimizer');
    setIsCartOpen(false);
  };

  const handleAdoptSubstitutions = (subs) => {
    if (!subs || subs.length === 0) return;
    setCartItems((prev) => {
      let next = [...prev];
      for (const sub of subs) {
        const origId = sub.original_product.id;
        const altProd = sub.recommended_product;
        const index = next.findIndex((item) => item.product.id === origId);
        if (index >= 0) {
          const qty = next[index].quantity;
          const existingAltIndex = next.findIndex((item, i) => i !== index && item.product.id === altProd.id);
          if (existingAltIndex >= 0) {
            next[existingAltIndex] = {
              ...next[existingAltIndex],
              quantity: next[existingAltIndex].quantity + qty
            };
            next.splice(index, 1);
          } else {
            next[index] = { ...next[index], product: altProd };
          }
        }
      }
      return next;
    });
  };

  const handleLoadPresetBasket = useCallback(async (productIds, suggestedBudget) => {
    try {
      const all = await fetchProducts();
      const selected = all.filter((p) => productIds.includes(p.id));
      const orderedItems = productIds
        .map((id) => selected.find((p) => p.id === id))
        .filter(Boolean)
        .map((product) => ({ product, quantity: 1 }));

      setCartItems(orderedItems);
      setOptimizerConfig({
        onlyUseBasket: true,
        budget: suggestedBudget,
        trigger: Date.now()
      });
    } catch (e) {
      console.error('Error loading preset basket', e);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'catalog' && (
          <CatalogPage
            onSelectForCompare={handleSelectForCompare}
            onToggleBasket={handleToggleBasket}
            basketProductIds={basketProductIds}
            onOpenDetails={(p) => setDetailProduct(p)}
            scannedProductDiff={scannedProductDiff}
            onLoadPresetBasket={handleLoadPresetBasket}
            onGoToOptimizer={() => handleTabChange('optimizer')}
          />
        )}

        {activeTab === 'optimizer' && (
          <OptimizerPage
            basketProductIds={basketProductIds}
            cartItems={cartItems}
            onSelectForCompare={handleSelectForCompare}
            onToggleBasket={handleToggleBasket}
            onOpenDetails={(p) => setDetailProduct(p)}
            optimizerConfig={optimizerConfig}
            onAdoptSubstitutions={handleAdoptSubstitutions}
            onLoadPresetBasket={handleLoadPresetBasket}
          />
        )}

        {activeTab === 'comparator' && (
          <ComparatorPage
            initialProduct={compareProduct}
            onToggleBasket={handleToggleBasket}
            basketProductIds={basketProductIds}
            onOpenDetails={(p) => setDetailProduct(p)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage />
        )}

        {activeTab === 'map' && (
          <StoreMapPage />
        )}
      </main>

      {/* Floating Action Button for Cart */}
      <CartFloatingButton
        onToggle={() => setIsCartOpen((prev) => !prev)}
        itemCount={totalCartCount}
        totalAmount={totalCartAmount}
      />

      {/* Cart Drawer / Slide-over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onSelectForCompare={handleSelectForCompare}
        onGoToOptimizer={handleGoToOptimizerFromCart}
        onGoToCatalog={() => handleTabChange('catalog')}
      />

      {/* Barcode Scanner Modal (Accessible globally) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForComparison={handleSelectForCompare}
        onAddToCart={handleAddToCart}
        isInBasket={(productId) => basketProductIds.includes(productId)}
        onProductScanned={(product) => setScannedProductDiff(product)}
      />

      {/* Detailed Product Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onSelectForCompare={handleSelectForCompare}
          onAddToCart={handleAddToCart}
          isInBasket={basketProductIds.includes(detailProduct.id)}
        />
      )}

      {/* Footer */}
      <footer style={{
        background: '#040d0a',
        borderTop: '1px solid var(--border-light)',
        padding: '2.5rem 1.5rem',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Leaf size={18} color="var(--primary-light)" />
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>LiquiVerde</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Desafío Técnico Software Engineer I • Grupo Lagos • Retail Inteligente y Sostenible
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-sub)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Swagger API Docs</span>

              <ExternalLink size={13} />
            </a>
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-sub)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>Open Food Facts</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
