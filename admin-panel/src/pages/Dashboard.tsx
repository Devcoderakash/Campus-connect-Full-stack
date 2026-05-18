import { useState, useEffect } from "react";
import { BookOpen, FileText, Bookmark, FileStack, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";

export function Dashboard() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get("/resources?limit=100");
        setResources(data.resources || []);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalNotes = resources.filter((r) => r.resourceType === "Notes").length;
  const totalPYQs = resources.filter((r) => r.resourceType === "PYQ").length;
  const totalPDFs = resources.filter((r) =>
    ["Study Material", "Important PDF", "Syllabus"].includes(r.resourceType),
  ).length;

  const stats = [
    { label: "Total Notes", value: totalNotes, icon: FileText, trend: "+12%" },
    { label: "Total PYQs", value: totalPYQs, icon: Bookmark, trend: "+8%" },
    { label: "Total PDFs", value: totalPDFs, icon: FileStack, trend: "+15%" },
    { label: "Total Resources", value: resources.length, icon: BookOpen, trend: "+23%" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="glass rounded-2xl p-6 shadow-card hover:-translate-y-1 transition-transform"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-display font-bold mt-2">
                  {loading ? "-" : stat.value}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-success">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              {stat.trend} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Recent Upload Activity</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading activity...</p>
            ) : resources.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity found.</p>
            ) : (
              resources.slice(0, 5).map((r: any) => (
                <div
                  key={r._id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-muted-foreground">
                      {r.uploadedBy?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {r.uploadedBy?.name || "Admin"} uploaded a new {r.resourceType}
                    </p>
                    <p className="text-xs text-muted-foreground font-semibold">
                      {r.title} ({r.subject})
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
