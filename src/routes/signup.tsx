import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User, ArrowRight, GraduationCap, Award } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Campus Connect" }] }),
  component: Signup,
});

function Signup() {
  const [role, setRole] = useState<"Junior" | "Senior" | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    branch: "CSE",
    year: 1,
    skills: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        role,
        skills:
          role === "Senior"
            ? formData.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
      };

      const res = await api.post<any>("/auth/signup", payload);

      // Directly log the user in with the returned token and user data to avoid a second API call
      if (res.token) {
        localStorage.setItem("cc_token", res.token);
        localStorage.setItem(
          "cc_user",
          JSON.stringify({
            _id: res._id,
            name: res.name,
            email: res.email,
            role: res.role,
            branch: formData.branch,
            year: formData.year,
            skills: payload.skills,
          }),
        );
        // We trigger a reload to let the AuthContext pick up the new storage natively
        window.location.href = "/dashboard";
      } else {
        await login(formData.email, formData.password);
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const firstError = err.response.data.errors[0];
        const fieldName = firstError.path ? firstError.path.join(".") : "Field";
        setError(`${fieldName}: ${firstError.message}`);
      } else {
        setError(err?.response?.data?.message ?? "Network error: Signup failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Pick your vibe ✨" : "Almost there 🎉"}
      subtitle={step === 1 ? "Tell us who you are" : "Just a few details to get you started"}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold gradient-text">
            Log in
          </Link>
        </>
      }
    >
      {step === 1 ? (
        <div className="space-y-3">
          {(
            [
              {
                id: "Junior",
                icon: GraduationCap,
                title: "Junior",
                desc: "I'm a 1st or 2nd year looking for guidance",
              },
              {
                id: "Senior",
                icon: Award,
                title: "Senior",
                desc: "I'm a 3rd/4th year ready to mentor juniors",
              },
            ] as const
          ).map((r) => (
            <motion.button
              key={r.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRole(r.id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                role === r.id
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center ${role === r.id ? "gradient-primary" : "bg-muted"}`}
              >
                <r.icon className={`h-5 w-5 ${role === r.id ? "text-primary-foreground" : ""}`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            </motion.button>
          ))}
          <button
            disabled={!role}
            onClick={() => setStep(2)}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 mt-2"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Name
            </label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@university.edu"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Branch
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full h-12 px-4 mt-1.5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors appearance-none"
              >
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EE">EE</option>
                <option value="ME">ME</option>
                <option value="CE">CE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full h-12 px-4 mt-1.5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors appearance-none"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
          </div>

          {role === "Senior" && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Top Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="React, Node.js, Python"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                className="w-full h-12 px-4 mt-1.5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors"
              />
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-4 rounded-xl border-2 border-border font-semibold hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create account"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
