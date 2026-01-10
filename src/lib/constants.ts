import {
  CreditCard,
  Globe,
  Package,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

export const categoryOptions = [
  { id: "uniforms", name: "Uniforms" },
  { id: "gear", name: "Protective Gear" },
  { id: "belts", name: "Belts" },
  { id: "equipment", name: "Training Equipment" },
  { id: "womens-fashion", name: "Women's Fashion" },
  { id: "mens-collection", name: "Men's Collection" },
  { id: "electronics", name: "Electronics" },
  { id: "furniture", name: "Furniture" },
  { id: "beauty", name: "Beauty & Cosmetics" },
  { id: "sports-fitness", name: "Sports & Fitness" },
  { id: "baby-kids", name: "Baby & Kids" },
  { id: "groceries", name: "Groceries" },
  { id: "mobile-phones", name: "Mobile Phones" },
  { id: "automotive", name: "Automotive" },
  { id: "books-stationery", name: "Books & Stationery" },
  { id: "health-wellness", name: "Health & Wellness" },
  { id: "jewelry-watches", name: "Jewelry & Watches" },
  { id: "computing", name: "Computing" },
];

export const tagOptions = [
  { id: "premium", name: "Premium" },
  { id: "competition", name: "Competition" },
  { id: "training", name: "Training" },
  { id: "protective", name: "Protective" },
  { id: "essential", name: "Essential" },
  { id: "beginner", name: "Beginner" },
  { id: "intermediate", name: "Intermediate" },
  { id: "advanced", name: "Advanced" },
];

export const categories = [
  {
    name: "Uniforms (Gi)",
    slug: "uniforms",
    description:
      "Find the perfect Gi for your training, from lightweight single weaves for everyday practice to durable double weaves for competition.",
    image: "/categories/uniforms.jpg",
  },
  {
    name: "Protective Gear",
    slug: "gear",
    description:
      "Safety first. Browse our selection of headgear, gloves, shin guards, and mouthguards to stay protected during sparring.",
    image: "/categories/gear.jpg",
  },
  {
    name: "Belts",
    slug: "belts",
    description:
      "Mark your journey and rank progression with our high-quality, durable martial arts belts.",
    image: "/categories/belts.jpg",
  },
  {
    name: "Training Equipment",
    slug: "equipment",
    description:
      "From focus mitts to punching bags, get the equipment you need to sharpen your skills and enhance your training.",
    image: "/categories/equipment.jpg",
  },
  {
    name: "Merch & Apparel",
    slug: "merch",
    description:
      "Rep Samma Martial Arts outside the dojo with branded t-shirts, hoodies, caps, and streetwear.",
    image: "/categories/merch.jpg",
  },
  {
    name: "Accessories",
    slug: "accessories",
    description:
      "Thoughtfully designed Samma Martial Arts accessories made for training days, off days, and everything in between.",
    image: "/categories/accessories.jpg",
  },
  {
    name: "Women's Fashion",
    slug: "womens-fashion",
    description:
      "Trendy dresses, skirts, blouses, traditional wear (kitenge, kanga), and accessories for every occasion.",
    image: "/categories/womens-fashion.jpg",
  },
  {
    name: "Men's Collection",
    slug: "mens-collection",
    description:
      "Smart casual wear, suits, traditional outfits, jeans, shirts, and footwear for the modern Kenyan man.",
    image: "/categories/mens-fashion.jpeg",
  },
  {
    name: "Electronics",
    slug: "electronics",
    description:
      "Smartphones, laptops, home appliances, audio systems, and gadgets at competitive prices.",
    image: "/categories/electronics.jpeg",
  },
  {
    name: "Furniture & Home",
    slug: "furniture",
    description:
      "Quality sofas, beds, tables, chairs, and home decor to transform your living space.",
    image: "/categories/furniture.jpeg",
  },
  {
    name: "Beauty & Cosmetics",
    slug: "beauty",
    description:
      "Skincare, makeup, hair care products, fragrances, and beauty tools from top brands.",
    image: "/categories/beauty.jpeg",
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    description:
      "Gym equipment, sportswear, running gear, football kits, and fitness accessories.",
    image: "/categories/sports.jpeg",
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    description:
      "Clothing, toys, school supplies, nursery furniture, and essentials for children of all ages.",
    image: "/categories/kids.jpeg",
  },
  {
    name: "Groceries & Food",
    slug: "groceries",
    description:
      "Fresh produce, pantry staples, beverages, snacks, and household essentials delivered to your door.",
    image: "/categories/groceries.jpeg",
  },
  {
    name: "Mobile Phones",
    slug: "mobile-phones",
    description:
      "Latest smartphones, tablets, accessories, and mobile gadgets from top brands.",
    image: "/categories/mobile-phones.jpeg",
  },
  {
    name: "Automotive",
    slug: "automotive",
    description:
      "Car parts, accessories, tools, lubricants, and maintenance products for your vehicle.",
    image: "/categories/automotive.jpeg",
  },
  {
    name: "Books & Stationery",
    slug: "books-stationery",
    description:
      "Educational books, novels, office supplies, writing materials, and art supplies.",
    image: "/categories/books.jpeg",
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    description:
      "Vitamins, supplements, medical equipment, personal care, and wellness products.",
    image: "/categories/health.jpeg",
  },
  {
    name: "Jewelry & Watches",
    slug: "jewelry-watches",
    description:
      "Elegant jewelry pieces, traditional adornments, luxury watches, and fashion accessories.",
    image: "/categories/jewelry.jpeg",
  },
  {
    name: "Computing",
    slug: "computing",
    description:
      "Laptops, desktops, computer accessories, software, and networking equipment.",
    image: "/categories/computing.jpeg",
  },
];

export const testimonials = [
  {
    name: "Grace Wangari",
    role: "Fashion Boutique Owner",
    content:
      "This platform increased my online sales by 300% in just 3 months! The interface is so easy for customers to use, and I can manage everything from my phone.",
    rating: 5,
  },
  {
    name: "David Otieno",
    role: "Electronics Store",
    content:
      "Best e-commerce solution I've used. The dashboard is intuitive, and the M-Pesa integration works flawlessly. My customers love the shopping experience.",
    rating: 5,
  },
  {
    name: "Sarah Kimani",
    role: "Home Decor Business",
    content:
      "Moving my physical store online was seamless. The platform handles everything from inventory to delivery tracking. Highly recommended!",
    rating: 5,
  },
  {
    name: "Michael Ochieng",
    role: "Sports Equipment Supplier",
    content:
      "The bulk order management features saved me hours of work. My wholesale customers can now order directly through the portal.",
    rating: 5,
  },
];

export const shopFeatures = [
  {
    icon: CreditCard,
    title: "M-Pesa Integration",
    description:
      "Seamless mobile money payments with Lipa Na M-Pesa and Buy Goods till numbers",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Globe,
    title: "Kenyan Delivery Networks",
    description:
      "Integrated with top Kenyan couriers - Sendy, G4S, and local logistics partners",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "90% of Kenyan shoppers use phones. Our platform is optimized for mobile shopping",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: ShieldCheck,
    title: "Local Support",
    description:
      "24/7 Kenyan-based support in English and Swahili. We understand your market",
    color: "from-amber-500 to-yellow-500",
  },
  {
    icon: Users,
    title: "Bulk Order Management",
    description:
      "Perfect for wholesalers, schools, and businesses with regular bulk purchases",
    color: "from-red-500 to-orange-500",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track stock across multiple locations, get low stock alerts, and manage suppliers",
    color: "from-indigo-500 to-blue-500",
  },
];
