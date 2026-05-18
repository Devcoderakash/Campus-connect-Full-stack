import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";

export function RequestMentorshipModal({
  isOpen,
  onClose,
  onSubmit,
  seniorName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (msg: string) => Promise<void>;
  seniorName: string;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setError("");
    setLoading(true);
    try {
      await onSubmit(message.trim());
      setMessage("");
      // onClose is called by the parent's onSuccess handler
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to send request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <h3 className="font-display font-bold text-xl">Request Mentorship</h3>
                <button
                  onClick={() => {
                    onClose();
                    setError("");
                    setMessage("");
                  }}
                  className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send a mentorship request to <strong>{seniorName}</strong>. You can optionally
                  include a message.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, I'd love to get your guidance on..."
                  className="w-full h-32 p-4 rounded-xl bg-muted outline-none border-2 border-transparent focus:border-primary resize-none text-sm"
                />
                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
