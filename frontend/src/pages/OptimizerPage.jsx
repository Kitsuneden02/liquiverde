import React, { useState, useEffect } from 'react';
import { Sliders, DollarSign, Leaf, Sparkles, AlertCircle, ShoppingCart, RefreshCw, CheckCircle2, TrendingUp, Droplets } from 'lucide-react';
import confetti from 'canvas-confetti';
import { optimizeKnapsack, fetchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';

const BUDGET_PRESETS = [5000, 10000, 15000, 25000, 40000];

export default function OptimizerPage({
  basketProductIds,
  onSelectForCompare,
  onToggleBasket,
  onOpenDetails
}) {
  const [budget, setBudget] = useState(15000);
  const [sustainabilityWeight, setSustainabilityWeight] = useState(0.5);
  const [onlyUseBasket, setOnlyUseBasket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunOptimization = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        budget: Number(budget),
        sustainability_weight: Number(sustainabilityWeight),
        product_ids: onlyUseBasket && basketProductIds.length > 0 ? basketProductIds : null,
        mandatory_product_ids: []
      };

      const result = await optimizeKnapsack(payload);
      setOptimizationResult(result);

      // Microinteracción de celebración con confetti
      if (result.selected_products && result.selected_products.length > 0) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#f59e0b', '#38bdf8']
        });
      }
    } catch (err) {
      setError(err.message || 'Error al ejecutar la optimización de mochila');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunOptimization();
  }, []);

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
                Método: {optimizationResult.optimization_method === 'exact_dynamic_programming' ? 'Programación Dinámica Exacta' : 'Heurística Voraz'}
              </div>
            </div>
          </div>

          {/* Optimized Products List */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem' }}>
              Productos Seleccionados en la Canasta ({optimizationResult.selected_products.length})
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
