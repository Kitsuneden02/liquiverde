import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Star, Tag, RefreshCw, Compass, Search, Filter, Store as StoreIcon, Leaf, Sparkles, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchStores } from '../services/api';

// Configurar ícono personalizado de Leaflet para evitar problemas de asset bundle
const ecoIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente auxiliar para animar el paneo del mapa cuando se selecciona una tienda en la lista
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const STORE_CATEGORIES = [
  { id: 'all', label: 'Todos los Puntos' },
  { id: 'mercados', label: 'Vegas y Mercados' },
  { id: 'ferias', label: 'Ferias Agroecológicas' },
  { id: 'granel', label: 'Tiendas a Granel' },
  { id: 'circular_vegan', label: 'Economía Circular y Vegano' }
];

const STORE_TYPE_LABELS = {
  mercado_popular: { label: 'Mercado Popular', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  feria_agroecologica: { label: 'Feria Agroecológica', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  mercado_organico: { label: 'Mercado Orgánico', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
  tienda_granel: { label: 'Tienda a Granel', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)' },
  zero_waste_dispenser: { label: 'Dispensador Circular', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' },
  tienda_vegana: { label: 'Emporio Vegano', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' }
};

export default function StoreMapPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [mapCenter, setMapCenter] = useState([-33.4440, -70.6350]); // Santiago Centro
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStores()
      .then((data) => {
        setStores(data);
        if (data.length > 0) setSelectedStore(data[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      // Filtro por categoría
      if (selectedCategory === 'mercados' && store.store_type !== 'mercado_popular') {
        return false;
      }
      if (selectedCategory === 'ferias' && store.store_type !== 'feria_agroecologica' && store.store_type !== 'mercado_organico') {
        return false;
      }
      if (selectedCategory === 'granel' && store.store_type !== 'tienda_granel') {
        return false;
      }
      if (selectedCategory === 'circular_vegan' && store.store_type !== 'zero_waste_dispenser' && store.store_type !== 'tienda_vegana') {
        return false;
      }

      // Filtro por texto de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = store.name.toLowerCase().includes(query);
        const matchesAddress = store.address.toLowerCase().includes(query);
        const matchesDesc = (store.description || '').toLowerCase().includes(query);
        return matchesName || matchesAddress || matchesDesc;
      }

      return true;
    });
  }, [stores, selectedCategory, searchQuery]);

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setMapCenter([store.latitude, store.longitude]);
    setMapZoom(14);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
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
          <Compass size={14} /> Geolocalización y Puntos de Abastecimiento Local
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Mapa de Tiendas Sostenibles y Rutas
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
          Encuentra mercados populares, ferias agroecológicas, dispensadores circulares Algramo y almacenes a granel en Santiago para abastecer tu canasta reduciendo emisiones de transporte y residuos plásticos.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-panel" style={{
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Pestañas de categoría */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {STORE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--primary-light)' : '1px solid var(--border-light)',
                  background: isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? 'var(--primary-light)' : 'var(--text-sub)',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Buscador */}
        <div style={{
          position: 'relative',
          minWidth: '260px',
          flex: '1 1 240px',
          maxWidth: '360px'
        }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, comuna o dirección..."
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem 0.5rem 2.4rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              background: 'rgba(0, 0, 0, 0.35)',
              color: '#ffffff',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>

      {/* Cuadrícula Principal: Lista Lateral + Mapa */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Barra Lateral de Tiendas */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <StoreIcon size={18} color="var(--primary-light)" />
              Puntos Recomendados ({filteredStores.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              Santiago, Chile
            </span>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary-light)' }} />
              <div>Cargando comercios ecológicos...</div>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Leaf size={28} style={{ margin: '0 auto 0.5rem', color: 'var(--text-sub)' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>No se encontraron comercios con los filtros aplicados.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="btn-outline"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              maxHeight: '620px',
              overflowY: 'auto',
              paddingRight: '0.35rem'
            }}>
              {filteredStores.map((store) => {
                const isSelected = selectedStore?.id === store.id;
                const typeInfo = STORE_TYPE_LABELS[store.store_type] || {
                  label: store.store_type,
                  color: 'var(--primary-light)',
                  bg: 'rgba(16, 185, 129, 0.12)'
                };

                return (
                  <div
                    key={store.id}
                    className="glass-panel"
                    onClick={() => handleSelectStore(store)}
                    style={{
                      padding: '1.1rem',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--primary-light)' : '1px solid var(--border-light)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-glass-card)',
                      transition: 'all 0.15s ease',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: isSelected ? 'var(--primary-light)' : '#ffffff', lineHeight: 1.3 }}>
                        {store.name}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        color: '#fbbf24',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        <Star size={14} fill="#fbbf24" />
                        {store.rating_eco}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        background: typeInfo.bg,
                        color: typeInfo.color,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}>
                        {typeInfo.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                      <MapPin size={13} style={{ flexShrink: 0, color: 'var(--primary-light)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store.address}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {store.discount_green > 0 && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          <Tag size={12} />
                          {store.discount_green}% Descuento Verde
                        </div>
                      )}
                      <span style={{ fontSize: '0.75rem', color: isSelected ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {isSelected ? '● Seleccionado' : 'Ver en mapa →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mapa Interactivo con Leaflet */}
        <div>
          <div className="glass-panel" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ height: '520px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <ChangeView center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredStores.map((store) => (
                  <Marker
                    key={store.id}
                    position={[store.latitude, store.longitude]}
                    icon={ecoIcon}
                    eventHandlers={{
                      click: () => handleSelectStore(store)
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#0f172a', padding: '0.2rem', minWidth: '180px' }}>
                        <strong style={{ fontSize: '0.92rem', display: 'block', marginBottom: '0.2rem', color: '#0f172a' }}>
                          {store.name}
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.4rem' }}>
                          {store.address}
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          color: '#16a34a',
                          fontWeight: 700,
                          background: 'rgba(22, 163, 74, 0.1)',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px',
                          marginBottom: '0.45rem'
                        }}>
                          ⭐ {store.rating_eco} Eco-Rating | {store.discount_green}% Dcto Verde
                        </div>
                        <div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#059669',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              textDecoration: 'underline'
                            }}
                          >
                            <ExternalLink size={12} /> Trazar Ruta en Google Maps
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Ficha de Detalle de la Tienda Seleccionada */}
            {selectedStore && (
              <div style={{
                marginTop: '1rem',
                padding: '1.25rem',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--primary-light)', fontSize: '1.05rem' }}>
                      {selectedStore.name}
                    </strong>
                    {STORE_TYPE_LABELS[selectedStore.store_type] && (
                      <span style={{
                        background: STORE_TYPE_LABELS[selectedStore.store_type].bg,
                        color: STORE_TYPE_LABELS[selectedStore.store_type].color,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}>
                        {STORE_TYPE_LABELS[selectedStore.store_type].label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                    <MapPin size={13} color="var(--primary-light)" />
                    <span>{selectedStore.address}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', margin: 0, lineHeight: 1.4 }}>
                    {selectedStore.description}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Navigation size={15} />
                    <span>Cómo Llegar</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
