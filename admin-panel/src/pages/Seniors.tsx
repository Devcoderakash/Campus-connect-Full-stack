import { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  Users,
  Search,
  Ban,
  CheckCircle,
  MessageSquare,
  UserCheck,
  UserX,
  UserMinus,
  Activity,
} from "lucide-react";
import { cn } from "../lib/utils";

export function Seniors() {
  const [seniors, setSeniors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSenior, setSelectedSenior] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seniorsRes, statsRes] = await Promise.all([
        api.get<any>(`/admin/seniors?search=${search}`),
        api.get<any>("/admin/senior-analytics"),
      ]);
      setSeniors(seniorsRes.data?.seniors || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch senior data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const toggleBlock = async (id: string) => {
    try {
      await api.patch(`/admin/senior/${id}/block`);
      fetchData(); // Refresh to get updated stats and list
    } catch (error) {
      console.error("Failed to toggle block status:", error);
      alert("Failed to block/unblock senior");
    }
  };

  const toggleMentorStatus = async (id: string) => {
    try {
      await api.patch(`/admin/senior/${id}/mentor-status`);
      fetchData();
    } catch (error) {
      console.error("Failed to toggle mentor status:", error);
      alert("Failed to change mentor status");
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading senior management...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Seniors",
            value: stats?.totalSeniors || 0,
            icon: Users,
            color: "text-blue-500",
          },
          {
            label: "Active Mentors",
            value: stats?.activeMentors || 0,
            icon: UserCheck,
            color: "text-green-500",
          },
          {
            label: "Inactive Seniors",
            value: stats?.inactiveSeniors || 0,
            icon: UserMinus,
            color: "text-orange-500",
          },
          {
            label: "Active Chats",
            value: stats?.activeChats || 0,
            icon: MessageSquare,
            color: "text-purple-500",
          },
          {
            label: "Pending Requests",
            value: stats?.pendingRequests || 0,
            icon: Activity,
            color: "text-yellow-500",
          },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-display font-bold">Senior Profiles</h2>
              <p className="text-sm text-muted-foreground">
                Monitor and manage all senior students.
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search seniors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary text-sm transition-colors"
              />
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Senior</th>
                  <th className="pb-3 font-medium">Details</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {seniors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No seniors found matching your search.
                    </td>
                  </tr>
                ) : (
                  seniors.map((senior) => (
                    <tr
                      key={senior._id}
                      className={cn(
                        "transition-colors hover:bg-muted/30 cursor-pointer",
                        selectedSenior?._id === senior._id && "bg-muted/50",
                      )}
                      onClick={() => setSelectedSenior(senior)}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                            {senior.profileImage ? (
                              <img
                                src={senior.profileImage}
                                alt={senior.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              senior.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{senior.name}</p>
                            <p className="text-xs text-muted-foreground">{senior.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm">{senior.branch}</p>
                        <p className="text-xs text-muted-foreground">Year {senior.year}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-1">
                          {senior.isBlocked ? (
                            <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium px-2 py-0.5 rounded-md bg-destructive/10 w-max">
                              <Ban className="h-3 w-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-success font-medium px-2 py-0.5 rounded-md bg-success/10 w-max">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          )}

                          {senior.isMentorAvailable ? (
                            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium px-2 py-0.5 rounded-md bg-primary/10 w-max">
                              <UserCheck className="h-3 w-3" /> Mentoring On
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted w-max">
                              <UserX className="h-3 w-3" /> Mentoring Off
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleMentorStatus(senior._id)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors"
                          >
                            Toggle Mentor
                          </button>
                          <button
                            onClick={() => toggleBlock(senior._id)}
                            className={cn(
                              "text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
                              senior.isBlocked
                                ? "bg-success/10 text-success hover:bg-success hover:text-white"
                                : "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white",
                            )}
                          >
                            {senior.isBlocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Senior Analytics Sidebar */}
        <div className="glass rounded-3xl p-6 flex flex-col gap-6">
          <h2 className="text-xl font-display font-bold">Detailed Analytics</h2>

          {selectedSenior ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl mb-3 overflow-hidden">
                  {selectedSenior.profileImage ? (
                    <img
                      src={selectedSenior.profileImage}
                      alt={selectedSenior.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    selectedSenior.name.charAt(0)
                  )}
                </div>
                <h3 className="font-bold text-lg">{selectedSenior.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedSenior.email}</p>

                <div className="flex gap-2 mt-3 flex-wrap justify-center">
                  {selectedSenior.skills?.slice(0, 3).map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-muted rounded-md text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                  {selectedSenior.skills?.length > 3 && (
                    <span className="px-2 py-1 bg-muted rounded-md text-xs font-medium">
                      +{selectedSenior.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3">Mentorship Activity</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Requests Received</span>
                    <span className="font-bold">
                      {selectedSenior.mentorStats?.totalRequests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Requests Accepted</span>
                    <span className="font-bold text-success">
                      {selectedSenior.mentorStats?.acceptedRequests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Requests Rejected</span>
                    <span className="font-bold text-destructive">
                      {selectedSenior.mentorStats?.rejectedRequests || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Active Chats</span>
                    <span className="font-bold text-primary">
                      {selectedSenior.mentorStats?.activeChats || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Resources Contributed</span>
                    <span className="font-bold">
                      {selectedSenior.mentorStats?.contributionCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3">Engagement</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Last Active</span>
                    <span className="font-medium">
                      {new Date(
                        selectedSenior.lastActive || selectedSenior.updatedAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Joined On</span>
                    <span className="font-medium">
                      {new Date(selectedSenior.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-50 py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p>Select a senior from the list to view their detailed activity and stats.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
