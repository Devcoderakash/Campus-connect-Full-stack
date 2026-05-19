/**
 * src/components/ProtectedRoute.tsx
 *
 * Wraps any page that requires authentication.
 * If the user is not logged in, they are redirected to /login
 * with the original destination saved so they can be sent back after login.
 *
 * Usage:
 *   export const Route = createFileRoute('/_app/dashboard')({
 *     component: () => <ProtectedRoute><Dashboard /></ProtectedRoute>,
 *   })
 *
 * Or wrap the _app layout component (recommended — see _app.tsx).
 */

import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: ReactNode;
  requiredRole?: "Junior" | "Senior" | "Admin";
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }

    // Force redirection to profile completion page if branch or year is empty
    const isIncomplete = !user?.branch || !user?.year;
    if (isIncomplete && currentPath !== "/complete-profile") {
      navigate({ to: "/complete-profile" });
      return;
    }

    // Case-insensitive role guard (e.g. admin-only pages)
    if (requiredRole) {
      const userRoleLower = user?.role?.toLowerCase() || "";
      const reqRoleLower = requiredRole.toLowerCase();
      if (userRoleLower !== reqRoleLower) {
        navigate({ to: "/dashboard" });
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, navigate, currentPath]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
