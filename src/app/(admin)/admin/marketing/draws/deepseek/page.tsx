// app/admin/marketing/draws/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Trash2, Trophy, Ticket, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { DrawsService } from "@/lib/services/draws-service";

export default function AdminDrawsPage() {
  const { supabase } = useAuth();
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const drawsService = new DrawsService();

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false });
    setDraws(data || []);
    setLoading(false);
  };

  const deleteDraw = async (id: string) => {
    if (confirm("Delete this draw?")) {
      await supabase.from("draws").delete().eq("id", id);
      toast.success("Draw deleted");
      await fetchDraws();
    }
  };

  const runDraw = async (id: string) => {
    try {
      await drawsService.performDraw(id);
      toast.success("Draw completed!");
      await fetchDraws();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading draws...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lucky Draws</h1>
          <p className="text-muted-foreground">Manage time-limited giveaways</p>
        </div>
        <Link href="/admin/marketing/draws?create=true">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Draw
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {draws.map((draw) => (
          <Card key={draw.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{draw.name}</span>
                <Badge
                  variant={draw.status === "open" ? "default" : "secondary"}
                >
                  {draw.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Ticket className="h-4 w-4" />
                  <span>Prize: {draw.prize_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>
                    Draw: {new Date(draw.draw_time).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 pt-3">
                  <Link href={`/draws/live/${draw.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      Live
                    </Button>
                  </Link>
                  {draw.status === "closed" && (
                    <Button size="sm" onClick={() => runDraw(draw.id)}>
                      <Trophy className="h-3 w-3 mr-1" />
                      Draw
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDraw(draw.id)}
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
