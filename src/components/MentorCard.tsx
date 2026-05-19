import { motion } from "framer-motion";
import { MessageCircle, UserPlus, Bookmark } from "lucide-react";
import { Card, Badge } from "@/components/ui-kit";

export function MentorCard({
  senior,
  onConnect,
  isBookmarked,
  onBookmark,
  index,
  alreadyRequested = false,
}: {
  senior: any;
  onConnect: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
  index: number;
  alreadyRequested?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="group hover:shadow-glow transition-shadow h-full flex flex-col">
        <div className="flex items-start gap-4 mb-4 relative">
          <div className="relative shrink-0">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow overflow-hidden">
              {senior.profileImage ? (
                <img
                  src={senior.profileImage}
                  alt={senior.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                senior.name.substring(0, 2).toUpperCase()
              )}
            </div>
            {senior.isMentorAvailable && (
              <div
                className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-success border-2 border-background"
                title="Available for Mentorship"
              />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-semibold truncate flex items-center gap-1.5">
              {senior.name}
              {(senior.verificationStatus === "approved" || senior.role?.toLowerCase() === "senior") && (
                <span
                  className="inline-flex items-center justify-center h-4.5 w-4.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black shadow-glow shrink-0"
                  title="Verified Senior Mentor"
                >
                  ✓
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {senior.branch} · Year {senior.year}
            </p>
            {senior.isMentorAvailable ? (
              <span className="text-xs text-success font-semibold">● Available</span>
            ) : (
              <span className="text-xs text-muted-foreground font-semibold">● Unavailable</span>
            )}
          </div>
          <button
            onClick={onBookmark}
            className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <Bookmark
              className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`}
            />
          </button>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {senior.bio || "No bio available."}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {senior.github && (
              <a
                href={senior.github.startsWith("http") ? senior.github : `https://${senior.github}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                GitHub
              </a>
            )}
            {senior.linkedin && (
              <a
                href={
                  senior.linkedin.startsWith("http")
                    ? senior.linkedin
                    : `https://${senior.linkedin}`
                }
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                LinkedIn
              </a>
            )}
            {senior.portfolio && (
              <a
                href={
                  senior.portfolio.startsWith("http")
                    ? senior.portfolio
                    : `https://${senior.portfolio}`
                }
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                Portfolio
              </a>
            )}
            {senior.leetcode && (
              <a
                href={
                  senior.leetcode.startsWith("http")
                    ? senior.leetcode
                    : `https://${senior.leetcode}`
                }
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                LeetCode
              </a>
            )}
            {senior.codechef && (
              <a
                href={
                  senior.codechef.startsWith("http")
                    ? senior.codechef
                    : `https://${senior.codechef}`
                }
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                CodeChef
              </a>
            )}
            {senior.hackerrank && (
              <a
                href={
                  senior.hackerrank.startsWith("http")
                    ? senior.hackerrank
                    : `https://${senior.hackerrank}`
                }
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                HackerRank
              </a>
            )}
            {senior.twitter && (
              <a
                href={
                  senior.twitter.startsWith("http") ? senior.twitter : `https://${senior.twitter}`
                }
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 rounded-md bg-muted hover:bg-primary/20 text-[10px] font-semibold text-primary transition-colors uppercase tracking-wider"
              >
                Twitter
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(senior.skills || []).map((sk: string) => (
            <Badge key={sk} variant="primary">
              {sk}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          {alreadyRequested ? (
            <button
              disabled
              className="flex-1 h-10 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center justify-center gap-1.5 cursor-not-allowed opacity-70"
            >
              <UserPlus className="h-4 w-4" /> Requested ✓
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5 shadow-glow hover:scale-105 transition-transform"
            >
              <UserPlus className="h-4 w-4" /> Request Mentorship
            </button>
          )}
          <button className="h-10 w-10 rounded-xl glass flex items-center justify-center hover:shadow-glow transition-shadow">
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
