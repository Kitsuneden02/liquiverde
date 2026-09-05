import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Leaf, DollarSign, Droplets, TreePine, Award, RefreshCw } from 'lucide-react';
import { fetchImpactSummary } from '../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpactSummary()
      .then((data) => setSummary(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--primary-light)' }} />
        <div>Cargando métricas de impacto ambiental y económico...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Dashboard de Impacto Colectivo
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Visualiza el impacto tangible en reducción de emisiones, ahorro de agua y dinero que se logra al reemplazar productos convencionales por alternativas sostenibles.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Ahorro Anual Proyectado */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Ahorro Hogar / Año
            </span>
            <DollarSign size={20} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>
            ${Number(summary?.projected_yearly_household_savings_clp || 0).toLocaleString('es-CL')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Proyectado por canasta mensual inteligente
          </div>
        </div>

        {/* CO2 Mitigado Anual */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              CO₂e Mitigado / Año
            </span>
            <Leaf size={20} color="#34d399" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {summary?.projected_yearly_co2_avoided_kg || 0} kg
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Emisiones de efecto invernadero evitadas
          </div>
        </div>

        {/* Árboles Equivalentes */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Árboles Equivalentes
            </span>
            <TreePine size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
            🌳 {summary?.trees_equivalent_annual || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Árboles absorbiendo carbono por 1 año
          </div>
        </div>

        {/* Agua Virtual Conservada */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Agua Virtual Ahorrada
            </span>
            <Droplets size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
            {Number(summary?.potential_basket_water_savings_l || 0).toLocaleString('es-CL')} L
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Litros preservados por canasta
          </div>
        </div>
      </div>

      {/* Educational Explanation Box */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={20} color="var(--primary-light)" />
          <span>Fórmulas Científicas y Metodología de Cálculo</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.88rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
          <div>
            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.2rem' }}>1. Huella de Carbono y Equivalencias</strong>
            Calculada a partir de los balances de ciclo de vida (LCA) de <em>Agribalyse</em> y <em>CarbonCloud</em>. La conversión de árboles equivalentes utiliza el factor estándar de la EPA: un árbol urbano maduro absorbe ~21.77 kg de CO₂ al año.
          </div>
          <div>
            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.2rem' }}>2. Agua Virtual y Envases Circulares</strong>
            El consumo de agua virtual evalúa el estrés hídrico de la cadena de suministro (riego de pastos y ganadería vs. legumbres y avena de secano). Los envases a granel y retornables eliminan el 100% de la carga de plástico de un solo uso.
          </div>
          <div>
            <strong style={{ color: '#ffffff', display: 'block', marginBottom: '0.2rem' }}>3. Ahorro Económico en Retail Chileno</strong>
            Los precios corresponden a valores reales del mercado nacional. El ahorro considera la eliminación de intermediarios mediante cooperativas agrícolas y recargas a granel (modelo Algramo).
          </div>
        </div>
      </div>
    </div>
  );
}
