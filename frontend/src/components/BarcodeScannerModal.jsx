import React, { useState } from 'react';
import { X, ScanBarcode, Camera, Search, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { fetchProductByBarcode } from '../services/api';
import { formatCategoryName } from '../utils/formatters';

const DEMO_BARCODES = [
  { label: '🥛 Leche Plástica (Tradicional)', code: '7802100001011' },
  { label: '🥩 Carne Vacuno (Alta Huella)', code: '7801610002012' },
  { label: '🧴 Detergente Convencional', code: '7804500004014' },
  { label: '🍫 Nutella (Open Food Facts)', code: '3017620422003' },
  { label: '🌱 Lentejas a Granel (Eco)', code: '7801610002029' },
];

export default function BarcodeScannerModal({ isOpen, onClose, onSelectProductForComparison }) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLookup = async (code) => {
    const codeToSearch = code || barcodeInput;
    if (!codeToSearch.trim()) return;

    setLoading(true);
    setError(null);
    setScannedProduct(null);

    try {
      const product = await fetchProductByBarcode(codeToSearch.trim());
      setScannedProduct(product);
    } catch (err) {
      setError(err.message || 'No se pudo encontrar el producto con este código.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoCode = (code) => {
    setBarcodeInput(code);
    handleLookup(code);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 10, 8, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '2rem',
        border: '1px solid rgba(52, 211, 153, 0.3)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)'
          }}>
            <ScanBarcode size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem' }}>Escáner de Código de Barras</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Escanea códigos EAN-13 o consulta la red Open Food Facts en tiempo real
            </p>
          </div>
        </div>

        {/* Simulated Camera Viewfinder */}
        <div style={{
          position: 'relative',
          height: '170px',
          background: '#040d0a',
          borderRadius: 'var(--radius-sm)',
          border: '2px dashed rgba(16, 185, 129, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}>
          {/* Laser scanning line */}
          <div style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            height: '2px',
            background: '#10b981',
            boxShadow: '0 0 12px 2px #34d399',
            animation: 'scanLaser 2.2s infinite ease-in-out'
          }} />
          <style>{`
            @keyframes scanLaser {
              0% { top: 15%; opacity: 0.2; }
              50% { top: 85%; opacity: 1; }
              100% { top: 15%; opacity: 0.2; }
            }
          `}</style>

          <Camera size={34} style={{ color: 'rgba(52, 211, 153, 0.45)', marginBottom: '0.5rem' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Cámara activa: Apunta al código de barras del empaque
          </span>
        </div>

        {/* Quick Demo Barcodes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '0.4rem', fontWeight: 600 }}>
            Probar Códigos Rápidos de Demostración:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {DEMO_BARCODES.map((item) => (
              <button
                key={item.code}
                onClick={() => handleUseDemoCode(item.code)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-sub)',
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-sub)'; }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Barcode Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleLookup(); }}
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}
        >
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Ingresa o pega un código EAN-13 (ej: 7802100001011)"
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.7rem 1rem',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ padding: '0 1.2rem' }}
          >
            {loading ? 'Buscando...' : <Search size={18} />}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.8rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Scanned Product Result Card */}
        {scannedProduct && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.25rem',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  {scannedProduct.brand || 'Marca General'} • {formatCategoryName(scannedProduct.category)}
                </span>
                <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{scannedProduct.name}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge-eco badge-eco-${(scannedProduct.eco_score || 'c').toLowerCase()}`}>
                  {(scannedProduct.eco_score || 'c').toUpperCase()}
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '0.25rem' }}>
                  ${Number(scannedProduct.price).toLocaleString('es-CL')}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              padding: '0.6rem 0',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              margin: '0.75rem 0',
              fontSize: '0.8rem'
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Huella Carbono</div>
                <div style={{ fontWeight: 600, color: scannedProduct.co2_kg > 3.0 ? '#f87171' : '#34d399' }}>
                  {scannedProduct.co2_kg} kg CO₂e
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Sostenibilidad</div>
                <div style={{ fontWeight: 600, color: 'var(--primary-light)' }}>
                  {scannedProduct.sustainability_score}/100
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Empaque</div>
                <div style={{ fontWeight: 500, color: 'var(--text-sub)', fontSize: '0.72rem' }}>
                  {scannedProduct.packaging_type || 'Estándar'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
                onClick={() => {
                  onSelectProductForComparison(scannedProduct);
                  onClose();
                }}
              >
                <Sparkles size={16} />
                <span>Buscar Sustitutos Verdes</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
