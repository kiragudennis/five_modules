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
  Coins,
  Share2,
  ShoppingBag,
  Ticket,
  Trophy,
  Target,
  Webhook,
  BarChart,
  Shield,
  Cpu,
  Radio,
  Tv,
  Braces,
  Layers,
  FileSearch,
  Phone,
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

interface ModuleDetail {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  icon: any;
  color: string;
  gradient: string;
  href: string;
  retentionValue: string[];
  mechanics: {
    title: string;
    description: string;
  }[];
  stats: { label: string; value: string }[];
  benefits: string[];
  useCases: string[];
}

export const modules: ModuleDetail[] = [
  {
    id: "spin",
    name: "Spin to Win",
    tagline: "Daily engagement through gamified rewards",
    description:
      "Interactive spinning wheel where customers win points, discounts, or products. Builds daily habit and repeat visits.",
    longDescription:
      "The Spin Wheel creates a daily touchpoint with your brand. Customers return each day for their free spins, earning points and prizes that keep them engaged with your store.",
    icon: Target,
    color: "from-purple-500 to-pink-500",
    gradient: "purple",
    href: "/spin",
    retentionValue: [
      "Creates daily visit habit",
      "Points system encourages repeat purchases",
      "Social sharing extends reach",
      "VIP tiers unlock exclusive wheels",
    ],
    mechanics: [
      {
        title: "Free Spins",
        description:
          "Customers receive free spins daily, weekly, and lifetime. Configurable limits per user.",
      },
      {
        title: "Paid Spins",
        description:
          "After free spins, customers can use loyalty points to spin more, keeping them engaged.",
      },
      {
        title: "Prize Configuration",
        description:
          "Set prizes as points, discounts, free shipping, products, or bundles with custom probabilities.",
      },
      {
        title: "Single Prize Mode",
        description:
          "Grand prize mode where the wheel locks after the top prize is won, creating urgency.",
      },
      {
        title: "Multi-Game Support",
        description:
          "Run multiple wheels simultaneously (VIP, New Customer, Weekend Special) for different audiences.",
      },
    ],
    stats: [
      { label: "Avg. Daily Spins", value: "3-5 per user" },
      { label: "Return Rate", value: "65% next day" },
      { label: "Points Spent", value: "2,500+ monthly" },
      { label: "Social Shares", value: "15% of spins" },
    ],
    benefits: [
      "Increases daily active users",
      "Reduces customer acquisition cost through shares",
      "Points economy drives purchases",
      "Creates excitement around your brand",
    ],
    useCases: [
      "E-commerce daily engagement",
      "Product launch promotions",
      "Holiday campaigns",
      "VIP member rewards",
    ],
  },
  {
    id: "challenges",
    name: "Live Challenges & Trivia",
    tagline: "Real-time competitions with host-led questions",
    description:
      "Host live trivia sessions where customers answer questions in real-time. Perfect for TikTok, Instagram, and YouTube Live.",
    longDescription:
      "Our unique Trivia Challenge mode lets you host live sessions where you ask questions and customers answer through the platform. Points awarded instantly creates addictive competitive energy.",
    icon: Trophy,
    color: "from-orange-500 to-red-500",
    gradient: "orange",
    href: "/challenges",
    retentionValue: [
      "Live events drive scheduled returns",
      "Competition creates community",
      "Leaderboard visibility motivates",
      "Team challenges increase social sharing",
    ],
    mechanics: [
      {
        title: "Live Trivia Mode",
        description:
          "Host asks questions, customers answer via the platform. Real-time scoring and leaderboard updates.",
      },
      {
        title: "Referral Challenges",
        description:
          "Compete to refer the most new customers. Automatic tracking and scoring.",
      },
      {
        title: "Purchase Challenges",
        description: "Compete based on spending amount during campaign period.",
      },
      {
        title: "Streak Challenges",
        description: "Consecutive daily visits or actions earn bonus points.",
      },
      {
        title: "Team Challenges",
        description:
          "Customers form teams and compete together against other teams.",
      },
    ],
    stats: [
      { label: "Avg. Participation", value: "40% of users" },
      { label: "Live Session Length", value: "15-30 minutes" },
      { label: "Referral Rate", value: "3-5x normal" },
      { label: "Points Awarded", value: "10K+ weekly" },
    ],
    benefits: [
      "Builds community around your brand",
      "Live events create scheduled engagement",
      "Referrals drive customer acquisition",
      "Competitive spirit increases activity",
    ],
    useCases: [
      "Weekly live trivia nights",
      "Product launch competitions",
      "Seasonal leaderboards",
      "Affiliate referral contests",
    ],
  },
  {
    id: "draws",
    name: "Lucky Draws",
    tagline: "Time-limited giveaways with multiple entry methods",
    description:
      "Create excitement with scheduled draws. Customers earn entries through purchases, referrals, and social shares.",
    longDescription:
      "Lucky Draws build anticipation before the draw date and excitement during the live winner reveal. Perfect for end-of-month promotions or special events.",
    icon: Ticket,
    color: "from-blue-500 to-cyan-500",
    gradient: "blue",
    href: "/draws",
    retentionValue: [
      "Builds anticipation before draw date",
      "Multiple entry methods maximize engagement",
      "Social shares extend reach",
      "Winner announcements create social proof",
    ],
    mechanics: [
      {
        title: "Multiple Entry Methods",
        description:
          "Purchase, referral, social share, live stream email, and loyalty tier bonuses.",
      },
      {
        title: "Entry Limits",
        description:
          "Configure per-user and global entry limits to ensure fairness.",
      },
      {
        title: "Multi-Phase Draw Show",
        description:
          "Entry collection → Entries closed → Winner reveal with confetti and sound.",
      },
      {
        title: "Winner Management",
        description:
          "Track claims, auto-redraw unclaimed prizes, distribute consolation points.",
      },
      {
        title: "Concurrent Draws",
        description:
          "Run multiple draws simultaneously with different schedules and prizes.",
      },
    ],
    stats: [
      { label: "Entry Rate", value: "35% of visitors" },
      { label: "Social Shares", value: "2-3 per entry" },
      { label: "Winner Retention", value: "80% return" },
      { label: "Avg. Entries", value: "500-5,000" },
    ],
    benefits: [
      "Massive social media engagement",
      "Purchase incentives during entry period",
      "Referral acquisition",
      "Email list growth via live stream entries",
    ],
    useCases: [
      "Monthly grand prize draws",
      "Flash draws during live streams",
      "Holiday giveaways",
      "Product launch promotions",
    ],
  },
  {
    id: "bundles",
    name: "Mystery Bundles",
    tagline: "Curated product bundles with surprise reveals",
    description:
      "Increase average order value with product bundles. Mystery mode creates unboxing content for social media.",
    longDescription:
      "Bundles increase AOV while clearing inventory. Mystery bundles generate viral unboxing content perfect for TikTok and Instagram.",
    icon: Gift,
    color: "from-green-500 to-emerald-500",
    gradient: "green",
    href: "/bundles",
    retentionValue: [
      "Increases average order value",
      "Mystery element drives curiosity",
      "Unboxing content goes viral",
      "Stream exclusives reward live viewers",
    ],
    mechanics: [
      {
        title: "Curated Bundles",
        description: "Admin handpicks products that work well together.",
      },
      {
        title: "Build-Your-Own",
        description: "Customers select products from eligible pool.",
      },
      {
        title: "Tiered Bundles",
        description: "Savings increase as customers add more items.",
      },
      {
        title: "Mystery Bundles",
        description:
          "Contents hidden until revealed during live stream or after purchase.",
      },
      {
        title: "Subscription Bundles",
        description: "Recurring bundle delivery for predictable revenue.",
      },
    ],
    stats: [
      { label: "AOV Increase", value: "35-50%" },
      { label: "Mystery Unboxings", value: "2M+ views" },
      { label: "Subscription Retention", value: "85% after 3 months" },
      { label: "Bundle Conversion", value: "25% of shoppers" },
    ],
    benefits: [
      "Higher average order value",
      "Inventory management",
      "Viral social content",
      "Predictable recurring revenue",
    ],
    useCases: [
      "Seasonal gift bundles",
      "Clearance inventory",
      "Subscription boxes",
      "Live stream exclusives",
    ],
  },
  {
    id: "deals",
    name: "Flash Deals",
    tagline: "Urgency-driven limited-time offers",
    description:
      "Create scarcity with countdown timers and real-time stock depletion. BOGO, free gifts, and mystery deals.",
    longDescription:
      "Flash Deals leverage scarcity psychology. Live countdowns, stock meters, and claim tickers create FOMO that drives immediate purchases.",
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    gradient: "amber",
    href: "/deals",
    retentionValue: [
      "Urgency drives immediate action",
      "Daily deals create visit habit",
      "Scarcity increases conversion",
      "Social proof via claim ticker",
    ],
    mechanics: [
      {
        title: "Flash Sales",
        description: "Scheduled or instant deals with countdown timer.",
      },
      {
        title: "Quantity Limits",
        description:
          "Limited units available at deal price. Real-time stock depletion.",
      },
      {
        title: "BOGO Offers",
        description: "Buy one, get one free or discounted.",
      },
      {
        title: "Free Gift with Purchase",
        description: "Automatic gift when spending above threshold.",
      },
      {
        title: "Mystery Deals",
        description: "Product and price hidden until revealed live.",
      },
    ],
    stats: [
      { label: "Conversion Rate", value: "3-5x normal" },
      { label: "Time to Sell Out", value: "2-4 hours" },
      { label: "Email Capture", value: "40% of viewers" },
      { label: "Share Rate", value: "25% of buyers" },
    ],
    benefits: [
      "Immediate revenue spikes",
      "Inventory clearance",
      "Email list growth",
      "Social media buzz",
    ],
    useCases: [
      "Daily deal at specific time",
      "Flash sale during live stream",
      "Holiday promotions",
      "Inventory clearance events",
    ],
  },
];

export const retentionMetrics = [
  {
    label: "Daily Active Users",
    value: "+65%",
    icon: Users,
    color: "text-blue-500",
  },
  {
    label: "Average Order Value",
    value: "+40%",
    icon: ShoppingBag,
    color: "text-green-500",
  },
  {
    label: "Customer Lifetime Value",
    value: "+85%",
    icon: TrendingUp,
    color: "text-purple-500",
  },
  {
    label: "Social Shares",
    value: "+120%",
    icon: Share2,
    color: "text-pink-500",
  },
  {
    label: "Referral Rate",
    value: "+200%",
    icon: Users,
    color: "text-orange-500",
  },
  {
    label: "Points Redemption",
    value: "15,000+/mo",
    icon: Coins,
    color: "text-amber-500",
  },
];

export const consultationPackages = [
  {
    name: "Discovery Call",
    price: "KES 5,000",
    duration: "60 minutes",
    description:
      "Strategic consultation to understand your business, audience, and recommend the right engagement architecture.",
    features: [
      "Business requirements & audience analysis",
      "Module architecture recommendation",
      "ROI projection based on your traffic data",
      "Live demo of all 5 modules in action",
      "Technical feasibility assessment",
      "Q&A with lead architect",
    ],
    icon: Phone,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Full Audit",
    price: "KES 50,000",
    duration: "Full day",
    description:
      "Comprehensive audit of your existing e-commerce with detailed implementation blueprint.",
    features: [
      "Everything in Discovery Call",
      "Existing tech stack deep-dive",
      "Database schema & API analysis",
      "Custom integration roadmap with timeline",
      "Performance & scalability assessment",
      "Security audit & recommendations",
      "Team capability assessment",
      "2-week post-audit support",
    ],
    icon: FileSearch,
    color: "from-purple-500 to-pink-500",
    recommended: true,
  },
  {
    name: "Implementation Workshop",
    price: "KES 250,000",
    duration: "1 week",
    description:
      "Full implementation of all 5 modules with your team. Includes training and 3 months support.",
    features: [
      "Everything in Full Audit",
      "Complete module deployment (all 5)",
      "Custom branding & theming",
      "Team training & knowledge transfer",
      "Live broadcast setup (OBS integration)",
      "30-day launch support",
      "Performance optimization",
      "Full documentation & handover",
    ],
    icon: Users,
    color: "from-orange-500 to-red-500",
  },
];

export const modulePricing = [
  {
    module: "Spin Wheel",
    price: "KES 250,000",
    setup: "3-5 days",
    description:
      "Real-time spinning wheel with live broadcast integration and dynamic prize pools.",
    longDescription:
      "Not just a wheel - it's a live engagement engine. Real-time probability calculations, dynamic prize pools, WebSocket-powered winner announcements, and OBS-ready displays. Supports multi-game segmentation (VIP, new customers, weekend specials) with automatic prize locking.",
    icon: Target,
    color: "from-purple-500 to-pink-500",
    features: [
      "Multi-game support (run 5+ wheels simultaneously)",
      "Dynamic prize pools with probability weighting",
      "Real-time winner ticker (WebSocket powered)",
      "Live broadcast display with sound & confetti",
      "Points integration (free spins + paid spins)",
      "Single-prize mode with auto-lock",
      "Grand prize winner announcements",
      "VIP tier-based access control",
      "Daily/weekly/lifetime spin limits",
      "Admin live controls (force winner, broadcast)",
    ],
    whatMakesItEnterprise: [
      "Zero-latency winner broadcasting",
      "Automatic prize pool replenishment",
      "Fraud detection & rate limiting",
      "Real-time analytics dashboard",
      "A/B testing support",
    ],
  },
  {
    module: "Challenges",
    price: "KES 250,000",
    setup: "5-7 days",
    description:
      "7 challenge types including live trivia where hosts ask questions in real-time.",
    longDescription:
      "Turn your live streams into competitions. Host asks questions, customers answer through the platform. Real-time leaderboards, team competitions, and automatic point distribution. Supports referral, purchase, share, streak, team, combo, and live trivia challenges.",
    icon: Trophy,
    color: "from-orange-500 to-red-500",
    features: [
      "7 challenge types (referral, purchase, share, streak, team, combo, live trivia)",
      "Live trivia mode with host dashboard",
      "Real-time leaderboard updates",
      "Team challenges with join codes",
      "Catch Them feature (track competitors)",
      "Multi-phase display (countdown/active/final hour/ended)",
      "Admin live controls (pause, extend, adjust scores)",
      "Automatic point distribution",
      "Social media integration",
      "Customizable prize tiers",
    ],
    whatMakesItEnterprise: [
      "Host-controlled question pacing",
      "Real-time participant scoring",
      "Suspicious activity flagging",
      "Automated winner notifications",
      "Cross-campaign analytics",
    ],
  },
  {
    module: "Lucky Draws",
    price: "KES 250,000",
    setup: "3-5 days",
    description:
      "Time-limited giveaways with live draw shows and automatic winner selection.",
    longDescription:
      "Build anticipation with entry periods, then host a live draw show. The system randomly selects winners with full transparency. Automatic winner notifications, claim tracking, and redraws for unclaimed prizes. Multiple entry methods (purchases, referrals, social shares, live stream).",
    icon: Ticket,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Multiple entry methods (purchase, referral, social share, live stream, loyalty tier)",
      "Live draw show with multi-phase display",
      "Cryptographically fair winner selection",
      "Winner management suite (claim tracking, auto-redraw)",
      "Consolation points for non-winners",
      "Concurrent draw support",
      "Real-time entry ticker",
      "Social proof notifications",
      "Entry limit controls (per-user, global)",
      "Email/SMS winner notifications",
    ],
    whatMakesItEnterprise: [
      "Provably fair selection algorithm",
      "Automated fraud detection",
      "Compliance-ready audit logs",
      "Automated tax document generation",
      "Winner blacklist management",
    ],
  },
  {
    module: "Mystery Bundles",
    price: "KES 250,000",
    setup: "3-5 days",
    description:
      "Product bundles with mystery reveal mode for viral unboxing content.",
    longDescription:
      "Increase average order value by 40%+. Mystery bundles create unboxing content that goes viral on TikTok/Instagram. Live stream exclusives appear only during broadcasts. Subscription bundles provide predictable recurring revenue.",
    icon: Gift,
    color: "from-green-500 to-emerald-500",
    features: [
      "5 bundle types (curated, build-your-own, tiered, mystery, subscription)",
      "Mystery reveal mode (hidden contents)",
      "Live stream exclusives (appear only during broadcast)",
      "Real-time stock depletion meter",
      "Live claim ticker with customer names",
      "Points bonus bundles",
      "Subscription management (weekly/monthly)",
      "VIP tier discounts",
      "Limited-time bundle windows",
      "Social sharing incentives",
    ],
    whatMakesItEnterprise: [
      "Automated inventory sync",
      "Dynamic bundle pricing engine",
      "Subscription renewal automation",
      "Unboxing content tracking",
      "Stream-exclusive analytics",
    ],
  },
  {
    module: "Flash Deals",
    price: "KES 250,000",
    setup: "2-3 days",
    description:
      "Urgency-driven deals with live countdowns, stock meters, and real-time claim tickers.",
    longDescription:
      "Create FOMO with limited-time offers. Live countdown timers change color (green → yellow → red) as time runs out. Stock meters deplete in real-time. Claim tickers show customer names and locations. Admin can extend timer or add stock live during broadcast.",
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    features: [
      "6 deal types (discount, flash sale, daily deal, BOGO, free gift, mystery)",
      "Live countdown with urgency states",
      "Real-time stock depletion meter",
      "Live claim ticker with customer locations",
      "Admin live controls (extend timer, add stock)",
      "Points early access",
      "Points revive (missed deals)",
      "Quantity-limited deals",
      "Schedule management",
      "Performance analytics",
    ],
    whatMakesItEnterprise: [
      "Real-time inventory sync with POS",
      "Dynamic discount optimization",
      "A/B test deal types",
      "Automated deal rotation",
      "Email/SMS reminders",
    ],
  },
  {
    module: "Complete Bundle",
    price: "KES 1,100,000",
    setup: "2-3 weeks",
    description: "All 5 modules + shared infrastructure + priority support.",
    longDescription:
      "The complete engagement ecosystem. Includes Points Economy Engine (shared across all modules), Live Display Infrastructure (WebSocket servers), and Admin Live Controls Dashboard. Everything you need to build a community around your brand.",
    icon: Sparkles,
    color: "from-purple-500 to-cyan-500",
    highlight: true,
    features: [
      "All 5 modules (Spin, Challenges, Draws, Bundles, Deals)",
      "Points Economy Engine (shared across modules)",
      "Live Display Infrastructure (WebSocket/Redis)",
      "Admin Live Controls Dashboard",
      "Priority support (4-hour response)",
      "Custom branding integration",
      "Team training session",
      "30-day launch support",
      "Full documentation",
      "Source code access",
    ],
    whatMakesItEnterprise: [
      "99.9% uptime SLA",
      "Dedicated support channel",
      "Custom feature development (up to 40 hours)",
      "Quarterly strategy calls",
      "Performance monitoring dashboard",
    ],
  },
];

// Enterprise Features
export const enterpriseFeatures = [
  {
    title: "Live Broadcast Ready",
    description:
      "Every module includes an OBS-friendly display URL. Hosts can project real-time action while the system handles stock, payments, and winner selection automatically.",
    icon: Tv,
  },
  {
    title: "WebSocket-Powered Real-time",
    description:
      "Zero-latency updates across all modules. Winner announcements, ticker feeds, and stock updates appear instantly on all connected displays.",
    icon: Radio,
  },
  {
    title: "Admin Live Controls",
    description:
      "During live streams, admins can trigger winners, extend timers, add stock, and send announcements - all without touching code.",
    icon: Cpu,
  },
  {
    title: "Points Economy Engine",
    description:
      "Shared points infrastructure across all modules. Points earned anywhere are usable everywhere. Real-time balance updates.",
    icon: Coins,
  },
  {
    title: "Fraud Prevention Suite",
    description:
      "Rate limiting, duplicate detection, suspicious pattern monitoring, and full audit trails for every transaction.",
    icon: Shield,
  },
  {
    title: "Analytics Dashboard",
    description:
      "Real-time engagement metrics, conversion tracking, and ROI analysis per module.",
    icon: BarChart,
  },
];

export const integrationPoints = [
  {
    title: "Automatic Checkout Integration",
    description:
      "Points redemption happens at checkout automatically. No manual coupon codes needed.",
    icon: ShoppingBag,
  },
  {
    title: "Live Stock Sync",
    description:
      "Real-time inventory updates. When a deal sells out, it's instantly reflected everywhere.",
    icon: Package,
  },
  {
    title: "Payment Gateway Agnostic",
    description:
      "Works with MPesa, Stripe, PayPal, or any processor. No changes to your payment flow.",
    icon: CreditCard,
  },
  {
    title: "Webhook Support",
    description:
      "Trigger external actions when events happen (new winner, deal claimed, etc.).",
    icon: Webhook,
  },
  {
    title: "REST API",
    description:
      "Full API access for custom integrations with your existing systems.",
    icon: Braces,
  },
  {
    title: "Multi-tenant Ready",
    description: "Support for multiple stores/brands under one installation.",
    icon: Layers,
  },
];

export const fraudPrevention = [
  "Rate limiting (per user/IP/second)",
  "Duplicate entry detection",
  "Suspicious pattern monitoring",
  "Referral fraud detection",
  "Bot detection & blocking",
  "Admin override with audit trail",
  "Winner verification workflow",
  "Automated blacklist management",
  "Geographic restrictions",
  "Device fingerprinting (optional)",
];

export const whatYouGet = [
  "Fully functional modules deployed on your infrastructure",
  "Source code access (you own everything)",
  "Database schemas and migrations",
  "API documentation",
  "OBS display URLs for each module",
  "Admin dashboard with live controls",
  "30-day launch support",
  "Team training session",
];

export const faqs = [
  {
    question: "Why is this different from building a basic spin wheel plugin?",
    answer:
      "This isn't a plugin - it's an enterprise-grade engagement ecosystem. We're building real-time WebSocket infrastructure, shared points economy, live broadcast displays, fraud detection, and admin controls. Each module is production-ready with scalability built-in. Basic plugins cost KES 20,000 - 28,000. What we deliver is a community-building platform that drives measurable ROI.",
  },
  {
    question: "What's the actual implementation process?",
    answer:
      "1) Discovery call (KES 5,000) to understand your needs. 2) We deploy to your infrastructure (Vercel/Supabase). 3) Each module is configured with your branding. 4) Live broadcast URLs are set up. 5) Your team is trained. 6) 30-day launch support. The KES 5,000 consultation fee is credited toward any module purchase.",
  },
  {
    question: "Do I need an existing e-commerce store?",
    answer:
      "Either works. We can build from scratch OR integrate with your existing store (Shopify, WooCommerce, custom). For existing stores, we'll need API access or database integration. The modules connect to your checkout, product catalogue, and user database seamlessly.",
  },
  {
    question: "What about ongoing costs?",
    answer:
      "You pay for your own infrastructure (Vercel + Supabase ~$50-200/month depending on traffic). Optional maintenance/support starts at KES 20,000/month which includes bug fixes, security updates, and feature tweaks. No hidden fees or per-user pricing.",
  },
  {
    question: "How does the live broadcast work?",
    answer:
      "Each module generates a unique OBS-friendly URL. During TikTok/Instagram/YouTube Live, hosts add this as a Browser Source. The display shows real-time action: wheel spins, winner names, stock meters, claim tickers. The system handles all the heavy lifting - stock updates, payments, winner selection - automatically.",
  },
  {
    question: "Is there fraud protection?",
    answer:
      "Multiple layers: rate limiting, duplicate detection, suspicious pattern monitoring, referral fraud detection, bot blocking, and full audit logs. Admin can override with audit trail. Winners go through verification workflow if needed.",
  },
  {
    question: "How do modules share the points system?",
    answer:
      "Unified Points Economy Engine. Customers earn points from purchases, spins, challenges, and draws. Points are redeemed for spin payments, early access, deals, and checkout discounts. All modules read/write from the same points ledger with real-time balance updates.",
  },
  {
    question: "What's the ROI timeline?",
    answer:
      "Clients typically see 40-60% increase in customer retention within 3 months, 25-35% increase in average order value within 2 months, and 150-250% increase in referral rates within 2 months. The complete bundle usually pays for itself within 6-9 months.",
  },
];

export const successMetrics = [
  { metric: "Customer Retention", increase: "40-60%", timeframe: "3 months" },
  { metric: "Average Order Value", increase: "25-35%", timeframe: "2 months" },
  { metric: "Repeat Purchase Rate", increase: "50-70%", timeframe: "3 months" },
  { metric: "Social Shares", increase: "100-200%", timeframe: "1 month" },
  { metric: "Referral Rate", increase: "150-250%", timeframe: "2 months" },
  { metric: "Points Redemption", increase: "80-95%", timeframe: "1 month" },
];

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

export const SIMULATED_NAMES = [
  "Sarah M.",
  "John K.",
  "Aisha W.",
  "Peter O.",
  "Mary N.",
  "James G.",
  "Grace A.",
  "David K.",
  "Mercy W.",
  "Kevin O.",
  "Lisa T.",
  "Michael R.",
  "Faith N.",
  "Victor O.",
  "Diana K.",
  "Brian M.",
  "Caroline W.",
  "Stephen O.",
  "Joyce A.",
  "Daniel M.",
];

export const SIMULATED_LOCATIONS = [
  "Nairobi",
  "Githurai",
  "Mombasa",
  "Rui",
  "Kisumu",
  "Kinangop",
  "Nakuru",
  "Lamu",
  "Eldoret",
  "Thika",
  "Luanda",
  "Malindi",
  "Chuka",
  "Taita",
  "Kitale",
  "Garissa",
  "Kakamega",
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
