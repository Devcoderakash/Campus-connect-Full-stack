import { Outlet, Link, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Bell,
  LogOut,
  Shield,
  Menu,
  UploadCloud,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: Shield, label: "Senior Verification", path: "/verification" },
  { icon: Users, label: "Senior Management", path: "/seniors" },
  { icon: CalendarDays, label: "University Updates", path: "/events" },
  { icon: BookOpen, label: "All Resources", path: "/resources" },
  { icon: UploadCloud, label: "Upload Resource", path: "/upload" },
];

export function AdminLayout() {
  // const { user, logout } = useAuth();
  // Temporary bypass user
  const user = { name: "Dev Admin", role: "Admin" };
  const logout = () => {
    console.log("Logout disabled in dev bypass mode");
  };

  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 h-screen w-64 glass border-r flex flex-col transition-transform duration-300",
          !sidebarOpen && "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Shield className="h-6 w-6 text-primary mr-2" />
          <span className="font-display font-bold text-lg">Admin Panel</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-muted/50">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Navbar */}
        <header className="h-16 glass border-b sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-display font-semibold capitalize">
              {location.pathname === "/" ? "Dashboard Overview" : location.pathname.split("/")[1]}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
