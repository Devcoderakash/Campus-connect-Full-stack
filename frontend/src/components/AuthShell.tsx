import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* visual side */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden gradient-hero p-12 flex-col justify-between">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl animate-blob" />
        <div className="relative">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-primary-foreground"
        >
          <h2 className="text-4xl font-bold mb-3 leading-tight">
            "Best decision I made in freshman year."
          </h2>
          <p className="opacity-80">— Riya, 2nd Year CSE</p>
        </motion.div>
        <div className="relative flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full ${i === 1 ? "w-8 bg-primary-foreground" : "w-1.5 bg-primary-foreground/40"}`}
            />
          ))}
        </div>
      </div>

      {/* form side */}
      <div className="flex-1 flex flex-col p-6 md:p-12">
        <div className="flex items-center justify-between md:hidden mb-8">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="hidden md:flex justify-end">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground mb-8">{subtitle}</p>
            {children}
            <div className="mt-6 text-sm text-muted-foreground text-center">{footer}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
