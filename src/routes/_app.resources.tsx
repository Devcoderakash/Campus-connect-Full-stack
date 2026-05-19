import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, Upload, Bookmark, X, FileText } from "lucide-react";
import { Card, SectionHeader, Badge } from "@/components/ui-kit";
import { branches, semesters } from "@/lib/constants";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

const years = [1, 2, 3, 4];
const units = ["All", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"];
const types = ["All", "Notes", "PYQ", "Assignment", "Syllabus", "Study Material", "Important PDF"];

export const Route = createFileRoute("/_app/resources")({
  head: () => ({ meta: [{ title: "Study Resources — Campus Connect" }] }),
  component: Resources,
});

function Resources() {
  const { user } = useAuth();
  const [branch, setBranch] = useState("All");
  const [sem, setSem] = useState<number | "all">("all");
  const [year, setYear] = useState<number | "all">("all");
  const [unit, setUnit] = useState("All");
  const [type, setType] = useState("All");
  const [q, setQ] = useState("");
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload Form State
  const [upTitle, setUpTitle] = useState("");
  const [upBranch, setUpBranch] = useState(branches[0]);
  const [upSem, setUpSem] = useState<number>(semesters[0]);
  const [upYear, setUpYear] = useState<number>(years[0]);
  const [upUnit, setUpUnit] = useState<string>("All");
  const [upType, setUpType] = useState<string>("Notes");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["resources", q, branch, sem, year, unit, type],
    queryFn: () => {
      let url = `/resources?limit=50`;
      if (type !== "All") url += `&type=${type}`;
      if (branch !== "All") url += `&branch=${branch}`;
      if (sem !== "all") url += `&semester=${sem}`;
      if (year !== "all") url += `&year=${year}`;
      if (unit !== "All") url += `&unit=${unit}`;
      if (q) url += `&keyword=${q}`;
      return api.get<any>(url);
    },
  });

  const rawData = apiData?.resources || [];

  const data = Array.isArray(rawData) ? rawData : [];

  const handleUpload = async () => {
    if (!file || !upTitle) return alert("Title and File are required");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", upTitle);
      formData.append("subject", upTitle); // Subject needed by backend
      formData.append("branch", upBranch);
      formData.append("semester", String(upSem));
      formData.append("year", String(upYear));
      formData.append("unit", upUnit);
      formData.append("resourceType", upType);
      formData.append("file", file);

      await api.postForm("/resources", formData);
      alert("Uploaded Successfully");
      setUploadOpen(false);
      setUpTitle("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleBm = (id: string) => {
    setBookmarked((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Study resources</h1>
          <p className="text-muted-foreground">
            Notes, PYQs, assignments and study material from across campus.
          </p>
        </div>
        {(user?.role === "Admin" || (user?.year && user.year >= 2)) && (
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex h-11 px-5 items-center gap-2 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
          >
            <Upload className="h-4 w-4" /> Upload
          </button>
        )}
      </div>

      {/* filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subject..."
              className="w-full h-11 pl-10 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
            />
          </div>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
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
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <select
            value={sem}
            onChange={(e) => setSem(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
            <option value="all">All semesters</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                Sem {s}
              </option>
            ))}
          </select>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="col-span-2 md:col-span-6 lg:col-span-2 h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "All" ? "All Resource Types" : t}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* grid */}
      {isLoading ? (
        <Card>
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Loading resources...
          </div>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted-foreground">
            No resources match your filters.
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((it: any, i: number) => (
            <motion.div
              key={it._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group hover:shadow-glow transition-shadow h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleBm(it._id)}
                    className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
                  >
                    <Bookmark
                      className={`h-4 w-4 transition-all ${bookmarked.has(it._id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                    />
                  </motion.button>
                </div>
                <h3 className="font-semibold text-lg mb-1">{it.title ?? it.subject}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {it.uploadedBy?.name
                    ? `by ${it.uploadedBy.name}`
                    : `Year ${it.year} · ${it.downloads ? it.downloads.toLocaleString() : 0} downloads`}
                </p>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge variant="primary">{it.branch}</Badge>
                  <Badge>
                    Y{it.year}S{it.semester}
                  </Badge>
                  {it.unit !== "All" && <Badge variant="default">{it.unit}</Badge>}
                  <Badge variant="success">{it.resourceType}</Badge>
                </div>
                <a
                  href={it.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto h-10 rounded-xl bg-muted hover:gradient-primary hover:text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="h-4 w-4" /> Download / View
                </a>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {uploadOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUploadOpen(false)}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="glass rounded-3xl p-6 w-full max-w-md pointer-events-auto bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-xl">Upload resource</h3>
                  <button
                    onClick={() => setUploadOpen(false)}
                    className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    value={upTitle}
                    onChange={(e) => setUpTitle(e.target.value)}
                    placeholder="Title / Subject"
                    className="w-full h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={upBranch}
                      onChange={(e) => setUpBranch(e.target.value)}
                      className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                    >
                      {branches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                    <select
                      value={upYear}
                      onChange={(e) => setUpYear(Number(e.target.value))}
                      className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          Year {y}
                        </option>
                      ))}
                    </select>
                    <select
                      value={upSem}
                      onChange={(e) => setUpSem(Number(e.target.value))}
                      className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                    >
                      {semesters.map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                    <select
                      value={upUnit}
                      onChange={(e) => setUpUnit(e.target.value)}
                      className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <select
                      value={upType}
                      onChange={(e) => setUpType(e.target.value as any)}
                      className="h-11 px-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary"
                    >
                      {types
                        .filter((t) => t !== "All")
                        .map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                    </select>
                  </div>
                  <label className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer block">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-semibold">
                      {file ? file.name : "Click to select file"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
                  </label>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
