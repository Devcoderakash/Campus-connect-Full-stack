import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Campus Connect" }] }),
  component: Login,
});

// ── Google "G" SVG icon ────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.705A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.705V4.963H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.037l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 6.295C4.672 4.169 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const emailValid = email.length === 0 || /\S+@\S+\.\S+/.test(email);

  // ── Email / password submit ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Google OAuth (implicit / access_token flow) ──────────────────────────
  // Step 1: @react-oauth/google opens the popup and returns an access_token.
  // Step 2: We call Google's userinfo endpoint to get name, email, picture.
  // Step 3: We send that profile to our backend via AuthContext.googleLogin().
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleError("");
      setIsGoogleLoading(true);
      try {
        // Fetch user profile from Google using the access_token
        const profile = await api.getExternal<any>(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          tokenResponse.access_token,
        );

        // Send the profile to our backend (Mode B: googleProfile)
        // AuthContext.googleLogin wraps the API call + state update
        await googleLogin(tokenResponse.access_token, profile);
        navigate({ to: "/dashboard" });
      } catch (err: any) {
        setGoogleError(err?.response?.data?.message ?? "Google sign-in failed. Please try again.");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleError("Google sign-in was cancelled or blocked. Please try again.");
    },
  });

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle="Log in to your Campus Connect account"
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-semibold gradient-text">
            Create account
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {/* ── Google OAuth button ───────────────────────────────────────── */}
        <button
          id="google-login-btn"
          type="button"
          onClick={() => loginWithGoogle()}
          disabled={isGoogleLoading}
          className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border-2 border-border bg-background hover:bg-muted font-semibold text-sm transition-all hover:border-primary/40 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <span className="h-5 w-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {isGoogleLoading ? "Signing in…" : "Continue with Google"}
        </button>

        {googleError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{googleError}</span>
          </div>
        )}

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── Email / password form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                className={`w-full h-12 pl-10 pr-10 rounded-xl bg-muted border-2 outline-none transition-colors ${
                  !emailValid
                    ? "border-destructive"
                    : email && emailValid
                      ? "border-success"
                      : "border-transparent focus:border-primary"
                }`}
              />
              {email && emailValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
              )}
            </div>
            {!emailValid && <p className="text-xs text-destructive mt-1">Enter a valid email</p>}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password-input"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 pl-10 pr-10 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded accent-primary" />
              <span className="text-muted-foreground">Remember me</span>
            </label>
            <a href="#" className="font-semibold gradient-text">
              Forgot?
            </a>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <>
                Log in <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
