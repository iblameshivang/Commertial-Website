import React from 'react';
import { Phone, Utensils, Navigation, ShoppingBag } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function MobileStickyBar({ onOpenCart, onExploreMenu, cartCount }) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-noir-950/95 backdrop-blur-xl border-t border-gold-500/20 px-3 py-2 flex items-center justify-around shadow-2xl">
      {/* Call */}
      <a
        href={`tel:${RESTAURANT_INFO.contact.phoneRaw}`}
        className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-gold-400 py-1"
      >
        <Phone className="w-4 h-4 text-gold-400" />
        <span className="text-[10px] font-medium tracking-tight">Call</span>
      </a>

      {/* Menu */}
      <button
        onClick={onExploreMenu}
        className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-gold-400 py-1"
      >
        <Utensils className="w-4 h-4 text-gold-400" />
        <span className="text-[10px] font-medium tracking-tight">Menu</span>
      </button>

      {/* Directions */}
      <a
        href={RESTAURANT_INFO.location.googleMapsDirectionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-gold-400 py-1"
      >
        <Navigation className="w-4 h-4 text-gold-400" />
        <span className="text-[10px] font-medium tracking-tight">Directions</span>
      </a>

      {/* Order Online CTA */}
      <button
        onClick={onOpenCart}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 text-noir-950 font-bold text-xs shadow-md shadow-gold-500/20"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Order</span>
        {cartCount > 0 && (
          <span className="bg-noir-950 text-gold-400 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
