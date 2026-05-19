import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  MessageSquare,
  Bell,
  Download,
  ArrowUpRight,
  Sparkles,
  Calendar,
  X,
  ShieldAlert,
} from "lucide-react";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Campus Connect" }] }),
  component: Dashboard,
});

const quickNav = [
  { to: "/resources", icon: BookOpen, label: "Resources", color: "from-violet-500 to-purple-500" },
  { to: "/seniors", icon: Users, label: "Seniors", color: "from-cyan-400 to-blue-500" },
  { to: "/chat", icon: MessageSquare, label: "Chat", color: "from-pink-400 to-rose-500" },
  { to: "/notifications", icon: Bell, label: "Alerts", color: "from-amber-400 to-orange-500" },
] as const;

function Dashboard() {
  const { user } = useAuth();

  const { data: events = [] } = useQuery({
    queryKey: ["university-events"],
    queryFn: () => api.get<any[]>("/events"),
  });

  const { data: seniors = [] } = useQuery({
    queryKey: ["seniors-dashboard"],
    queryFn: () => api.get<any[]>("/mentorship/seniors?limit=3"),
  });

  const { data: pyqsData } = useQuery({
    queryKey: ["resources-pyqs"],
    queryFn: () => api.get<any>("/resources?type=PYQ&limit=3"),
  });

  const { data: notesData } = useQuery({
    queryKey: ["resources-notes"],
    queryFn: () => api.get<any>("/resources?type=Notes&limit=3"),
  });

  const pyqs = pyqsData?.resources || [];
  const notes = notesData?.resources || [];
  const updates = events.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Verification Alerts */}
      {user?.verificationStatus === "pending" && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Senior Verification Request Pending</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                We've received your College ID Card upload and our admin team is reviewing it. Once verified, you will unlock full mentor tools, appear on senior lists, and be able to receive junior requests!
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-500/20 px-3 py-1 rounded-full font-bold self-start md:self-center shrink-0">In Review</span>
        </div>
      )}

      {user?.verificationStatus === "rejected" && (
        <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <X className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Senior Verification Request Rejected</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unfortunately, your senior verification request was rejected. Reason: <span className="font-medium text-foreground">{user?.rejectionReason || "No details provided."}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                You can submit a new verification request by updating your profile.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="text-xs font-bold bg-destructive/20 text-destructive hover:bg-destructive/30 px-3 py-1.5 rounded-full self-start md:self-center shrink-0 transition-colors"
          >
            Re-submit Request
          </Link>
        </div>
      )}

      {/* welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-10 gradient-hero text-primary-foreground"
      >
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary-foreground/10 blur-2xl animate-blob" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/15 text-xs font-semibold mb-3">
            <Sparkles className="h-3 w-3" /> Welcome back
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            Hey {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="opacity-80 max-w-md">Here is what's happening on campus today.</p>
        </div>
      </motion.div>

      {/* quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickNav.map((q, i) => (
          <motion.div
            key={q.to}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={q.to} className="group block">
              <Card className="hover:shadow-glow transition-shadow group-hover:-translate-y-1 transition-transform">
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${q.color} flex items-center justify-center mb-3 shadow-glow`}
                >
                  <q.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{q.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* updates + pyqs */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader
            title="University updates"
            action={
              <Link to="/notifications" className="text-sm font-semibold gradient-text">
                View all
              </Link>
            }
          />
          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No recent university updates.
              </div>
            ) : (
              updates.map((event: any, i: number) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="flex flex-col sm:flex-row gap-4 hover:shadow-glow transition-shadow overflow-hidden p-0 sm:pr-4">
                    {event.bannerImage ? (
                      <div className="h-40 sm:h-auto sm:w-32 bg-muted shrink-0">
                        <img
                          src={event.bannerImage}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="hidden sm:flex h-24 w-24 rounded-2xl bg-primary/10 items-center justify-center shrink-0 ml-4 mt-4 sm:my-auto">
                        <Calendar className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 p-4 sm:p-4 sm:pl-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="primary">{event.eventType}</Badge>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {new Date(event.eventDate).toLocaleDateString()} at {event.eventTime}
                        </span>
                      </div>
                      <p className="font-bold text-lg leading-tight mb-1 truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          Organized by{" "}
                          <span className="font-semibold text-foreground">{event.organizedBy}</span>
                        </span>
                      </div>
                      {(event.registrationLink || event.websiteLink || event.moreDetailsLink) && (
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {event.registrationLink && (
                            <a
                              href={
                                event.registrationLink.startsWith("http")
                                  ? event.registrationLink
                                  : `https://${event.registrationLink}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold shadow-glow hover:-translate-y-0.5 transition-transform"
                            >
                              Register
                            </a>
                          )}
                          {event.websiteLink && (
                            <a
                              href={
                                event.websiteLink.startsWith("http")
                                  ? event.websiteLink
                                  : `https://${event.websiteLink}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted-foreground/20 text-xs font-semibold transition-colors"
                            >
                              Website
                            </a>
                          )}
                          {event.moreDetailsLink && (
                            <a
                              href={
                                event.moreDetailsLink.startsWith("http")
                                  ? event.moreDetailsLink
                                  : `https://${event.moreDetailsLink}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-muted-foreground/20 text-xs font-semibold transition-colors"
                            >
                              More Details
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeader
            title="Suggested seniors"
            action={
              <Link to="/seniors" className="text-sm font-semibold gradient-text">
                All
              </Link>
            }
          />
          <div className="space-y-3">
            {seniors.slice(0, 3).map((s: any) => (
              <Card key={s._id} className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0 overflow-hidden">
                    {s.profileImage ? (
                      <img
                        src={s.profileImage}
                        alt={s.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      s.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  {s.isMentorAvailable && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.branch} · Year {s.year}
                  </p>
                </div>
                <Link
                  to="/seniors"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full gradient-primary text-primary-foreground"
                >
                  View
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* PYQs and notes */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <SectionHeader
            title="Recent PYQs"
            action={
              <Link to="/resources" className="text-sm font-semibold gradient-text">
                All
              </Link>
            }
          />
          <div className="space-y-3">
            {pyqs.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">No recent PYQs.</div>
            ) : (
              pyqs.slice(0, 3).map((p: any) => (
                <Card key={p._id} className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.title || p.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.branch} · Sem {p.semester}
                    </p>
                  </div>
                  <a
                    href={p.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl glass flex items-center justify-center hover:shadow-glow transition-shadow"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Card>
              ))
            )}
          </div>
        </div>
        <div>
          <SectionHeader
            title="Top notes"
            action={
              <Link to="/resources" className="text-sm font-semibold gradient-text">
                All
              </Link>
            }
          />
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">No recent notes.</div>
            ) : (
              notes.slice(0, 3).map((n: any) => (
                <Card key={n._id} className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{n.title || n.subject}</p>
                    <p className="text-xs text-muted-foreground">{n.uploadedBy?.name}</p>
                  </div>
                  <Badge variant="primary">{n.subject}</Badge>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
