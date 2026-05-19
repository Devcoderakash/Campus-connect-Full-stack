import { useState } from "react";
import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, Plus, LogOut } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { ProtectedRoute } from "./ProtectedRoute";
import { NotificationBell } from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get avatar initials from name, or "?" for unknown users
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    // All app routes are protected — unauthenticated users are sent to /login
    <ProtectedRoute>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 glass border-b border-border">
            <div className="flex items-center gap-3 h-16 px-4 md:px-6">
              <button
                onClick={() => setOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="Search resources, seniors, notes…"
                    className="w-full pl-10 pr-4 h-10 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-background outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 md:hidden" />
              <ThemeToggle />
              <NotificationBell />

              {/* ── User avatar + dropdown ─────────────────────────────────── */}
              <div className="relative">
                <button
                  id="user-avatar-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                  className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-glow hover:scale-110 transition-transform overflow-hidden"
                  title={user?.name ?? "Profile"}
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute right-0 top-12 w-56 glass rounded-2xl shadow-card border border-border p-2 z-50"
                    >
                      {/* User info */}
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="font-semibold text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          {user?.role}
                        </span>
                      </div>
                      {/* Profile link */}
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm hover:bg-muted transition-colors"
                      >
                        My Profile
                      </Link>
                      {/* Logout */}
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <motion.main
            key={typeof window !== "undefined" ? window.location.pathname : "main"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 p-4 md:p-6 lg:p-8"
          >
            <Outlet />
          </motion.main>

          {/* FAB */}
          <button className="fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-primary shadow-glow flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform z-20">
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
