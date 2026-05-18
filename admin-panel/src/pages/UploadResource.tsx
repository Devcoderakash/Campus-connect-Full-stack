import { useState } from "react";
import { UploadCloud, File, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

const branches = ["All", "CSE", "IT", "ECE", "ME", "CE"];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const years = [1, 2, 3, 4];
const units = ["All", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5"];
const types = ["Notes", "PYQ", "Assignment", "Syllabus", "Study Material", "Important PDF"];

export function UploadResource() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    branch: "All",
    year: 1,
    semester: 1,
    unit: "All",
    resourceType: "Notes",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, String(val));
      });
      data.append("file", file);

      await api.post("/resources", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setFile(null);
      setFormData({
        title: "",
        description: "",
        subject: "",
        branch: "All",
        year: 1,
        semester: 1,
        unit: "All",
        resourceType: "Notes",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to upload resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass rounded-2xl p-8 shadow-card">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">Upload Resource</h2>
            <p className="text-muted-foreground text-sm">
              Instantly sync materials to the student app
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 text-success text-sm font-medium flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Resource successfully uploaded and synced!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors"
                placeholder="e.g. Data Structures Notes"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors"
                placeholder="e.g. CS201"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Branch
              </label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors appearance-none"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors appearance-none"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors appearance-none"
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors appearance-none"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resource Type
              </label>
              <div className="flex flex-wrap gap-4">
                {types.map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      checked={formData.resourceType === t}
                      onChange={() => setFormData({ ...formData, resourceType: t })}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none transition-colors resize-none h-24"
                placeholder="Optional description..."
              />
            </div>

            <div className="space-y-2 lg:col-span-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                File
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-muted/50 transition-colors hover:bg-muted relative">
                <input
                  type="file"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <>
                    <File className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm font-medium text-primary">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click or drag file to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, ZIP up to 50MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Uploading to Google Drive..." : "Upload Resource"}
          </button>
        </form>
      </div>
    </div>
  );
}
