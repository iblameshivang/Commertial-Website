import React from 'react';
import { motion } from 'framer-motion';
import { 
  Utensils, 
  Car, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

const iconMap = {
  Utensils: Utensils,
  Car: Car,
  ShieldCheck: ShieldCheck,
  Smartphone: Smartphone
};

export default function ServicesBanner({ onOpenReservation, onOpenCart }) {
  return (
    <section id="services" className="py-20 bg-noir-900 border-y border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
            Seamless Hospitality
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-2">
            Ways to Experience Chef’s Planet
          </h2>
          <p className="text-stone-400 text-sm mt-2 font-light">
            Whether you choose to dine under ambient chandeliers, grab a speedy road trip drive-through, or enjoy no-contact home delivery across Solan.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RESTAURANT_INFO.services.map((service, index) => {
            const Icon = iconMap[service.icon] || Utensils;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-noir-850 border border-white/5 hover:border-gold-500/30 hover:bg-noir-800 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-gold-500 group-hover:text-noir-950 transition-all duration-300 mb-4 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-gold-300 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  {service.id === 'dine-in' && (
                    <button
                      onClick={onOpenReservation}
                      className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <span>Book Table</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {service.id === 'order-online' && (
                    <button
                      onClick={onOpenCart}
                      className="text-xs font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <span>Order Now</span>
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {service.id === 'drive-through' && (
                    <a
                      href={`tel:${RESTAURANT_INFO.contact.phoneRaw}`}
                      className="text-xs font-semibold text-stone-300 hover:text-gold-400 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <span>Call Ahead: 01792 220 224</span>
                    </a>
                  )}
                  {service.id === 'no-contact-delivery' && (
                    <span className="text-[11px] text-emerald-400 font-medium">
                      ✓ Delivered hot & fresh in Solan
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
