import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui-kit";
import { branches } from "@/lib/constants";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MentorCard } from "@/components/MentorCard";
import { RequestMentorshipModal } from "@/components/RequestMentorshipModal";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_app/seniors")({
  head: () => ({ meta: [{ title: "Senior Connect — Campus Connect" }] }),
  component: SeniorsPage,
});

function SeniorsPage() {
  const { user } = useAuth();
  const currentYear = user?.year ?? 1;

  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("All");
  const [year, setYear] = useState<number | "all">("all");
  const [availability, setAvailability] = useState<"all" | "true" | "false">("all");
  const [selectedSenior, setSelectedSenior] = useState<any>(null);

  const queryClient = useQueryClient();

  // Fetch the current user's sent requests to disable duplicate buttons
  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-mentorship-requests"],
    queryFn: () => api.get<any[]>("/mentorship/my-requests"),
    staleTime: 30_000,
  });

  // Set of seniorIds that already have a request (any status: Pending/Accepted/Rejected)
  const requestedSeniorIds = new Set(
    myRequests.map((r: any) => String(r.seniorId?._id ?? r.seniorId)),
  );

  // Years that are strictly higher than the current user's year
  const validSeniorYears = useMemo(() => [2, 3, 4].filter((y) => y > currentYear), [currentYear]);

  const { data: seniors = [], isLoading } = useQuery({
    queryKey: ["seniors", branch, year, availability, q],
    queryFn: () => {
      let url = `/mentorship/seniors?branch=${branch}&search=${q}`;
      if (year !== "all") url += `&year=${year}`;
      if (availability !== "all") url += `&availability=${availability}`;
      return api.get<any[]>(url);
    },
    enabled: validSeniorYears.length > 0, // no query if user is already 4th year
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api.get<any[]>("/mentorship/bookmarks"),
  });

  const bookmarkMutation = useMutation({
    mutationFn: (seniorId: string) => api.post("/mentorship/bookmarks", { seniorId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  const requestMutation = useMutation({
    mutationFn: ({ seniorId, requestMessage }: { seniorId: string; requestMessage: string }) =>
      api.post("/mentorship/request", { seniorId, requestMessage }),
    onSuccess: () => {
      setSelectedSenior(null); // Close modal
      // Refresh so the button becomes "Requested" immediately
      queryClient.invalidateQueries({ queryKey: ["my-mentorship-requests"] });
    },
    onError: (err: any) => {
      console.error("Mentorship request failed:", err?.response?.data?.message ?? err?.message);
    },
  });

  const handleBookmark = (id: string) => {
    bookmarkMutation.mutate(id);
  };

  const handleRequestSubmit = async (message: string) => {
    if (!selectedSenior) return;
    // mutateAsync re-throws on error, which lets the modal's catch block handle it
    await requestMutation.mutateAsync({ seniorId: selectedSenior._id, requestMessage: message });
  };

  const bookmarkedIds = new Set(bookmarks.map((b: any) => b._id || b));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-1">Find your mentor</h1>
        <p className="text-muted-foreground">Connect with seniors who've been there, done that.</p>
      </div>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by skill or name..."
              className="w-full h-11 pl-10 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
            />
          </div>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
            <option value="All">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
            <option value="all">All Senior Years</option>
            {validSeniorYears.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as any)}
            className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
            <option value="all">Any Availability</option>
            <option value="true">Available for Mentorship</option>
            <option value="false">Currently Unavailable</option>
          </select>
        </div>
      </Card>

      {/* Empty state — no seniors available */}
      {validSeniorYears.length === 0 ? (
        <Card>
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">You've reached the top!</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              As a {currentYear === 4 ? "4th year" : `Year ${currentYear}`} student, there are no
              seniors above you. Consider becoming a mentor yourself!
            </p>
          </div>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading mentors...</div>
      ) : seniors.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No mentors found matching your filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seniors.map((s: any, i: number) => (
            <MentorCard
              key={s._id}
              senior={s}
              index={i}
              isBookmarked={bookmarkedIds.has(s._id)}
              onBookmark={() => handleBookmark(s._id)}
              onConnect={() => setSelectedSenior(s)}
              alreadyRequested={requestedSeniorIds.has(String(s._id))}
            />
          ))}
        </div>
      )}

      <RequestMentorshipModal
        isOpen={!!selectedSenior}
        onClose={() => setSelectedSenior(null)}
        seniorName={selectedSenior?.name || ""}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
}
