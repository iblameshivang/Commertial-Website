import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Phone,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function ReservationModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1: Form, 2: Confirmation
  const [guests, setGuests] = useState('2 Guests');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('08:00 PM');
  const [seatingArea, setSeatingArea] = useState('Main Luxury Dining');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState('Casual Dining');
  const [bookingId, setBookingId] = useState('');

  const timeSlots = [
    '12:30 PM', '01:15 PM', '02:00 PM', '02:45 PM',
    '07:00 PM', '07:45 PM', '08:30 PM', '09:15 PM', '10:00 PM'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please enter your Name and Phone Number to confirm your table.');
      return;
    }

    // Generate random booking ID
    const newId = `CP-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingId(newId);
    setStep(2);

    // Trigger celebratory golden confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#F59E0B', '#FFFFFF', '#B89428']
    });
  };

  const resetAndClose = () => {
    setStep(1);
    setName('');
    setPhone('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={resetAndClose}
          className="fixed inset-0 bg-noir-950/85 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl bg-noir-900 border border-gold-500/30 overflow-hidden shadow-2xl z-10 p-6 sm:p-8"
        >
          {/* Close button */}
          <button
            onClick={resetAndClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-noir-950/80 text-stone-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {step === 1 ? (
            <div>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-gold-500/10 border border-gold-500/30 text-gold-400 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Table Reservation</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  Reserve Your Dining Experience
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Smart Homes, Rajgarh Rd, Solan • 10:00 AM – 11:00 PM
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Party Size & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-stone-400 block mb-1">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white focus:border-gold-400 focus:outline-none"
                    >
                      <option>1 Guest</option>
                      <option>2 Guests</option>
                      <option>3 Guests</option>
                      <option>4 Guests</option>
                      <option>5-6 Guests</option>
                      <option>7-10 Guests (Large Group)</option>
                      <option>10+ Guests (Party)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-stone-400 block mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="text-[10px] uppercase text-stone-400 block mb-1.5">Select Time Slot</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setTimeSlot(slot)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          timeSlot === slot
                            ? 'bg-gold-500 text-noir-950 font-bold border-gold-500'
                            : 'bg-noir-950 border-white/10 text-stone-300 hover:border-gold-500/40'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seating Preference */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-stone-400 block mb-1">Seating Area</label>
                    <select
                      value={seatingArea}
                      onChange={(e) => setSeatingArea(e.target.value)}
                      className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white focus:border-gold-400 focus:outline-none"
                    >
                      <option>Main Luxury Dining</option>
                      <option>Mountain View Terrace</option>
                      <option>Family Private Booth</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-stone-400 block mb-1">Occasion</label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white focus:border-gold-400 focus:outline-none"
                    >
                      <option>Casual Dining</option>
                      <option>Birthday Celebration</option>
                      <option>Anniversary</option>
                      <option>Family Gathering</option>
                      <option>Business Meeting</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] uppercase text-stone-400 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-stone-400 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="01792 / 98160..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:border-gold-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 text-noir-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-gold-500/20 hover:brightness-110 transition-all"
                >
                  Confirm Table Reservation
                </button>

                <p className="text-[10px] text-center text-stone-500">
                  Instant confirmation • No reservation fee required
                </p>
              </form>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400">
                  Booking Confirmed
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  We look forward to welcoming you!
                </h3>
                <p className="text-xs text-stone-300 mt-1">
                  Booking Reference: <span className="font-mono text-gold-300 font-bold">{bookingId}</span>
                </p>
              </div>

              {/* Reservation summary card */}
              <div className="p-4 rounded-2xl bg-noir-950 border border-white/10 text-left space-y-2 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>Guest Name:</span>
                  <span className="font-bold text-white">{name}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Party Size:</span>
                  <span className="text-white">{guests}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Date & Time:</span>
                  <span className="text-gold-300 font-bold">{date} at {timeSlot}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Location:</span>
                  <span className="text-white">Smart Homes, Rajgarh Rd, Solan</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Seating Area:</span>
                  <span className="text-white">{seatingArea}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`https://wa.me/${RESTAURANT_INFO.contact.whatsappNumber}?text=${encodeURIComponent(`Hello Chef's Planet, I just booked Table ${bookingId} for ${name} on ${date} at ${timeSlot}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Notify via WhatsApp</span>
                </a>
                <button
                  onClick={resetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-noir-850 border border-white/10 text-stone-300 text-xs font-semibold hover:text-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
