import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Sliders,
  Leaf,
  Droplets,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { formatCategoryName } from '../utils/formatters';

function CartItemRow({ item, onUpdateQuantity, onRemoveItem, onSelectForCompare, onClose }) {
  const { product, quantity } = item;
  const [imgError, setImgError] = useState(false);
  const ecoGrade = (product.eco_score || 'c').toLowerCase();

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.85rem',
        padding: '1rem 0.6rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        transition: 'background 0.15s ease'
      }}
    >
      {/* Product Image Thumbnail */}
      <div
        style={{
          width: '64px',
          height: '64px',
          minWidth: '64px',
          borderRadius: 'var(--radius-sm)',
          background: 'radial-gradient(circle at 50% 50%, rgba(20, 50, 40, 0.45) 0%, rgba(7, 18, 14, 0.85) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.35rem',
          overflow: 'hidden'
        }}
      >
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            onError={() => setImgError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))'
            }}
          />
        ) : (
          <Leaf size={24} color="var(--primary-light)" style={{ opacity: 0.75 }} />
        )}
      </div>

      {/* Product Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
          <span className={`badge-eco badge-eco-${ecoGrade}`} style={{ width: '18px', height: '18px', fontSize: '0.68rem' }}>
            {ecoGrade.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {product.brand || 'Local'}
          </span>
        </div>

        <h4
          style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#ffffff'
          }}
          title={product.name}
        >
          {product.name}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
            ${Number(product.price).toLocaleString('es-CL')} c/u
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            • {product.co2_kg} kg CO₂
          </span>
        </div>

        {/* Quick link to compare alternatives */}
        {onSelectForCompare && (
          <button
            onClick={() => {
              onSelectForCompare(product);
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-blue)',
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0',
              marginTop: '0.2rem',
              textDecoration: 'underline',
              textUnderlineOffset: '2px'
            }}
          >
            <RefreshCw size={11} />
            <span>Ver alternativas</span>
          </button>
        )}
      </div>

      {/* Quantity Stepper Controls & Subtotal */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
          ${(product.price * quantity).toLocaleString('es-CL')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            className="cart-qty-btn"
            onClick={() => onUpdateQuantity(product.id, -1)}
            title="Reducir cantidad"
            aria-label="Disminuir"
          >
            <Minus size={12} />
          </button>

          <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
            {quantity}
          </span>

          <button
            className="cart-qty-btn"
            onClick={() => onUpdateQuantity(product.id, 1)}
            title="Aumentar cantidad"
            aria-label="Aumentar"
          >
            <Plus size={12} />
          </button>

          <button
            onClick={() => onRemoveItem(product.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.2rem',
              marginLeft: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            title="Eliminar producto"
            aria-label="Eliminar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSelectForCompare,
  onGoToOptimizer,
  onGoToCatalog
}) {
  if (!isOpen) return null;

  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalCo2 = Number(
    cartItems.reduce((acc, item) => acc + item.product.co2_kg * item.quantity, 0).toFixed(2)
  );
  const totalWater = Math.round(
    cartItems.reduce((acc, item) => acc + (item.product.water_liters || 0) * item.quantity, 0)
  );
  const avgSustainability = totalCount > 0
    ? Number((cartItems.reduce((acc, item) => acc + item.product.sustainability_score * item.quantity, 0) / totalCount).toFixed(1))
    : 0;

  // Evaluation: Can this cart be optimized?
  const hasSuboptimalProducts = cartItems.some(
    (item) => ['c', 'd', 'e'].includes((item.product.eco_score || 'c').toLowerCase()) || item.product.co2_kg > 2.5
  );

  return (
    <>
      {/* Backdrop */}
      <div className="cart-drawer-backdrop" onClick={onClose} />

      {/* Slide-over Panel */}
      <aside className="cart-drawer-panel" aria-label="Canasta de compra">
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(52, 211, 153, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(14, 34, 27, 0.95)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)'
              }}
            >
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                Tu Canasta Consciente
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {totalCount} {totalCount === 1 ? 'producto seleccionado' : 'productos seleccionados'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {totalCount > 0 && (
              <button
                onClick={onClearCart}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'color 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Vaciar todos los productos"
              >
                Vaciar
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-light)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'var(--primary-light)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              aria-label="Cerrar canasta"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {totalCount === 0 ? (
            /* Empty State */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '3rem 1rem'
              }}
            >
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-light)',
                  marginBottom: '1.2rem'
                }}
              >
                <ShoppingBag size={34} style={{ opacity: 0.8 }} />
              </div>

              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.4rem' }}>
                Tu canasta está vacía
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '280px', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                Agrega productos desde el Catálogo o el Escáner para evaluar su huella y optimizar tu compra con inteligencia artificial.
              </p>

              {onGoToCatalog && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    onGoToCatalog();
                    onClose();
                  }}
                  style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
                >
                  <Sparkles size={16} />
                  <span>Explorar Catálogo</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* SMART DIAGNOSTIC CARD (KEY FEATURE) */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.28) 100%)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.15rem',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={16} color="var(--primary-light)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Diagnóstico Inteligente
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.45, marginBottom: '0.9rem' }}>
                  {hasSuboptimalProducts ? (
                    <>
                      💡 <strong>Oportunidad detectada:</strong> Tu canasta puede optimizarse. Existen sustitutos con menor huella de carbono y mejor balance de precio que nuestro algoritmo matemático puede calcular para ti.
                    </>
                  ) : (
                    <>
                      🌱 <strong>Canasta consciente:</strong> Tus selecciones tienen un excelente balance ecológico ({avgSustainability}/100 pts). Puedes usar el Optimizador para ajustar tu compra a un presupuesto exacto.
                    </>
                  )}
                </p>

                {/* Direct Action to Optimizer */}
                <button
                  id="cart-optimize-btn"
                  onClick={() => {
                    if (onGoToOptimizer) {
                      onGoToOptimizer(cartItems, totalAmount);
                    }
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.7rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.45)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; }}
                >
                  <Sliders size={16} />
                  <span>Optimizar Canasta en Optimizador</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Aggregated Impact Snapshot */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Huella CO₂e</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: totalCo2 > 5.0 ? '#f87171' : '#34d399', marginTop: '0.15rem' }}>
                    {totalCo2} kg
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Agua Virtual</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.15rem' }}>
                    {totalWater} L
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Eco-Puntaje</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-light)', marginTop: '0.15rem' }}>
                    {avgSustainability}/100
                  </div>
                </div>
              </div>

              {/* Items List Heading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Artículos ({totalCount})
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Subtotal
                </span>
              </div>

              {/* Items List */}
              <div className="cart-items-list">
                {cartItems.map((item, idx) => (
                  <CartItemRow
                    key={`cart-${item.product.id}-${idx}`}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                    onSelectForCompare={onSelectForCompare}
                    onClose={onClose}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer Summary (if items present) */}
        {totalCount > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid rgba(52, 211, 153, 0.2)',
              background: 'rgba(14, 34, 27, 0.98)',
              marginTop: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', display: 'block' }}>
                  Total Estimado
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Precios referenciales retail
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                  ${totalAmount.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                className="btn-secondary"
                onClick={onClose}
                style={{ flex: '0 0 auto', padding: '0.7rem 1rem', fontSize: '0.85rem' }}
              >
                Seguir Comprando
              </button>

              <button
                className="btn-primary"
                onClick={() => {
                  if (onGoToOptimizer) {
                    onGoToOptimizer(cartItems, totalAmount);
                  }
                  onClose();
                }}
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem' }}
              >
                <Sliders size={16} />
                <span>Optimizar Canasta</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
