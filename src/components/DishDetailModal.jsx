import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Star, 
  Flame, 
  Sparkles, 
  Plus, 
  Minus, 
  Check, 
  ChefHat 
} from 'lucide-react';

export default function DishDetailModal({ dish, onClose, onAddToCart, cartQuantity, onUpdateQuantity }) {
  if (!dish) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-noir-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl rounded-3xl bg-noir-900 border border-gold-500/30 overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-noir-950/80 text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left / Top Image Stage */}
          <div className="md:w-1/2 relative min-h-[220px] md:min-h-full bg-noir-850">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-noir-900" />
            
            {/* Dietary Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className={`p-1.5 rounded-md backdrop-blur-md ${dish.isVeg ? 'bg-emerald-950/90 border border-emerald-500/50' : 'bg-rose-950/90 border border-rose-500/50'}`}>
                <span className={dish.isVeg ? 'veg-indicator' : 'nonveg-indicator'} />
              </span>
              {dish.isChefSpecial && (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gold-500 text-noir-950 flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Chef's Choice</span>
                </span>
              )}
            </div>
          </div>

          {/* Right / Content Stage */}
          <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gold-400 font-semibold tracking-wider uppercase">
                  {dish.category.replace('-', ' ')}
                </p>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {dish.name}
                </h3>
                <p className="text-xs text-gold-400/90 font-medium">
                  {dish.nameHindi}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-noir-950 border border-white/10 text-gold-400 font-bold text-xs flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-gold-400" />
                  <span>{dish.rating || 4.8}</span>
                </span>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Spice Level: {Array.from({ length: dish.spiceLevel || 1 }).map((_, i) => '🌶️')}</span>
                </span>
              </div>

              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed font-light">
                {dish.description}
              </p>

              {/* Chef Notes if available */}
              {dish.chefNote && (
                <div className="p-3 rounded-xl bg-gold-500/10 border border-gold-500/20 text-xs text-gold-300 flex items-start gap-2">
                  <ChefHat className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <span>{dish.chefNote}</span>
                </div>
              )}

              {/* Ingredients List */}
              {dish.ingredients && (
                <div>
                  <p className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold mb-2">
                    Key Ingredients & Notes:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {dish.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-noir-950 border border-white/10 text-[11px] text-stone-300"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block">Price</span>
                <span className="font-serif text-2xl font-bold text-white">₹{dish.price}</span>
              </div>

              {cartQuantity === 0 ? (
                <button
                  onClick={() => onAddToCart(dish)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-gold-500/20 hover:brightness-110 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Order</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-gold-500/15 border border-gold-500/40 rounded-xl p-1">
                  <button
                    onClick={() => onUpdateQuantity(dish.id, cartQuantity - 1)}
                    className="w-8 h-8 rounded-lg bg-noir-950 text-gold-300 flex items-center justify-center hover:bg-gold-500 hover:text-noir-950 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-white w-6 text-center">
                    {cartQuantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(dish.id, cartQuantity + 1)}
                    className="w-8 h-8 rounded-lg bg-gold-500 text-noir-950 flex items-center justify-center hover:brightness-110 transition-colors"
                  >
                    <Plus className="w-4 h-4 font-bold" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
