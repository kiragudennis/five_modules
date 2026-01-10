import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  ShippingZone,
  ShippingOptions,
  CartItem,
  ShippingCalculationResult,
} from "@/types/store";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// utils/format.ts (shared safe zone)
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateShipping({
  zone,
  weightKg = 0.5,
}: ShippingOptions): number {
  // base rates in USD
  const baseRates: Record<ShippingZone, number> = {
    NAIROBI: 3, // $3 flat
    KENYA: 5, // $5 flat
    INTERNATIONAL: 15, // $15 flat
  };

  let cost = baseRates[zone];

  // Optional: scaling by weight (simple rule, e.g. every extra kg adds a fee)
  if (weightKg > 1) {
    const extraKg = weightKg - 1;
    if (zone === "INTERNATIONAL") {
      cost += extraKg * 5; // $5 per extra kg international
    } else {
      cost += extraKg * 1; // $1 per extra kg domestic
    }
  }

  return cost;
}

export function calculateOrderTotals(
  cartItems: CartItem[],
  country: string,
  city: string
): ShippingCalculationResult {
  // Calculate total weight
  const totalWeight = cartItems.reduce(
    (acc, item) => acc + item.product.weight * item.quantity,
    0
  );

  // Calculate subtotal
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product.price ?? 0) * item.quantity,
    0
  );

  // Determine shipping zone based on location
  const zone = determineShippingZone(country, city);

  // Calculate shipping cost
  const shippingCost = calculateShipping({
    zone,
    weightKg: totalWeight,
  });

  // Calculate order total
  const orderTotal = subtotal + shippingCost;

  return {
    shippingCost,
    orderTotal,
    totalWeight,
  };
}

export function determineShippingZone(
  country: string,
  city: string
): ShippingZone {
  // Normalize inputs
  const normalizedCountry = country.trim().toUpperCase();
  const normalizedCity = city.trim().toUpperCase();

  if (normalizedCountry !== "KENYA") {
    return "INTERNATIONAL";
  }

  if (normalizedCity === "NAIROBI") {
    return "NAIROBI";
  }

  return "KENYA";
}

// Belt level options
export const beltLevels = [
  { id: "all", name: "All Levels" },
  { id: "white", name: "White Belt" },
  { id: "yellow", name: "Yellow Belt" },
  { id: "orange", name: "Orange Belt" },
  { id: "green", name: "Green Belt" },
  { id: "blue", name: "Blue Belt" },
  { id: "purple", name: "Purple Belt" },
  { id: "brown", name: "Brown Belt" },
  { id: "black", name: "Black Belt" },
];

export const getCurrencyOptions = () => {
  const formatter = new Intl.DisplayNames(["en"], { type: "currency" });

  const currencyCodes = Intl.supportedValuesOf
    ? Intl.supportedValuesOf("currency")
    : ["USD", "EUR", "GBP", "KES", "INR", "NGN", "AUD", "CAD", "JPY", "CNY"];

  return currencyCodes.map((code) => ({
    value: code,
    label: `${code} - ${formatter.of(code)}`,
  }));
};

export const generateToken = async () => {
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const key = process.env.MPESA_CONSUMER_KEY;
  const auth = Buffer.from(key + ":" + secret).toString("base64");
  try {
    const response = await axios.get(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );
    const token = response.data.access_token; // No need for await here

    return token;
  } catch (error) {
    console.log("Token Error generated", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

// utils/tag-filters.ts
export const getAvailableTagsForCategory = (categoryId: string) => {
  const tagCategoryMap: Record<string, string[]> = {
    // Martial Arts specific
    uniforms: [
      "premium",
      "competition",
      "training",
      "beginner",
      "intermediate",
      "advanced",
    ],
    gear: ["protective", "competition", "training", "essential"],
    belts: [
      "premium",
      "competition",
      "training",
      "beginner",
      "intermediate",
      "advanced",
    ],
    equipment: [
      "training",
      "essential",
      "beginner",
      "intermediate",
      "advanced",
    ],

    // General categories
    electronics: ["premium", "essential"],
    furniture: ["premium", "essential"],
    beauty: ["premium", "essential"],
    "sports-fitness": ["training", "beginner", "intermediate", "advanced"],
    groceries: ["essential"],
    automotive: ["premium", "essential"],

    // Default for uncategorized
    default: ["premium", "essential", "beginner", "intermediate", "advanced"],
  };

  return tagCategoryMap[categoryId] || tagCategoryMap["default"];
};

// Group tags by type
export const groupedTagOptions = [
  {
    group: "Quality Level",
    tags: ["premium", "essential"],
  },
  {
    group: "Skill Level",
    tags: ["beginner", "intermediate", "advanced"],
  },
  {
    group: "Purpose",
    tags: ["training", "competition", "protective"],
  },
];
