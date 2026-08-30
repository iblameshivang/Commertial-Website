import React from 'react';
import { 
  Sparkles, 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  ArrowUp
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function Footer({ onExploreMenu, onOpenReservation, onOpenCart, onOpenAdminOrders, isStaffLoggedIn, onLogoutStaff }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-noir-950 border-t border-white/10 text-stone-300 relative pt-20 pb-24 sm:pb-12 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-500/40 bg-noir-900 flex items-center justify-center text-gold-400 shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-wider text-white uppercase">
                  {RESTAURANT_INFO.name}
                </span>
                <span className="block text-[11px] tracking-widest text-gold-400 uppercase">
                  {RESTAURANT_INFO.nameHindi} • Solan
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed font-light">
              {RESTAURANT_INFO.tagline}. Bringing timeless North Indian, tandoori, and multi-cuisine culinary mastery to Solan, Himachal Pradesh.
            </p>

            {/* Social Links with crisp SVGs */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={RESTAURANT_INFO.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-noir-900 border border-white/10 text-stone-400 hover:text-gold-400 hover:border-gold-500/40 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a
                href={RESTAURANT_INFO.contact.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-noir-900 border border-white/10 text-stone-400 hover:text-gold-400 hover:border-gold-500/40 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/${RESTAURANT_INFO.contact.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-noir-900 border border-white/10 text-stone-400 hover:text-emerald-400 hover:border-emerald-500/40 flex items-center justify-center transition-colors text-xs font-bold font-mono"
                aria-label="WhatsApp"
              >
                WA
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <a href="#story" className="hover:text-gold-400 transition-colors">Our Story</a>
              </li>
              <li>
                <a href="#signatures" className="hover:text-gold-400 transition-colors">Signature Dishes</a>
              </li>
              <li>
                <a href="#menu" className="hover:text-gold-400 transition-colors">Full Menu</a>
              </li>
              <li>
                <a href="#services" className="hover:text-gold-400 transition-colors">Our Services</a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-gold-400 transition-colors">Reviews & Ratings</a>
              </li>
              <li>
                <a href="#location" className="hover:text-gold-400 transition-colors">Location & Map</a>
              </li>
            </ul>
          </div>

          {/* Dining Services */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Experiences
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={onOpenReservation} className="hover:text-gold-400 transition-colors text-left">
                  Reserve a Table
                </button>
              </li>
              <li>
                <button onClick={onOpenCart} className="hover:text-gold-400 transition-colors text-left">
                  WhatsApp Direct Order
                </button>
              </li>
              {isStaffLoggedIn ? (
                <>
                  <li>
                    <button onClick={onOpenAdminOrders} className="hover:text-gold-400 transition-colors text-left">
                      Admin Order Log
                    </button>
                  </li>
                  {onLogoutStaff && (
                    <li>
                      <button onClick={onLogoutStaff} className="hover:text-red-300 transition-colors text-left">
                        Logout Staff
                      </button>
                    </li>
                  )}
                </>
              ) : (
                <li>
                  <button onClick={onOpenAdminOrders} className="hover:text-gold-400 transition-colors text-left">
                    Staff Login
                  </button>
                </li>
              )}
              <li>
                <a href={`tel:${RESTAURANT_INFO.contact.phoneRaw}`} className="hover:text-gold-400 transition-colors">
                  Drive-Through Takeaway
                </a>
              </li>
              <li>
                <span className="text-stone-500">Party & Catering in Solan</span>
              </li>
            </ul>
          </div>

          {/* Contact & Location Details */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Restaurant Details
            </h4>
            <div className="space-y-2.5 text-xs text-stone-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>
                  {RESTAURANT_INFO.location.address} <br />
                  <span className="text-gold-400 font-medium">({RESTAURANT_INFO.location.landmark})</span>
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <a href={`tel:${RESTAURANT_INFO.contact.phoneRaw}`} className="hover:text-white font-medium text-stone-200">
                  {RESTAURANT_INFO.contact.phoneDisplay}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-400 shrink-0" />
                <span>{RESTAURANT_INFO.hours.display}</span>
              </p>
              <p className="text-[11px] text-stone-500 font-mono pt-1">
                Plus Code: {RESTAURANT_INFO.location.plusCode}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Chef’s Planet (चीफ्स प्लैनेट). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Crafted with passion in Solan, HP</span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-noir-900 hover:bg-gold-500 hover:text-noir-950 border border-white/10 text-stone-400 transition-colors"
              aria-label="Back to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
