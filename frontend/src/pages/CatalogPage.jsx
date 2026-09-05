import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  X,
  Leaf,
  ShieldCheck,
  ArrowUpDown,
  AlertCircle,
  Sparkles,
  ShoppingCart,
  Check,
  ArrowRight
} from 'lucide-react';
import { fetchProducts, fetchCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { formatCategoryName } from '../utils/formatters';
import { BASKET_PRESETS } from '../utils/presets';

export default function CatalogPage({
  onSelectForCompare,
  onToggleBasket,
  basketProductIds = [],
  onOpenDetails,
  scannedProductDiff = null,
  onLoadPresetBasket,
  onGoToOptimizer
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEcoScore, setSelectedEcoScore] = useState('');
  const [onlyOrganic, setOnlyOrganic] = useState(false);
  const [onlyFairTrade, setOnlyFairTrade] = useState(false);
  const [sortBy, setSortBy] = useState('sustainability_desc');

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      setError('No se pudo conectar con el catálogo. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedEcoScore, onlyOrganic, onlyFairTrade]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadCatalog]);

  // Smart Diff: Si el producto escaneado ya existe, no recarga ni parpadea. Si es nuevo, lo incorpora suavemente.
  useEffect(() => {
    if (!scannedProductDiff) return;

    const timer = setTimeout(() => {
      setProducts((prev) => {
        const alreadyExists = prev.some(
          (p) => p.id === scannedProductDiff.id || (p.barcode && p.barcode === scannedProductDiff.barcode)
        );
        if (alreadyExists) return prev;
        return [scannedProductDiff, ...prev];
      });

      if (scannedProductDiff.category) {
        setCategories((prev) =>
          prev.includes(scannedProductDiff.category) ? prev : [...prev, scannedProductDiff.category]
        );
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [scannedProductDiff]);


  // Organización y ordenamiento del catálogo (Por defecto: Mayor Sostenibilidad / Eco-Score)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (sortBy === 'sustainability_desc') {
        return (b.sustainability_score || 0) - (a.sustainability_score || 0);
      }
      if (sortBy === 'price_asc') {
        return (a.price || 0) - (b.price || 0);
      }
      if (sortBy === 'price_desc') {
        return (b.price || 0) - (a.price || 0);
      }
      if (sortBy === 'co2_asc') {
        return (a.co2_kg || 0) - (b.co2_kg || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [products, sortBy]);

  const [loadedPresetId, setLoadedPresetId] = useState(null);
  const [loadingPresetId, setLoadingPresetId] = useState(null);

  const isPresetInCart = useCallback(
    (preset) => {
      if (!basketProductIds || basketProductIds.length === 0) return false;
      return preset.productIds.every((id) => basketProductIds.includes(id));
    },
    [basketProductIds]
  );

  const handleLoadPreset = async (preset) => {
    if (!onLoadPresetBasket) return;
    setLoadingPresetId(preset.id);
    try {
      await onLoadPresetBasket(preset.productIds, preset.budget);
      setLoadedPresetId(preset.id);
      setTimeout(() => setLoadedPresetId(null), 2400);
    } catch (e) {
      console.error('Error loading preset into basket', e);
    } finally {
      setLoadingPresetId(null);
    }
  };

  const handleOptimizePreset = async (preset) => {
    setLoadingPresetId(preset.id);
    try {
      if (onLoadPresetBasket) {
        await onLoadPresetBasket(preset.productIds, preset.budget);
      }
      if (onGoToOptimizer) {
        onGoToOptimizer();
      }
    } catch (e) {
      console.error('Error optimizing preset', e);
    } finally {
      setLoadingPresetId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Hero Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Catálogo de Productos Sostenibles
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Compara huellas de carbono, grados Eco-Score y orígenes locales para tomar decisiones de compra que ahorren dinero y cuiden el planeta.
        </p>
      </div>

      {/* Plantillas Rápidas de Canasta */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              <Sparkles size={18} color="var(--primary-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Plantillas Rápidas de Canasta
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Canastas curadas listas para cargar a tu carrito o resolver con el Optimizador Inteligente
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {BASKET_PRESETS.map((preset) => {
            const inCart = isPresetInCart(preset);
            const isJustLoaded = loadedPresetId === preset.id;
            const isLoading = loadingPresetId === preset.id;

            return (
              <div
                key={preset.id}
                style={{
                  background: inCart ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${inCart ? 'var(--primary-light)' : 'rgba(52, 211, 153, 0.22)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-light)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = inCart ? 'var(--primary-light)' : 'rgba(52, 211, 153, 0.22)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '1.45rem' }}>{preset.icon}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {inCart && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#34d399',
                          background: 'rgba(52, 211, 153, 0.15)',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}>
                          <Check size={11} /> En Canasta
                        </span>
                      )}
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: 'var(--primary-light)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px'
                      }}>
                        ${preset.budget.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
                    {preset.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    {preset.summary}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset(preset)}
                    disabled={isLoading}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.5rem',
                      fontSize: '0.76rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                    title="Cargar productos en tu carrito"
                  >
                    {isJustLoaded ? (
                      <>
                        <Check size={14} color="#34d399" />
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Cargada</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={14} />
                        <span>{inCart ? 'Recargar' : 'Cargar'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOptimizePreset(preset)}
                    disabled={isLoading}
                    className="btn btn-primary"
                    style={{
                      flex: 1.15,
                      padding: '0.45rem 0.5rem',
                      fontSize: '0.76rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                    title="Cargar canasta e ir al Optimizador Inteligente"
                  >
                    <Sparkles size={13} />
                    <span>Optimizar</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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

      {/* Product Results Counter & Sort Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Mostrando <strong style={{ color: '#ffffff' }}>{sortedProducts.length}</strong> productos
        </span>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowUpDown size={14} color="var(--primary-light)" /> Ordenar:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.85rem',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="sustainability_desc" style={{ background: '#0e221b' }}>🌱 Mayor Sostenibilidad (Eco-Score)</option>
            <option value="price_asc" style={{ background: '#0e221b' }}>💰 Menor Precio ($ a $$$)</option>
            <option value="price_desc" style={{ background: '#0e221b' }}>🏷️ Mayor Precio ($$$ a $)</option>
            <option value="co2_asc" style={{ background: '#0e221b' }}>📉 Menor Huella CO₂</option>
            <option value="name_asc" style={{ background: '#0e221b' }}>🔤 Nombre (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--primary-light)' }} />
          <div>Cargando productos sustentables...</div>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <AlertCircle size={40} style={{ color: 'var(--error, #ef4444)', margin: '0 auto 1rem' }} />
          <h3>Error al cargar productos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.4rem', marginBottom: '1.25rem' }}>
            {error}
          </p>
          <button className="btn btn-primary" onClick={loadCatalog} style={{ margin: '0 auto' }}>
            <RefreshCw size={16} /> Reintentar
          </button>
        </div>
      ) : sortedProducts.length === 0 ? (

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
          {sortedProducts.map((product) => (
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
