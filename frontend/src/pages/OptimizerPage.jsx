import React, { useState, useEffect } from 'react';
import {
  Sliders,
  DollarSign,
  Leaf,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Droplets,
  ArrowRight,
  Check
} from 'lucide-react';
import { optimizeKnapsack, fetchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';

const BUDGET_PRESETS = [5000, 10000, 15000, 25000, 40000];

function SubstitutionCard({ sub, onAdoptOne, onOpenDetails }) {
  const {
    original_product: orig,
    recommended_product: alt,
    price_difference_clp,
    co2_reduction_kg,
    water_saved_liters,
    recommendation_reason
  } = sub;
  const [imgErrorOrig, setImgErrorOrig] = useState(false);
  const [imgErrorAlt, setImgErrorAlt] = useState(false);
  const [adopted, setAdopted] = useState(false);

  const ecoGradeOrig = (orig.eco_score || 'c').toLowerCase();
  const ecoGradeAlt = (alt.eco_score || 'a').toLowerCase();

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(52, 211, 153, 0.25)',
        borderRadius: 'var(--radius-sm)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', alignItems: 'center' }}>
        {/* Original Product */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              minWidth: '60px',
              borderRadius: 'var(--radius-sm)',
              background: 'radial-gradient(circle, rgba(45, 20, 20, 0.6) 0%, rgba(18, 7, 7, 0.9) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              overflow: 'hidden'
            }}
          >
            {orig.image_url && !imgErrorOrig ? (
              <img
                src={orig.image_url}
                alt={orig.name}
                onError={() => setImgErrorOrig(true)}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Leaf size={22} color="#f87171" />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '0.68rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              En tu canasta actual
            </span>
            <div
              style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: onOpenDetails ? 'pointer' : 'default' }}
              onClick={() => onOpenDetails && onOpenDetails(orig)}
              title={orig.name}
            >
              {orig.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.78rem' }}>
              <span className={`badge-eco badge-eco-${ecoGradeOrig}`} style={{ transform: 'scale(0.85)' }}>
                {ecoGradeOrig.toUpperCase()}
              </span>
              <strong style={{ color: '#ffffff' }}>${Number(orig.price).toLocaleString('es-CL')}</strong>
              <span style={{ color: 'var(--text-muted)' }}>• {orig.co2_kg} kg CO₂</span>
            </div>
          </div>
        </div>

        {/* Center / Arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-light)',
            border: '1px solid rgba(52, 211, 153, 0.4)'
          }}>
            <ArrowRight size={16} />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase' }}>
            Reemplazar por
          </span>
        </div>

        {/* Recommended Alternative */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              minWidth: '60px',
              borderRadius: 'var(--radius-sm)',
              background: 'radial-gradient(circle, rgba(20, 50, 40, 0.6) 0%, rgba(7, 18, 14, 0.95) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              overflow: 'hidden'
            }}
          >
            {alt.image_url && !imgErrorAlt ? (
              <img
                src={alt.image_url}
                alt={alt.name}
                onError={() => setImgErrorAlt(true)}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Leaf size={22} color="var(--primary-light)" />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--primary-light)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Alternativa Sugerida
            </span>
            <div
              style={{ fontSize: '0.92rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: onOpenDetails ? 'pointer' : 'default' }}
              onClick={() => onOpenDetails && onOpenDetails(alt)}
              title={alt.name}
            >
              {alt.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.78rem' }}>
              <span className={`badge-eco badge-eco-${ecoGradeAlt}`} style={{ transform: 'scale(0.85)' }}>
                {ecoGradeAlt.toUpperCase()}
              </span>
              <strong style={{ color: 'var(--primary-light)' }}>${Number(alt.price).toLocaleString('es-CL')}</strong>
              <span style={{ color: 'var(--text-muted)' }}>• {alt.co2_kg} kg CO₂</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Badges & Reason & Action */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {price_difference_clp > 0 && (
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <DollarSign size={13} />
              Ahorras ${Number(price_difference_clp).toLocaleString('es-CL')}
            </span>
          )}

          {co2_reduction_kg > 0 && (
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Leaf size={13} />
              Evitas {co2_reduction_kg} kg CO₂e
            </span>
          )}

          {water_saved_liters > 50 && (
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Droplets size={13} />
              Conservas {Math.round(water_saved_liters)} L agua
            </span>
          )}
        </div>

        {onAdoptOne && (
          <button
            onClick={() => {
              onAdoptOne();
              setAdopted(true);
            }}
            className="btn-secondary"
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.8rem',
              background: adopted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              borderColor: adopted ? 'var(--primary-light)' : 'var(--border-light)',
              color: adopted ? 'var(--primary-light)' : '#ffffff',
              fontWeight: 600
            }}
          >
            <Check size={14} />
            <span>{adopted ? '¡Sustituido en Canasta!' : 'Adoptar este Sustituto'}</span>
          </button>
        )}
      </div>

      {recommendation_reason && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', lineHeight: 1.45, background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
          💡 <em>{recommendation_reason}</em>
        </div>
      )}
    </div>
  );
}

export default function OptimizerPage({
  basketProductIds = [],
  onSelectForCompare,
  onToggleBasket,
  onOpenDetails,
  optimizerConfig,
  onAdoptSubstitutions
}) {
  const [budget, setBudget] = useState(optimizerConfig?.budget || 15000);
  const [sustainabilityWeight, setSustainabilityWeight] = useState(0.5);
  const [onlyUseBasket, setOnlyUseBasket] = useState(
    Boolean(optimizerConfig?.onlyUseBasket && basketProductIds.length > 0)
  );
  const [loading, setLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [error, setError] = useState(null);
  const [appliedAll, setAppliedAll] = useState(false);

  const handleRunOptimization = async (overrideParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const activeBudget = overrideParams.budget !== undefined ? overrideParams.budget : budget;
      const activeOnlyBasket = overrideParams.onlyUseBasket !== undefined ? overrideParams.onlyUseBasket : onlyUseBasket;
      const activeWeight = overrideParams.sustainabilityWeight !== undefined ? overrideParams.sustainabilityWeight : sustainabilityWeight;

      const payload = {
        budget: Number(activeBudget),
        sustainability_weight: Number(activeWeight),
        product_ids: activeOnlyBasket && basketProductIds.length > 0 ? basketProductIds : null,
        mandatory_product_ids: []
      };

      const result = await optimizeKnapsack(payload);
      setOptimizationResult(result);
      setAppliedAll(false);
    } catch (err) {
      setError(err.message || 'Error al ejecutar la optimización de mochila');
    } finally {
      setLoading(false);
    }
  };

  // Sync when optimizerConfig changes from external button (e.g. cart)
  useEffect(() => {
    if (optimizerConfig && optimizerConfig.trigger) {
      const targetBudget = optimizerConfig.budget || budget;
      const targetOnlyBasket = Boolean(optimizerConfig.onlyUseBasket && basketProductIds.length > 0);
      setBudget(targetBudget);
      setOnlyUseBasket(targetOnlyBasket);
      handleRunOptimization({
        budget: targetBudget,
        onlyUseBasket: targetOnlyBasket
      });
    }
  }, [optimizerConfig?.trigger]);

  // Debounced auto-recalculation when slider, budget, or basket toggle changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleRunOptimization({
        budget,
        onlyUseBasket,
        sustainabilityWeight
      });
    }, 220);
    return () => clearTimeout(timer);
  }, [budget, onlyUseBasket, sustainabilityWeight, basketProductIds.length]);

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
          <Sliders size={14} /> Algoritmo de Mochila Multi-Objetivo (0/1 Knapsack)
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Optimizador Inteligente de Compras
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
          Define tu presupuesto límite y ajusta el balance entre <strong>Ahorro de Dinero</strong> y <strong>Sostenibilidad Ambiental</strong>. Nuestro algoritmo matemático calculará la combinación óptima de productos.
        </p>
      </div>

      {/* Interactive Control Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          
          {/* Budget Input & Presets */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <DollarSign size={18} color="var(--primary-light)" />
                Presupuesto Máximo
              </label>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                ${Number(budget).toLocaleString('es-CL')}
              </span>
            </div>

            <input
              type="range"
              min={3000}
              max={50000}
              step={1000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{ marginBottom: '0.8rem' }}
            />

            {/* Quick Budget Presets */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setBudget(p)}
                  style={{
                    background: budget === p ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-light)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: budget === p ? 700 : 500
                  }}
                >
                  ${(p / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Sustainability Weight Slider (Alpha) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Leaf size={18} color="#34d399" />
                Preferencia: Ahorro vs. Planeta
              </label>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: sustainabilityWeight > 0.6 ? '#34d399' : sustainabilityWeight < 0.4 ? '#fbbf24' : '#38bdf8'
              }}>
                {sustainabilityWeight === 0.5 ? '50/50 Equilibrio' :
                 sustainabilityWeight > 0.5 ? `${Math.round(sustainabilityWeight * 100)}% Planeta` :
                 `${Math.round((1 - sustainabilityWeight) * 100)}% Ahorro`}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={sustainabilityWeight}
              onChange={(e) => setSustainabilityWeight(Number(e.target.value))}
              style={{ marginBottom: '0.5rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>💰 Priorizar Precio Bajo</span>
              <span>⚖️ Balance</span>
              <span>🌱 Priorizar Cero Huella</span>
            </div>
          </div>
        </div>

        {/* Action button & scope toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.8rem',
          paddingTop: '1.2rem',
          borderTop: '1px solid var(--border-light)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={onlyUseBasket}
              onChange={(e) => setOnlyUseBasket(e.target.checked)}
              disabled={basketProductIds.length === 0}
            />
            <span style={{ color: basketProductIds.length === 0 ? 'var(--text-muted)' : 'var(--text-main)' }}>
              Optimizar solo sobre mi canasta seleccionada ({basketProductIds.length} productos)
            </span>
          </label>

          <button
            onClick={handleRunOptimization}
            disabled={loading}
            className="btn-primary"
            style={{ padding: '0.75rem 1.8rem', fontSize: '0.95rem' }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Calculando Óptimo...' : 'Calcular Canasta Óptima'}</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#fca5a5',
          marginBottom: '2rem'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Optimization Results Summary Cards */}
      {optimizationResult && (
        <div className="animate-fade-in">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {/* Total Cost Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Total Invertido
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                ${Number(optimizationResult.total_cost).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', marginTop: '0.2rem' }}>
                Sobra: ${Number(optimizationResult.budget_remaining).toLocaleString('es-CL')}
              </div>
            </div>

            {/* Savings CLP Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Ahorro Estimado vs. Convencional
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>
                +${Number(optimizationResult.estimated_savings_clp).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                frente a marcas industriales
              </div>
            </div>

            {/* CO2 Avoided Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Huella CO₂e Mitigada
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
                -{optimizationResult.co2_avoided_kg} kg
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Total emitido: {optimizationResult.total_co2_kg} kg
              </div>
            </div>

            {/* Average Sustainability Score Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Score Promedio Canasta
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                {optimizationResult.average_sustainability_score} / 100
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Método: {
                  optimizationResult.optimization_method === 'multiple_choice_basket_optimization'
                    ? 'Optimización de Canasta y Sustitutos'
                    : optimizationResult.optimization_method === 'exact_dynamic_programming'
                    ? 'Programación Dinámica Exacta'
                    : 'Heurística Voraz'
                }
              </div>
            </div>
          </div>

          {/* Original Basket vs Optimized Comparison Banner */}
          {optimizationResult.original_total_cost > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 78, 59, 0.22) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                  <TrendingUp size={16} color="var(--primary-light)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Diagnóstico Comparativo de tu Canasta
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                  Canasta Original: <strong>${Number(optimizationResult.original_total_cost).toLocaleString('es-CL')}</strong> ({optimizationResult.original_total_co2_kg} kg CO₂)
                  {' ➔ '}
                  Canasta Optimizada: <strong style={{ color: 'var(--primary-light)' }}>${Number(optimizationResult.total_cost).toLocaleString('es-CL')}</strong> ({optimizationResult.total_co2_kg} kg CO₂)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {optimizationResult.estimated_savings_clp > 0 && (
                  <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700 }}>
                    Ahorro Real: +${Number(optimizationResult.estimated_savings_clp).toLocaleString('es-CL')}
                  </span>
                )}
                {optimizationResult.co2_avoided_kg > 0 && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 700 }}>
                    CO₂ Mitigado: -{optimizationResult.co2_avoided_kg} kg
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SMART SUBSTITUTIONS SECTION */}
          {optimizationResult.substitutions && optimizationResult.substitutions.length > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '1.75rem',
                marginBottom: '2.5rem',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} color="var(--primary-light)" />
                    <h3 style={{ fontSize: '1.3rem', color: '#ffffff', margin: 0 }}>
                      Sustituciones Inteligentes Sugeridas ({optimizationResult.substitutions.length})
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Ajustado con tu preferencia (<strong>{sustainabilityWeight > 0.5 ? `${Math.round(sustainabilityWeight * 100)}% Planeta` : sustainabilityWeight < 0.5 ? `${Math.round((1 - sustainabilityWeight) * 100)}% Ahorro` : '50/50 Equilibrio'}</strong>). Nuestro algoritmo reemplaza los productos convencionales por sus mejores alternativas:
                  </p>
                </div>

                {onAdoptSubstitutions && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      onAdoptSubstitutions(optimizationResult.substitutions);
                      setAppliedAll(true);
                    }}
                    style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem' }}
                  >
                    <Check size={16} />
                    <span>{appliedAll ? '¡Sustituciones Aplicadas!' : 'Adoptar Todas en mi Canasta'}</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {optimizationResult.substitutions.map((sub, idx) => (
                  <SubstitutionCard
                    key={`${sub.original_product.id}-${sub.recommended_product.id}-${idx}`}
                    sub={sub}
                    onAdoptOne={() => onAdoptSubstitutions && onAdoptSubstitutions([sub])}
                    onOpenDetails={onOpenDetails}
                  />
                ))}
              </div>
            </div>
          )}

          {/* If basket was selected and no substitutions needed */}
          {onlyUseBasket && optimizationResult.substitutions && optimizationResult.substitutions.length === 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircle2 size={22} color="var(--primary-light)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                <strong>¡Canasta Óptima!</strong> Los productos que seleccionaste ya representan las opciones más eficientes y sostenibles en su categoría para tu nivel de preferencia.
              </div>
            </div>
          )}

          {/* Optimized Products List */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem' }}>
              Productos Resultantes en la Canasta ({optimizationResult.selected_products.length})
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              Cumple restricción: Total ≤ ${Number(budget).toLocaleString('es-CL')}
            </span>
          </div>

          {optimizationResult.selected_products.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <AlertCircle size={36} color="#fbbf24" style={{ margin: '0 auto 0.5rem' }} />
              <h3>Presupuesto Insuficiente</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                El presupuesto ingresado es menor al precio del producto más accesible. Aumenta el presupuesto para optimizar la canasta.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {optimizationResult.selected_products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelectForCompare={onSelectForCompare}
                  onToggleBasket={onToggleBasket}
                  isInBasket={basketProductIds.includes(prod.id)}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
