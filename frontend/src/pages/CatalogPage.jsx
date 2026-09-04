import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, RefreshCw, X, Leaf, ShieldCheck } from 'lucide-react';
import { fetchProducts, fetchCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { formatCategoryName } from '../utils/formatters';

export default function CatalogPage({
  onSelectForCompare,
  onToggleBasket,
  basketProductIds,
  onOpenDetails
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEcoScore, setSelectedEcoScore] = useState('');
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyFairTrade, setOnlyFairTrade] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        fetchProducts({
          q: searchQuery,
          category: selectedCategory,
          eco_score: selectedEcoScore,
          organic: onlyOrganic,
          fair_trade: onlyFairTrade
        }),
        fetchCategories()
      ]);
      setProducts(prodsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Error loading catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedEcoScore, onlyOrganic, onlyFairTrade]);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Hero Header */}
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
          <Sparkles size={14} /> Retail Consciente y Canastas Inteligentes
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Catálogo de Productos Sostenibles
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Compara huellas de carbono, grados Eco-Score y orígenes locales para tomar decisiones de compra que ahorren dinero y cuiden el planeta.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, marca o código EAN..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.7rem 1rem 0.7rem 2.6rem',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Eco-Score Filter */}
          <select
            value={selectedEcoScore}
            onChange={(e) => setSelectedEcoScore(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.7rem 1rem',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="" style={{ background: '#0e221b' }}>Cualquier Eco-Score</option>
            <option value="a" style={{ background: '#0e221b' }}>Eco-Score A (Excelente)</option>
            <option value="b" style={{ background: '#0e221b' }}>Eco-Score B (Muy Bueno)</option>
            <option value="c" style={{ background: '#0e221b' }}>Eco-Score C (Moderado)</option>
            <option value="d" style={{ background: '#0e221b' }}>Eco-Score D (Alto impacto)</option>
            <option value="e" style={{ background: '#0e221b' }}>Eco-Score E (Crítico)</option>
          </select>

          {/* Organic Toggle */}
          <button
            onClick={() => setOnlyOrganic(!onlyOrganic)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: onlyOrganic ? 'var(--primary-light)' : 'var(--border-light)',
              background: onlyOrganic ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: onlyOrganic ? 'var(--primary-light)' : 'var(--text-sub)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Leaf size={15} />
            <span>Orgánicos</span>
          </button>

          {/* Fair Trade Toggle */}
          <button
            onClick={() => setOnlyFairTrade(!onlyFairTrade)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: onlyFairTrade ? '#fbbf24' : 'var(--border-light)',
              background: onlyFairTrade ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: onlyFairTrade ? '#fbbf24' : 'var(--text-sub)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={15} />
            <span>Comercio Justo</span>
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button
            onClick={() => setSelectedCategory('')}
            style={{
              whiteSpace: 'nowrap',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: selectedCategory === '' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              transition: 'all 0.15s'
            }}
          >
            Todas las Categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedCategory === cat ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                transition: 'all 0.15s'
              }}
            >
              {formatCategoryName(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Results Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Mostrando <strong style={{ color: '#ffffff' }}>{products.length}</strong> productos
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--primary-light)' }} />
          <div>Cargando productos sustentables...</div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Leaf size={42} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '0.8rem' }} />
          <h3>No se encontraron productos con estos filtros</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
            Prueba ajustando el término de búsqueda o seleccionando otra categoría.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectForCompare={onSelectForCompare}
              onToggleBasket={onToggleBasket}
              isInBasket={basketProductIds.includes(product.id)}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
