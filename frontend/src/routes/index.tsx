import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Users,
  MessageSquare,
  Sparkles,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Star,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Connect — Your Freshman Survival Kit" },
      {
        name: "description",
        content:
          "Notes, PYQs, campus updates, and senior mentors — everything first-years need, in one place.",
      },
      { property: "og:title", content: "Campus Connect — Your Freshman Survival Kit" },
      {
        property: "og:description",
        content: "Notes, PYQs, campus updates, and senior mentors — everything first-years need.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: BookOpen,
    title: "Study Resources",
    desc: "Curated notes & PYQs by branch and semester.",
  },
  {
    icon: Users,
    title: "Senior Connect",
    desc: "Find mentors who've already cracked your subjects.",
  },
  {
    icon: MessageSquare,
    title: "Realtime Chat",
    desc: "Group chats, DMs and study squads built-in.",
  },
  { icon: Sparkles, title: "Smart Updates", desc: "Never miss a deadline, fest, or campus alert." },
];

const testimonials = [
  {
    name: "Riya V.",
    role: "1st Year, CSE",
    text: "Honestly saved me during mid-sems. The PYQs section is gold.",
  },
  {
    name: "Aman G.",
    role: "1st Year, ECE",
    text: "Connected with a senior in week 1. Best onboarding ever.",
  },
  {
    name: "Sara K.",
    role: "2nd Year, EE",
    text: "I now share notes here too. Pay it forward energy 💜",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* nav */}
      <header className="fixed top-0 inset-x-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 md:px-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Stories
            </a>
            <a href="#footer" className="hover:text-foreground transition-colors">
              About
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/login"
              className="hidden sm:inline-flex h-9 px-4 items-center text-sm font-medium hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-9 px-4 items-center text-sm font-semibold rounded-xl gradient-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative pt-32 pb-24 px-4 md:px-8">
        <div className="absolute inset-0 gradient-mesh opacity-70" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div
          className="absolute top-40 right-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 text-xs font-medium"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built by students, for students
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6"
          >
            Survive freshman year.
            <br />
            <span className="gradient-text">Thrive in college.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Notes, PYQs, campus updates and senior mentors — your complete college toolkit,
            beautifully organized.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link
              to="/signup"
              className="inline-flex h-12 px-6 items-center gap-2 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-12 px-6 items-center gap-2 rounded-2xl glass font-semibold hover:shadow-card transition-shadow"
            >
              Explore demo
            </Link>
          </motion.div>

          {/* preview card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-20 max-w-4xl mx-auto"
          >
            <div className="glass rounded-3xl p-3 shadow-glow">
              <div className="aspect-[16/9] rounded-2xl gradient-hero flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 gradient-mesh opacity-50" />
                <div className="relative grid grid-cols-3 gap-3 p-6 w-full">
                  {[BookOpen, Users, MessageSquare].map((Icon, i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                      className="glass rounded-2xl p-4 md:p-6"
                    >
                      <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground mb-2" />
                      <div className="h-2 bg-primary-foreground/30 rounded mb-1" />
                      <div className="h-2 bg-primary-foreground/20 rounded w-2/3" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need.</h2>
            <p className="text-muted-foreground text-lg">Nothing you don't.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="glass rounded-3xl p-6 hover:shadow-glow transition-shadow"
              >
                <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-glow">
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* testimonials */}
      <section id="testimonials" className="py-24 px-4 md:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by <span className="gradient-text">12k+ students</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-3xl p-6"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 gradient-hero opacity-90" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-primary-foreground">
              Ready to level up?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              Join thousands of students already on Campus Connect.
            </p>
            <Link
              to="/signup"
              className="inline-flex h-12 px-8 items-center gap-2 rounded-2xl bg-background text-foreground font-semibold hover:scale-105 transition-transform"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer id="footer" className="border-t border-border py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © 2026 Campus Connect. Made with 💜 by students.
          </p>
          <div className="flex items-center gap-3">
            {[Github, Twitter, Linkedin, Instagram].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="h-9 w-9 rounded-full glass flex items-center justify-center hover:shadow-glow transition-shadow"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
