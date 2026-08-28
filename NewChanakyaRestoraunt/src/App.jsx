import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import {
  MapPin,
  Clock,
  Phone,
  X,
  ChevronDown,
  Menu,
  Plus,
  Minus,
  Users,
  CalendarDays,
  Send,
  Flame,
  Leaf,
  ArrowUpRight,
} from "lucide-react";
import Lenis from "lenis";

/* ============================================================================
   CONFIG — everything cafe-specific lives here. Swap photos, dishes, and
   contact details without touching a single component below.
============================================================================ */
const CAFE = {
  name: "NEW CHANAKYA",
  tagline: "Tradition on Every Plate, Warmth in Every Corner",
  eyebrow: "Solan · Est. on The Mall Road",
  instagramHandle: "@newchanakya_solan",
  instagramUrl: "https://instagram.com/newchanakya_solan",
  whatsappNumber: "918580602249", // country code + number, no symbols
  phoneDisplay: "+91 85806 02249",
  address: "The Mall Road, Lawi Khurd, Solan, Himachal Pradesh",
  timings: "12:00 PM – 11:00 PM · Open all days",
  services: [
    { label: "All-You-Can-Eat", icon: Flame },
    { label: "Rooftop Seating", icon: MapPin },
    { label: "Vegan Options", icon: Leaf },
    { label: "Fresh Bakery Counter", icon: Clock },
  ],
  heroImage:
    "/images/unnamed (1).webp",
  storyImage:
    "/images/images.jpeg",
  tickerWords: [
    "TANDOOR FIRE",
    "ROOFTOP VALLEY VIEWS",
    "FRESH BAKERY EVERY MORNING",
    "HIMALAYAN HOSPITALITY",
    "PINE-CARVED CEILINGS",
  ],
  journey: [
    {
      id: "j1",
      tag: "Chapter One",
      title: "Sourced at Dawn",
      copy: "Vegetables off the hill farms, spice ground fresh each morning — nothing sits in a box waiting.",
      image:
        "/images/Screenshot 2026-08-28 030024.png",
    },
    {
      id: "j2",
      tag: "Chapter Two",
      title: "Marinated in Tradition",
      copy: "Recipes handed down, not written down — yogurt, chilli, and patience doing the real work.",
      image:
        "/images/Screenshot 2026-08-28 025734.png",
    },
    {
      id: "j3",
      tag: "Chapter Three",
      title: "Fired Over Coal",
      copy: "The tandoor runs hot from noon to midnight — char, smoke, and a heat you can feel from the door.",
      image:
        "/images/Screenshot 2026-08-28 025817.png",
    },
    {
      id: "j4",
      tag: "Chapter Four",
      title: "Served with Warmth",
      copy: "To your table, rooftop or hall, under chandelier glow — the way Solan has always gathered.",
      image:
        "/images/Screenshot 2026-08-28 025605.png",
    },
  ],
  gallery: [
    {
      id: "g1",
      caption: "Valley view, rooftop deck",
      src: "/images/unnamed (1).webp",
    },
    {
      id: "g2",
      caption: "Chandelier glow, main hall",
      src: "/images/images (1).jpeg",
    },
    {
      id: "g3",
      caption: "Fresh from the tandoor",
      src: "/images/images (2).jpeg",
    },
    {
      id: "g4",
      caption: "The bakery counter, every morning",
      src: "/images/unnamed (2).webp",
    },
    {
      id: "g5",
      caption: "Pine-carved ceiling detail",
      src: "/images/unnamed.webp",
    },
    {
      id: "g6",
      caption: "Table for two, rooftop side",
      src: "/images/unnamed (3).webp",
    },
  ],
  categories: ["North Indian", "South Indian", "Tandoor", "Chinese", "Bakery"],
  dishes: [
    {
      id: "d1",
      name: "Paneer Lababdar",
      category: "North Indian",
      price: "₹320",
      image:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=80",
      story:
        "A Punjabi classic, simmered slow the way it's been done since the dhaba days — rich, unhurried, and built for mopping up with warm naan.",
      flavor: "Buttery · Mildly sweet · Deep tomato",
      ingredients: "Paneer, tomato-cashew gravy, cream, kasuri methi, ghar ka masala",
    },
    {
      id: "d2",
      name: "Dal Makhani",
      category: "North Indian",
      price: "₹280",
      image:
        "https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=1200&q=80",
      story:
        "Black lentils on a slow simmer for hours, finished with a spoon of white butter — the dish every regular orders twice.",
      flavor: "Smoky · Velvety · Earthy",
      ingredients: "Whole urad dal, rajma, tomato, cream, white butter, smoked over coal",
    },
    {
      id: "d3",
      name: "Masala Dosa",
      category: "South Indian",
      price: "₹190",
      image:
        "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80",
      story:
        "Batter fermented overnight, ground on stone, poured thin and crisped on iron — served the way it's meant to be, hot off the tawa.",
      flavor: "Crisp · Tangy · Comforting",
      ingredients: "Fermented rice-lentil batter, spiced potato masala, sambar, coconut chutney",
    },
    {
      id: "d4",
      name: "Idli Sambar",
      category: "South Indian",
      price: "₹150",
      image:
        "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80",
      story:
        "Steamed to a cloud-soft finish and dropped straight into sambar that's been on the stove since sunrise.",
      flavor: "Light · Tangy · Warming",
      ingredients: "Steamed rice-lentil cakes, toor dal sambar, tempered mustard and curry leaf",
    },
    {
      id: "d5",
      name: "Tandoori Chicken",
      category: "Tandoor",
      price: "₹420",
      image:
        "https://images.unsplash.com/photo-1610057099431-d73a1c9d8151?auto=format&fit=crop&w=1200&q=80",
      story:
        "Marinated two full days in yogurt and hand-ground spice, then finished over live coal until the char just meets the char.",
      flavor: "Smoky · Char-kissed · Bright",
      ingredients: "Free-range chicken, yogurt marinade, kashmiri chilli, charcoal tandoor",
    },
    {
      id: "d6",
      name: "Seekh Kebab",
      category: "Tandoor",
      price: "₹360",
      image:
        "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=1200&q=80",
      story:
        "Hand-minced, hand-skewered, hand-turned — nothing about this kebab has ever seen a machine.",
      flavor: "Spiced · Juicy · Char-forward",
      ingredients: "Minced mutton, raw papaya, roasted spice, mint, coal-fired skewer",
    },
    {
      id: "d7",
      name: "Chilli Paneer",
      category: "Chinese",
      price: "₹300",
      image:
        "https://images.unsplash.com/photo-1626200926749-33607a0d5b62?auto=format&fit=crop&w=1200&q=80",
      story:
        "Wok-tossed on the highest flame the kitchen has, so the paneer stays soft while the outside goes glossy and sharp.",
      flavor: "Sharp · Sweet-spiced · Glossy",
      ingredients: "Paneer, capsicum, onion, soy-chilli glaze, garlic, spring onion",
    },
    {
      id: "d8",
      name: "Veg Manchurian",
      category: "Chinese",
      price: "₹260",
      image:
        "https://images.unsplash.com/photo-1626711934535-991344e94c19?auto=format&fit=crop&w=1200&q=80",
      story:
        "Crisp vegetable dumplings dropped into a dark, garlicky gravy that disappears fast at every table.",
      flavor: "Umami · Garlicky · Crisp-to-soft",
      ingredients: "Mixed vegetable dumplings, garlic-soy gravy, spring onion, white pepper",
    },
    {
      id: "d9",
      name: "Cinnamon Rolls",
      category: "Bakery",
      price: "₹140",
      image:
        "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1200&q=80",
      story:
        "Proofed slow near the ovens, rolled by hand each morning, glazed while still warm from the bake.",
      flavor: "Buttery · Sweet · Spiced",
      ingredients: "Laminated dough, brown sugar, ceylon cinnamon, cream cheese glaze",
    },
    {
      id: "d10",
      name: "Fresh Croissants",
      category: "Bakery",
      price: "₹120",
      image:
        "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
      story:
        "Butter, folded thirty-six times over three days, baked fresh each morning for the counter out front.",
      flavor: "Flaky · Buttery · Golden",
      ingredients: "French butter, laminated dough, sea salt, egg wash",
    },
  ],
  testimonials: [
    {
      quote:
        "The rooftop at sunset, dal makhani that tastes like someone's grandmother made it. We come back every visit to Solan.",
      name: "Regular guest",
      context: "Mall Road, Solan",
    },
    {
      quote:
        "Ordered the tandoori chicken on a whim and ended up asking the chef what was in the marinade. He wouldn't say.",
      name: "Weekend visitor",
      context: "Chandigarh",
    },
    {
      quote:
        "Took my parents for their anniversary. The chandelier room, the pine ceiling — it felt like an occasion, not just dinner.",
      name: "Local family",
      context: "Solan",
    },
  ],
};

/* Placeholder quotes above — swap in real guest reviews when you have them. */

/* lucide-react no longer ships brand/social icons — a minimal inline glyph instead. */
function Instagram({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const _IMAGE_MATCHED_DISHES = [
  {
    id: "photo-paneer-tikka",
    name: "Paneer Tikka",
    category: "Tandoor Se",
    price: "₹200",
    image: "/images/Screenshot 2026-08-28 025734.png",
    story: "Charred paneer, warm spice, and the unmistakable glow of the tandoor.",
    flavor: "Smoky · Creamy · Char-kissed",
    ingredients: "Paneer, yogurt marinade, peppers, onion, tandoori spice",
  },
  {
    id: "photo-noodles",
    name: "Veg Hakka Noodles",
    category: "Chinese",
    price: "₹180",
    image: "/images/Screenshot 2026-08-28 025817.png",
    story: "Wok-tossed noodles with bright vegetables and a quick, savoury finish.",
    flavor: "Wok-fired · Colourful · Savoury",
    ingredients: "Hakka noodles, cabbage, carrot, capsicum, onion, soy seasoning",
  },
  {
    id: "photo-crispy-corn",
    name: "Crispy Corn",
    category: "Chinese",
    price: "₹200",
    image: "/images/Screenshot 2026-08-28 025855.png",
    story: "Golden kernels, crisp edges, and a lively chilli-garlic toss for the table.",
    flavor: "Crisp · Sweet-spiced · Bright",
    ingredients: "Crispy corn, capsicum, spring onion, chilli, garlic",
  },
  {
    id: "photo-dahi-bhalla",
    name: "Dahi Bhalla",
    category: "Chaat & Quick Bites",
    price: "₹80",
    image: "/images/images (2).jpeg",
    story: "Soft bhalla, cool yogurt, and bright chutneys layered into a Solan favourite.",
    flavor: "Tangy · Cool · Moreish",
    ingredients: "Lentil bhalla, yogurt, tamarind chutney, mint, sev",
  },
  {
    id: "photo-chicken-tikka",
    name: "Chicken Tikka",
    category: "Tandoor Se",
    price: "₹230 / ₹375",
    image: "/images/Screenshot 2026-08-28 025716.png",
    story: "Tender chicken, rested in yogurt and spice, then finished over live coal.",
    flavor: "Smoky · Tender · Bright",
    ingredients: "Chicken, yogurt, Kashmiri chilli, ginger, garlic, charcoal tandoor",
  },
];

const MENU_DIRECTORY = [
  ["Tandoor Se", [["Paneer Tikka", "₹200"], ["Paneer Malai Tikka", "₹250"], ["Achaari Paneer Tikka", "₹230"], ["Mushroom Tikka", "₹180"], ["Veg Seekh Kebab", "₹180"]]],
  ["North Indian Non Veg Zayka", [["Butter Chicken", "₹280 / ₹450"], ["Chicken Lababdar", "₹280 / ₹440"], ["Kali Mirch Chicken", "₹280 / ₹440"], ["Chicken Tawa Masala", "₹280 / ₹440"], ["Handi Chicken", "₹230 / ₹420"]]],
  ["Indian Zayka", [["Dal Makhani", "₹190"], ["Dal Fry", "₹170"], ["Rajmah", "₹170"], ["Shahi Paneer", "₹220"], ["Paneer Butter Masala", "₹220"]]],
  ["South Indian Flavours", [["Masala Dosa", "₹100"], ["Butter Masala Dosa", "₹120"], ["Mysore Masala Dosa", "₹140"], ["Paneer Dosa", "₹150"], ["Plain Dosa", "₹80"]]],
  ["Chinese", [["Honey Chilli Potato", "₹170"], ["Honey Chilli Cauliflower", "₹190"], ["Spring Rolls", "₹150"], ["Crispy Corn", "₹200"], ["Veg Hakka Noodles", "₹180"]]],
  ["Basmati Khazana", [["Plain Rice", "₹90"], ["Jeera Rice", "₹100"], ["Veg Pulao", "₹150"], ["Paneer Pulao", "₹170"], ["Veg Biryani", "₹210"]]],
  ["Indian Breads", [["Tandoori Roti", "₹15"], ["Butter Roti", "₹20"], ["Plain Naan", "₹30"], ["Butter Naan", "₹35"], ["Garlic Naan", "₹70"]]],
  ["Chaat, Sandwiches & Quick Bites", [["Golgappe", "₹40"], ["Dahi Bhalla", "₹80"], ["Raj Kachori", "₹80"], ["Veg Grilled Sandwich", "₹120"], ["Chicken Sandwich", "₹150"]]],
];

const WE_SERVE_IMAGES = [
  "/images/Screenshot 2026-08-28 025646.png",
  "/images/Screenshot 2026-08-28 025734.png",
  "/images/Screenshot 2026-08-28 025915.png",
  "/images/Screenshot 2026-08-28 025938.png",
  "/images/Screenshot 2026-08-28 030024.png",
  "/images/Screenshot 2026-08-28 025855.png",
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

/* ============================================================================
   SMOOTH SCROLL — Lenis provides the original eased wheel motion.
============================================================================ */
function useSmoothScroll(enabled) {
  useEffect(() => {
    if (!enabled || window.matchMedia("(pointer: coarse)").matches) return undefined;

    const lenis = new Lenis({
      duration: 0.65,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    window.__lenis = lenis;

    let frame;
    function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      window.__lenis = null;
    };
  }, [enabled]);
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -20 });
  else el.scrollIntoView({ behavior: "smooth" });
}

function useSkipHorizontalOnReverse(ref) {
  const previousScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const section = ref.current;
      const currentScrollY = window.scrollY;
      if (section && previousScrollY.current > section.offsetTop + section.offsetHeight && currentScrollY <= section.offsetTop + section.offsetHeight) {
        if (window.__lenis) window.__lenis.scrollTo(section, { offset: -1, immediate: true });
        else window.scrollTo({ top: section.offsetTop - 1, behavior: "auto" });
      }
      previousScrollY.current = currentScrollY;
    };

    previousScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);
}

/* ============================================================================
   SCROLL PROGRESS — thin gold line tracking position through the whole story.
============================================================================ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-ember via-amber to-brass"
    />
  );
}

/* ============================================================================
   CUSTOM CURSOR — a glowing amber dot with a trailing ring. Desktop only.
============================================================================ */
function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 400, damping: 20 });
  const ringY = useSpring(y, { stiffness: 400, damping: 20 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    setEnabled(fine);
    if (!fine) return undefined;

    document.documentElement.classList.add("has-custom-cursor");
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e) => {
      if (e.target.closest && e.target.closest("[data-cursor]")) setHovering(true);
    };
    const out = (e) => {
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest("[data-cursor]")) setHovering(false);
    };
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        style={{ left: x, top: y }}
        animate={{ scale: hovering ? 0 : 1 }}
        className="pointer-events-none fixed z-[70] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber"
      />
      <motion.div
        style={{ left: ringX, top: ringY }}
        animate={{ scale: hovering ? 1.8 : 1, opacity: hovering ? 1 : 0.6 }}
        transition={{ scale: { type: "spring", stiffness: 200, damping: 18 } }}
        className="pointer-events-none fixed z-[70] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber/70"
      />
    </>
  );
}

/* ============================================================================
   PRELOADER — a brief curtain reveal before the hero appears.
============================================================================ */
function Preloader({ reduceMotion, onDone }) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setVisible(false);
      onDone();
      return undefined;
    }
    const start = Date.now();
    const duration = 500;
    let raf;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setVisible(false), 80);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, onDone]);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-timber"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ clipPath: "inset(0 0 0 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.35, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-timber"
          />
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="relative z-10 font-display text-3xl tracking-wide text-linen"
          >
            NEW <span className="text-amber">CHANAKYA</span>
          </motion.p>
          <div className="relative z-10 mt-6 h-px w-40 overflow-hidden bg-brass/20">
            <motion.div
              style={{ scaleX: progress }}
              className="h-full w-full origin-left bg-amber"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
   AMBER PARTICLE FIELD — a lightweight canvas of rising embers for the hero.
   GPU-light: a few dozen particles, no external libraries.
============================================================================ */
function EmberField({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let particles = [];
    let width = 0;
    let height = 0;

    const spawn = () => ({
      x: Math.random() * width,
      y: height + Math.random() * 100,
      r: 1 + Math.random() * 2.2,
      speed: 0.3 + Math.random() * 0.7,
      drift: (Math.random() - 0.5) * 0.4,
      alpha: 0.2 + Math.random() * 0.5,
    });

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      particles = Array.from({ length: 46 }, spawn);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) Object.assign(p, spawn(), { y: height + 10 });
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 155, 56, ${p.alpha})`;
        ctx.shadowColor = "rgba(229, 155, 56, 0.8)";
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/* ============================================================================
   SPATIAL TYPOGRAPHY — layered extrusion + pointer-driven tilt in 3D space.
============================================================================ */
function SpatialHeading({ children, className = "" }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 14 });
  const sry = useSpring(ry, { stiffness: 120, damping: 14 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 16);
    rx.set(py * -16);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  const layers = [5, 4, 3, 2, 1];

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ perspective: 900 }}
      className="relative"
    >
      <motion.h1
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        className={`relative font-display text-linen ${className}`}
      >
        {layers.map((l) => (
          <span
            key={l}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateZ(-${l * 3}px) translateY(${l * 1.2}px)`,
              color: "transparent",
              WebkitTextStroke: "1px rgba(201,161,95,0.12)",
            }}
          >
            {children}
          </span>
        ))}
        <span className="relative" style={{ transform: "translateZ(6px)" }}>
          {children}
        </span>
      </motion.h1>
    </div>
  );
}

/* ============================================================================
   MAGNETIC BUTTON — nudges toward the cursor within its bounds.
============================================================================ */
function Magnetic({ children, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 16 });
  const sy = useSpring(y, { stiffness: 200, damping: 16 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={className}
      data-cursor="hover"
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
   MARQUEE — infinite horizontal ticker, pure CSS transform, no scroll cost.
============================================================================ */
function Marquee({ items, reverse = false, font = "font-wide", tone = "text-linen/15" }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div
        className={`inline-flex ${font} animate-marquee`}
        style={{ animationDirection: reverse ? "reverse" : "normal" }}
      >
        {doubled.map((word, i) => (
          <span key={i} className={`mx-6 text-[10vw] leading-none tracking-tight sm:text-6xl ${tone}`}>
            {word} <span className="text-amber/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
   NAVBAR
============================================================================ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = ["Story", "Journey", "Menu", "Gallery", "Reserve"];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    setOpen(false);
    scrollToId(id.toLowerCase());
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled ? "bg-timber/90 backdrop-blur-md border-b border-brass/10" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <button
          onClick={() => scrollToId("top")}
          className="font-display text-xl tracking-wide text-linen"
          data-cursor="hover"
        >
          NEW <span className="text-amber">CHANAKYA</span>
        </button>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <button
              key={l}
              onClick={() => go(l)}
              data-cursor="hover"
              className="font-body text-sm tracking-wide text-linen/80 transition-colors hover:text-amber"
            >
              {l}
            </button>
          ))}
          <Magnetic>
            <button
              onClick={() => go("Reserve")}
              className="rounded-full border border-amber/70 px-5 py-2 font-body text-sm text-amber transition-colors hover:bg-amber hover:text-timber"
            >
              Reserve a Table
            </button>
          </Magnetic>
        </div>

        <button
          className="text-linen md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden bg-timber/95 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 pb-6">
              {links.map((l) => (
                <button
                  key={l}
                  onClick={() => go(l)}
                  className="border-b border-brass/10 py-3 text-left font-body text-sm text-linen/85"
                >
                  {l}
                </button>
              ))}
              <button
                onClick={() => go("Reserve")}
                className="mt-3 rounded-full border border-amber/70 py-3 text-center font-body text-sm text-amber"
              >
                Reserve a Table
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ============================================================================
   HERO — parallax background, ember field, 3D spatial headline.
============================================================================ */

function Hero({ reduceMotion }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "-18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex h-[100svh] min-h-[560px] items-center justify-center overflow-hidden"
    >
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <img
          src={CAFE.heroImage}
          alt="NEW CHANAKYA rooftop overlooking the valley"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-timber/70 via-timber/40 to-timber/95" />
        <div className="absolute inset-0 bg-timber/10" />
      </motion.div>

      <EmberField
        active={!reduceMotion && !window.matchMedia("(pointer: coarse)").matches}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        initial="hidden"
        animate="show"
        variants={stagger}
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        <motion.span variants={fadeUp} className="font-body text-xs tracking-[0.5em] uppercase text-brass">
          {CAFE.eyebrow}
        </motion.span>

        <motion.div variants={fadeUp} className="mt-6">
          <SpatialHeading className="text-[15vw] leading-[0.95] sm:text-7xl md:text-8xl">
            NEW CHANAKYA
          </SpatialHeading>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl font-accent text-2xl italic text-linen/85 md:text-3xl"
        >
          {CAFE.tagline}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Magnetic>
            <button
              onClick={() => scrollToId("reserve")}
              className="rounded-full bg-amber px-8 py-3 font-body text-sm tracking-wide text-timber transition-transform"
            >
              Reserve a Table
            </button>
          </Magnetic>
          <a
            href={CAFE.instagramUrl}
            target="_blank"
            rel="noreferrer"
            data-cursor="hover"
            className="flex items-center gap-2 rounded-full border border-linen/30 px-6 py-3 font-body text-sm text-linen/90 transition-colors hover:border-amber hover:text-amber"
          >
            <Instagram size={16} /> {CAFE.instagramHandle}
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        animate={reduceMotion ? {} : { y: [0, 10, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-linen/60"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  );
}

/* ============================================================================
   STORY — with a parallax image layer.
============================================================================ */

function Story({ reduceMotion }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-8%", "8%"]);

  return (
    <section id="story" ref={ref} className="relative bg-timber px-6 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2 md:gap-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="relative order-2 self-stretch md:order-1"
        >
          <div className="h-full min-h-[20rem] w-full overflow-hidden rounded-2xl md:min-h-[28rem]">
            <motion.img
              style={{ y: imgY }}
              src={CAFE.storyImage}
              alt="Himalayan valley view from NEW CHANAKYA"
              loading="lazy"
              decoding="async"
              className="h-full min-h-[20rem] w-full scale-110 object-cover md:min-h-[28rem]"
            />
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="order-1 md:order-2"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>Our Story</SectionLabel>
          </motion.div>
          <motion.h2 variants={fadeUp} className="mt-5 font-display text-4xl leading-tight text-linen md:text-5xl">
            Carved pine ceilings.
            <br />
            A chandelier that's seen forty years of dinners.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 font-body text-base leading-relaxed text-linen/70 md:text-lg">
            Perched on The Mall Road with the valley falling away below, NEW CHANAKYA has always
            been where Solan comes to eat well — tandoor smoke, temple-bell quiet, and a rooftop
            that catches the last light of the hills.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 grid grid-cols-2 gap-5">
            {CAFE.services.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-brass/15 bg-cedar/50 px-4 py-3">
                <Icon size={18} className="shrink-0 text-amber" />
                <span className="font-body text-sm text-linen/85">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-3 font-body text-[11px] tracking-[0.35em] uppercase text-brass">
      <span className="h-px w-8 bg-brass/60" />
      {children}
    </span>
  );
}

function StoryQuote() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="border-y border-amber/25 bg-amber/5 px-6 py-10 md:py-12"
    >
      <p className="mx-auto max-w-3xl text-center font-accent text-2xl italic leading-relaxed text-amber md:text-3xl">
        “The best meals are the ones that make the room feel like home.”
      </p>
    </motion.section>
  );
}

/* ============================================================================
  JOURNEY — vertical scroll drives a horizontal chapter sequence.
============================================================================ */

function JourneyStage({ stage, index, total, scrollYProgress }) {
  const segment = 1 / total;
  const start = index * segment;
  const end = start + segment;
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.08), start + 0.05, end - 0.05, Math.min(1, end + 0.08)],
    [index === 0 ? 1 : 0, 1, 1, index === total - 1 ? 1 : 0],
  );

  return (
    <article
      style={{ width: "100vw", flex: "0 0 100vw" }}
      className="relative h-[100svh] shrink-0 overflow-hidden rounded-2xl bg-timber"
    >
      <motion.img
        style={{ opacity }}
        src={stage.image}
        alt={stage.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <motion.div style={{ opacity }} className="absolute inset-0 bg-gradient-to-t from-timber via-timber/50 to-timber/30" />

      <motion.div style={{ opacity }} className="absolute inset-0 flex items-end px-6 pb-20 md:items-center md:pb-0">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-8">
          <div className="max-w-xl">
            <SectionLabel>{stage.tag}</SectionLabel>
            <h3 className="mt-4 font-display text-4xl text-linen md:text-6xl">{stage.title}</h3>
            <p className="mt-4 max-w-md font-body text-base text-linen/70 md:text-lg">{stage.copy}</p>
          </div>
          <span aria-hidden="true" className="hidden select-none font-wide text-[9rem] leading-none text-linen/10 md:block">
            0{index + 1}
          </span>
        </div>
      </motion.div>
    </article>
  );
}

function Journey() {
  const ref = useRef(null);
  const total = CAFE.journey.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", `-${((total - 1) / total) * 100}%`]), {
    stiffness: 110,
    damping: 28,
    mass: 0.35,
  });
  useSkipHorizontalOnReverse(ref);

  return (
    <section id="journey" ref={ref} style={{ height: `${total * 100}vh` }} className="relative overflow-x-clip bg-timber">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ x, width: `${total * 100}vw` }} className="flex h-full">
          {CAFE.journey.map((stage, i) => (
            <JourneyStage key={stage.id} stage={stage} index={i} total={total} scrollYProgress={scrollYProgress} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Dishes() {
  return (
    <section id="menu" className="relative bg-cedar/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>We Serve</SectionLabel>
          </motion.div>
          <motion.h2 variants={fadeUp} className="mt-5 font-display text-4xl text-linen md:text-5xl">
            Made for the table
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {WE_SERVE_IMAGES.map((image) => (
            <motion.div
              key={image}
              variants={fadeUp}
              className="group h-[19rem] overflow-hidden rounded-2xl border border-brass/15 bg-timber sm:h-[22rem]"
            >
              <img
                src={image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function MenuDirectory() {
  return (
    <section className="relative bg-timber px-6 py-14 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 border-b border-brass/20 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>The Complete Menu</SectionLabel>
            <h2 className="mt-3 font-display text-3xl text-linen md:text-4xl">Something for every table</h2>
          </div>
        </div>
        <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-4">
          {MENU_DIRECTORY.map(([category, items]) => (
            <article key={category} className="rounded-xl border border-brass/15 bg-cedar/30 p-5">
              <h3 className="font-display text-xl leading-tight text-amber">{category}</h3>
              <div className="mt-4 space-y-1">
                {items.map(([name, price]) => (
                  <div key={name} className="flex min-h-8 items-center justify-between gap-2 border-b border-brass/10 py-1 font-body text-sm text-linen/80">
                    <span>{name}</span>
                    <span className="shrink-0 font-display text-base text-amber">{price}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoMoment({ src, poster, label, skipSeconds = 0 }) {
  const videoRef = useRef(null);

  const playVideo = (event) => {
    event.currentTarget.play().catch(() => {});
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const playWhenVisible = () => {
      video.play().catch(() => {});
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) playWhenVisible();
        else video.pause();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const startAfterIntro = (event) => {
    if (skipSeconds > 0 && event.currentTarget.currentTime < skipSeconds) {
      event.currentTarget.currentTime = skipSeconds;
    }
  };

  return (
    <section className="relative bg-timber p-0">
      <div className="w-full">
        <figure className="relative overflow-hidden bg-timber">
          <video
            ref={videoRef}
            className="block h-[70svh] min-h-[28rem] w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster}
            src={src}
            onLoadedMetadata={startAfterIntro}
            onTimeUpdate={startAfterIntro}
            onCanPlay={playVideo}
          />
          <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-timber/90 to-transparent px-5 pb-5 pt-12 font-body text-sm text-linen/80">
            {label}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ============================================================================
   GALLERY — vertical scroll drives a horizontal image sequence.
============================================================================ */

function HorizontalGallery({ onOpen }) {
  const ref = useRef(null);
  const slides = Array.from({ length: Math.ceil(CAFE.gallery.length / 2) }, (_, index) =>
    CAFE.gallery.slice(index * 2, index * 2 + 2),
  );
  const count = slides.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", `-${((count - 1) / count) * 100}%`]), {
    stiffness: 145,
    damping: 30,
    mass: 0.28,
  });
  useSkipHorizontalOnReverse(ref);

  return (
    <section id="gallery" ref={ref} style={{ height: `${count * 82}vh` }} className="relative overflow-x-clip bg-timber">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute left-0 right-0 top-10 z-10 text-center">
          <SectionLabel>Ambiance</SectionLabel>
          <h2 className="mt-4 font-display text-3xl text-linen md:text-5xl">A room worth lingering in</h2>
        </div>

        <motion.div style={{ x, width: `${count * 100}vw` }} className="flex h-full">
          {slides.map((slide) => (
            <div
              key={slide[0].id}
              style={{ width: "100vw", flex: "0 0 100vw" }}
              className="grid h-full shrink-0 grid-cols-2 gap-2 p-2 md:gap-4 md:p-4"
            >
              {slide.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => onOpen(photo)}
                  data-cursor="hover"
                  className="group relative h-full overflow-hidden rounded-2xl focus:outline-none md:rounded-3xl"
                >
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-timber/80 via-transparent to-timber/30" />
                  <p className="absolute bottom-6 left-4 right-4 font-accent text-lg italic text-linen md:bottom-10 md:left-6 md:text-2xl">
                    {photo.caption}
                  </p>
                </button>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Lightbox({ photo, onClose }) {
  useEffect(() => {
    document.body.style.overflow = photo ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [photo]);

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-timber/95 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.button
            onClick={onClose}
            className="absolute right-6 top-6 text-linen/80 transition-colors hover:text-amber"
            aria-label="Close photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <X size={28} />
          </motion.button>
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-4xl overflow-hidden rounded-lg"
          >
            <img
              src={photo.src}
              alt={photo.caption}
              decoding="async"
              className="max-h-[85vh] w-full object-contain"
            />
            <p className="mt-3 text-center font-accent text-lg italic text-linen/80">{photo.caption}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================================
   TESTIMONIALS — slow auto-rotating quotes.
============================================================================ */

function Testimonials({ reduceMotion }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % CAFE.testimonials.length), 5000);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const t = CAFE.testimonials[index];

  return (
    <section className="relative bg-cedar/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <SectionLabel>In Their Words</SectionLabel>
        <div className="relative mt-10 min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-accent text-2xl italic leading-relaxed text-linen/90 md:text-3xl">
                "{t.quote}"
              </p>
              <p className="mt-6 font-body text-sm uppercase tracking-[0.2em] text-brass">
                {t.name} · {t.context}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {CAFE.testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              data-cursor="hover"
              aria-label={`Show testimonial ${i + 1}`}
              className={`h-1.5 w-6 rounded-full transition-colors ${i === index ? "bg-amber" : "bg-linen/15"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   RESERVE — pure-frontend WhatsApp handoff
============================================================================ */

function ChandelierDivider() {
  return (
    <div className="relative flex justify-center py-2" aria-hidden="true">
      <div className="h-16 w-px bg-gradient-to-b from-transparent via-brass/50 to-transparent" />
      <div className="absolute top-16 h-2 w-2 rounded-full bg-amber shadow-[0_0_18px_6px_rgba(229,155,56,0.55)]" />
    </div>
  );
}

function Reserve() {
  const [name, setName] = useState("");
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const buildLink = () => {
    const lines = [
      `Hi NEW CHANAKYA, I'd like to reserve a table.`,
      name && `Name: ${name}`,
      `Guests: ${guests}`,
      date && `Date: ${date}`,
      time && `Time: ${time}`,
    ].filter(Boolean);
    return `https://wa.me/${CAFE.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  return (
    <section id="reserve" className="relative overflow-hidden bg-gradient-to-b from-cedar/40 to-timber px-6 py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-amber/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
          className="text-center"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>Reserve a Table</SectionLabel>
          </motion.div>
          <motion.h2 variants={fadeUp} className="mt-5 font-display text-4xl text-linen md:text-5xl">
            We'll hold the rooftop for you
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 font-body text-base text-linen/65">
            Fill in your details — it opens straight into WhatsApp with everything pre-filled.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="mt-12 rounded-3xl border border-brass/15 bg-cedar/60 p-6 backdrop-blur-sm md:p-10"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-brass">Your Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Optional"
                className="rounded-xl border border-brass/20 bg-timber/60 px-4 py-3 font-body text-linen placeholder:text-linen/30 focus:border-amber focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-brass">
                <Users size={12} className="mr-1 -mt-0.5 inline" /> Guests
              </span>
              <div className="flex items-center justify-between rounded-xl border border-brass/20 bg-timber/60 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  data-cursor="hover"
                  className="rounded-full p-1.5 text-linen/70 transition-colors hover:bg-brass/15 hover:text-amber"
                  aria-label="Decrease guests"
                >
                  <Minus size={16} />
                </button>
                <span className="font-display text-lg text-linen">{guests}</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(20, g + 1))}
                  data-cursor="hover"
                  className="rounded-full p-1.5 text-linen/70 transition-colors hover:bg-brass/15 hover:text-amber"
                  aria-label="Increase guests"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-brass">
                <CalendarDays size={12} className="mr-1 -mt-0.5 inline" /> Date
              </span>
              <input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-brass/20 bg-timber/60 px-4 py-3 font-body text-linen focus:border-amber focus:outline-none [color-scheme:dark]"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-brass">
                <Clock size={12} className="mr-1 -mt-0.5 inline" /> Time
              </span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border border-brass/20 bg-timber/60 px-4 py-3 font-body text-linen focus:border-amber focus:outline-none [color-scheme:dark]"
              />
            </label>
          </div>

          <Magnetic className="mt-8 block">
            <a
              href={buildLink()}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-amber py-4 font-body text-sm tracking-wide text-timber"
            >
              <Send size={16} /> Send Reservation on WhatsApp
            </a>
          </Magnetic>
        </motion.div>

        <ChandelierDivider />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="flex items-center gap-2 font-body text-sm text-linen/70">
            <Phone size={14} className="text-amber" /> {CAFE.phoneDisplay}
          </p>
          <p className="flex items-center gap-2 font-body text-sm text-linen/70">
            <MapPin size={14} className="text-amber" /> {CAFE.address}
          </p>
          <p className="flex items-center gap-2 font-body text-sm text-linen/70">
            <Clock size={14} className="text-amber" /> {CAFE.timings}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================================
   FOOTER — cinematic clip-path outro reveal.
============================================================================ */

function Footer() {
  return (
    <footer className="relative border-t border-brass/10 bg-timber px-6 pb-12 pt-24 md:pt-32">
      <motion.h2
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 0% 0 0)" }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
        className="mx-auto max-w-5xl text-center font-display text-4xl leading-tight text-linen sm:text-6xl md:text-7xl"
      >
        See you at <span className="text-amber">the table.</span>
      </motion.h2>

      <div className="mx-auto mt-20 flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <p className="font-display text-2xl text-linen">
            NEW <span className="text-amber">CHANAKYA</span>
          </p>
          <p className="mt-1 font-accent italic text-linen/50">{CAFE.tagline}</p>
        </div>

        <Magnetic>
          <a
            href={CAFE.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-brass/25 px-5 py-2.5 font-body text-sm text-linen/80 transition-colors hover:border-amber hover:text-amber"
          >
            <Instagram size={16} /> {CAFE.instagramHandle} <ArrowUpRight size={14} />
          </a>
        </Magnetic>
      </div>
      <p className="mt-8 text-center font-body text-xs tracking-wide text-linen/30">
        © {new Date().getFullYear()} NEW CHANAKYA · The Mall Road, Lawi Khurd, Solan
      </p>
    </footer>
  );
}

/* ============================================================================
   APP
============================================================================ */

export default function App() {
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useSmoothScroll(!reduceMotion);
  const onPreloaderDone = useCallback(() => setLoading(false), []);

  return (
    <div className="min-h-screen bg-timber font-body">
      <style>{`
        .has-custom-cursor, .has-custom-cursor * { cursor: none !important; }
        .has-custom-cursor input, .has-custom-cursor textarea, .has-custom-cursor select { cursor: auto !important; }
      `}</style>

      <Preloader reduceMotion={!!reduceMotion} onDone={onPreloaderDone} />
      <CustomCursor />
      <ScrollProgress />
      <Navbar />

      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <Hero reduceMotion={!!reduceMotion} />
          <Marquee items={CAFE.tickerWords} tone="text-linen/10" />
          <Story reduceMotion={!!reduceMotion} />
          <StoryQuote />
          <Journey />
          <Dishes />
          <MenuDirectory />
          <Marquee items={CAFE.dishes.map((d) => d.name)} reverse tone="text-brass/15" />
          <VideoMoment
            src="/videos/hero-video.mp4"
            poster={CAFE.storyImage}
            label="A taste of the table"
            skipSeconds={10}
          />
          <HorizontalGallery onOpen={setLightboxPhoto} />
          <VideoMoment
            src="/videos/ambiance-video.mp4"
            poster={CAFE.heroImage}
            label="Inside NEW CHANAKYA"
          />
          <Testimonials reduceMotion={!!reduceMotion} />
          <Reserve />
          <Footer />
        </motion.div>
      )}

      <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
    </div>
  );
}