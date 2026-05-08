"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, Users } from "lucide-react";

type LiveDisplayShellProps = {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  activeCount?: number;
  tickerItems?: string[];
  children: ReactNode;
};

export function LiveDisplayShell({
  title,
  subtitle,
  statusLabel = "LIVE",
  activeCount = 0,
  tickerItems = [],
  children,
}: LiveDisplayShellProps) {
  const ticker =
    tickerItems.length > 0
      ? tickerItems.join("  •  ")
      : "Waiting for activity...";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-600 text-white hover:bg-red-600">
              <Radio className="mr-1 h-3 w-3" />
              {statusLabel}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-slate-800 text-slate-200 hover:bg-slate-800"
            >
              <Users className="mr-1 h-3 w-3" />
              {activeCount} active
            </Badge>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="overflow-hidden py-3">
              <div className="whitespace-nowrap text-sm text-slate-200">
                <span className="inline-block animate-[marquee_22s_linear_infinite]">
                  {ticker}
                </span>
              </div>
            </CardContent>
          </Card>
        </footer>
      </div>
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
