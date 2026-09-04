import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Tag, RefreshCw, Compass, ShieldCheck } from 'lucide-react';
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
  map.setView(center, zoom, { animate: true });
  return null;
}

export default function StoreMapPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [mapCenter, setMapCenter] = useState([-33.4421, -70.6272]); // Santiago Centro

  useEffect(() => {
    fetchStores()
      .then((data) => {
        setStores(data);
        if (data.length > 0) setSelectedStore(data[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setMapCenter([store.latitude, store.longitude]);
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
          <Compass size={14} /> Geolocalización & Puntos de Abastecimiento Local
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>
          Mapa de Tiendas Sostenibles & Rutas
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Encuentra cooperativas campesinas, ferias agroecológicas y dispensadores circulares Algramo en Santiago para abastecer tu canasta con mínimo trayecto de transporte.
        </p>
      </div>

      {/* Main Grid: List + Map */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        alignItems: 'start'
      }}>
        {/* Stores List Sidebar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Puntos Recomendados ({stores.length})</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>Santiago, Chile</span>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary-light)' }} />
              <div>Cargando comercios...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stores.map((store) => {
                const isSelected = selectedStore?.id === store.id;
                return (
                  <div
                    key={store.id}
                    className="glass-panel"
                    onClick={() => handleSelectStore(store)}
                    style={{
                      padding: '1.2rem',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--primary-light)' : '1px solid var(--border-light)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-glass-card)',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <h4 style={{ fontSize: '1.05rem', color: isSelected ? 'var(--primary-light)' : '#ffffff' }}>
                        {store.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700 }}>
                        <Star size={14} fill="#fbbf24" />
                        {store.rating_eco}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      <MapPin size={14} />
                      <span>{store.address}</span>
                    </div>

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
                        {store.discount_green}% Descuento en Compras Ecológicas
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Leaflet Interactive Map View */}
        <div>
          <div className="glass-panel" style={{ padding: '1rem', overflow: 'hidden' }}>
            <div style={{ height: '480px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <MapContainer
                center={mapCenter}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <ChangeView center={mapCenter} zoom={13} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {stores.map((store) => (
                  <Marker
                    key={store.id}
                    position={[store.latitude, store.longitude]}
                    icon={ecoIcon}
                    eventHandlers={{
                      click: () => setSelectedStore(store)
                    }}
                  >
                    <Popup>
                      <div style={{ color: '#000', padding: '0.2rem' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{store.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#555', margin: '0.2rem 0' }}>{store.address}</div>
                        <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                          ⭐ {store.rating_eco} Eco-Rating | {store.discount_green}% Dcto Verde
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Selected Store Detailed Footer */}
            {selectedStore && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.8rem'
              }}>
                <div>
                  <strong style={{ color: 'var(--primary-light)', fontSize: '0.95rem' }}>{selectedStore.name}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '0.2rem' }}>
                    {selectedStore.description}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStore.latitude},${selectedStore.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', textDecoration: 'none' }}
                >
                  <Navigation size={15} />
                  <span>Cómo Llegar</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
