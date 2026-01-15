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

// Get suggested tags for a category
export function getCustomerTagsForCategory(
  category: string,
  limit: number = 8
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
