// src/lib/constants.ts

export const productCategories = [
  "led-bulbs",
  "solar-lights",
  "security-lights",
  "smart-lighting",
  "camera-lights",
  "decorative-lights",
  "commercial-lighting",
  "batteries",
  "outdoor-lighting",
  "emergency-lights",
];

import {
  Lightbulb,
  Sun,
  Shield,
  Sparkles,
  Camera,
  BatteryCharging,
  Moon,
  Zap,
  Home,
  Fan,
  Car,
  Factory,
  Flashlight,
  Plug,
  PanelTop,
  Truck,
  ShieldCheck,
  Award,
  CreditCard,
  Headphones,
  Users,
} from "lucide-react";

// Blessed Two Electronics categories - Enhanced version
export const lightingCategories = [
  {
    id: "led-bulbs",
    slug: "led-bulbs",
    name: "LED Bulbs",
    description: "Energy efficient home & office bulbs",
    image: "/categories/led-bulbs.jpg",
    icon: Lightbulb,
    color: "from-green-500 to-emerald-500",
    subcategories: ["Edison Bulbs", "Corn Bulbs", "Panel Lights", "Spotlights"],
    popular: true,
  },
  {
    id: "solar-lighting",
    slug: "solar-lighting",
    name: "Solar Lighting",
    description: "Complete solar lighting systems",
    image: "/categories/solar-lighting.jpg",
    icon: Sun,
    color: "from-amber-500 to-orange-500",
    subcategories: [
      "Solar Home Kits",
      "Street Lights",
      "Garden Lights",
      "Solar Flood Lights",
    ],
    popular: true,
  },
  {
    id: "security-lights",
    slug: "security-lights",
    name: "Security Lights",
    description: "Motion sensor & surveillance lighting",
    image: "/categories/security-lights.jpg",
    icon: Shield,
    color: "from-blue-500 to-cyan-500",
    subcategories: [
      "PIR Motion Lights",
      "Flood Lights",
      "Wall Lights",
      "Post Lights",
    ],
    popular: true,
  },
  {
    id: "smart-lighting",
    slug: "smart-lighting",
    name: "Smart Lighting",
    description: "App & voice controlled lighting",
    image: "/categories/smart-lighting.jpg",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    subcategories: [
      "Smart Bulbs",
      "Smart Switches",
      "LED Strips",
      "Smart Controllers",
    ],
  },
  {
    id: "cctv-lighting",
    slug: "cctv-lighting",
    name: "CCTV Lighting",
    description: "Specialized lighting for surveillance",
    image: "/categories/cctv-lighting.jpg",
    icon: Camera,
    color: "from-red-500 to-orange-500",
    subcategories: [
      "IR Illuminators",
      "Camera Flood Lights",
      "License Plate Lights",
    ],
  },
  {
    id: "home-lighting",
    slug: "home-lighting",
    name: "Home Lighting",
    description: "Complete home lighting solutions",
    image: "/categories/home-lighting.jpg",
    icon: Home,
    color: "from-yellow-500 to-amber-500",
    subcategories: [
      "Ceiling Lights",
      "Wall Lights",
      "Table Lamps",
      "Chandeliers",
    ],
    popular: true,
  },
  {
    id: "commercial-lighting",
    slug: "commercial-lighting",
    name: "Commercial & Industrial",
    description: "Business & factory lighting",
    image: "/categories/commercial-lighting.jpg",
    icon: Factory,
    color: "from-indigo-500 to-purple-500",
    subcategories: [
      "Shop Lights",
      "Warehouse Lighting",
      "High Bay Lights",
      "Office Panels",
    ],
  },
  {
    id: "emergency-lighting",
    slug: "emergency-lighting",
    name: "Emergency Lighting",
    description: "Backup & safety lighting systems",
    image: "/categories/emergency-lighting.jpg",
    icon: Zap,
    color: "from-red-500 to-yellow-500",
    subcategories: [
      "Exit Signs",
      "Emergency Bulbs",
      "Central Inverter Systems",
      "Portable Lights",
    ],
  },
  {
    id: "automotive-lighting",
    slug: "automotive-lighting",
    name: "Automotive Lights",
    description: "Vehicle & motorcycle lighting",
    image: "/categories/automotive-lighting.jpg",
    icon: Car,
    color: "from-gray-500 to-blue-500",
    subcategories: ["Headlights", "Fog Lights", "Work Lights", "Indicators"],
  },
  {
    id: "decorative-lighting",
    slug: "decorative-lighting",
    name: "Decorative & Festive",
    description: "Party & event lighting",
    image: "/categories/decorative-lighting.jpg",
    icon: Sparkles,
    color: "from-pink-500 to-rose-500",
    subcategories: [
      "Fairy Lights",
      "Neon Signs",
      "Garden Decor",
      "Christmas Lights",
    ],
    seasonal: true,
  },
  {
    id: "power-solutions",
    slug: "power-solutions",
    name: "Power Solutions",
    description: "Batteries & power backup",
    image: "/categories/power-solutions.jpg",
    icon: BatteryCharging,
    color: "from-blue-500 to-teal-500",
    subcategories: [
      "Inverter Batteries",
      "Solar Batteries",
      "UPS Systems",
      "Stabilizers",
    ],
  },
  {
    id: "electrical-accessories",
    slug: "electrical-accessories",
    name: "Electrical Accessories",
    description: "Installation components & tools",
    image: "/categories/electrical-accessories.jpg",
    icon: Plug,
    color: "from-gray-600 to-gray-800",
    subcategories: [
      "Switches & Sockets",
      "Wires & Cables",
      "Conduits",
      "Installation Tools",
    ],
  },
  {
    id: "ceiling-fans",
    slug: "ceiling-fans",
    name: "Ceiling Fans with Lights",
    description: "Energy efficient ceiling fans",
    image: "/categories/ceiling-fans.jpg",
    icon: Fan,
    color: "from-cyan-500 to-blue-500",
    subcategories: ["Standard Fans", "Premium Fans", "Remote Control Fans"],
    popular: true,
  },
  {
    id: "outdoor-lighting",
    slug: "outdoor-lighting",
    name: "Outdoor & Garden",
    description: "Weatherproof exterior lighting",
    image: "/categories/outdoor-lighting.jpg",
    icon: Moon,
    color: "from-indigo-500 to-purple-500",
    subcategories: [
      "Path Lights",
      "Wall Lights",
      "Flood Lights",
      "Step Lights",
    ],
  },
  {
    id: "specialty-lighting",
    slug: "specialty-lighting",
    name: "Specialty Lighting",
    description: "Niche & specialized applications",
    image: "/categories/specialty-lighting.jpg",
    icon: Flashlight,
    color: "from-orange-500 to-red-500",
    subcategories: [
      "Grow Lights",
      "UV Lights",
      "Stage Lights",
      "Medical Lights",
    ],
  },
  {
    id: "solar-panels",
    slug: "solar-panels",
    name: "Solar Panels",
    description: "Complete solar energy systems",
    image: "/categories/solar-panels.jpg",
    icon: PanelTop,
    color: "from-amber-600 to-yellow-500",
    subcategories: [
      "Monocrystalline",
      "Polycrystalline",
      "Solar Kits",
      "Mounting Systems",
    ],
    popular: true,
  },
];

// Special collections for featured sections
export const featuredCollections = [
  {
    id: "energy-saving-kits",
    name: "Energy Saving Kits",
    description: "Complete kits to reduce electricity bills",
    slug: "energy-saving-kits",
    image: "/collections/energy-kits.jpg",
  },
  {
    id: "nairobi-essentials",
    name: "Nairobi Essentials",
    description: "Best sellers in Nairobi area",
    slug: "nairobi-essentials",
    image: "/collections/nairobi-essentials.jpg",
  },
  {
    id: "budget-friendly",
    name: "Budget Friendly",
    description: "Quality lighting under 2000 KES",
    slug: "budget-friendly",
    image: "/collections/budget-lighting.jpg",
  },
  {
    id: "premium-lighting",
    name: "Premium Solutions",
    description: "High-end lighting for commercial use",
    slug: "premium-lighting",
    image: "/collections/premium-lighting.jpg",
  },
];

// Enhanced lighting tags
export const lightingTags = [
  // Energy & Cost
  { id: "energy-saving", name: "Energy Saving", icon: Zap },
  { id: "low-wattage", name: "Low Wattage" },
  { id: "bill-reduction", name: "Reduces Bills" },

  // Features
  { id: "waterproof-ip65", name: "Waterproof IP65" },
  { id: "weatherproof", name: "Weatherproof" },
  { id: "motion-sensor", name: "Motion Sensor" },
  { id: "dusk-to-dawn", name: "Dusk to Dawn" },
  { id: "auto-on-off", name: "Auto On/Off" },
  { id: "dimmable", name: "Dimmable" },
  { id: "color-changing", name: "Color Changing" },

  // Smart Features
  { id: "wifi-enabled", name: "Wi-Fi Enabled" },
  { id: "bluetooth", name: "Bluetooth" },
  { id: "voice-control", name: "Voice Control" },
  { id: "app-controlled", name: "App Controlled" },
  { id: "smart-home", name: "Smart Home Compatible" },

  // Power
  { id: "solar-powered", name: "Solar Powered" },
  { id: "battery-backup", name: "Battery Backup" },
  { id: "usb-charging", name: "USB Charging" },
  { id: "ac-dc", name: "AC/DC Compatible" },

  // Quality
  { id: "long-lasting", name: "50,000+ Hours" },
  { id: "dali-certified", name: "DALI Certified" },
  { id: "ce-certified", name: "CE Certified" },
  { id: "rohs-compliant", name: "RoHS Compliant" },

  // Installation
  { id: "easy-install", name: "Easy Installation" },
  { id: "diy-friendly", name: "DIY Friendly" },
  { id: "plug-play", name: "Plug & Play" },

  // Warranty & Support
  { id: "2-year-warranty", name: "2 Year Warranty" },
  { id: "3-year-warranty", name: "3 Year Warranty" },
  { id: "local-support", name: "Local Support" },
  { id: "free-installation", name: "Free Installation*" },

  // Use Cases
  { id: "home-office", name: "Home & Office" },
  { id: "shop-retail", name: "Shop & Retail" },
  { id: "industrial-use", name: "Industrial Use" },
  { id: "outdoor-garden", name: "Outdoor & Garden" },

  // Special Offers
  { id: "nairobi-delivery", name: "Nairobi Free Delivery" },
  { id: "bulk-discount", name: "Bulk Discount Available" },
  { id: "trade-pricing", name: "Trade Pricing" },
];

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Top Rated" },
  { value: "deal", label: "Deal of the Day" },
];

export const shopFeatures = [
  {
    title: "Same-Day Nairobi Delivery",
    description:
      "Order by 2PM, get it same day. Free delivery within Nairobi CBD for orders above KES 3,000.",
    icon: Truck,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "2-Year Warranty",
    description:
      "All products come with 2-year warranty. Quality guaranteed or your money back.",
    icon: ShieldCheck,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Expert Installation",
    description:
      "Professional installation services available. Our technicians ensure perfect setup.",
    icon: Award,
    color: "from-amber-500 to-yellow-500",
  },
  {
    title: "M-Pesa & Card Payments",
    description:
      "Secure payments via M-Pesa, Visa, Mastercard. Lipa Pole Pole financing available.",
    icon: CreditCard,
    color: "from-purple-500 to-pink-500",
  },
  {
    title: "24/7 Support",
    description:
      "Lighting experts available round the clock. Call, WhatsApp, or visit our Duruma Road store.",
    icon: Headphones,
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Bulk Order Discounts",
    description:
      "Special prices for contractors, businesses, and bulk purchases. Request a quote today.",
    icon: Users,
    color: "from-indigo-500 to-purple-500",
  },
];

export const businessTypes = [
  "Individual",
  "Small Business",
  "Contractor",
  "Electrician",
  "Architecture Firm",
  "Construction Company",
  "Real Estate Developer",
  "Hospitality",
  "Retail Store",
  "Other",
];

export const cities = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
  "Kakamega",
  "Other",
];
