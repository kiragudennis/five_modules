"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  User as SupabaseUser,
  Session,
  AuthError,
} from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ProfileData } from "@/types/customer";

interface AuthContextType {
  profile: ProfileData | null;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData | null>>;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
  supabase: ReturnType<typeof getSupabaseClient>;
  deleteFileFromSupabase: (
    fileUrl: string,
    bucketName: string,
  ) => Promise<boolean>; // ✅ Also needed!
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabase] = useState(() => getSupabaseClient());

  const fetchUserRole = useCallback(
    async (supabaseUser: SupabaseUser) => {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", supabaseUser.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error.message);

          if (
            error.code?.includes("AUTH") ||
            error.message?.includes("Invalid") ||
            error.status === 400
          ) {
            await supabase.auth.signOut();
          }
          return;
        }

        if (!data) {
          console.warn("No user found with that ID.");
          return;
        }

        const profileData: ProfileData = {
          id: data.id,
          email: data.email,
          role: data.role,

          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country,

          business_name: data.business_name,
          business_type: data.business_type,
          business_customer: data.metadata?.business_customer,

          receive_offers: data.receive_offers,
          receive_newsletter: data.receive_newsletter,

          email_verified: data.email_verified,
          last_login: data.last_login,

          metadata: data.metadata,

          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        setProfile(profileData);
      } catch (err) {
        console.error("Unexpected error in fetchUserRole:", err);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error.message);
        setLoading(false);
        return;
      }

      if (mounted) {
        if (session?.user) {
          await fetchUserRole(session.user);
        } else {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    }: {
      data: { subscription: { unsubscribe: () => void } };
    } = supabase.auth.onAuthStateChange((_event: string, session: Session) => {
      if (!mounted) return;

      (async () => {
        if (session?.user) {
          await fetchUserRole(session.user);
        } else {
          setLoading(false);
        }
      })(); // wrapped in IIFE
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole, supabase]);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: AuthError | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    return { error };
  };
  // Login with magic link
  const signInWithMagicLink = async (email: string) => {
    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || data.message || "Magic link failed");
  };

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signInWithTwitter = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /**
   * Deletes a file from Supabase Storage using its public URL.
   * Only works in the browser (requires cookie-based auth).
   */
  const deleteFileFromSupabase = async (
    fileUrl: string | null,
    bucketName: string | null,
  ): Promise<boolean> => {
    if (!fileUrl || !bucketName) {
      console.warn("Missing URL or bucket name.");
      return false;
    }

    try {
      const prefix = "/storage/v1/object/public/";
      const [_, path] = fileUrl.split(prefix);

      if (!path) {
        console.warn("Invalid Supabase URL format:", fileUrl);
        return false;
      }

      const { error } = await supabase.storage.from(bucketName).remove([path]);

      if (error) {
        console.error("Supabase delete error:", error.message);
        return false;
      }

      console.log("Deleted from Supabase:", path);
      return true;
    } catch (err) {
      console.error("Unexpected delete error:", err);
      return false;
    }
  };

  const value = useMemo<AuthContextType>(() => {
    return {
      profile,
      setProfile,
      loading,
      signIn,
      signInWithMagicLink,
      signInWithGoogle,
      signInWithTwitter,
      signOut,
      deleteFileFromSupabase,
      supabase,
    };
  }, [
    profile,
    loading,
    supabase,
    deleteFileFromSupabase,
    signIn,
    signInWithGoogle,
    signInWithMagicLink,
    signInWithTwitter,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
