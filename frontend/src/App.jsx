import React, { useState } from 'react';
import Navbar from './components/Navbar';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import ProductDetailModal from './components/ProductDetailModal';
import CatalogPage from './pages/CatalogPage';
import OptimizerPage from './pages/OptimizerPage';
import ComparatorPage from './pages/ComparatorPage';
import DashboardPage from './pages/DashboardPage';
import StoreMapPage from './pages/StoreMapPage';
import { Leaf, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('catalog');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [basketProductIds, setBasketProductIds] = useState([]);
  const [compareProduct, setCompareProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);

  const handleToggleBasket = (product) => {
    setBasketProductIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      } else {
        return [...prev, product.id];
      }
    });
  };

  const handleSelectForCompare = (product) => {
    setCompareProduct(product);
    setActiveTab('comparator');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
          />
        )}

        {activeTab === 'optimizer' && (
          <OptimizerPage
            basketProductIds={basketProductIds}
            onSelectForCompare={handleSelectForCompare}
            onToggleBasket={handleToggleBasket}
            onOpenDetails={(p) => setDetailProduct(p)}
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

      {/* Barcode Scanner Modal (Accessible globally) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForComparison={handleSelectForCompare}
      />

      {/* Detailed Product Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
          onSelectForCompare={handleSelectForCompare}
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
              href="http://localhost:8000/docs"
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
