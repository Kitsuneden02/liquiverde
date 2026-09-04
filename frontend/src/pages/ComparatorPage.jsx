import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, Check, AlertCircle, Sparkles, Leaf, DollarSign, Droplets, ShieldCheck } from 'lucide-react';
import { fetchProducts, fetchSubstitutes } from '../services/api';

export default function ComparatorPage({
  initialProduct,
  onToggleBasket,
  basketProductIds,
  onOpenDetails
}) {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || null);
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data);
      if (!selectedProduct && data.length > 0) {
        // Selecciona por defecto un producto convencional con alto CO2 para demostrar la sustitución
        const defaultOrig = data.find((p) => p.co2_kg >= 2.0 && p.substitute_id) || data[0];
        setSelectedProduct(defaultOrig);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadSubstitutes(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadSubstitutes = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubstitutes(productId);
      setSubstitutes(data);
    } catch (err) {
      setError('Error al cargar recomendaciones de sustitución.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'rgba(16, 185, 129, 0.12)',
          color: 'var(--primary-light)',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '0.8rem',
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <RefreshCw size={14} /> Motor de Sustitución Inteligente & Ahorro
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Comparador Lado a Lado de Alternativas
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
          Analiza cualquier producto convencional y descubre alternativas ecológicas que reducen tu huella de carbono y bajan el costo de tu boleta de supermercado.
        </p>
      </div>

      {/* Product Selector Dropdown */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-sub)' }}>
          Selecciona un producto para analizar sus alternativas más sostenibles:
        </label>
        <select
          value={selectedProduct ? selectedProduct.id : ''}
          onChange={(e) => {
            const found = allProducts.find((p) => p.id === Number(e.target.value));
            setSelectedProduct(found);
          }}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.8rem 1rem',
            color: '#ffffff',
            fontSize: '0.95rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {allProducts.map((p) => (
            <option key={p.id} value={p.id} style={{ background: '#0e221b' }}>
              [{p.category.toUpperCase()}] {p.name} - ${Number(p.price).toLocaleString('es-CL')} (Eco-Score: {(p.eco_score || 'c').toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Comparison Grid */}
      {selectedProduct && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'start'
        }}>
          {/* Left Column: Original Product */}
          <div className="glass-panel" style={{ padding: '1.8rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              Producto Convencional Original
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', lineHeight: 1.3 }}>{selectedProduct.name}</h3>
              <span className={`badge-eco badge-eco-${(selectedProduct.eco_score || 'c').toLowerCase()}`}>
                {(selectedProduct.eco_score || 'c').toUpperCase()}
              </span>
            </div>

            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
              ${Number(selectedProduct.price).toLocaleString('es-CL')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Huella de Carbono</span>
                <strong style={{ color: '#f87171' }}>{selectedProduct.co2_kg} kg CO₂e</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Agua Virtual</span>
                <strong style={{ color: 'var(--text-sub)' }}>{selectedProduct.water_liters} L</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tipo de Empaque</span>
                <span style={{ color: 'var(--text-sub)' }}>{selectedProduct.packaging_type || 'Plástico estándar'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Origen</span>
                <span style={{ color: 'var(--text-sub)' }}>{selectedProduct.origin || 'Importado / Industrial'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Puntaje Sostenibilidad</span>
                <strong style={{ color: 'var(--text-main)' }}>{selectedProduct.sustainability_score} / 100</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Recommended Green Alternatives */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--primary-light)',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>
              <Sparkles size={14} /> Alternativas Verdes & Ahorro Sugeridas
            </div>

            {loading ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary-light)' }} />
                <div>Buscando alternativas óptimas...</div>
              </div>
            ) : substitutes.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Check size={32} color="var(--primary-light)" style={{ margin: '0 auto 0.5rem' }} />
                <h3>Este producto ya es una opción líder en sostenibilidad</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  No existen alternativas de menor huella o costo significativamente mejor en esta categoría.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {substitutes.map((sub, idx) => {
                  const alt = sub.recommended_product;
                  const priceDiff = sub.price_difference_clp;
                  const co2Reduction = sub.co2_reduction_kg;

                  return (
                    <div
                      key={alt.id}
                      className="glass-panel"
                      style={{
                        padding: '1.5rem',
                        border: idx === 0 ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid var(--border-light)',
                        boxShadow: idx === 0 ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none'
                      }}
                    >
                      {/* Top banner if best match */}
                      {idx === 0 && (
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--primary-light)',
                          marginBottom: '0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}>
                          <Sparkles size={14} /> MEJOR OPCIÓN RECOMENDADA
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {alt.brand}
                          </div>
                          <h4 style={{ fontSize: '1.15rem', marginTop: '0.1rem' }}>{alt.name}</h4>
                        </div>
                        <span className={`badge-eco badge-eco-${(alt.eco_score || 'a').toLowerCase()}`}>
                          {(alt.eco_score || 'a').toUpperCase()}
                        </span>
                      </div>

                      {/* Delta Badges */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                        {priceDiff > 0 && (
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <DollarSign size={14} />
                            Ahorras ${Number(priceDiff).toLocaleString('es-CL')}
                          </div>
                        )}
                        {co2Reduction > 0 && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <Leaf size={14} />
                            Evitas {co2Reduction} kg CO₂e
                          </div>
                        )}
                        {sub.water_saved_liters > 100 && (
                          <div style={{
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            padding: '0.3rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <Droplets size={14} />
                            Conservas {Math.round(sub.water_saved_liters)} L agua
                          </div>
                        )}
                      </div>

                      {/* Natural language reasoning */}
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-sub)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        lineHeight: 1.4,
                        marginBottom: '1rem'
                      }}>
                        💡 <em>{sub.recommendation_reason ? sub.recommendation_reason.replace(/\s*CLP\b/gi, '') : ''}</em>
                      </p>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                          ${Number(alt.price).toLocaleString('es-CL')}
                        </div>

                        <button
                          onClick={() => onToggleBasket && onToggleBasket(alt)}
                          className="btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Check size={16} />
                          <span>{basketProductIds.includes(alt.id) ? 'En mi canasta' : 'Adoptar Sustituto'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
