import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Flame, 
  Star, 
  Plus, 
  Minus, 
  SlidersHorizontal, 
  Utensils,
  Eye,
  Info
} from 'lucide-react';
import { FULL_MENU, MENU_CATEGORIES } from '../data/menuData';

export default function MenuSection({ onSelectDish, onAddToCart, onUpdateQuantity, cartItems }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'non-veg', 'special'

  // Filter items based on Category, Search query, and Dietary preferences
  const filteredMenu = useMemo(() => {
    return FULL_MENU.filter((item) => {
      // Category filter
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      
      // Search filter
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameHindi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Dietary filter
      let matchesDiet = true;
      if (dietaryFilter === 'veg') matchesDiet = item.isVeg;
      if (dietaryFilter === 'non-veg') matchesDiet = !item.isVeg;
      if (dietaryFilter === 'special') matchesDiet = item.isChefSpecial;

      return matchesCategory && matchesSearch && matchesDiet;
    });
  }, [activeCategory, searchQuery, dietaryFilter]);

  // Helper to get current quantity of item in cart
  const getItemQuantity = (itemId) => {
    const item = cartItems.find((ci) => ci.id === itemId);
    return item ? item.quantity : 0;
  };

  return (
    <section id="menu" className="py-24 sm:py-32 bg-noir-950 relative overflow-hidden">
      {/* Subtle Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/30 mb-4">
            <Utensils className="w-3.5 h-3.5" />
            <span>Complete Culinary Menu</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Crafted for the Discerning Palate
          </h2>

          <p className="mt-4 text-stone-400 text-sm sm:text-base font-light">
            Explore authentic North Indian curries, tandoori wonders, fragrant biryanis, and Indo-Chinese delights prepared fresh daily.
          </p>
        </div>

        {/* Filter Bar: Category Tabs & Search */}
        <div className="space-y-6 mb-12">
          
          {/* Category Scrollable Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start lg:justify-center">
            {MENU_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-noir-950 shadow-lg shadow-gold-500/20 scale-105'
                      : 'bg-noir-900 border border-white/10 text-stone-300 hover:border-gold-500/40 hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar & Dietary Filter Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-noir-900/90 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search dishes (e.g. Butter Chicken, Dal, Naan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-noir-950 rounded-xl border border-white/10 text-stone-100 placeholder-stone-500 text-xs focus:outline-none focus:border-gold-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dietary Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dietaryFilter === 'all'
                    ? 'bg-stone-200 text-noir-950 font-bold'
                    : 'bg-noir-950 text-stone-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDietaryFilter('veg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  dietaryFilter === 'veg'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-noir-950 text-emerald-400/90 hover:bg-emerald-950/40'
                }`}
              >
                <span className="veg-indicator !w-3.5 !h-3.5" />
                <span>Veg Only</span>
              </button>
              <button
                onClick={() => setDietaryFilter('non-veg')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  dietaryFilter === 'non-veg'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-noir-950 text-rose-400/90 hover:bg-rose-950/40'
                }`}
              >
                <span className="nonveg-indicator !w-3.5 !h-3.5" />
                <span>Non-Veg</span>
              </button>
              <button
                onClick={() => setDietaryFilter('special')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  dietaryFilter === 'special'
                    ? 'bg-gold-500 text-noir-950 font-bold'
                    : 'bg-noir-950 text-gold-400 hover:bg-gold-950/40'
                }`}
              >
                <Sparkles className="w-3 h-3 text-gold-400" />
                <span>Chef's Choice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredMenu.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMenu.map((item, index) => {
                const quantity = getItemQuantity(item.id);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className="p-4 sm:p-5 rounded-2xl bg-noir-900 border border-white/10 hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      {/* Top Media & Tags */}
                      <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-noir-850">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-transparent to-transparent" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className={`p-1 rounded-md backdrop-blur-md ${item.isVeg ? 'bg-emerald-950/90 border border-emerald-500/50' : 'bg-rose-950/90 border border-rose-500/50'}`}>
                            <span className={item.isVeg ? 'veg-indicator' : 'nonveg-indicator'} />
                          </span>
                          {item.isChefSpecial && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gold-500 text-noir-950 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Chef Special</span>
                            </span>
                          )}
                        </div>

                        {/* Spice Level Indicator */}
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-noir-950/80 backdrop-blur-md border border-white/10 text-[10px] text-stone-300 flex items-center gap-0.5">
                          {Array.from({ length: item.spiceLevel || 1 }).map((_, i) => (
                            <span key={i} title="Spice level">🌶️</span>
                          ))}
                        </div>

                        {/* Details Preview Button */}
                        <button
                          onClick={() => onSelectDish(item)}
                          className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-noir-950/80 text-stone-300 hover:text-gold-400 border border-white/10 hover:border-gold-500/40 backdrop-blur-md text-xs transition-colors"
                          title="View ingredients & notes"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Title & Description */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 
                            onClick={() => onSelectDish(item)}
                            className="font-serif text-base sm:text-lg font-bold text-white group-hover:text-gold-300 cursor-pointer transition-colors"
                          >
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-gold-400 font-medium">
                            {item.nameHindi}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Price and Cart Controller */}
                    <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Price</span>
                        <span className="text-lg font-bold font-serif text-white">
                          ₹{item.price}
                        </span>
                      </div>

                      {quantity === 0 ? (
                        <button
                          onClick={() => onAddToCart(item)}
                          className="px-4 py-2 rounded-xl bg-gold-500/10 hover:bg-gold-500 text-gold-300 hover:text-noir-950 border border-gold-500/30 transition-all duration-300 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-gold-500/15 border border-gold-500/40 rounded-xl p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-noir-950 text-gold-300 flex items-center justify-center hover:bg-gold-500 hover:text-noir-950 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white w-4 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-gold-500 text-noir-950 flex items-center justify-center hover:brightness-110 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 font-bold" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-16 text-center bg-noir-900/50 rounded-2xl border border-white/5">
            <p className="text-stone-400 text-sm">No dishes match your search or filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setDietaryFilter('all');
              }}
              className="mt-3 text-xs text-gold-400 underline uppercase tracking-wider"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
