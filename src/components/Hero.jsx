import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Star, 
  ChevronDown, 
  MapPin, 
  Sparkles,
  ArrowRight,
  Flame
} from 'lucide-react';
import { HERO_SCENES } from '../data/videoHeroData';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function Hero({ onExploreMenu, onOpenReservation }) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRefs = useRef([]);

  // Auto-advance scenes every 7 seconds
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % HERO_SCENES.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const currentScene = HERO_SCENES[currentSceneIndex];

  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-noir-950 select-none">
      {/* Background Video & Fallback Image Sequence with Crossfade */}
      <div className="absolute inset-0 z-0">
        {HERO_SCENES.map((scene, index) => {
          const isActive = index === currentSceneIndex;
          return (
            <div
              key={scene.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Fallback & Pre-load Image */}
              <img
                src={scene.fallbackImage}
                alt={scene.title}
                className="absolute inset-0 w-full h-full object-cover scale-105 transform animate-pulse-glow"
              />
              
              {/* Autoplaying HTML5 Video */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={scene.videoUrl}
                poster={scene.fallbackImage}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onLoadedData={() => setVideoLoaded(true)}
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
              />
            </div>
          );
        })}

        {/* Cinematic Vignette & Radial Dark Gradient Overlays */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-noir-950 via-noir-950/40 to-black/70" />
        <div className="absolute inset-0 z-20 bg-radial-gradient from-transparent via-black/30 to-noir-950/80" />
        <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-noir-950/40 to-noir-950/90" />
      </div>

      {/* Center Hero Content & Taglines */}
      <div className="relative z-30 max-w-5xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center justify-center pt-16">
        
        {/* Top Badges: Devanagari & Solan Heritage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          <span className="px-3.5 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-gold-500/15 border border-gold-500/40 text-gold-300 backdrop-blur-md flex items-center gap-1.5 shadow-sm shadow-gold-500/20">
            <Flame className="w-3.5 h-3.5 text-gold-400" />
            <span>चीफ्स प्लैनेट</span>
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium tracking-wider text-stone-300 bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-gold-400" />
            <span>Solan, Himachal Pradesh</span>
          </span>
        </motion.div>

        {/* Main Tagline Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.15] max-w-4xl text-shadow-lg"
        >
          Authentic North Indian Flavours <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-amber-500 italic font-normal">
            in the Heart of Solan
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-stone-200/90 font-light tracking-wide max-w-2xl text-shadow"
        >
          {RESTAURANT_INFO.taglineAlt} — slow-simmered rich curries, smoky charcoal tandoor, and royal Himachali hospitality.
        </motion.p>

        {/* Circular "SEE MENU" Button - Replicating Just Falafel / jfvegancafe.com Signature Feature */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 sm:mt-10 relative flex items-center justify-center group cursor-pointer"
          onClick={onExploreMenu}
        >
          {/* Ambient Glowing Outer Ring */}
          <div className="absolute inset-0 rounded-full bg-gold-500/20 blur-xl group-hover:bg-gold-500/40 transition-all duration-500 scale-125" />
          
          {/* Rotating Text Circle */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-gold-500/40 group-hover:border-gold-400 transition-all duration-500 flex items-center justify-center bg-noir-950/60 backdrop-blur-md shadow-2xl group-hover:scale-105">
            
            {/* SVG Circular Text Path */}
            <svg className="absolute inset-0 w-full h-full spin-text pointer-events-none" viewBox="0 0 100 100">
              <path
                id="circlePath"
                d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                fill="none"
              />
              <text className="text-[8.5px] uppercase tracking-[2.5px] fill-gold-300 font-medium">
                <textPath xlinkHref="#circlePath" startOffset="0%">
                  • CHEF'S PLANET • VIEW FULL MENU •
                </textPath>
              </text>
            </svg>

            {/* Center Core Button */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-gold-500 to-amber-400 text-noir-950 flex flex-col items-center justify-center font-serif font-bold text-xs shadow-lg shadow-gold-500/30 group-hover:scale-110 transition-transform duration-300">
              <ChevronDown className="w-5 h-5 animate-bounce text-noir-950" />
            </div>
          </div>
        </motion.div>

        {/* Live Scene Highlight Badge */}
        <motion.div
          key={currentScene.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="mt-6 flex items-center gap-2 text-xs text-stone-400 bg-black/40 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/5"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-stone-300">Featuring:</span>
          <span className="text-gold-300 font-medium">{currentScene.dishHighlight}</span>
        </motion.div>
      </div>

      {/* Floating Bottom Quick Info & Video Controls Bar */}
      <div className="absolute bottom-6 left-0 right-0 z-30 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Rating & Location Pill */}
        <div className="flex items-center gap-3 bg-noir-950/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs text-stone-300 shadow-xl">
          <div className="flex items-center gap-1 text-gold-400 font-bold">
            <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
            <span>4.0 ★</span>
          </div>
          <span className="text-stone-500">•</span>
          <span className="text-stone-300">1,287+ Google Reviews</span>
          <span className="text-stone-500 hidden md:inline">•</span>
          <span className="text-gold-400/90 hidden md:inline">₹200 – ₹1,200</span>
        </div>

        {/* Scene Dots & Video Player Controls */}
        <div className="flex items-center gap-4 bg-noir-950/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full shadow-xl">
          {/* Scene Carousel Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {HERO_SCENES.map((scene, idx) => (
              <button
                key={scene.id}
                onClick={() => setCurrentSceneIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSceneIndex ? 'w-6 bg-gold-400' : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                aria-label={`Go to scene ${idx + 1}`}
              />
            ))}
          </div>

          <div className="h-3 w-px bg-white/20" />

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-stone-300 hover:text-gold-400 transition-colors p-1"
            title={isMuted ? "Unmute Video" : "Mute Video"}
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-gold-400" />}
          </button>

          {/* Pause / Play */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-stone-300 hover:text-gold-400 transition-colors p-1"
            title={isPlaying ? "Pause Video Carousel" : "Play Video Carousel"}
            aria-label="Toggle Carousel"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </section>
  );
}
