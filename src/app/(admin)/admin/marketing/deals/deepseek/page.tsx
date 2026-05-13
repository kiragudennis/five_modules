// app/admin/marketing/deals/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Trash2, Zap, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function AdminDealsPage() {
  const { supabase } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    const { data } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    setDeals(data || []);
    setLoading(false);
  };

  const deleteDeal = async (id: string) => {
    if (confirm("Delete this deal?")) {
      await supabase.from("deals").delete().eq("id", id);
      toast.success("Deal deleted");
      await fetchDeals();
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading deals...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Flash Deals</h1>
          <p className="text-muted-foreground">
            Create urgency with limited-time offers
          </p>
        </div>
        <Link href="/admin/marketing/deals?create=true">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{deal.name}</span>
                <Badge
                  variant={deal.status === "active" ? "default" : "secondary"}
                >
                  {deal.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>
                    {deal.discount_type === "percentage"
                      ? `${deal.discount_value}% OFF`
                      : `${formatCurrency(deal.discount_value, "KES")} OFF`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Ends: {new Date(deal.ends_at).toLocaleString()}</span>
                </div>
                {deal.remaining_quantity !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    <span>
                      {deal.remaining_quantity} / {deal.total_quantity} left
                    </span>
                  </div>
                )}
                <div className="flex gap-2 pt-3">
                  <Link href={`/deals/live/${deal.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Live
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDeal(deal.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
