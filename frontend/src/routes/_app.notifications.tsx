import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, MessageCircle, Calendar, Settings, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui-kit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, UserPlus, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Campus Connect" }] }),
  component: NotificationsPage,
});

const iconMap = {
  resource: BookOpen,
  message: MessageCircle,
  mentorship: UserPlus,
  admin: ShieldAlert,
};

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any[]>("/notifications"),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground">Stay in the loop.</p>
        </div>
        <button
          onClick={() => readAllMutation.mutate()}
          className="inline-flex items-center gap-2 text-sm font-semibold gradient-text"
        >
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No notifications found.</div>
        ) : (
          notifications.map((n: any, i: number) => {
            const Icon = iconMap[n.type as keyof typeof iconMap] || Bell;
            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`flex items-center gap-4 hover:shadow-glow transition-shadow ${!n.isRead ? "border-l-4 border-l-primary" : ""}`}
                >
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${!n.isRead ? "gradient-primary shadow-glow" : "bg-muted"}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${!n.isRead ? "text-primary-foreground" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${!n.isRead ? "font-semibold" : ""} truncate`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.message} ·{" "}
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
