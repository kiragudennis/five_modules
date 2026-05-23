// src/lib/constants.ts

import { CartItem } from "@/types/store";
import {
  Sparkles,
  Zap,
  Home,
  Car,
  Truck,
  ShieldCheck,
  Award,
  CreditCard,
  Headphones,
  Users,
  MapPin,
  Smartphone,
  Laptop,
  Shirt,
  Utensils,
  Sofa,
  Activity,
  Gamepad2,
  Baby,
  BookOpen,
  Dog,
  ShoppingCart,
  Gift,
  Crown,
  Package,
  TrendingUp,
  RefreshCcw,
  Star,
} from "lucide-react";

export const scrollableCategories = [
  {
    id: "electronics",
    slug: "electronics",
    name: "Electronics",
    icon: Smartphone,
    color: "bg-blue-100 text-blue-600",
    gradient: "from-blue-500 to-cyan-500",
    description: "Latest electronics & gadgets",
    image: "/categories/electronics.jpg",
    subcategories: ["Smartphones", "Tablets", "Wearables", "Audio", "Gaming"],
    popular: true,
    featured: true,
    productCount: 1250,
  },
  {
    id: "phones-tablets",
    slug: "phones-tablets",
    name: "Phones & Tablets",
    icon: Smartphone,
    color: "bg-indigo-100 text-indigo-600",
    gradient: "from-indigo-500 to-purple-500",
    description: "Smartphones, tablets & accessories",
    image: "/categories/phones-tablets.jpg",
    subcategories: [
      "Smartphones",
      "Tablets",
      "Phone Cases",
      "Screen Protectors",
      "Chargers",
    ],
    popular: true,
    featured: true,
    productCount: 3450,
  },
  {
    id: "computers",
    slug: "computers",
    name: "Computers",
    icon: Laptop,
    color: "bg-cyan-100 text-cyan-600",
    gradient: "from-cyan-500 to-blue-500",
    description: "Laptops, desktops & components",
    image: "/categories/computers.jpg",
    subcategories: [
      "Laptops",
      "Desktops",
      "Monitors",
      "Keyboards",
      "Mice",
      "Components",
    ],
    popular: true,
    featured: true,
    productCount: 2890,
  },
  {
    id: "fashion",
    slug: "fashion",
    name: "Fashion",
    icon: Shirt,
    color: "bg-pink-100 text-pink-600",
    gradient: "from-pink-500 to-rose-500",
    description: "Clothing, shoes & accessories",
    image: "/categories/fashion.jpg",
    subcategories: ["Men", "Women", "Kids", "Shoes", "Bags", "Accessories"],
    popular: true,
    productCount: 5600,
  },
  {
    id: "home-appliances",
    slug: "home-appliances",
    name: "Home Appliances",
    icon: Home,
    color: "bg-orange-100 text-orange-600",
    gradient: "from-orange-500 to-red-500",
    description: "Essential home appliances",
    image: "/categories/home-appliances.jpg",
    subcategories: [
      "Refrigerators",
      "Washing Machines",
      "ACs",
      "Microwaves",
      "Vacuum Cleaners",
    ],
    popular: true,
    productCount: 1850,
  },
  {
    id: "kitchen",
    slug: "kitchen",
    name: "Kitchen & Dining",
    icon: Utensils,
    color: "bg-amber-100 text-amber-600",
    gradient: "from-amber-500 to-yellow-500",
    description: "Kitchenware & dining essentials",
    image: "/categories/kitchen.jpg",
    subcategories: [
      "Cookware",
      "Bakeware",
      "Kitchen Tools",
      "Dinnerware",
      "Glassware",
    ],
    popular: true,
    productCount: 2100,
  },
  {
    id: "furniture",
    slug: "furniture",
    name: "Furniture",
    icon: Sofa,
    color: "bg-emerald-100 text-emerald-600",
    gradient: "from-emerald-500 to-teal-500",
    description: "Home & office furniture",
    image: "/categories/furniture.jpg",
    subcategories: ["Living Room", "Bedroom", "Office", "Outdoor", "Storage"],
    productCount: 1560,
  },
  {
    id: "sports",
    slug: "sports",
    name: "Sports & Outdoors",
    icon: Activity,
    color: "bg-green-100 text-green-600",
    gradient: "from-green-500 to-emerald-500",
    description: "Sports equipment & outdoor gear",
    image: "/categories/sports.jpg",
    subcategories: ["Fitness", "Team Sports", "Cycling", "Camping", "Swimming"],
    popular: true,
    productCount: 980,
  },
  {
    id: "toys-games",
    slug: "toys-games",
    name: "Toys & Games",
    icon: Gamepad2,
    color: "bg-purple-100 text-purple-600",
    gradient: "from-purple-500 to-pink-500",
    description: "Toys, games & hobbies",
    image: "/categories/toys-games.jpg",
    subcategories: [
      "Action Figures",
      "Board Games",
      "Video Games",
      "Puzzles",
      "Remote Control",
    ],
    seasonal: true,
    productCount: 2340,
  },
  {
    id: "beauty",
    slug: "beauty",
    name: "Beauty & Personal Care",
    icon: Sparkles,
    color: "bg-rose-100 text-rose-600",
    gradient: "from-rose-500 to-pink-500",
    description: "Beauty products & personal care",
    image: "/categories/beauty.jpg",
    subcategories: [
      "Skincare",
      "Makeup",
      "Hair Care",
      "Fragrances",
      "Grooming",
    ],
    popular: true,
    productCount: 3120,
  },
  {
    id: "baby",
    slug: "baby",
    name: "Baby & Maternity",
    icon: Baby,
    color: "bg-sky-100 text-sky-600",
    gradient: "from-sky-500 to-blue-500",
    description: "Baby products & maternity wear",
    image: "/categories/baby.jpg",
    subcategories: [
      "Baby Gear",
      "Nursery",
      "Feeding",
      "Diapering",
      "Maternity",
    ],
    productCount: 1450,
  },
  {
    id: "automotive",
    slug: "automotive",
    name: "Automotive",
    icon: Car,
    color: "bg-gray-100 text-gray-600",
    gradient: "from-gray-500 to-gray-700",
    description: "Car parts & accessories",
    image: "/categories/automotive.jpg",
    subcategories: ["Car Care", "Tools", "Electronics", "Interior", "Exterior"],
    productCount: 870,
  },
  {
    id: "books",
    slug: "books",
    name: "Books & Media",
    icon: BookOpen,
    color: "bg-yellow-100 text-yellow-600",
    gradient: "from-yellow-500 to-amber-500",
    description: "Books, movies & music",
    image: "/categories/books.jpg",
    subcategories: [
      "Fiction",
      "Non-Fiction",
      "Textbooks",
      "Audiobooks",
      "eBooks",
    ],
    productCount: 8900,
  },
  {
    id: "pet-supplies",
    slug: "pet-supplies",
    name: "Pet Supplies",
    icon: Dog,
    color: "bg-amber-100 text-amber-600",
    gradient: "from-amber-500 to-orange-500",
    description: "Everything for your pets",
    image: "/categories/pet-supplies.jpg",
    subcategories: ["Dog", "Cat", "Fish", "Bird", "Small Pet"],
    productCount: 670,
  },
  {
    id: "grocery",
    slug: "grocery",
    name: "Grocery",
    icon: ShoppingCart,
    color: "bg-lime-100 text-lime-600",
    gradient: "from-lime-500 to-green-500",
    description: "Daily essentials & groceries",
    image: "/categories/grocery.jpg",
    subcategories: [
      "Fresh Produce",
      "Pantry",
      "Beverages",
      "Snacks",
      "Household",
    ],
    popular: true,
    productCount: 4300,
  },
];

// Export both for backward compatibility during migration
export const lightingCategories = scrollableCategories;

export const BUNDLE_CONFIG = {
  mystery: {
    icon: Gift,
    label: "Mystery Bundle",
    description: "Surprise package with guaranteed value",
    color: "from-purple-500 to-pink-500",
    badge: "🎁 Mystery Box",
  },
  curated: {
    icon: Crown,
    label: "Curated Collection",
    description: "Hand-picked by our experts",
    color: "from-amber-500 to-yellow-500",
    badge: "✨ Curated",
  },
  build_own: {
    icon: Package,
    label: "Build Your Own",
    description: "Choose the items you want",
    color: "from-blue-500 to-cyan-500",
    badge: "🛠️ Customizable",
  },
  tiered: {
    icon: TrendingUp,
    label: "Tiered Savings",
    description: "Save more when you buy more",
    color: "from-green-500 to-emerald-500",
    badge: "📈 Tiered Pricing",
  },
  subscription: {
    icon: RefreshCcw,
    label: "Subscribe & Save",
    description: "Recurring deliveries",
    color: "from-indigo-500 to-purple-500",
    badge: "🔄 Recurring",
  },
  bonus_points: {
    icon: Star,
    label: "Points Bundle",
    description: "Earn bonus loyalty points",
    color: "from-yellow-500 to-orange-500",
    badge: "⭐ Points Bonus",
  },
};

// If you need to keep the icon components mapping separately
export const categoryIcons = {
  electronics: "Smartphone",
  "phones-tablets": "Smartphone",
  computers: "Laptop",
  fashion: "Shirt",
  "home-appliances": "Home",
  kitchen: "Utensils",
  furniture: "Sofa",
  sports: "Activity",
  "toys-games": "Gamepad",
  beauty: "Sparkles",
  baby: "Baby",
  automotive: "Car",
  books: "Book",
  "pet-supplies": "Dog",
  grocery: "ShoppingCart",
};

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

export const varietyOptions = [
  "wattage",
  "colorTemp",
  "warranty",
  "batteryCapacity",
  "solarPanelWattage",
  "dimensions",
  "ipRating",
  "installationType",
  "referralPoints",
  "size",
  "type",
];

// Helper functions for the variety form
export const getPlaceholderForType = (type: string): string => {
  const placeholders: Record<string, string> = {
    wattage: "e.g., 50, 100, 200",
    colorTemp: "e.g., Warm White, Cool White, Daylight",
    warranty: "e.g., 1 year, 2 years, 5 years",
    batteryCapacity: "e.g., 2000, 3000, 5000",
    solarPanelWattage: "e.g., 100, 200, 300",
    dimensions: "e.g., 10x20x30 cm",
    ipRating: "e.g., IP65, IP67, IP68",
    installationType: "e.g., Wall mount, Ceiling, Portable",
    referralPoints: "e.g., 100, 200, 500",
    size: "e.g., Small, Medium, Large, XL",
    type: "e.g., Basic, Pro, Premium",
  };
  return placeholders[type] || "Enter value";
};

export const getUnitHint = (type: string): string => {
  const units: Record<string, string> = {
    wattage: "W",
    solarPanelWattage: "W",
    batteryCapacity: "Ah",
    referralPoints: "pts",
    dimensions: "cm",
  };
  return units[type] || "";
};

export const getValueExample = (type: string): string => {
  const examples: Record<string, string> = {
    wattage: "Example: 50, 100, 150 (will show as '50W')",
    colorTemp: "Example: Warm White, Cool White, Daylight",
    warranty: "Example: 1 year, 2 years, 5 years",
    batteryCapacity: "Example: 2000, 3000, 5000 (will show as '2000Ah')",
    solarPanelWattage: "Example: 100, 200, 300 (will show as '100W')",
    dimensions: "Example: 10x20x30 cm",
    ipRating: "Example: IP65, IP67, IP68",
    installationType: "Example: Wall mount, Ceiling, Portable",
    referralPoints: "Example: 100, 200, 500 (will show as '100 pts')",
    size: "Example: Small, Medium, Large, XL",
    type: "Example: Basic, Pro, Premium",
  };
  return examples[type] || "Enter the specific value for this variety";
};

export const formatTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    wattage: "Wattage",
    colorTemp: "Color Temperature",
    warranty: "Warranty",
    batteryCapacity: "Battery Capacity",
    solarPanelWattage: "Solar Panel Wattage",
    dimensions: "Dimensions",
    ipRating: "IP Rating",
    installationType: "Installation Type",
    referralPoints: "Referral Points",
    size: "Size",
    type: "Type",
  };
  return typeMap[type] || type.replace(/([A-Z])/g, " $1").trim();
};

export const formatValue = (type: string, value: string): string => {
  switch (type) {
    case "wattage":
    case "solarPanelWattage":
      return value.includes("W") ? value : `${value}W`;
    case "batteryCapacity":
      return value.includes("Ah") ? value : `${value}Ah`;
    case "referralPoints":
      return value.includes("pts") ? value : `${value} pts`;
    default:
      return value;
  }
};

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
  "Garissa",
  "Nyeri",
  "Meru",
  "Other",
];

export const shippingMethods = [
  {
    id: "standard",
    name: "Standard Delivery",
    cost: 200,
    time: "3-5 business days",
    description: "via our trusted logistics partners",
    icon: Truck,
  },
  {
    id: "express",
    name: "Same-Day Express",
    cost: 500,
    time: "Within Nairobi CBD",
    description: "Order by 2PM, delivered today",
    icon: Zap,
  },
  {
    id: "pickup",
    name: "Store Pickup",
    cost: 0,
    time: "Ready within 2 hours",
    description: "Collect from Duruma Road, Nairobi",
    icon: MapPin,
  },
];
// lib/constants/tags.ts
// Customer-focused tags for Blessed Two Electronics

export const customerTags = {
  // Use Cases (How customers will use the product)
  useCases: [
    "home-lighting",
    "office-lighting",
    "shop-lighting",
    "outdoor-garden",
    "security-lighting",
    "emergency-lighting",
    "decorative-lighting",
    "kitchen-lighting",
    "bedroom-lighting",
    "bathroom-lighting",
    "living-room",
    "garage-lighting",
    "pathway-lighting",
    "street-lighting",
    "warehouse-lighting",
  ],

  // Customer Needs & Benefits
  needsBenefits: [
    "energy-saving",
    "cost-saving",
    "easy-install",
    "long-lasting",
    "bright-lighting",
    "dimmable",
    "weatherproof",
    "child-safe",
    "eco-friendly",
    "low-maintenance",
    "smart-home",
    "remote-control",
    "motion-sensor",
    "auto-on-off",
    "battery-backup",
  ],

  // Project Types
  projectTypes: [
    "home-renovation",
    "new-construction",
    "business-setup",
    "security-upgrade",
    "energy-upgrade",
    "emergency-preparedness",
    "holiday-decoration",
    "garden-makeover",
    "shop-renovation",
    "office-upgrade",
  ],

  // Customer Types
  customerTypes: [
    "homeowner",
    "renter",
    "business-owner",
    "contractor",
    "electrician",
    "property-manager",
    "hotel-owner",
    "restaurant-owner",
    "school-admin",
    "hospital-admin",
  ],

  // Budget Levels
  budgetLevels: [
    "budget-friendly",
    "mid-range",
    "premium",
    "value-pack",
    "bulk-discount",
  ],

  // Special Offers
  specialOffers: [
    "deal-of-day",
    "clearance-sale",
    "new-arrival",
    "best-seller",
    "staff-pick",
    "nairobi-popular",
    "free-installation",
    "free-delivery",
  ],

  // Energy & Cost Saving
  energyCost: [
    "save-electricity",
    "reduce-bills",
    "solar-powered",
    "battery-operated",
    "low-wattage",
    "led-technology",
    "energy-star",
  ],

  // Installation & Maintenance
  installation: [
    "diy-friendly",
    "plug-play",
    "professional-install",
    "no-wiring-needed",
    "wireless",
    "easy-replace",
    "maintenance-free",
  ],

  // Smart Features
  smartFeatures: [
    "wifi-enabled",
    "bluetooth",
    "voice-control",
    "app-controlled",
    "timer-function",
    "color-changing",
    "scene-setting",
  ],
};

// Map product categories to relevant customer tags
export const categoryCustomerTagMap: Record<string, string[]> = {
  // LED Bulbs
  "led-bulbs": [
    "home-lighting",
    "energy-saving",
    "cost-saving",
    "easy-install",
    "long-lasting",
    "homeowner",
    "budget-friendly",
    "save-electricity",
    "diy-friendly",
  ],

  // Solar Lights
  "solar-lights": [
    "outdoor-garden",
    "security-lighting",
    "solar-powered",
    "energy-saving",
    "weatherproof",
    "eco-friendly",
    "no-wiring-needed",
    "garden-makeover",
    "homeowner",
  ],

  // Security Lights
  "security-lights": [
    "security-lighting",
    "motion-sensor",
    "weatherproof",
    "auto-on-off",
    "home-security",
    "business-owner",
    "property-manager",
    "security-upgrade",
  ],

  // Smart Lighting
  "smart-lighting": [
    "smart-home",
    "wifi-enabled",
    "voice-control",
    "app-controlled",
    "dimmable",
    "color-changing",
    "tech-enthusiast",
    "premium",
    "home-automation",
  ],

  // Camera Lights
  "camera-lights": [
    "security-lighting",
    "motion-sensor",
    "business-security",
    "property-manager",
    "cctv-integration",
    "professional-install",
    "security-upgrade",
  ],

  // Decorative Lights
  "decorative-lights": [
    "decorative-lighting",
    "living-room",
    "bedroom-lighting",
    "holiday-decoration",
    "mood-lighting",
    "renter-friendly",
    "easy-install",
    "plug-play",
  ],

  // Commercial Lighting
  "commercial-lighting": [
    "shop-lighting",
    "office-lighting",
    "warehouse-lighting",
    "business-owner",
    "contractor",
    "commercial-grade",
    "professional-install",
    "bulk-discount",
  ],

  // Batteries
  batteries: [
    "emergency-lighting",
    "battery-backup",
    "backup-power",
    "uninterrupted-power",
    "emergency-preparedness",
    "business-continuity",
  ],

  // Outdoor Lighting
  "outdoor-lighting": [
    "outdoor-garden",
    "pathway-lighting",
    "weatherproof",
    "garden-makeover",
    "home-exterior",
    "motion-sensor",
    "security-lighting",
  ],

  // Emergency Lights
  "emergency-lights": [
    "emergency-lighting",
    "safety-first",
    "backup-power",
    "emergency-preparedness",
    "mandatory-safety",
    "business-compliance",
    "property-manager",
  ],

  // Ceiling Fans with Lights
  "ceiling-fans": [
    "bedroom-lighting",
    "living-room",
    "energy-saving",
    "hot-weather",
    "home-cooling",
    "diy-friendly",
    "long-lasting",
  ],

  // Solar Panels
  "solar-panels": [
    "solar-powered",
    "energy-saving",
    "reduce-bills",
    "eco-friendly",
    "long-term-investment",
    "off-grid",
    "business-energy",
  ],
};

// Popular Nairobi-specific tags
export const nairobiTags = [
  "nairobi-delivery",
  "same-day-delivery",
  "free-nairobi-shipping",
  "popular-in-nairobi",
  "nairobi-essential",
  "duruma-road",
  "nairobi-showroom",
  "nairobi-installation",
];

// Tag display names (for better UI)
export const tagDisplayNames: Record<string, string> = {
  // Use Cases
  "home-lighting": "Home Lighting",
  "office-lighting": "Office Lighting",
  "shop-lighting": "Shop Lighting",
  "outdoor-garden": "Outdoor & Garden",
  "security-lighting": "Security Lighting",
  "emergency-lighting": "Emergency Lighting",
  "decorative-lighting": "Decorative Lighting",
  "kitchen-lighting": "Kitchen Lighting",
  "bedroom-lighting": "Bedroom Lighting",
  "bathroom-lighting": "Bathroom Lighting",
  "living-room": "Living Room",
  "garage-lighting": "Garage Lighting",
  "pathway-lighting": "Pathway Lighting",
  "street-lighting": "Street Lighting",
  "warehouse-lighting": "Warehouse Lighting",

  // Needs & Benefits
  "energy-saving": "Energy Saving",
  "cost-saving": "Cost Saving",
  "easy-install": "Easy Installation",
  "long-lasting": "Long Lasting",
  "bright-lighting": "Bright Lighting",
  dimmable: "Dimmable",
  weatherproof: "Weatherproof",
  "child-safe": "Child Safe",
  "eco-friendly": "Eco Friendly",
  "low-maintenance": "Low Maintenance",
  "smart-home": "Smart Home Compatible",
  "remote-control": "Remote Control",
  "motion-sensor": "Motion Sensor",
  "auto-on-off": "Auto On/Off",
  "battery-backup": "Battery Backup",

  // Budget
  "budget-friendly": "Budget Friendly",
  "mid-range": "Mid Range",
  premium: "Premium Quality",
  "value-pack": "Value Pack",
  "bulk-discount": "Bulk Discount",

  // Special Offers
  "deal-of-day": "Deal of the Day",
  "clearance-sale": "Clearance Sale",
  "new-arrival": "New Arrival",
  "best-seller": "Best Seller",
  "staff-pick": "Staff Pick",
  "nairobi-popular": "Popular in Nairobi",
  "free-installation": "Free Installation",
  "free-delivery": "Free Delivery",

  // Nairobi-specific
  "nairobi-delivery": "Nairobi Delivery",
  "same-day-delivery": "Same Day Delivery",
  "free-nairobi-shipping": "Free Nairobi Shipping",
  "popular-in-nairobi": "Popular in Nairobi",
  "nairobi-essential": "Nairobi Essential",
  "duruma-road": "Duruma Road Store",
  "nairobi-showroom": "Nairobi Showroom",
  "nairobi-installation": "Nairobi Installation",
};

// Realistic Installation Services for Kenyan Lighting Market
export const installationOptions = [
  {
    id: "basic-bulb",
    name: "Basic Bulb Installation",
    cost: 150,
    description: "Simple bulb replacement (up to 5 bulbs)",
    duration: "30-60 mins",
    includes: [
      "Safe removal of old bulbs",
      "New bulb installation",
      "Basic safety testing",
      "Disposal of old bulbs",
    ],
    bestFor: ["LED bulbs", "CFL bulbs", "Energy savers"],
    icon: "💡",
    recommended: true,
  },
  {
    id: "tube-light",
    name: "Tube Light Installation",
    cost: 300,
    description: "Fluorescent/LED tube installation (up to 3 tubes)",
    duration: "1-2 hours",
    includes: [
      "Choke/ballast checking",
      "Tube mounting",
      "Wiring connection",
      "Starter replacement if needed",
    ],
    bestFor: ["4ft LED tubes", "2ft tubes", "Office lighting"],
    icon: "📏",
  },
  {
    id: "ceiling-light",
    name: "Ceiling Light Fitting",
    cost: 500,
    description: "Ceiling-mounted light fixture installation",
    duration: "1-2 hours",
    includes: [
      "Mounting bracket installation",
      "Wiring connection",
      "Fixture assembly",
      "Bulb installation",
    ],
    bestFor: ["Pendant lights", "Chandeliers", "Downlights"],
    icon: "🔩",
  },
  {
    id: "solar-light",
    name: "Solar Light Installation",
    cost: 1000,
    description: "Complete solar lighting system setup",
    duration: "3-4 hours",
    includes: [
      "Solar panel mounting",
      "Battery connection",
      "Light fixture installation",
      "System testing",
      "Basic orientation",
    ],
    bestFor: [
      "Solar street lights",
      "Solar garden lights",
      "Solar security lights",
    ],
    icon: "☀️",
    recommended: true,
  },
  {
    id: "security-light",
    name: "Security Light Setup",
    cost: 800,
    description: "Motion sensor security light installation",
    duration: "2-3 hours",
    includes: [
      "Mounting at optimal height",
      "Motion sensor calibration",
      "Weatherproof wiring",
      "Angle adjustment",
    ],
    bestFor: ["PIR security lights", "Flood lights", "Camera lights"],
    icon: "👁️",
  },
  {
    id: "emergency-light",
    name: "Emergency Light Installation",
    cost: 1200,
    description: "Emergency backup lighting system",
    duration: "3-4 hours",
    includes: [
      "Main power connection",
      "Battery backup setup",
      "Auto-switch testing",
      "Exit sign installation if needed",
    ],
    bestFor: ["Emergency lights", "Exit signs", "Backup systems"],
    icon: "🚨",
  },
  {
    id: "commercial-lighting",
    name: "Commercial Lighting Setup",
    cost: 2500,
    description: "Multiple point commercial lighting installation",
    duration: "1 full day",
    includes: [
      "Up to 10 light points",
      "Wiring conduit installation",
      "Switchboard connection",
      "Energy consumption testing",
    ],
    bestFor: ["Shops", "Offices", "Restaurants", "Showrooms"],
    icon: "🏢",
    recommended: true,
  },
  {
    id: "smart-lighting",
    name: "Smart Lighting Setup",
    cost: 1500,
    description: "Smart/automated lighting system configuration",
    duration: "2-3 hours",
    includes: [
      "App installation guidance",
      "Wi-Fi/Bluetooth pairing",
      "Schedule programming",
      "Voice assistant setup",
    ],
    bestFor: ["Smart bulbs", "Wi-Fi lights", "App-controlled systems"],
    icon: "📱",
  },
  {
    id: "outdoor-lighting",
    name: "Outdoor/Garden Lighting",
    cost: 1200,
    description: "Weatherproof outdoor lighting installation",
    duration: "3-4 hours",
    includes: [
      "Waterproof connections",
      "Burial cable installation",
      "Transformer setup for low voltage",
      "Landscape lighting placement",
    ],
    bestFor: ["Garden lights", "Pathway lights", "Wall washers"],
    icon: "🌳",
  },
  {
    id: "industrial-lighting",
    name: "Industrial/High Bay",
    cost: 3500,
    description: "High bay/industrial lighting installation",
    duration: "1-2 days",
    includes: [
      "High ceiling mounting",
      "Heavy-duty fixture installation",
      "Three-phase connection if needed",
      "Safety harness setup",
    ],
    bestFor: ["Warehouses", "Factories", "Workshops"],
    icon: "🏭",
  },
  {
    id: "custom-wiring",
    name: "Custom Wiring Service",
    cost: 800,
    description: "Additional wiring and electrical work",
    duration: "Varies",
    includes: [
      "Additional conduit installation",
      "Wall chasing and patching",
      "Switch/dimmer installation",
      "Circuit extension",
    ],
    bestFor: ["New installations", "Renovations", "Additional points"],
    icon: "🔌",
  },
  {
    id: "maintenance-check",
    name: "Lighting Maintenance Check",
    cost: 400,
    description: "Comprehensive lighting system inspection",
    duration: "1-2 hours",
    includes: [
      "All bulb/fixture inspection",
      "Wiring safety check",
      "Energy efficiency assessment",
      "Maintenance report",
    ],
    bestFor: ["Existing setups", "Routine maintenance", "Energy audits"],
    icon: "🔍",
  },
];

export const getRecommendedInstallations = (cartItems: CartItem[]) => {
  const recommendations = [];
  const productTypes = new Set();

  // Analyze cart items
  cartItems.forEach((item) => {
    const category = item.product.category?.toLowerCase() || "";
    const tags = item.product.tags || [];

    // Check for solar products
    if (
      category.includes("solar") ||
      tags.some((tag) => tag.includes("solar"))
    ) {
      productTypes.add("solar");
    }

    // Check for security products
    if (
      category.includes("security") ||
      tags.some((tag) => tag.includes("security"))
    ) {
      productTypes.add("security");
    }

    // Check for commercial/industrial
    if (category.includes("commercial") || category.includes("industrial")) {
      productTypes.add("commercial");
    }

    // Check for emergency lights
    if (
      category.includes("emergency") ||
      tags.some((tag) => tag.includes("emergency"))
    ) {
      productTypes.add("emergency");
    }
  });

  // Add recommendations based on product types
  if (productTypes.has("solar")) {
    recommendations.push(
      installationOptions.find((s) => s.id === "solar-light"),
    );
  }

  if (productTypes.has("security")) {
    recommendations.push(
      installationOptions.find((s) => s.id === "security-light"),
    );
  }

  if (productTypes.has("commercial")) {
    recommendations.push(
      installationOptions.find((s) => s.id === "commercial-lighting"),
    );
  }

  if (productTypes.has("emergency")) {
    recommendations.push(
      installationOptions.find((s) => s.id === "emergency-light"),
    );
  }

  // Always include basic bulb installation as a safe option
  if (recommendations.length === 0 || cartItems.length <= 3) {
    recommendations.push(
      installationOptions.find((s) => s.id === "basic-bulb"),
    );
  }

  return recommendations.filter(Boolean).slice(0, 4); // Limit to 4 recommendations
};

// Get suggested tags for a category
export function getCustomerTagsForCategory(
  category: string,
  limit: number = 8,
): string[] {
  const categoryTags = categoryCustomerTagMap[category] || [];
  const allTags = [
    ...categoryTags,
    ...customerTags.useCases.slice(0, 2),
    ...customerTags.needsBenefits.slice(0, 2),
    ...customerTags.budgetLevels.slice(0, 1),
    ...nairobiTags.slice(0, 1),
  ];

  // Remove duplicates and limit
  return [...new Set(allTags)].slice(0, limit);
}

// Get all available tags (for admin)
export function getAllCustomerTags(): string[] {
  const allTags = new Set<string>();

  // Add all tag categories
  Object.values(customerTags).forEach((tagArray) => {
    tagArray.forEach((tag) => allTags.add(tag));
  });

  // Add Nairobi tags
  nairobiTags.forEach((tag) => allTags.add(tag));

  return Array.from(allTags);
}

// Get tag display name
export function getTagDisplayName(tag: string): string {
  return (
    tagDisplayNames[tag] ||
    tag
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

/**
 * Get available tags for a specific category
 */
export function getAvailableTagsForCategory(category: string): string[] {
  const categoryTags = categoryCustomerTagMap[category] || [];
  const allTags = [
    ...categoryTags,
    ...customerTags.useCases,
    ...customerTags.needsBenefits,
    ...customerTags.specialOffers,
  ];

  // Remove duplicates
  return [...new Set(allTags)];
}

/**
 * Filter products by tags
 */
export function filterProductsByTags(products: any[], tags: string[]): any[] {
  if (!tags.length) return products;

  return products.filter((product) => {
    const productTags = product.tags || [];
    return tags.some((tag) => productTags.includes(tag));
  });
}

/**
 * Group tags by category for display
 */
export function groupTagsByCategory(tags: string[]) {
  const grouped: { [key: string]: string[] } = {};

  tags.forEach((tag) => {
    // Find which category this tag belongs to
    let category = "Other";

    if (customerTags.useCases.includes(tag)) category = "Use Cases";
    else if (customerTags.needsBenefits.includes(tag)) category = "Benefits";
    else if (customerTags.projectTypes.includes(tag))
      category = "Project Types";
    else if (customerTags.customerTypes.includes(tag)) category = "For";
    else if (customerTags.budgetLevels.includes(tag)) category = "Budget";
    else if (customerTags.specialOffers.includes(tag)) category = "Special";
    else if (customerTags.energyCost.includes(tag)) category = "Energy Saving";
    else if (customerTags.installation.includes(tag)) category = "Installation";
    else if (customerTags.smartFeatures.includes(tag))
      category = "Smart Features";

    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(tag);
  });

  return grouped;
}

/**
 * Get tag icon based on category
 */
export function getTagIcon(tag: string) {
  const tagCategories = [
    { category: customerTags.useCases, icon: "🏠" },
    { category: customerTags.needsBenefits, icon: "⭐" },
    { category: customerTags.projectTypes, icon: "🔨" },
    { category: customerTags.customerTypes, icon: "👤" },
    { category: customerTags.budgetLevels, icon: "💰" },
    { category: customerTags.specialOffers, icon: "🎯" },
    { category: customerTags.energyCost, icon: "⚡" },
    { category: customerTags.installation, icon: "🔧" },
    { category: customerTags.smartFeatures, icon: "📱" },
  ];

  for (const { category, icon } of tagCategories) {
    if (category.includes(tag)) return icon;
  }

  return "🏷️";
}

/**
 * Format tags for display with icons and proper names
 */
export function formatTagsForDisplay(tags: string[], limit?: number) {
  const tagsToDisplay = limit ? tags.slice(0, limit) : tags;

  return tagsToDisplay.map((tag) => ({
    id: tag,
    name: getTagDisplayName(tag),
    icon: getTagIcon(tag),
  }));
}

/**
 * Sort tags by relevance (category-specific first, then general)
 */
export function sortTagsByRelevance(tags: string[], category?: string) {
  const categorySpecific = category
    ? tags.filter((tag) => categoryCustomerTagMap[category]?.includes(tag))
    : [];

  const generalTags = tags.filter((tag) => !categorySpecific.includes(tag));

  return [...categorySpecific, ...generalTags];
}
