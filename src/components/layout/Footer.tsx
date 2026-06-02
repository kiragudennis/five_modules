// components/footer.tsx

import {
  ExternalLink,
  Info,
  Sparkles,
  Target,
  Gift,
  Trophy,
  Ticket,
  Zap,
  Heart,
  Users,
  Award,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Icon } from "../Icon";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const modules = [
    {
      name: "Spin Wheel",
      icon: Target,
      href: "/spin",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Challenges",
      icon: Trophy,
      href: "/challenges",
      color: "from-orange-500 to-red-500",
    },
    {
      name: "Lucky Draws",
      icon: Ticket,
      href: "/draws",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Mystery Bundles",
      icon: Gift,
      href: "/bundles",
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Flash Deals",
      icon: Zap,
      href: "/deals",
      color: "from-amber-500 to-yellow-500",
    },
  ];

  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                <img
                  src="/favicon-32x32.png"
                  alt="Northwind Systems"
                  className="h-8 w-8"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Northwind Systems
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Revolutionary customer engagement platform. We transform casual
              browsers into loyal brand advocates through gamified experiences.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="https://northwind.yunobase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Visit Website <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="https://tiktok.com/@northwind"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                @northwind
              </Link>
            </div>
          </div>

          {/* Gamification Modules Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Engagement Modules
            </h3>
            <ul className="space-y-2">
              {modules.map((module) => (
                <li key={module.name}>
                  <Link
                    href={module.href}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                  >
                    <module.icon
                      className={`h-3.5 w-3.5 transition-colors group-hover:text-${module.color.split(" ")[0].replace("from-", "")}-500`}
                    />
                    <span>{module.name}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Powered by Northwind's 5-in-1 Engagement Suite
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Store</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  href="/?featured=true"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Featured Items
                </Link>
              </li>
              <li>
                <Link
                  href="/?deal=true"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  Deals of the Day
                </Link>
              </li>
              <li>
                <Link
                  href="/loyalty"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Award className="h-3 w-3 text-purple-500" />
                  Loyalty Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social Column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              <p className="flex items-center gap-2">
                <span>🌍</span> Nairobi, Kenya
              </p>
              <p className="flex items-center gap-2">
                <span>📧</span> hello@northwind.yunobase.com
              </p>
              <p className="flex items-center gap-2">
                <span>📱</span> +254 113 062 599
              </p>
            </address>
            <div className="mt-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Transform your customer experience with our proven engagement
                strategies.
              </p>
            </div>
          </div>
        </div>

        {/* Customer Engagement Stats Banner */}
        <div className="border-t border-b py-4 my-6 flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Live Engagement
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              Loyalty Points
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">
              Referral Rewards
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">
              Customer Retention
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Northwind Systems. Revolutionizing customer
            engagement.
          </p>
          <div className="flex gap-6">
            <Link
              href="/about"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/about/modules"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/about/modules/consultation"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Consultation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
