import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanBarcode,
  Camera,
  CameraOff,
  Search,
  Sparkles,
  ShoppingCart,
  Check,
  AlertCircle,
  Video,
  Smartphone,
  Info
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { fetchProductByBarcode } from '../services/api';
import { formatCategoryName } from '../utils/formatters';

const DEMO_BARCODES = [
  { label: '🥛 Leche Plástica (Tradicional)', code: '7802100001011' },
  { label: '🥩 Carne Vacuno (Alta Huella)', code: '7801610002012' },
  { label: '🧴 FreeMet Lavaloza Eco', code: '7804652410014' },
  { label: '🍫 Nutella (Open Food Facts)', code: '3017620422003' },
  { label: '🌱 Lentejas a Granel (Eco)', code: '7801610002029' },
  { label: '🍝 Spaghetti Carozzi', code: '7802500000012' },
];

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onSelectProductForComparison,
  onAddToCart,
  isInBasket
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [error, setError] = useState(null);

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error al detener escáner:', err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    setScannedProduct(null);

    // Detect if mediaDevices is supported (browsers require HTTPS on mobile IPs)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'El navegador no permite el acceso a la cámara en conexiones HTTP no seguras. ' +
        'Para usar la cámara del teléfono se requiere HTTPS, o puedes probar en localhost / ingresar el código manualmente.'
      );
      return;
    }

    try {
      // Ensure previous instance is stopped
      await stopCamera();

      const html5QrCode = new Html5Qrcode('barcode-scanner-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.3333
        },
        (decodedText) => {
          // Success callback
          stopCamera();
          handleLookup(decodedText);
        },
        () => {
          // Frame read callback (ignore routine parse drops)
        }
      );

      setIsCameraActive(true);
    } catch (err) {
      console.error('Error starting camera scanner:', err);
      setIsCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.message?.includes('Permission')
          ? 'Permiso de cámara denegado. Permite el acceso a la cámara en los ajustes del navegador.'
          : 'No se pudo iniciar la cámara: ' + (err.message || 'Dispositivo no disponible')
      );
    }
  };

  // Close handler with camera cleanup
  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  // Auto-stop camera if modal closes or changes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

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
      setBarcodeInput(codeToSearch.trim());
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
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '2rem',
        border: '1px solid rgba(52, 211, 153, 0.3)'
      }}>
        {/* Close Button */}
        <button
          onClick={handleClose}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
              Identifica productos por EAN-13 o consulta la red Open Food Facts
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-light)'
        }}>
          <button
            onClick={() => {
              setActiveTab('camera');
              if (!isCameraActive) startCamera();
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'camera' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'camera' ? '#ffffff' : 'var(--text-sub)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s'
            }}
          >
            <Camera size={16} /> Cámara en Vivo
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'manual' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'manual' ? '#ffffff' : 'var(--text-sub)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s'
            }}
          >
            <Search size={16} /> Ingreso Manual & Demos
          </button>
        </div>

        {/* CAMERA VIEW TAB */}
        {activeTab === 'camera' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              id="barcode-scanner-reader"
              style={{
                width: '100%',
                minHeight: isCameraActive ? '260px' : '180px',
                background: '#040d0a',
                borderRadius: 'var(--radius-sm)',
                border: isCameraActive ? '2px solid var(--primary-light)' : '2px dashed rgba(16, 185, 129, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {!isCameraActive && (
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <Video size={36} color="rgba(52, 211, 153, 0.6)" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Escáner con Cámara Real
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: '340px', margin: '0 auto 1rem' }}>
                    Apunta la cámara del dispositivo directamente al código de barras del producto para escanearlo automáticamente.
                  </p>
                  <button
                    onClick={startCamera}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.55rem 1.2rem' }}
                  >
                    <Camera size={16} /> Iniciar Cámara
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls while scanning */}
            {isCameraActive && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Cámara activa • Apunta al código EAN-13
                </span>
                <button
                  onClick={stopCamera}
                  className="btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                >
                  <CameraOff size={14} /> Detener Cámara
                </button>
              </div>
            )}

            {/* Camera Permission / Mobile HTTP Notice */}
            {cameraError && (
              <div style={{
                marginTop: '0.8rem',
                padding: '0.8rem 1rem',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#fbbf24',
                fontSize: '0.8rem',
                lineHeight: 1.4,
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start'
              }}>
                <Info size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Aviso de Acceso a Cámara:</strong>
                  {cameraError}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANUAL INPUT & DEMO TAB */}
        {activeTab === 'manual' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-sub)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Códigos de Prueba Rápidos:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {DEMO_BARCODES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => handleUseDemoCode(item.code)}
                  style={{
                    background: barcodeInput === item.code ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    border: barcodeInput === item.code ? '1px solid var(--primary-light)' : '1px solid var(--border-light)',
                    color: barcodeInput === item.code ? '#ffffff' : 'var(--text-sub)',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); handleLookup(); }}
              style={{ display: 'flex', gap: '0.5rem' }}
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
          </div>
        )}

        {/* Global Error Display */}
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
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--primary-light)', fontSize: '0.88rem' }}>
            Consultando base de datos y Open Food Facts...
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  {scannedProduct.brand || 'Marca General'} • {formatCategoryName(scannedProduct.category)}
                </span>
                <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{scannedProduct.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  EAN: {scannedProduct.barcode}
                </span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              {onAddToCart && (
                <button
                  className="btn-secondary"
                  style={{
                    flex: '1 1 140px',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    background: isInBasket && isInBasket(scannedProduct.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    borderColor: isInBasket && isInBasket(scannedProduct.id) ? 'var(--primary-light)' : 'var(--border-light)',
                    color: isInBasket && isInBasket(scannedProduct.id) ? 'var(--primary-light)' : '#ffffff',
                    fontWeight: 600
                  }}
                  onClick={() => onAddToCart(scannedProduct, 1)}
                >
                  {isInBasket && isInBasket(scannedProduct.id) ? <Check size={16} /> : <ShoppingCart size={16} />}
                  <span>{isInBasket && isInBasket(scannedProduct.id) ? 'En Canasta (+1)' : 'Añadir a Canasta'}</span>
                </button>
              )}

              <button
                className="btn-primary"
                style={{ flex: '1 1 180px', justifyContent: 'center', fontSize: '0.85rem' }}
                onClick={() => {
                  onSelectProductForComparison(scannedProduct);
                  handleClose();
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
