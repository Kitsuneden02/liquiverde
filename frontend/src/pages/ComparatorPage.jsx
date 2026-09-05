import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
  Leaf,
  DollarSign,
  Droplets,
  ShieldCheck,
  Search,
  ChevronDown,
  X,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { fetchProducts, fetchSubstitutes } from '../services/api';
import { formatCategoryName } from '../utils/formatters';

function ProductThumbnail({
  src,
  alt,
  width = 110,
  height = 110,
  fallbackIcon: FallbackIcon = Leaf,
  tint = 'emerald'
}) {
  const [error, setError] = useState(false);

  const bg =
    tint === 'red'
      ? 'radial-gradient(circle at 50% 50%, rgba(45, 20, 20, 0.6) 0%, rgba(18, 7, 7, 0.95) 100%)'
      : 'radial-gradient(circle at 50% 50%, rgba(20, 50, 40, 0.5) 0%, rgba(7, 18, 14, 0.95) 100%)';

  const borderColor =
    tint === 'red' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';

  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem',
        border: `1px solid ${borderColor}`,
        overflow: 'hidden'
      }}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55))',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.06)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ) : (
        <FallbackIcon
          size={36}
          color={tint === 'red' ? '#f87171' : 'var(--primary-light)'}
          style={{ opacity: 0.7 }}
        />
      )}
    </div>
  );
}

const QUICK_SUGGESTIONS = [
  { label: '🥛 Leche Entera UHT', query: 'Leche Natural Entera' },
  { label: '🥩 Carne Molida Vacuno', query: 'Carne Molida Vacuno' },
  { label: '⚡ Powerade Zero', query: 'Powerade' },
  { label: '🍚 Arroz Blanco', query: 'Arroz Blanco' },
  { label: '🧼 Detergente Líquido', query: 'Detergente' },
  { label: '🍞 Pan de Molde', query: 'Pan' }
];

export default function ComparatorPage({
  initialProduct,
  onToggleBasket,
  basketProductIds = [],
  onOpenDetails
}) {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(initialProduct || null);
  const [substitutes, setSubstitutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter State for Product Selector
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data);
      if (!selectedProduct && data.length > 0) {
        if (initialProduct) {
          setSelectedProduct(initialProduct);
        } else {
          // Selecciona por defecto un producto convencional con alto CO2 para demostrar la sustitución
          const defaultOrig =
            data.find((p) => p.co2_kg >= 2.0 && p.substitute_id) || data[0];
          setSelectedProduct(defaultOrig);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (selectedProduct) {
      loadSubstitutes(selectedProduct.id);
    }
  }, [selectedProduct]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Categories list computed dynamically
  const categories = useMemo(() => {
    const uniqueCats = Array.from(
      new Set(allProducts.map((p) => p.category).filter(Boolean))
    );
    return [
      { id: 'all', label: 'Todas las categorías' },
      ...uniqueCats.map((cat) => ({ id: cat, label: formatCategoryName(cat) }))
    ];
  }, [allProducts]);

  // Filtered products for the search picker
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesCat =
        selectedCategory === 'all' || p.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCat;

      const matchesName = (p.name || '').toLowerCase().includes(query);
      const matchesBrand = (p.brand || '').toLowerCase().includes(query);
      const matchesBarcode = (p.barcode || '').includes(query);
      const matchesCatText = formatCategoryName(p.category).toLowerCase().includes(query);

      return matchesCat && (matchesName || matchesBrand || matchesBarcode || matchesCatText);
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const handleSelectSuggestion = (searchPattern) => {
    const found = allProducts.find(
      (p) =>
        p.name.toLowerCase().includes(searchPattern.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchPattern.toLowerCase()))
    );
    if (found) {
      setSelectedProduct(found);
      setIsPickerOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Comparador Lado a Lado de Alternativas
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            maxWidth: '680px',
            margin: '0 auto',
            fontSize: '0.95rem'
          }}
        >
          Analiza cualquier producto convencional y descubre alternativas
          ecológicas que reducen tu huella de carbono y bajan el costo de tu
          boleta de supermercado.
        </p>
      </div>

      {/* Modern Searchable Product Selector */}
      <div
        ref={selectorRef}
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <label
            style={{
              fontWeight: 600,
              fontSize: '0.88rem',
              color: 'var(--text-sub)'
            }}
          >
            Producto a analizar para encontrar sustitutos:
          </label>
          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.9rem',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Search size={14} />
            <span>
              {isPickerOpen ? 'Cerrar selector' : 'Explorar / Cambiar producto'}
            </span>
            <ChevronDown
              size={14}
              style={{
                transform: isPickerOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>
        </div>

        {/* Selected Product Hero Strip (When selector is closed) */}
        {selectedProduct && (
          <div
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.5)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: 'var(--radius-sm)',
                background:
                  'radial-gradient(circle, rgba(20, 50, 40, 0.6) 0%, rgba(7, 18, 14, 0.9) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.2rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                flexShrink: 0
              }}
            >
              {selectedProduct.image_url ? (
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <Leaf size={22} color="var(--primary-light)" />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--primary-light)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {formatCategoryName(selectedProduct.category)}
                </span>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                  {selectedProduct.brand || 'Marca Local'}
                </span>
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginTop: '0.2rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {selectedProduct.name}
              </div>
            </div>

            {/* Eco Score & Price */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <span
                className={`badge-eco badge-eco-${(
                  selectedProduct.eco_score || 'c'
                ).toLowerCase()}`}
              >
                {(selectedProduct.eco_score || 'c').toUpperCase()}
              </span>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#ffffff'
                }}
              >
                ${Number(selectedProduct.price).toLocaleString('es-CL')}
              </div>
              <ChevronDown size={18} color="var(--text-muted)" />
            </div>
          </div>
        )}

        {/* Dropdown / Search Modal Drawer */}
        {isPickerOpen && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '1.25rem',
              background: 'rgba(11, 26, 20, 0.98)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
              <Search
                size={18}
                color="var(--text-muted)"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, marca o código EAN-13 (ej: leche, powerade, carne, arroz)..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem 2.4rem 0.75rem 2.8rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.2rem'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                overflowX: 'auto',
                paddingBottom: '0.65rem',
                marginBottom: '0.75rem'
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background:
                      selectedCategory === cat.id
                        ? 'var(--primary)'
                        : 'rgba(255, 255, 255, 0.06)',
                    color:
                      selectedCategory === cat.id ? '#ffffff' : 'var(--text-sub)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scrollable Product List */}
            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                paddingRight: '0.25rem'
              }}
            >
              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                  }}
                >
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProduct && selectedProduct.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setIsPickerOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected
                          ? 'rgba(16, 185, 129, 0.16)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected
                          ? '1px solid var(--primary-light)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background =
                            'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor =
                            'rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background =
                            'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-sm)',
                          background:
                            'radial-gradient(circle, rgba(20, 50, 40, 0.5) 0%, rgba(7, 18, 14, 0.9) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.2rem',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          flexShrink: 0
                        }}
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain'
                            }}
                          />
                        ) : (
                          <Leaf size={18} color="var(--primary-light)" />
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-sub)',
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-full)'
                            }}
                          >
                            {formatCategoryName(p.category)}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)'
                            }}
                          >
                            {p.brand}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#ffffff',
                            marginTop: '0.15rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {p.name}
                        </div>
                      </div>

                      {/* Eco Score & Price */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          flexShrink: 0
                        }}
                      >
                        <span
                          className={`badge-eco badge-eco-${(
                            p.eco_score || 'c'
                          ).toLowerCase()}`}
                          style={{ transform: 'scale(0.85)' }}
                        >
                          {(p.eco_score || 'c').toUpperCase()}
                        </span>
                        <div
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#ffffff'
                          }}
                        >
                          ${Number(p.price).toLocaleString('es-CL')}
                        </div>
                        {isSelected && (
                          <Check size={16} color="var(--primary-light)" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Quick Suggestions Chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '0.9rem'
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            Comparaciones sugeridas:
          </span>
          {QUICK_SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(item.query)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-sub)',
                borderRadius: 'var(--radius-full)',
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                e.currentTarget.style.color = 'var(--primary-light)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-sub)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Grid */}
      {selectedProduct && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem',
            alignItems: 'start'
          }}
        >
          {/* Left Column: Original Conventional Product */}
          <div
            className="glass-panel"
            style={{
              padding: '1.8rem',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            {/* Top Label & Badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Producto Convencional Original
              </div>
              <span
                className={`badge-eco badge-eco-${(
                  selectedProduct.eco_score || 'c'
                ).toLowerCase()}`}
              >
                {(selectedProduct.eco_score || 'c').toUpperCase()}
              </span>
            </div>

            {/* Product Image Container */}
            <div
              onClick={() => onOpenDetails && onOpenDetails(selectedProduct)}
              style={{
                height: '210px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle at 50% 50%, rgba(45, 20, 20, 0.55) 0%, rgba(14, 20, 18, 0.95) 100%)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                padding: '0.85rem',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                overflow: 'hidden',
                cursor: onOpenDetails ? 'pointer' : 'default',
                position: 'relative'
              }}
            >
              <ProductThumbnail
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                width="100%"
                height="100%"
                tint="red"
              />
            </div>

            {/* Title & Brand */}
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {selectedProduct.brand || 'Marca Convencional'}
              </div>
              <h3
                onClick={() => onOpenDetails && onOpenDetails(selectedProduct)}
                style={{
                  fontSize: '1.25rem',
                  lineHeight: 1.3,
                  marginTop: '0.15rem',
                  cursor: onOpenDetails ? 'pointer' : 'default',
                  transition: 'color 0.15s'
                }}
                onMouseOver={(e) => {
                  if (onOpenDetails) e.currentTarget.style.color = '#f87171';
                }}
                onMouseOut={(e) => {
                  if (onOpenDetails) e.currentTarget.style.color = '#ffffff';
                }}
              >
                {selectedProduct.name}
              </h3>
            </div>

            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: '0.5rem 0 1.25rem'
              }}
            >
              ${Number(selectedProduct.price).toLocaleString('es-CL')}
            </div>

            {/* Technical Specs List */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.85rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Huella de Carbono
                </span>
                <strong style={{ color: '#f87171' }}>
                  {selectedProduct.co2_kg} kg CO₂e
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Agua Virtual</span>
                <strong style={{ color: 'var(--text-sub)' }}>
                  {selectedProduct.water_liters} L
                </strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Tipo de Empaque
                </span>
                <span style={{ color: 'var(--text-sub)' }}>
                  {selectedProduct.packaging_type || 'Plástico estándar'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Origen</span>
                <span style={{ color: 'var(--text-sub)' }}>
                  {selectedProduct.origin || 'Importado / Industrial'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Puntaje Sostenibilidad
                </span>
                <strong style={{ color: 'var(--text-main)' }}>
                  {selectedProduct.sustainability_score} / 100
                </strong>
              </div>

              {/* Add to Basket Action for Conventional Product */}
              {onToggleBasket && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onToggleBasket(selectedProduct)}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      background: basketProductIds.includes(selectedProduct.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      borderColor: basketProductIds.includes(selectedProduct.id) ? 'var(--primary-light)' : 'var(--border-light)',
                      color: basketProductIds.includes(selectedProduct.id) ? 'var(--primary-light)' : '#ffffff'
                    }}
                  >
                    <Check size={16} />
                    <span>
                      {basketProductIds.includes(selectedProduct.id)
                        ? 'En mi canasta'
                        : 'Añadir a mi Canasta'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recommended Green Alternatives */}
          <div>
            <div
              style={{
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
              }}
            >
              <Sparkles size={14} /> Alternativas Verdes y Ahorro Sugeridas
            </div>

            {loading ? (
              <div
                className="glass-panel"
                style={{
                  padding: '3.5rem 2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <RefreshCw
                  size={26}
                  className="animate-spin"
                  style={{
                    margin: '0 auto 0.6rem',
                    color: 'var(--primary-light)'
                  }}
                />
                <div>Buscando alternativas ecológicas óptimas...</div>
              </div>
            ) : substitutes.length === 0 ? (
              <div
                className="glass-panel"
                style={{ padding: '2.5rem 2rem', textAlign: 'center' }}
              >
                <Check
                  size={36}
                  color="var(--primary-light)"
                  style={{ margin: '0 auto 0.6rem' }}
                />
                <h3>Este producto ya es una opción líder en sostenibilidad</h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginTop: '0.4rem'
                  }}
                >
                  No existen alternativas de menor huella o costo significativamente
                  mejor en esta categoría.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}
              >
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
                        border:
                          idx === 0
                            ? '1px solid rgba(52, 211, 153, 0.5)'
                            : '1px solid var(--border-light)',
                        boxShadow:
                          idx === 0
                            ? '0 0 24px rgba(16, 185, 129, 0.15)'
                            : 'none'
                      }}
                    >
                      {/* Top banner if best match */}
                      {idx === 0 && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--primary-light)',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Sparkles size={14} /> MEJOR OPCIÓN RECOMENDADA
                        </div>
                      )}

                      {/* Header with Product Image & Essential Details */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '1.15rem',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          background: 'rgba(0, 0, 0, 0.22)',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(16, 185, 129, 0.15)'
                        }}
                      >
                        {/* Thumbnail Image */}
                        <div
                          onClick={() => onOpenDetails && onOpenDetails(alt)}
                          style={{
                            cursor: onOpenDetails ? 'pointer' : 'default'
                          }}
                        >
                          <ProductThumbnail
                            src={alt.image_url}
                            alt={alt.name}
                            width={105}
                            height={105}
                            tint="emerald"
                          />
                        </div>

                        {/* Title, Brand, Eco-Score & Price */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '0.5rem'
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}
                              >
                                {alt.brand}
                              </div>
                              <h4
                                onClick={() =>
                                  onOpenDetails && onOpenDetails(alt)
                                }
                                style={{
                                  fontSize: '1.15rem',
                                  marginTop: '0.15rem',
                                  lineHeight: 1.3,
                                  cursor: onOpenDetails ? 'pointer' : 'default',
                                  transition: 'color 0.15s'
                                }}
                                onMouseOver={(e) => {
                                  if (onOpenDetails)
                                    e.currentTarget.style.color =
                                      'var(--primary-light)';
                                }}
                                onMouseOut={(e) => {
                                  if (onOpenDetails)
                                    e.currentTarget.style.color = '#ffffff';
                                }}
                              >
                                {alt.name}
                              </h4>
                            </div>
                            <span
                              className={`badge-eco badge-eco-${(
                                alt.eco_score || 'a'
                              ).toLowerCase()}`}
                              style={{ flexShrink: 0 }}
                            >
                              {(alt.eco_score || 'a').toUpperCase()}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: '0.4rem',
                              marginTop: '0.4rem'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '1.35rem',
                                fontWeight: 800,
                                color: '#ffffff'
                              }}
                            >
                              ${Number(alt.price).toLocaleString('es-CL')}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              / {alt.unit || 'unidad'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Green Delta Badges */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.85rem'
                        }}
                      >
                        {priceDiff > 0 && (
                          <div
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <DollarSign size={14} />
                            Ahorras ${Number(priceDiff).toLocaleString('es-CL')}
                          </div>
                        )}
                        {co2Reduction > 0 && (
                          <div
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Leaf size={14} />
                            Evitas {co2Reduction} kg CO₂e
                          </div>
                        )}
                        {sub.water_saved_liters > 100 && (
                          <div
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <Droplets size={14} />
                            Conservas {Math.round(sub.water_saved_liters)} L agua
                          </div>
                        )}
                      </div>

                      {/* Natural language reasoning */}
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-sub)',
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          lineHeight: 1.45,
                          marginBottom: '1.1rem'
                        }}
                      >
                        💡{' '}
                        <em>
                          {sub.recommendation_reason
                            ? sub.recommendation_reason.replace(/\s*CLP\b/gi, '')
                            : ''}
                        </em>
                      </p>

                      {/* Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center'
                        }}
                      >
                        <button
                          onClick={() => onToggleBasket && onToggleBasket(alt)}
                          className="btn-primary"
                          style={{
                            padding: '0.55rem 1.15rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          <Check size={16} />
                          <span>
                            {basketProductIds.includes(alt.id)
                              ? 'En mi canasta'
                              : 'Adoptar Sustituto'}
                          </span>
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
