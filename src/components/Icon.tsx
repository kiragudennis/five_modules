import {
  LucideIcon,
  ShoppingBag,
  ChartNoAxesCombined,
  CreditCard,
  Vault,
  Gem,
  Clock,
  Users,
  TableOfContents,
  Logs,
  Video,
  BarChart2,
  Boxes,
} from "lucide-react";

interface IconProps {
  name: string;
  className?: string;
}

const iconComponents: Record<string, LucideIcon> = {
  "shopping-bag": ShoppingBag,
  chart: ChartNoAxesCombined,
  "credit-card": CreditCard,
  "empty-vault": Vault,
  gem: Gem,
  users: Users,
  clock: Clock,
  "content-missing": TableOfContents,
  "no-logs": Logs,
  "no-videos": Video,
  "bar-chart-2": BarChart2,
  boxes: Boxes,
};

export function Icon({ name, className }: IconProps) {
  const IconComponent = iconComponents[name] || ShoppingBag;

  return <IconComponent className={className} />;
}
