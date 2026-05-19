import { useState, useEffect } from "react";
import { api } from "../lib/api";
import {
  ShieldAlert,
  Check,
  X,
  Globe,
  User,
  ExternalLink,
  FileText,
  AlertCircle,
  Download,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PendingSenior {
  _id: string;
  name: string;
  email: string;
  branch: string;
  year: number;
  bio?: string;
  skills: string[];
  profileImage?: string;
  collegeIdUrl?: string;
  collegeIdDriveFileId?: string;
  collegeIdPreviewUrl?: string;
  collegeIdDownloadUrl?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  createdAt: string;
  verificationSubmittedAt?: string;
}

// Custom Premium Google Drive & General File Preview Component with loading and fallback
export function VerificationDocumentPreview({ url }: { url: string; downloadUrl?: string }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const isPdf = url.toLowerCase().includes(".pdf") || url.includes("application/pdf");
  const isGoogleDrive = url.includes("drive.google.com");

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  if (!url) {
    return (
      <div className="p-5 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive text-xs font-medium text-center">
        No ID Card Document Provided.
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-5 rounded-2xl border border-border bg-muted/20 flex flex-col items-center justify-center gap-3 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Document Preview Unavailable</span>
        <p className="text-[10px] text-muted-foreground max-w-[200px]">
          The document could not be loaded directly. You can still open it in a new tab.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry Load
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center gap-1 shadow-glow hover:scale-105 transition-all"
          >
            Open Document <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border h-44 bg-muted/30 flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {isGoogleDrive ? (
        // Google Drive file: render embedded preview iframe (works for both images and PDFs!)
        <iframe
          key={`${url}-${retryCount}`}
          src={url}
          className="w-full h-full border-none"
          allow="autoplay"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      ) : isPdf ? (
        // Standard PDF: render secure PDF viewer
        <iframe
          key={`${url}-${retryCount}`}
          src={url}
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      ) : (
        // Standard Image: render image preview
        <img
          key={`${url}-${retryCount}`}
          src={url}
          alt="ID Preview"
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}

      {/* Hover action overlay to view full screen */}
      {!isLoading && !hasError && (
        <div className="absolute inset-0 bg-background/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-1.5 shadow-glow hover:scale-105 transition-transform text-xs"
          >
            <ExternalLink className="h-4 w-4" /> Open Full Screen
          </a>
        </div>
      )}
    </div>
  );
}

export function VerificationRequests() {
  const [requests, setRequests] = useState<PendingSenior[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewIdUrl, setPreviewIdUrl] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingUser, setRejectingUser] = useState<PendingSenior | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  // Fetch pending verification requests
  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<PendingSenior[]>("/admin/pending-seniors");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load verification requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Approve a request
  const handleApprove = async (id: string) => {
    setError("");
    setSubmittingAction(id);
    try {
      await api.put(`/admin/seniors/${id}/verify`, { status: "approved" });
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to approve senior request.");
    } finally {
      setSubmittingAction(null);
    }
  };

  // Reject a request
  const handleRejectSubmit = async () => {
    if (!rejectingUser) return;
    const id = rejectingUser._id;
    setError("");
    setSubmittingAction(id);
    try {
      await api.put(`/admin/seniors/${id}/verify`, {
        status: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setRejectingUser(null);
      setRejectReason("");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to reject senior request.");
    } finally {
      setSubmittingAction(null);
    }
  };



  return (
    <div className="space-y-6">
      {/* Overview stats header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass rounded-2xl border border-border">
        <div>
          <h2 className="text-xl font-bold font-display">Senior Verification Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage student requests to unlock senior mentor profiles and capabilities.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-semibold text-sm rounded-xl">
          <ShieldAlert className="h-5 w-5" />
          <span>{requests.length} Requests Pending</span>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests content section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading pending requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center glass rounded-3xl border border-border flex flex-col items-center justify-center gap-3">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success">
            <Check className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">All caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There are no pending senior verification requests at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-3xl border border-border p-6 md:p-8 flex flex-col lg:flex-row gap-6 relative"
              >
                {/* Profile detail column */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground overflow-hidden font-bold shrink-0">
                      {req.profileImage ? (
                        <img
                          src={req.profileImage}
                          alt={req.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold font-display text-lg truncate flex items-center gap-2">
                        {req.name}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          Year {req.year}
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted/40 rounded-xl">
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Department
                      </span>
                      <span className="font-semibold mt-0.5 block truncate">{req.branch}</span>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl">
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                        Date Requested
                      </span>
                      <span className="font-semibold mt-0.5 block truncate">
                        {new Date(req.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {req.bio && (
                    <div className="text-sm p-4 bg-muted/20 rounded-xl leading-relaxed">
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold mb-1">
                        Bio
                      </span>
                      {req.bio}
                    </div>
                  )}

                  {req.skills && req.skills.length > 0 && (
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-semibold mb-2">
                        Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {req.skills.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    {req.linkedin && (
                      <a
                        href={req.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="LinkedIn"
                      >
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                    )}
                    {req.github && (
                      <a
                        href={req.github}
                        target="_blank"
                        rel="noreferrer"
                        className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="GitHub"
                      >
                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {req.portfolio && (
                      <a
                        href={req.portfolio}
                        target="_blank"
                        rel="noreferrer"
                        className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="Portfolio"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* College ID preview & Action column */}
                <div className="w-full lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-6 gap-6">
                  <div className="space-y-3">
                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                      College ID Card Document
                    </span>
                    <VerificationDocumentPreview 
                      url={req.collegeIdPreviewUrl || req.collegeIdUrl || ""} 
                      downloadUrl={req.collegeIdDownloadUrl} 
                    />
                  </div>

                  {/* Approve/Reject Controls & Download */}
                  <div className="space-y-3">
                    {req.collegeIdDownloadUrl && (
                      <a
                        href={req.collegeIdDownloadUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="w-full h-11 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 text-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        <Download className="h-4 w-4" /> Download ID Document
                      </a>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={submittingAction !== null}
                        onClick={() => setRejectingUser(req)}
                        className="flex-1 h-11 rounded-xl border border-destructive/20 hover:bg-destructive/10 text-destructive text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                      <button
                        type="button"
                        disabled={submittingAction !== null}
                        onClick={() => handleApprove(req._id)}
                        className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 shadow-glow hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                      >
                        {submittingAction === req._id ? (
                          <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Approve
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* College ID Image Preview Modal overlay */}
      <AnimatePresence>
        {previewIdUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 z-50"
            onClick={() => setPreviewIdUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-border shadow-card bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewIdUrl(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background border border-border hover:bg-muted flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={previewIdUrl}
                alt="Enlarged College ID"
                className="max-w-full max-h-[80vh] object-contain p-2"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject confirmation/reason Modal */}
      <AnimatePresence>
        {rejectingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 z-50"
            onClick={() => setRejectingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative max-w-md w-full glass rounded-3xl border border-border shadow-card p-6 md:p-8 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg font-display">Reject Senior Request</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Provide a reason for rejecting {rejectingUser.name}'s application. This will be shown to the user on their dashboard.
                  </p>
                </div>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g. The uploaded image is blurry, please re-upload a clear picture of your College ID Card."
                rows={4}
                className="w-full p-4 rounded-xl bg-muted border border-border focus:border-destructive outline-none text-sm transition-colors resize-none"
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="flex-1 h-11 rounded-xl border border-border hover:bg-muted text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="flex-1 h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold flex items-center justify-center shadow-glow transition-all"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default VerificationRequests;
