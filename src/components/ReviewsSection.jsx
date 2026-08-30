import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Quote, 
  CheckCircle, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { REVIEWS_DATA } from '../data/reviewsData';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function ReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevReview = () => {
    setCurrentIndex((prev) => (prev === 0 ? REVIEWS_DATA.length - 1 : prev - 1));
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev === REVIEWS_DATA.length - 1 ? 0 : prev + 1));
  };

  const review = REVIEWS_DATA[currentIndex];

  return (
    <section id="reviews" className="py-24 sm:py-32 bg-noir-900 relative overflow-hidden border-t border-white/5">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Customer Reviews</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Loved by Solan & Highway Travellers
          </h2>

          {/* Big Rating Banner */}
          <div className="mt-6 inline-flex items-center gap-4 bg-noir-850 border border-white/10 px-6 py-3 rounded-2xl shadow-xl">
            <div className="flex items-center gap-1.5 text-gold-400 font-bold text-2xl font-serif">
              <span>4.0</span>
              <div className="flex">
                {[...Array(4)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                ))}
                <Star className="w-5 h-5 fill-gold-400/40 text-gold-400" />
              </div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-left">
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                1,287+ Google Reviews
              </p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Verified Solan Restaurant</span>
              </p>
            </div>
          </div>
        </div>

        {/* Testimonial Showcase Card */}
        <div className="max-w-4xl mx-auto relative">
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="p-8 sm:p-12 rounded-3xl bg-noir-850 border border-white/10 shadow-2xl relative"
          >
            <Quote className="absolute top-8 right-8 w-14 h-14 text-gold-500/10" />

            {/* Stars */}
            <div className="flex gap-1 mb-6 text-gold-400">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold-400 text-gold-400" />
              ))}
            </div>

            {/* Quote Body */}
            <p className="font-serif text-lg sm:text-2xl text-stone-100 font-normal leading-relaxed italic">
              "{review.text}"
            </p>

            {/* Recommendation badge */}
            {review.dishRecommended && (
              <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-xs text-gold-300">
                <span className="text-gold-400 font-semibold">Recommended Dish:</span>
                <span>{review.dishRecommended}</span>
              </div>
            )}

            {/* Author Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-11 h-11 rounded-full object-cover border border-gold-500/40"
                />
                <div>
                  <h4 className="font-bold text-sm text-white">{review.name}</h4>
                  <p className="text-xs text-stone-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gold-400" />
                    <span>{review.location} • {review.date}</span>
                  </p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevReview}
                  className="w-10 h-10 rounded-full bg-noir-950 border border-white/10 hover:border-gold-500/40 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Previous Review"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextReview}
                  className="w-10 h-10 rounded-full bg-noir-950 border border-white/10 hover:border-gold-500/40 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Next Review"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {REVIEWS_DATA.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? 'w-6 bg-gold-400' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`View review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
