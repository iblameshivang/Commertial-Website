import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Star, 
  Plus, 
  Flame, 
  ArrowRight, 
  Eye,
  Heart
} from 'lucide-react';
import { SIGNATURE_DISHES } from '../data/menuData';

export default function SignatureDishes({ onSelectDish, onAddToCart, onExploreFullMenu }) {
  return (
    <section id="signatures" className="py-24 sm:py-32 bg-noir-950 relative overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/30 mb-4"
            >
              <Flame className="w-3.5 h-3.5 text-gold-400" />
              <span>Masterpiece Creations</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
            >
              Chef’s Signature <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-amber-500 font-normal italic">Highlights</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 text-stone-400 text-sm sm:text-base max-w-xl font-light"
            >
              Hand-picked culinary jewels celebrated across Solan for their rich flavours, authentic recipes, and aromatic perfection.
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            onClick={onExploreFullMenu}
            className="self-start md:self-auto group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-noir-950 transition-all duration-300 text-xs font-bold uppercase tracking-wider"
          >
            <span>Explore Full Menu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Signature Dishes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {SIGNATURE_DISHES.map((dish, index) => (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative rounded-3xl bg-noir-900 border border-white/10 hover:border-gold-500/50 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-gold-500/10 hover:-translate-y-1.5"
            >
              {/* Image Container with Zoom and Badge */}
              <div className="relative aspect-[4/3] overflow-hidden bg-noir-850">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-95 group-hover:brightness-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-noir-900/20 to-transparent" />

                {/* Top Tags: Veg/NonVeg + Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-md backdrop-blur-md ${dish.isVeg ? 'bg-emerald-950/80 border border-emerald-500/50' : 'bg-rose-950/80 border border-rose-500/50'}`}>
                      <span className={dish.isVeg ? 'veg-indicator' : 'nonveg-indicator'} />
                    </span>
                    {dish.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-noir-950 shadow-md">
                        {dish.badge}
                      </span>
                    )}
                  </div>

                  {/* Rating Pill */}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-noir-950/80 backdrop-blur-md border border-white/10 text-gold-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-gold-400" />
                    <span>{dish.rating}</span>
                  </span>
                </div>

                {/* Quick View Button on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                  <button
                    onClick={() => onSelectDish(dish)}
                    className="px-4 py-2 rounded-full bg-noir-950/90 text-gold-300 border border-gold-500/40 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-gold-500 hover:text-noir-950 transition-colors shadow-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Recipe Details</span>
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-serif text-lg font-bold text-white group-hover:text-gold-300 transition-colors">
                      {dish.name}
                    </h3>
                  </div>
                  <p className="text-[11px] text-gold-400/90 font-medium tracking-wide">
                    {dish.nameHindi}
                  </p>

                  <p className="mt-2.5 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>
                </div>

                {/* Price & Add to Cart Action */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest block">Price</span>
                    <span className="text-xl font-bold font-serif text-white">
                      ₹{dish.price}
                    </span>
                  </div>

                  <button
                    onClick={() => onAddToCart(dish)}
                    className="px-3.5 py-2 rounded-xl bg-gold-500/10 hover:bg-gold-500 text-gold-300 hover:text-noir-950 border border-gold-500/30 transition-all duration-300 flex items-center gap-1.5 text-xs font-bold tracking-wider"
                    aria-label={`Add ${dish.name} to cart`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
