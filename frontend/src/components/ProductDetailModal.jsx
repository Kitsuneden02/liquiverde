import React from 'react';
import { X, Leaf, Droplets, Package, MapPin, ShieldCheck, DollarSign, ArrowRight, ShoppingCart, Check } from 'lucide-react';

import { formatCategoryName } from '../utils/formatters';

export default function ProductDetailModal({
  product,
  onClose,
  onSelectForCompare,
  onAddToCart,
  isInBasket
}) {
  if (!product) return null;

  const ecoGrade = (product.eco_score || 'c').toLowerCase();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 10, 8, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '2.2rem',
        border: '1px solid rgba(52, 211, 153, 0.3)'
      }}>
        {/* Close Button - Clean circle with safe margin */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 10
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
        >
          <X size={18} />
        </button>

        {/* Product Hero: Contained Image + Product Info + Separated Price */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingRight: '2.5rem' /* Safe spacing away from the X close button */
        }}>
          {/* Product Image Frame */}
          {product.image_url ? (
            <div style={{
              width: '130px',
              height: '130px',
              minWidth: '130px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 50%, rgba(20, 50, 40, 0.45) 0%, rgba(7, 18, 14, 0.85) 100%)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.6rem',
              overflow: 'hidden'
            }}>
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6))'
                }}
              />
            </div>
          ) : null}

          {/* Product Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className={`badge-eco badge-eco-${ecoGrade}`} style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>
                {ecoGrade.toUpperCase()}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {product.brand} • {formatCategoryName(product.category)}
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', lineHeight: 1.25, fontWeight: 700, color: '#ffffff' }}>
              {product.name}
            </h2>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Código de Barras EAN-13: <code style={{ color: 'var(--primary-light)' }}>{product.barcode}</code>
            </div>

            {/* Price Tag positioned safely below title away from X button */}
            <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                ${Number(product.price).toLocaleString('es-CL')}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {product.unit}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {product.description}
          </p>
        )}

        {/* Sustainability Pillars Breakdown */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)' }}>
            <Leaf size={18} />
            <span>Desglose de Scoring de Sostenibilidad ({product.sustainability_score}/100 pts)</span>
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {/* Dimensión Ambiental */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.8rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>1. AMBIENTAL (50%)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399', margin: '0.3rem 0' }}>
                {product.co2_kg} kg CO₂e
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                Empaque: {product.packaging_score}/100 pts
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                Eco-Score: Grado {ecoGrade.toUpperCase()}
              </div>
            </div>

            {/* Dimensión Social */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.8rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>2. SOCIAL (30%)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', margin: '0.3rem 0' }}>
                {product.origin_score}/100 pts
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                Origen: {product.origin || 'Nacional'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                {product.fair_trade ? '✅ Comercio Justo' : 'Comercio estándar'}
              </div>
            </div>

            {/* Dimensión Económica */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.8rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>3. ECONÓMICA (20%)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', margin: '0.3rem 0' }}>
                ${Number(product.price).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                Agua virtual: {product.water_liters} L
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                {product.organic ? '🌿 Orgánico' : 'Convencional'}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>

          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product, 1)}
              className="btn-secondary"
              style={{
                background: isInBasket ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isInBasket ? 'var(--primary-light)' : 'var(--border-light)',
                color: isInBasket ? 'var(--primary-light)' : '#ffffff',
                fontWeight: 600
              }}
            >
              {isInBasket ? <Check size={16} /> : <ShoppingCart size={16} />}
              <span>{isInBasket ? 'Añadir otro (+1)' : 'Añadir a la Canasta'}</span>
            </button>
          )}

          <button
            className="btn-primary"
            onClick={() => {
              onSelectForCompare(product);
              onClose();
            }}
          >
            <span>Buscar y Comparar Sustitutos</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
