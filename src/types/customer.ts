// src/lib/types/student.ts
import { z } from "zod";

export const CustomerSchema = z
  .object({
    id: z.string().optional(),
    email: z.email(),
    metadata: z.any(),
    createdAt: z.string(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmPassword: z.string().optional(),
    role: z.string(),
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, { message: "Full name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z
      .string()
      .min(10, { message: "Please enter a valid phone number" })
      .regex(/^[0-9+\-\s]+$/, { message: "Invalid phone number format" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Must contain at least one number" }),
    confirmPassword: z.string(),
    address: z.string().optional(),
    city: z.string().min(2, { message: "Please enter your city" }),
    postalCode: z.string().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    receiveOffers: z.boolean().default(true),
    receiveNewsletter: z.boolean().default(true),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Validation schema
export const validateSignUp = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  address: z.string().optional(),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  receiveOffers: z.boolean().default(true),
  receiveNewsletter: z.boolean().default(true),
});

export type Customer = z.infer<typeof CustomerSchema>;

// Use the same type for ProfileData to avoid inconsistencies
export type Profile = Omit<Customer, "password" | "confirmPassword">;

export interface ProfileData {
  id: string;
  email: string;
  role: string;

  // personal
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;

  // business
  business_name?: string;
  business_type?: string;
  business_customer?: boolean;

  // preferences
  receive_offers?: boolean;
  receive_newsletter?: boolean;

  // auth/meta
  email_verified?: boolean;
  last_login?: string | null;

  // raw metadata fallback
  metadata?: {
    city?: string;
    phone?: string;
    full_name?: string;
    business_customer?: boolean;
    [key: string]: any;
  };

  created_at: string;
  updated_at?: string;
  referred_by?: string;
}

export interface ClubMembership {
  clubs: {
    id: string;
    name: string;
    slug: string;
    country_code: string;
    logo_url: string;
  };
  membership_type: string;
}

export interface AssociationMembership {
  associations: {
    id: string;
    name: string;
    slug: string;
    country_code: string;
    county_code: string;
    logo_url: string;
  };
  role: string;
}

export interface CoachingRole {
  clubs: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
  display_name: string;
  bio: string;
  public_phone: string;
  public_email: string;
  is_public: boolean;
}
