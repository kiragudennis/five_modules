"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/context/AuthContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const linkSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

type LinkData = z.infer<typeof linkSchema>;

export default function MagicLinkForm() {
  const { signInWithMagicLink } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LinkData>({
    resolver: zodResolver(linkSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: LinkData) => {
    setError(null);
    setLoading(true);

    const toastId = toast.loading("Sending magic link...");

    try {
      await signInWithMagicLink(data.email);
      toast.success("Magic link sent! Check your email ✉️", { id: toastId });
    } catch (err: any) {
      setError(err.message || "Failed to send link.");
      toast.error(err.message || "Magic link failed ❌", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className="text-sm"
                  placeholder="email@creator.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending Link..." : "Send Magic Link"}
        </Button>
      </form>
    </Form>
  );
}
