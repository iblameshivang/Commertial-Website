import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  MapPin, 
  Clock, 
  HeartHandshake, 
  Sparkles, 
  Utensils, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function AboutSection({ onOpenReservation }) {
  const highlights = [
    "24-Hour slow-simmered Dal Makhani crafted in copper handis",
    "Fresh cottage cheese (Malai Paneer) sourced directly from local dairy",
    "Signature tandoori marinades infused with Solan garlic and cold-pressed mustard oil",
    "Hand-pounded garam masalas and whole aromatic mountain herbs",
    "Clay tandoor baking at 400°C for airy, crisp naans and tender kebabs"
  ];

  return (
    <section id="story" className="py-24 sm:py-32 bg-noir-900 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/30 mb-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Culinary Journey</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight"
          >
            Where Ancient North Indian Traditions <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 font-normal italic">
              Meet Himalayan Serenity
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-stone-300 font-light leading-relaxed"
          >
            Located inside <span className="text-white font-medium">Smart Homes on Rajgarh Road, Solan</span>, 
            Chef’s Planet has grown into Himachal’s beloved destination for food lovers seeking uncompromising authenticity and warmth.
          </motion.p>
        </div>

        {/* Content Grid: Story & Visual Collage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: The Story */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-6"
          >
            <h3 className="font-serif text-2xl sm:text-3xl text-white font-semibold leading-snug">
              Every Pot Simmers with Passion, Every Spice Tells a Tale.
            </h3>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-light">
              At Chef’s Planet (चीफ्स प्लैनेट), we believe great food is a dialogue between patient slow-cooking and timeless royal recipes. From our signature 24-hour slow-cooked Dal Makhani to our butter-basted tandoori delicacies and rich Awadhi dum biryanis, every single dish is prepared fresh on order with hand-ground spices and pristine mountain water.
            </p>

            {/* Checkpoints list */}
            <div className="space-y-3 pt-2">
              {highlights.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-stone-200">{point}</span>
                </div>
              ))}
            </div>

            {/* Quick Location & Hours Callout Box */}
            <div className="mt-8 p-5 rounded-2xl bg-noir-850 border border-gold-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-400">
                  <MapPin className="w-4 h-4 text-gold-400" />
                  <span>Smart Homes, Rajgarh Rd, Solan</span>
                </div>
                <div className="text-xs text-stone-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Open Daily: 10:00 AM – 11:00 PM</span>
                </div>
              </div>

              <button
                onClick={onOpenReservation}
                className="px-5 py-2.5 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-300 hover:bg-gold-500 hover:text-noir-950 transition-all duration-300 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
              >
                Reserve a Table
              </button>
            </div>
          </motion.div>

          {/* Right Column: Visual Collage & Rating Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-noir-850 aspect-[4/3] group">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
                alt="Chef's Planet Solan Ambiance"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-transparent to-transparent opacity-80" />
              
              {/* Overlay Badge */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-noir-950/80 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
                    Dine-In • Takeaway • Delivery
                  </p>
                  <p className="text-white font-serif text-lg font-bold">
                    Premium Ambiance in Solan
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold-400 font-serif">4.0 ★</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider">1,287 Reviews</p>
                </div>
              </div>
            </div>

            {/* Floating Secondary Mini Image Card */}
            <div className="hidden sm:block absolute -bottom-8 -left-8 w-44 rounded-2xl overflow-hidden border-2 border-gold-500/40 shadow-2xl bg-noir-900">
              <img
                src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80"
                alt="Dal Makhani Preparation"
                className="w-full h-28 object-cover"
              />
              <div className="p-2.5 text-center">
                <p className="text-[11px] font-bold text-stone-200">24hr Slow Cooking</p>
                <p className="text-[9px] text-gold-400">Pure Desi Ghee</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
        >
          {RESTAURANT_INFO.stats.map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-noir-850/80 border border-white/5 hover:border-gold-500/30 transition-all duration-300 text-center group"
            >
              <p className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500 group-hover:scale-105 transition-transform duration-300">
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-stone-300 font-semibold mt-2">
                {stat.label}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {stat.sub}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
