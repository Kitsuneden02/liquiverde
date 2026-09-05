import React from 'react';
import { ShoppingCart } from 'lucide-react';

export default function CartFloatingButton({ isOpen, onToggle, itemCount = 0, totalAmount = 0 }) {
  return (
    <button
      id="floating-cart-btn"
      className="cart-fab"
      onClick={onToggle}
      aria-label="Ver canasta de compra"
      title={itemCount > 0 ? `Canasta (${itemCount} productos) - $${totalAmount.toLocaleString('es-CL')}` : 'Canasta vacía'}
    >
      <div className="cart-fab-icon-wrap">
        <ShoppingCart size={21} color="var(--primary-light)" />
        {itemCount > 0 && (
          <span className="cart-fab-badge" key={itemCount}>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', letterSpacing: '0.01em' }}>
          Mi Canasta
        </span>
        {itemCount > 0 ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 600 }}>
            ${totalAmount.toLocaleString('es-CL')}
          </span>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Vacía
          </span>
        )}
      </div>
    </button>
  );
}
