import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  Sparkles, 
  Building, 
  ExternalLink, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function LocationSection({ onOpenCart }) {
  return (
    <section id="location" className="py-24 sm:py-32 bg-noir-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-gold-400 bg-gold-500/10 border border-gold-500/30 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span>Visit Us in Solan</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Find Us on Rajgarh Road
          </h2>

          <p className="mt-4 text-stone-400 text-sm sm:text-base font-light">
            Conveniently situated in <span className="text-white font-medium">Smart Homes</span>, easily accessible for Solan residents, families, and mountain road travellers.
          </p>
        </div>

        {/* Location Grid: Info Cards + Map Embed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Details & Contacts */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Address Card */}
            <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-gold-400 font-bold text-xs uppercase tracking-wider">
                <Building className="w-4 h-4" />
                <span>Primary Location</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                Chef’s Planet (चीफ्स प्लैनेट)
              </h3>
              <p className="text-stone-300 text-sm leading-relaxed">
                {RESTAURANT_INFO.location.address}
              </p>
              <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-xs text-gold-300 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                <span>{RESTAURANT_INFO.location.landmark}</span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                Plus Code: <span className="text-stone-200">{RESTAURANT_INFO.location.plusCode}</span>
              </p>
            </div>

            {/* Operating Hours & Contact Card */}
            <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-4">
              {/* Hours */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gold-500/10 text-gold-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Opening Hours</h4>
                  <p className="text-sm text-stone-300 font-medium">{RESTAURANT_INFO.hours.display}</p>
                  <p className="text-xs text-stone-400">{RESTAURANT_INFO.hours.days}</p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gold-500/10 text-gold-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Direct Phone Line</h4>
                  <a
                    href={`tel:${RESTAURANT_INFO.contact.phoneRaw}`}
                    className="text-base font-bold text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    {RESTAURANT_INFO.contact.phoneDisplay}
                  </a>
                  <p className="text-xs text-stone-400">Call for table reservations, drive-through & inquiries</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href={RESTAURANT_INFO.location.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-noir-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 hover:brightness-110 transition-all text-center"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>

              <a
                href={`https://wa.me/${RESTAURANT_INFO.contact.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Embedded Google Map */}
          <div className="lg:col-span-7 h-[420px] lg:h-auto min-h-[400px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-noir-850">
            <iframe
              title="Chef's Planet Location Map"
              src="https://maps.google.com/maps?q=Chef's+Planet+Rajgarh+Road+Solan+Himachal+Pradesh&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(1.1) brightness(0.95)' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
            
            {/* Map Overlay Card */}
            <div className="absolute top-4 left-4 p-3 rounded-xl bg-noir-950/90 backdrop-blur-md border border-white/10 text-xs shadow-xl hidden sm:flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-stone-200 font-medium">Live Location: Solan, HP</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
