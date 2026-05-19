import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, User } from "lucide-react";
import { Card, Badge } from "@/components/ui-kit";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/mentorship-requests")({
  head: () => ({ meta: [{ title: "Mentorship Requests — Campus Connect" }] }),
  component: MentorshipRequestsPage,
});

function MentorshipRequestsPage() {
  const [tab, setTab] = useState<"Pending" | "Accepted" | "Rejected">("Pending");
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["mentorship-requests"],
    queryFn: () => api.get<any[]>("/mentorship/requests"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/mentorship/status/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorship-requests"] });
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update status");
    },
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const filteredRequests = requests.filter((r: any) => r.status === tab);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-1">Mentorship Requests</h1>
        <p className="text-muted-foreground">Manage your incoming mentorship requests.</p>
      </div>

      <div className="inline-flex p-1 rounded-2xl glass">
        {(["Pending", "Accepted", "Rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2 rounded-xl text-sm font-semibold ${tab === t ? "text-primary-foreground" : "text-muted-foreground"}`}
          >
            {tab === t && (
              <motion.div
                layoutId="tab-pill-reqs"
                className="absolute inset-0 gradient-primary rounded-xl shadow-glow"
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted-foreground">
            No {tab.toLowerCase()} requests.
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((req: any, i: number) => (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground shadow-glow shrink-0 overflow-hidden">
                  {req.juniorId?.profileImage ? (
                    <img
                      src={req.juniorId.profileImage}
                      alt={req.juniorId.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{req.juniorId?.name || "Unknown User"}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary">{req.juniorId?.branch}</Badge>
                    <Badge>Year {req.juniorId?.year}</Badge>
                  </div>
                  {req.requestMessage && (
                    <div className="bg-muted p-3 rounded-xl text-sm italic text-muted-foreground border-l-2 border-primary">
                      {req.requestMessage}
                    </div>
                  )}
                </div>
                {tab === "Pending" && (
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <button
                      onClick={() => handleUpdateStatus(req._id, "Rejected")}
                      className="flex-1 md:flex-none h-10 w-10 md:w-auto md:px-4 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-destructive hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" /> <span className="hidden md:inline">Reject</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req._id, "Accepted")}
                      className="flex-1 md:flex-none h-10 w-10 md:w-auto md:px-4 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-1.5 shadow-glow hover:scale-105 transition-transform"
                    >
                      <Check className="h-4 w-4" /> <span className="hidden md:inline">Accept</span>
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
