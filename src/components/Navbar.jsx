import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Menu as MenuIcon, 
  X, 
  Phone, 
  Calendar, 
  MapPin, 
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function Navbar({
  cartCount,
  onOpenCart,
  onOpenReservation,
  onOpenAdminOrders,
  isStaffLoggedIn,
  onLogoutStaff,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Story', href: '#story' },
    { name: 'Signatures', href: '#signatures' },
    { name: 'Menu', href: '#menu' },
    { name: 'Services', href: '#services' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Location', href: '#location' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-noir-950/85 backdrop-blur-md border-b border-white/10 py-3.5 shadow-2xl shadow-black/60'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <a 
            href="#" 
            className="group flex items-center gap-3 focus:outline-none"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <div className="w-10 h-10 rounded-full border border-gold-500/40 bg-noir-900/80 flex items-center justify-center text-gold-400 group-hover:border-gold-400 group-hover:scale-105 transition-all duration-300 shadow-md shadow-gold-500/10">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-white group-hover:text-gold-300 transition-colors uppercase">
                {RESTAURANT_INFO.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-widest text-gold-400/90 font-medium uppercase">
                  {RESTAURANT_INFO.nameHindi}
                </span>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider hidden sm:inline">
                  • Solan, HP
                </span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-xs tracking-widest uppercase font-medium text-stone-300 hover:text-gold-400 transition-colors duration-200 relative py-1 group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-gold-400 to-amber-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {isStaffLoggedIn ? (
              <button
                onClick={onOpenAdminOrders}
                className="px-3 py-2 rounded-full text-[10px] font-semibold tracking-wider uppercase border border-white/10 bg-noir-900/70 text-stone-300 hover:text-gold-300 hover:border-gold-500/40 transition-all duration-300"
              >
                Admin Orders
              </button>
            ) : (
              <button
                onClick={onOpenAdminOrders}
                className="px-3 py-2 rounded-full text-[10px] font-semibold tracking-wider uppercase border border-white/10 bg-noir-900/70 text-stone-300 hover:text-gold-300 hover:border-gold-500/40 transition-all duration-300"
              >
                Staff Login
              </button>
            )}

            {isStaffLoggedIn && onLogoutStaff && (
              <button
                onClick={onLogoutStaff}
                className="px-3 py-2 rounded-full text-[10px] font-semibold tracking-wider uppercase border border-red-500/30 bg-red-500/10 text-red-200 hover:text-red-100 transition-all duration-300"
              >
                Logout
              </button>
            )}

            {/* Table Reservation Button */}
            <button
              onClick={onOpenReservation}
              className="px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 hover:border-gold-400 transition-all duration-300 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-gold-400" />
              <span>Book Table</span>
            </button>

            {/* Order Online / Cart CTA */}
            <button
              onClick={onOpenCart}
              className="relative px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 text-noir-950 hover:brightness-110 shadow-lg shadow-gold-500/20 transition-all duration-300 flex items-center gap-2 font-sans font-bold"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Online</span>
              {cartCount > 0 && (
                <span className="bg-noir-950 text-gold-400 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-gold-400/40">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-full bg-noir-850 border border-gold-500/30 text-gold-400"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-noir-950 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-noir-850 border border-white/10 text-stone-200 hover:text-white"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] h-screen min-h-screen bg-[#070709] pt-24 px-6 pb-8 flex flex-col justify-between lg:hidden border-b border-gold-500/20 overflow-y-auto overscroll-contain"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-noir-850 border border-white/10 text-stone-200"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <p className="text-xs text-gold-400 uppercase tracking-widest font-semibold">
                  Chef’s Planet • Solan
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  Authentic North Indian Flavours in Himachal
                </p>
              </div>

              <div className="flex flex-col space-y-4">
                {navLinks.map((link, idx) => (
                  <motion.a
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="flex items-center justify-between text-lg font-serif text-stone-200 hover:text-gold-400 py-2 border-b border-white/5"
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="w-4 h-4 text-gold-500/60" />
                  </motion.a>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-white/10">
             {isStaffLoggedIn ? (
               <button
                 onClick={() => {
                   setMobileMenuOpen(false);
                   onOpenAdminOrders();
                 }}
                 className="w-full py-3 rounded-xl border border-white/10 text-stone-200 font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-noir-900"
               >
                 <span>Admin Orders</span>
               </button>
             ) : (
               <button
                 onClick={() => {
                   setMobileMenuOpen(false);
                   onOpenAdminOrders();
                 }}
                 className="w-full py-3 rounded-xl border border-white/10 text-stone-200 font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-noir-900"
               >
                 <span>Staff Login</span>
               </button>
             )}

             {isStaffLoggedIn && onLogoutStaff && (
               <button
                 onClick={() => {
                   setMobileMenuOpen(false);
                   onLogoutStaff();
                 }}
                 className="w-full py-3 rounded-xl border border-red-500/30 text-red-200 font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-red-500/10"
               >
                 <span>Logout</span>
               </button>
             )}

             <button
               onClick={() => {
                 setMobileMenuOpen(false);
                 onOpenReservation();
               }}
               className="w-full py-3 rounded-xl border border-gold-500/40 text-gold-300 font-medium text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-noir-900"
             >
               <Calendar className="w-4 h-4 text-gold-400" />
               <span>Reserve a Table</span>
             </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCart();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 text-noir-950 font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Online Now</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-stone-400 pt-2">
                <a href={`tel:${RESTAURANT_INFO.contact.phoneRaw}`} className="flex items-center gap-1 hover:text-gold-400">
                  <Phone className="w-3.5 h-3.5 text-gold-400" />
                  <span>{RESTAURANT_INFO.contact.phoneDisplay}</span>
                </a>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gold-400" />
                  <span>10 AM – 11 PM</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
