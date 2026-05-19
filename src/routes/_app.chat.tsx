import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageSquareDashed, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — Campus Connect" }] }),
  component: ChatMaintenancePage,
});

function ChatMaintenancePage() {
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="glass rounded-3xl overflow-hidden h-full flex flex-col items-center justify-center shadow-card relative">
        {/* Soft Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-60"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center p-8 max-w-2xl mx-auto"
        >
          {/* Icon Composition */}
          <div className="relative mb-8">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full gradient-primary shadow-glow flex items-center justify-center text-primary-foreground relative z-10 mx-auto">
              <MessageSquareDashed className="h-10 w-10 md:h-12 md:w-12" />
            </div>
            {/* Ambient Sparkles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 text-primary"
            >
              <Sparkles className="h-6 w-6 md:h-8 md:w-8" />
            </motion.div>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-extrabold mb-5 tracking-tight text-foreground">
            Messaging Feature <br className="hidden md:block" /> Coming Soon 🚀
          </h1>

          <p className="text-base md:text-lg text-muted-foreground font-medium mb-4 max-w-lg mx-auto leading-relaxed">
            We’re currently upgrading the Campus Connect messaging experience to make it faster, smarter, and more reliable for everyone.
          </p>

          <p className="text-xs md:text-sm text-muted-foreground/80 mb-10 max-w-md mx-auto">
            Chat and real-time mentorship conversations will be available in an upcoming update.
          </p>

          <button 
            disabled 
            className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-full bg-muted/60 text-muted-foreground font-semibold shadow-inner cursor-not-allowed border border-border/50"
          >
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            Coming in Next Update
          </button>
        </motion.div>
      </div>
    </div>
  );
}
