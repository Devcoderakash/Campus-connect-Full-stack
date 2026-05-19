import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageCircle,
  Bell,
  User,
  Shield,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/context/AuthContext";

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const allItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/resources", label: "Resources", icon: BookOpen },
    { to: "/seniors", label: "Seniors", icon: Users, roles: ["junior", "senior", "admin", "Junior", "Senior", "Admin"] },
    {
      to: "/mentorship-requests",
      label: "Requests",
      icon: MessageCircle,
      roles: ["senior", "admin", "Senior", "Admin"],
    },
    { to: "/chat", label: "Chat", icon: MessageCircle, roles: ["junior", "senior", "admin", "Junior", "Senior", "Admin"] },
    { to: "/notifications", label: "Notifications", icon: Bell },
    { to: "/profile", label: "Profile", icon: User },
    { to: "/admin", label: "Admin", icon: Shield, roles: ["admin", "Admin"] },
  ];

  const items = allItems.filter((item) => {
    if (!item.roles) return true;
    const userRoleLower = user?.role?.toLowerCase() || "";
    return item.roles.map(r => r.toLowerCase()).includes(userRoleLower);
  });

  const Content = (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-8 px-2">
        <Logo to="/dashboard" />
        <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {items.map((item) => {
          const active = path === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 gradient-primary rounded-xl shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="glass rounded-2xl p-4 mt-4">
        <p className="text-xs font-semibold mb-1">Need help?</p>
        <p className="text-xs text-muted-foreground mb-3">Connect with a senior mentor today.</p>
        <Link to="/seniors" className="text-xs font-semibold gradient-text">
          Find mentor →
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* desktop */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-sidebar">
        {Content}
      </aside>
      {/* mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="md:hidden fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-sidebar z-50 border-r border-border"
            >
              {Content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
