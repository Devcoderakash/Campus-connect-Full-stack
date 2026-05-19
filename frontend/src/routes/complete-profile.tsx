import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Award,
  User,
  Image,
  Upload,
  FileText,
  Linkedin,
  Github,
  Globe,
  Save,
  ArrowRight,
  Plus,
  X,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({ meta: [{ title: "Complete Profile — Campus Connect" }] }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const { user, refetchUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    branch: "CSE",
    year: 1,
    bio: "",
    skills: [] as string[],
    profileImage: "",
    collegeIdUrl: "",
    linkedin: "",
    github: "",
    portfolio: "",
  });

  const [skillInput, setSkillInput] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Redirect if user is not authenticated, or if their profile is already complete
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login" });
      return;
    }
    if (user?.branch && user?.year) {
      navigate({ to: "/dashboard" });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Sync user's existing data if any (e.g., name from Google)
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        branch: user.branch || prev.branch,
        year: user.year || prev.year,
        bio: user.bio || prev.bio,
        skills: user.skills || prev.skills,
        profileImage: user.profileImage || prev.profileImage,
      }));
    }
  }, [user]);

  // Upload Profile Image
  const handleProfileUpload = async (file: File) => {
    setUploadingProfile(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await api.postForm<{ url: string }>("/users/upload", data);
      setFormData((prev) => ({ ...prev, profileImage: res.url }));
    } catch (err: any) {
      setError("Failed to upload profile picture. Try another file type (JPG/PNG).");
    } finally {
      setUploadingProfile(false);
    }
  };

  // Upload College ID Card
  const handleIdUpload = async (file: File) => {
    setUploadingId(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await api.postForm<{ url: string }>("/users/upload", data);
      setFormData((prev) => ({ ...prev, collegeIdUrl: res.url }));
    } catch (err: any) {
      setError("Failed to upload College ID card. Try PDF or image (JPG/PNG).");
    } finally {
      setUploadingId(false);
    }
  };

  const addSkill = () => {
    const clean = skillInput.trim();
    if (clean && !formData.skills.includes(clean)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, clean] }));
      setSkillInput("");
    }
  };

  const removeSkill = (tag: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Form Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      setIsSubmitting(false);
      setStep(1);
      return;
    }

    if (formData.year >= 2 && !formData.collegeIdUrl) {
      setError("College ID Card verification is required for 2nd, 3rd, and 4th-year students.");
      setIsSubmitting(false);
      setStep(2);
      return;
    }

    try {
      // Complete profile API call
      await api.put("/users/profile", {
        name: formData.name.trim(),
        branch: formData.branch,
        year: formData.year,
        bio: formData.bio.trim(),
        skills: formData.skills,
        profileImage: formData.profileImage,
        collegeIdUrl: formData.collegeIdUrl,
        linkedin: formData.linkedin.trim(),
        github: formData.github.trim(),
        portfolio: formData.portfolio.trim(),
      });

      // Refetch the updated profile details globally
      await refetchUser();

      // Direct to dashboard
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-background relative overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-[-10%] right-[-10%] h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="w-full max-w-2xl glass rounded-3xl shadow-card border border-border overflow-hidden z-10">
        {/* Header */}
        <div className="p-8 border-b border-border bg-muted/20 text-center">
          <h1 className="text-3xl font-display font-bold tracking-tight">Complete your profile ✨</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Campus Connect helps you find study partners, resources, and expert mentorship. Let's get set up!
          </p>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setStep(1)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                step === 1
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              1. General Details
            </button>
            <div className="h-0.5 w-8 bg-border" />
            <button
              onClick={() => {
                if (formData.name.trim()) setStep(2);
              }}
              disabled={!formData.name.trim()}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                step === 2
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
              }`}
            >
              2. Skills & Socials
            </button>
          </div>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 py-3 bg-destructive/10 text-destructive text-sm font-medium border-b border-destructive/20 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Profile image upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="h-28 w-28 rounded-full border-2 border-border overflow-hidden flex items-center justify-center bg-muted transition-all group-hover:border-primary">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                    {uploadingProfile && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
                    title="Upload Photo"
                  >
                    <Image className="h-4 w-4" />
                  </button>
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfileUpload(file);
                    }}
                    className="hidden"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Upload profile picture (optional)</span>
              </div>

              {/* General details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">College Email</label>
                  <input
                    value={user?.email || ""}
                    disabled
                    className="w-full h-11 px-4 rounded-xl bg-muted/50 border border-border text-muted-foreground outline-none text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Department / Branch
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors appearance-none"
                  >
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="ME">Mechanical Engineering (ME)</option>
                    <option value="CE">Civil Engineering (CE)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="IT">Information Technology (IT)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Current Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, year: Number(e.target.value) }))
                    }
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors appearance-none"
                  >
                    <option value={1}>1st Year (Junior)</option>
                    <option value={2}>2nd Year (Pending Senior Verification)</option>
                    <option value={3}>3rd Year (Pending Senior Verification)</option>
                    <option value={4}>4th Year / Mentor (Pending Senior Verification)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Short Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Share a short bio with the campus..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (formData.name.trim()) setStep(2);
                    else setError("Full name is required.");
                  }}
                  className="h-11 px-6 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-glow hover:scale-[1.02] transition-transform"
                >
                  Continue to Skills & Verification <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* College ID upload panel for 2nd/3rd/4th year */}
              {formData.year >= 2 && (
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">Senior Mentorship Verification</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Because you're in year {formData.year}, you can act as a mentor! We require a college ID Card
                        upload to keep this a trusted space.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => idInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 relative flex flex-col items-center justify-center gap-2"
                  >
                    {uploadingId ? (
                      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : formData.collegeIdUrl ? (
                      <>
                        <CheckCircle className="h-8 w-8 text-success" />
                        <span className="text-xs font-semibold text-success">ID Card Uploaded Successfully!</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-xs">
                          {formData.collegeIdUrl}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs font-semibold">Click to upload your College ID Card</span>
                        <span className="text-[10px] text-muted-foreground">PDF or Image (Max 10MB)</span>
                      </>
                    )}
                    <input
                      ref={idInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIdUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Skills Multi-Input */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Skills & Expertise
                </label>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="E.g. React, Python, UI Design"
                    className="flex-1 h-11 px-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="h-11 px-4 rounded-xl bg-muted border border-border hover:bg-border transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b border-border pb-1">Professional Socials</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={formData.linkedin}
                      onChange={(e) => setFormData((prev) => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="LinkedIn URL (optional)"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={formData.github}
                      onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                      placeholder="GitHub URL (optional)"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={formData.portfolio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, portfolio: e.target.value }))}
                      placeholder="Portfolio / Personal Website URL (optional)"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submission actions */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-11 px-5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingProfile || uploadingId}
                  className="h-11 px-6 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Profile & Explore
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}
