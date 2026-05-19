import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Edit2, Eye, EyeOff, FileText, Plus, X } from "lucide-react";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Campus Connect" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<string[]>(user?.skills || ["React", "Python"]);
  const [contactVisible, setContactVisible] = useState(user?.visibility ?? true);
  const [mentorAvailable, setMentorAvailable] = useState((user as any)?.isMentorAvailable ?? true);
  const [newSkill, setNewSkill] = useState("");
  const [bio, setBio] = useState(
    user?.bio ||
      "Hey! I'm a student passionate about tech. Always down to collab on cool projects 💜",
  );

  // Professional Links
  const [github, setGithub] = useState(user?.github || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [leetcode, setLeetcode] = useState(user?.leetcode || "");
  const [codechef, setCodechef] = useState(user?.codechef || "");
  const [hackerrank, setHackerrank] = useState(user?.hackerrank || "");
  const [twitter, setTwitter] = useState(user?.twitter || "");

  const { data: userResources = [] } = useQuery({
    queryKey: ["my-resources"],
    queryFn: async () => {
      // Just fetch all and filter client side for MVP or a dedicated endpoint if available
      const res = await api.get<any>("/resources?limit=100");
      return (res.resources || []).filter(
        (r: any) => r.uploadedBy?._id === user?._id || r.uploadedBy === user?._id,
      );
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["my-profile-stats"],
    queryFn: () => api.get<any>("/users/profile/stats"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.put("/users/profile", data),
    onSuccess: (data) => {
      // update local storage via a custom event or context, but for now we just show an alert
      // AuthContext will not automatically sync unless we reload or it listens to an event
      const stored = localStorage.getItem("cc_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("cc_user", JSON.stringify({ ...(parsed as any), ...(data as any) }));
        window.location.reload(); // simple way to re-sync AuthContext without complex prop drilling
      }
    },
  });

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        bio,
        skills,
        visibility: contactVisible,
        isMentorAvailable: mentorAvailable,
        github,
        linkedin,
        portfolio,
        leetcode,
        codechef,
        hackerrank,
        twitter,
      });
      alert("Profile saved successfully");
    } catch (e) {
      alert("Failed to save profile");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-32 gradient-hero" />
        <div className="relative pt-16 flex flex-col md:flex-row gap-6 md:items-end">
          <div className="relative">
            <div className="h-28 w-28 rounded-3xl gradient-primary border-4 border-background flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-glow overflow-hidden">
              {user?.profileImage ? (
                <img src={user.profileImage} className="w-full h-full object-cover" />
              ) : (
                user?.name?.substring(0, 2).toUpperCase() || "U"
              )}
            </div>
            <button className="absolute bottom-1 right-1 h-9 w-9 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground">
              {user?.role} · Year {user?.year ?? 1} · {user?.branch || "General"} · Joined 2024
            </p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex h-10 px-5 items-center gap-2 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow"
          >
            <Edit2 className="h-4 w-4" /> Save
          </button>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <SectionHeader title="About" />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-24 p-3 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary text-sm resize-none"
            />
          </Card>

          <Card>
            <SectionHeader title="Skills" />
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold"
                >
                  {s}
                  <button onClick={() => setSkills(skills.filter((sk) => sk !== s))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                className="flex-1 h-10 px-3 rounded-xl bg-muted outline-none text-sm"
              />
              <button
                onClick={() => {
                  if (newSkill) {
                    setSkills([...skills, newSkill]);
                    setNewSkill("");
                  }
                }}
                className="h-10 w-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Professional & Social Links" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  GitHub
                </label>
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  LinkedIn
                </label>
                <input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  Portfolio Website
                </label>
                <input
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://mywebsite.com"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  LeetCode
                </label>
                <input
                  value={leetcode}
                  onChange={(e) => setLeetcode(e.target.value)}
                  placeholder="https://leetcode.com/u/username"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  CodeChef
                </label>
                <input
                  value={codechef}
                  onChange={(e) => setCodechef(e.target.value)}
                  placeholder="https://codechef.com/users/username"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  HackerRank
                </label>
                <input
                  value={hackerrank}
                  onChange={(e) => setHackerrank(e.target.value)}
                  placeholder="https://hackerrank.com/profile/username"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">
                  Twitter / X
                </label>
                <input
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/username"
                  className="w-full h-11 px-3 rounded-xl bg-muted outline-none text-sm focus:border-primary border-2 border-transparent"
                />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Uploaded resources" />
            <div className="space-y-3">
              {userResources.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">No resources uploaded yet.</div>
              ) : (
                userResources.map((n: any) => (
                  <div key={n._id} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40">
                    <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{n.title || n.subject}</p>
                      <p className="text-xs text-muted-foreground">{n.resourceType}</p>
                    </div>
                    <Badge variant="primary">{n.subject}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeader title="Privacy" />
            <button
              onClick={() => setContactVisible(!contactVisible)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                {contactVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <div className="text-left">
                  <p className="text-sm font-semibold">Contact info</p>
                  <p className="text-xs text-muted-foreground">
                    {contactVisible ? "Visible to all" : "Hidden"}
                  </p>
                </div>
              </div>
              <div
                className={`h-6 w-11 rounded-full transition-colors ${contactVisible ? "gradient-primary" : "bg-border"} relative`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${contactVisible ? "left-5" : "left-0.5"}`}
                />
              </div>
            </button>

            {(user?.role === "Senior" || (user?.year ?? 1) >= 2) && (
              <button
                onClick={() => setMentorAvailable(!mentorAvailable)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors mt-3"
              >
                <div className="flex items-center gap-3">
                  {mentorAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <div className="text-left">
                    <p className="text-sm font-semibold">Mentor Status</p>
                    <p className="text-xs text-muted-foreground">
                      {mentorAvailable ? "Available for requests" : "Not accepting requests"}
                    </p>
                  </div>
                </div>
                <div
                  className={`h-6 w-11 rounded-full transition-colors ${mentorAvailable ? "gradient-primary" : "bg-border"} relative`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${mentorAvailable ? "left-5" : "left-0.5"}`}
                  />
                </div>
              </button>
            )}
          </Card>

          <Card>
            <SectionHeader title="Stats" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Resources", value: statsLoading ? "-" : (stats?.resourcesCount ?? 0) },
                { label: "Connects", value: statsLoading ? "-" : (stats?.connectionsCount ?? 0) },
                { label: "Uploads", value: statsLoading ? "-" : (stats?.uploadsCount ?? 0) },
                { label: "Bookmarks", value: statsLoading ? "-" : (stats?.bookmarksCount ?? 0) },
                { label: "Active Chats", value: statsLoading ? "-" : (stats?.activeChats ?? 0) },
                { label: "Requests", value: statsLoading ? "-" : (stats?.totalRequests ?? 0) },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-2xl bg-muted/40 text-center">
                  <p className="text-2xl font-bold gradient-text">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
