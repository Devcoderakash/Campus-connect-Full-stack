import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, Upload, FileText, Users as UsersIcon, MoreHorizontal } from "lucide-react";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — Campus Connect" }] }),
  component: AdminPage,
});

function AdminPage() {
  const chartData = [
    { day: "Mon", users: 420 },
    { day: "Tue", users: 580 },
    { day: "Wed", users: 690 },
    { day: "Thu", users: 540 },
    { day: "Fri", users: 780 },
    { day: "Sat", users: 320 },
    { day: "Sun", users: 410 },
  ];
  const max = Math.max(...chartData.map((d) => d.users));

  const stats = [
    { label: "Active Students", value: "1,248", change: "+12%" },
    { label: "Resources", value: "310", change: "+8%" },
    { label: "Senior Connects", value: "89", change: "+24%" },
    { label: "Daily Visits", value: "520", change: "+5%" },
  ];

  const adminUsers: any[] = []; // Real implementation would fetch users

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-1">Admin dashboard</h1>
        <p className="text-muted-foreground">Manage your campus, your way.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                {s.label}
              </p>
              <p className="text-3xl font-bold mb-1">{s.value}</p>
              <p className="text-xs text-success font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {s.change}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionHeader title="Weekly activity" />
          <div className="flex items-end justify-between gap-2 h-48 mt-4">
            {chartData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.users / max) * 100}%` }}
                  transition={{ delay: i * 0.06, type: "spring" }}
                  className="w-full gradient-primary rounded-t-xl shadow-glow min-h-2"
                />
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Quick actions" />
          <div className="space-y-2">
            {[
              { icon: Upload, label: "Post university update" },
              { icon: FileText, label: "Manage resources" },
              { icon: UsersIcon, label: "Invite users" },
            ].map((a) => (
              <button
                key={a.label}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
                  <a.icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Users" />
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-2 py-3 font-semibold">Name</th>
                <th className="px-2 py-3 font-semibold hidden md:table-cell">Email</th>
                <th className="px-2 py-3 font-semibold">Role</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-2 py-3 font-semibold hidden lg:table-cell">Joined</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                adminUsers.map((u: any) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-2 py-3 font-semibold">{u.name}</td>
                    <td className="px-2 py-3 text-muted-foreground hidden md:table-cell">
                      {u.email}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={u.role === "Senior" ? "primary" : "default"}>{u.role}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={u.status === "Active" ? "success" : "warning"}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground hidden lg:table-cell">
                      {u.joined}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button className="p-1.5 hover:bg-muted rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
