import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <div className="relative h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
        <GraduationCap className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="font-display font-bold text-lg tracking-tight">
        Campus<span className="gradient-text">Connect</span>
      </span>
    </Link>
  );
}
