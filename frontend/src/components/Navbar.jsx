import React, { useState, useEffect, useRef } from 'react';
import {
  Leaf,
  ShoppingBag,
  Sliders,
  RefreshCw,
  BarChart3,
  MapPin,
  ScanBarcode,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenScanner }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const navItems = [
    { id: 'catalog', label: 'Catálogo', shortLabel: 'Catálogo', icon: ShoppingBag },
    { id: 'optimizer', label: 'Optimizar Canasta', shortLabel: 'Optimizar', icon: Sliders },
    { id: 'comparator', label: 'Comparador Sustitutos', shortLabel: 'Comparador', icon: RefreshCw },
    { id: 'dashboard', label: 'Impacto Ambiental', shortLabel: 'Impacto', icon: BarChart3 },
    { id: 'map', label: 'Tiendas y Rutas', shortLabel: 'Tiendas', icon: MapPin },
  ];

  // Close mobile drawer when selecting an item
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Close mobile menu if resized to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 880) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header
      style={{
        background: 'rgba(7, 19, 15, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
          position: 'relative'
        }}
      >
        {/* Logo */}
        <div
          onClick={() => setActiveTab('catalog')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Leaf size={21} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.03em',
                lineHeight: 1.1
              }}
            >
              Liqui<span style={{ color: 'var(--primary-light)' }}>Verde</span>
            </div>
            <div
              className="logo-subtext"
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              Retail Inteligente
            </div>
          </div>
        </div>

        {/* Desktop & Tablet Navigation Tabs (Adapts between full and short labels) */}
        <div className="nav-desktop-container">
          <nav className="nav-tabs-wrapper">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span className="nav-label-full">{item.label}</span>
                  <span className="nav-label-short">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Scan Action Button */}
          <button
            onClick={onOpenScanner}
            className="btn-primary nav-scan-btn"
          >
            <ScanBarcode size={18} />
            <span className="nav-label-full">Escanear EAN-13</span>
            <span className="nav-label-short">Escanear</span>
          </button>
        </div>

        {/* Mobile Action Controls (< 880px) */}
        <div className="nav-mobile-toggle">
          <button
            onClick={onOpenScanner}
            className="btn-primary"
            style={{
              height: '38px',
              padding: '0 0.85rem',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ScanBarcode size={17} />
            <span>Escanear</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-secondary"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)'
            }}
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          style={{
            background: 'rgba(7, 19, 15, 0.98)',
            borderBottom: '1px solid var(--border-light)',
            backdropFilter: 'blur(20px)',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  style={{
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: isActive ? 'var(--primary-light)' : 'var(--text-sub)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                    boxShadow: isActive
                      ? 'inset 0 0 0 1px rgba(52, 211, 153, 0.4)'
                      : 'none'
                  }}
                >
                  <Icon
                    size={19}
                    color={isActive ? 'var(--primary-light)' : 'var(--text-muted)'}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenScanner();
              }}
              className="btn-primary"
              style={{
                height: '46px',
                marginTop: '0.6rem',
                justifyContent: 'center',
                fontSize: '0.95rem'
              }}
            >
              <ScanBarcode size={19} />
              <span>Escanear Código EAN-13</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
