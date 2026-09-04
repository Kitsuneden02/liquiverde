import React, { useState } from 'react';
import { Leaf, Droplets, RefreshCw, Plus, Check, ShieldCheck, Sparkles, Coffee, Utensils, Apple, Sparkle, HeartPulse, ShoppingBag } from 'lucide-react';

const CATEGORY_ICONS = {
  lacteos_y_vegetales: { icon: Leaf, label: 'Lácteo / Vegetal', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' },
  proteinas_y_legumbres: { icon: HeartPulse, label: 'Proteína Eco', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  abarrotes_y_cereales: { icon: Utensils, label: 'Abarrotes & Granos', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  limpieza_y_hogar: { icon: Sparkles, label: 'Limpieza Circular', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
  frutas_y_verduras: { icon: Apple, label: 'Agroecológico', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  bebidas: { icon: Coffee, label: 'Bebida & Infusión', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
  desayuno_y_snacks: { icon: ShoppingBag, label: 'Snack & Desayuno', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.12)' }
};

export default function ProductCard({
  product,
  onSelectForCompare,
  onToggleBasket,
  isInBasket,
  onOpenDetails
}) {
  const [imgError, setImgError] = useState(false);
  const ecoGrade = (product.eco_score || 'c').toLowerCase();
  const catConfig = CATEGORY_ICONS[product.category] || { icon: Leaf, label: 'Eco Retail', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  const CategoryIcon = catConfig.icon;

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, border-color 0.2s'
    }}>
      {/* Top Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flex: 1, minWidth: 0, alignItems: 'center' }}>
          <span className={`badge-eco badge-eco-${ecoGrade}`} title={`Eco-Score Oficial: Grado ${ecoGrade.toUpperCase()}`}>
            {ecoGrade.toUpperCase()}
          </span>
          {product.organic && (
            <span className="tag-pill tag-organic" title="Certificado Orgánico">
              <Leaf size={11} /> Orgánico
            </span>
          )}
          {product.fair_trade && (
            <span className="tag-pill tag-fair-trade" title="Comercio Justo / Cooperativa Local">
              <ShieldCheck size={11} /> Cooperativa
            </span>
          )}
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--primary-light)',
          padding: '0.22rem 0.6rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          {Number(product.sustainability_score).toFixed(1)} pts
        </div>
      </div>

      {/* Product Image and Stylized Fallback */}
      <div style={{
        height: '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(20, 50, 40, 0.45) 0%, rgba(7, 18, 14, 0.85) 100%)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '0.9rem',
        overflow: 'hidden',
        position: 'relative',
        padding: '0.6rem',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5))',
              transition: 'transform 0.25s ease'
            }}
            onError={() => setImgError(true)}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: catConfig.bg,
            border: `1px dashed ${catConfig.color}40`,
            borderRadius: 'var(--radius-sm)',
            padding: '1rem'
          }}>
            <CategoryIcon size={38} color={catConfig.color} style={{ marginBottom: '0.4rem', opacity: 0.9 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: catConfig.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {catConfig.label}
            </span>
          </div>
        )}
      </div>

      {/* Product Name & Brand */}
      <div style={{ marginBottom: '0.5rem', flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {product.brand || 'Marca Local'}
        </div>
        <h4 
          onClick={() => onOpenDetails && onOpenDetails(product)}
          style={{
            fontSize: '1rem',
            lineHeight: 1.3,
            marginTop: '0.15rem',
            cursor: 'pointer',
            transition: 'color 0.15s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary-light)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#ffffff'; }}
        >
          {product.name}
        </h4>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.2rem' }}>
          Empaque: {product.packaging_type || 'Estándar'}
        </div>
      </div>

      {/* Ecological Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '0.55rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '0.9rem',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Leaf size={14} color={product.co2_kg > 3.0 ? '#f87171' : '#34d399'} />
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Huella CO₂e</span>
            <strong style={{ color: product.co2_kg > 3.0 ? '#f87171' : '#34d399' }}>
              {product.co2_kg} kg
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Droplets size={14} color="#38bdf8" />
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', display: 'block' }}>Agua Virtual</span>
            <strong style={{ color: '#38bdf8' }}>
              {product.water_liters} L
            </strong>
          </div>
        </div>
      </div>

      {/* Price & Primary Actions (WITHOUT "CLP") */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
            ${Number(product.price).toLocaleString('es-CL')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            / {product.unit || 'unidad'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {onSelectForCompare && (
            <button
              onClick={() => onSelectForCompare(product)}
              className="btn-secondary"
              title="Comparar alternativas y sustitutos"
              style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}
            >
              <RefreshCw size={16} />
            </button>
          )}

          {onToggleBasket && (
            <button
              onClick={() => onToggleBasket(product)}
              style={{
                background: isInBasket ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid var(--border-light)',
                padding: '0.55rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.15s'
              }}
            >
              {isInBasket ? <Check size={16} /> : <Plus size={16} />}
              <span>{isInBasket ? 'En canasta' : 'Añadir'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
