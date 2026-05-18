import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Trash2, ExternalLink, Search, FileText } from "lucide-react";

interface Resource {
  _id: string;
  title: string;
  subject: string;
  branch: string;
  semester: number;
  year: number;
  unit: string;
  resourceType: string;
  fileUrl: string;
  createdAt: string;
  uploadedBy: { name: string };
}

export function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSem, setFilterSem] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterUnit, setFilterUnit] = useState("All");

  const fetchResources = async () => {
    try {
      const { data } = await api.get("/resources?limit=1000"); // Fetch all for admin
      setResources(data.resources);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this resource? This will remove it from the database and Google Drive.",
      )
    )
      return;
    try {
      await api.delete(`/resources/${id}`);
      setResources(resources.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete resource.");
    }
  };

  const filtered = resources.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase());
    const matchBranch = filterBranch === "All" || r.branch === filterBranch;
    const matchYear = filterYear === "All" || r.year === Number(filterYear);
    const matchSem = filterSem === "All" || r.semester === Number(filterSem);
    const matchType = filterType === "All" || r.resourceType === filterType;
    const matchUnit = filterUnit === "All" || r.unit === filterUnit;

    return matchSearch && matchBranch && matchYear && matchSem && matchType && matchUnit;
  });

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-2xl shadow-card space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl">Manage Resources</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} resources found</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border-none outline-none text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-border">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border-none outline-none text-sm"
          >
            <option value="All">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border-none outline-none text-sm"
          >
            <option value="All">All Years</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <select
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border-none outline-none text-sm"
          >
            <option value="All">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border-none outline-none text-sm"
          >
            <option value="All">All Units</option>
            {["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"].map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 px-3 rounded-lg bg-muted border-none outline-none text-sm"
          >
            <option value="All">All Types</option>
            {["Notes", "PYQ", "Assignment", "Syllabus", "Study Material", "Important PDF"].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Title / Subject</th>
                <th className="px-6 py-4 font-semibold">Details</th>
                <th className="px-6 py-4 font-semibold">Uploaded By</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading resources...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No resources found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.subject} {r.unit !== "All" && `• ${r.unit}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium mr-2 whitespace-nowrap">
                        {r.resourceType}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {r.branch} • Y{r.year}S{r.semester}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{r.uploadedBy?.name || "Unknown"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="View File"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          title="Delete Resource"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
