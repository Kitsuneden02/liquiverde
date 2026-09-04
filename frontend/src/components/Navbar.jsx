import React from 'react';
import { Leaf, ShoppingBag, Sliders, RefreshCw, BarChart3, MapPin, ScanBarcode } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenScanner }) {
  const navItems = [
    { id: 'catalog', label: 'Catálogo', icon: ShoppingBag },
    { id: 'optimizer', label: 'Optimizador Mochila', icon: Sliders },
    { id: 'comparator', label: 'Comparador Sustitutos', icon: RefreshCw },
    { id: 'dashboard', label: 'Impacto Ambiental', icon: BarChart3 },
    { id: 'map', label: 'Tiendas & Rutas', icon: MapPin },
  ];

  return (
    <header style={{
      background: 'rgba(7, 19, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('catalog')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
          }}>
            <Leaf size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Liqui<span style={{ color: 'var(--primary-light)' }}>Verde</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Retail Inteligente
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-sub)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(52, 211, 153, 0.3)' : 'none'
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scan Barcode Quick Action */}
        <button
          onClick={onOpenScanner}
          className="btn-primary"
          style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
        >
          <ScanBarcode size={18} />
          <span>Escanear EAN-13</span>
        </button>
      </div>
    </header>
  );
}
