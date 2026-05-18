import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ArrowLeft, User } from "lucide-react";
import { api, SOCKET_URL } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — Campus Connect" }] }),
  component: ChatPage,
});

/** Stable string coercion — handles ObjectId, string, null */
const sid = (v: any): string => (v == null ? "" : String(v));

function ChatPage() {
  const { user } = useAuth();
  // Use a ref too so closures always have the latest value without re-subscribing
  const currentUserId = user?._id ?? null;
  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  const [selected, setSelected] = useState<any>(null);
  const selectedRef = useRef<any>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const [showList, setShowList] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);
  const queryClient = useQueryClient();

  // ── Stable message handler (uses refs so it never goes stale) ────────────
  const handleReceive = useCallback(
    (msg: any) => {
      const myId = sid(currentUserIdRef.current);
      const theirId = sid(selectedRef.current?._id);
      const msgSender = sid(msg.senderId);
      const msgReceiver = sid(msg.receiverId);

      // Always refresh sidebar so unread counts/last message stay current,
      // even when the message belongs to a different conversation.
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Only add to active message list if it belongs to the open conversation
      const relevant =
        (msgSender === theirId && msgReceiver === myId) ||
        (msgSender === myId && msgReceiver === theirId);

      if (!relevant) return;

      setMessages((prev) => {
        // Already have this exact confirmed message — skip
        if (
          prev.find((m) => sid(m._id) === sid(msg._id) && !sid(m._id).startsWith("optimistic_"))
        ) {
          return prev;
        }
        // Replace an optimistic message with the same text sent by me
        if (msgSender === myId) {
          const withoutOptimistic = prev.filter(
            (m) => !sid(m._id).startsWith("optimistic_") || m.message !== msg.message,
          );
          // If we removed an optimistic entry, the real message takes its place
          if (withoutOptimistic.length < prev.length) {
            return [...withoutOptimistic, msg];
          }
        }
        return [...prev, msg];
      });
    },
    [queryClient],
  ); // queryClient is stable; we read user/selected from refs

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("cc_token") : null;
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[Chat] Socket connected:", newSocket.id);
    });
    newSocket.on("connect_error", (err) => {
      console.error("[Chat] Socket connection error:", err.message);
    });
    newSocket.on("onlineUsers", (users: string[]) => setOnlineUsers(new Set(users)));
    newSocket.on("chatError", (msg: string) => setChatError(msg));

    // Global receiveMessage listener — handles messages arriving when no
    // conversation is open yet (e.g., receiver hasn't clicked on the chat)
    newSocket.on("receiveMessage", handleReceive);

    setSocket(newSocket);
    return () => {
      newSocket.off("receiveMessage", handleReceive);
      newSocket.disconnect();
    };
  }, [handleReceive]);

  // ── Conversations list ────────────────────────────────────────────────────
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<any[]>("/messages/conversations"),
    enabled: !!currentUserId,
    refetchInterval: 20000,
  });

  const filteredConversations = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    if (!searchQ.trim()) return list;
    return list.filter((c: any) => c.name?.toLowerCase().includes(searchQ.toLowerCase()));
  }, [conversations, searchQ]);

  // ── When a conversation is selected ──────────────────────────────────────
  useEffect(() => {
    if (!selected || !socket) return;

    setChatError(null);
    setMessages([]);
    setIsTyping(false);

    // Join the socket room for this conversation
    socket.emit("joinChat", { otherUserId: selected._id });

    // Fetch full history from REST
    api
      .get<any[]>(`/messages/${selected._id}`)
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => setChatError(err?.response?.data?.message ?? "Failed to load messages"));

    // Typing indicators scoped to this conversation
    const handleTyping = ({ senderId }: any) => {
      if (sid(senderId) === sid(selected._id)) setIsTyping(true);
    };
    const handleStopTyping = ({ senderId }: any) => {
      if (sid(senderId) === sid(selected._id)) setIsTyping(false);
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
    // NOTE: handleReceive is NOT listed here because it's registered globally
    // on the socket (in the socket lifecycle effect) using refs, so it never
    // goes stale and never creates duplicate listeners.
  }, [selected?._id, socket]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || !selected || !socket || !currentUserId) return;

    const text = input.trim();
    const optimistic = {
      _id: `optimistic_${Date.now()}`,
      senderId: currentUserId,
      receiverId: selected._id,
      message: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    socket.emit("sendMessage", { receiverId: selected._id, message: text });
    socket.emit("stopTyping", { receiverId: selected._id });
  };

  const handleTypingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!socket || !selected) return;
    socket.emit("typing", { receiverId: selected._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: selected._id });
    }, 2000);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatLastMsgTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return formatTime(iso);
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      <div className="glass rounded-3xl overflow-hidden h-full flex shadow-card">
        {/* ── SIDEBAR ── */}
        <div
          className={`${selected && !showList ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-96 border-r border-border flex-col`}
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-display font-bold text-xl mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search chats..."
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground animate-pulse">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground space-y-2">
                <p className="font-medium">No conversations yet</p>
                <p className="text-xs">
                  {searchQ
                    ? "No chats match your search."
                    : "Conversations appear once a mentorship is accepted."}
                </p>
              </div>
            ) : (
              filteredConversations.map((c: any) => {
                const isOnline = onlineUsers.has(sid(c._id));
                const isSelected = sid(selected?._id) === sid(c._id);
                return (
                  <button
                    key={c._id}
                    onClick={() => {
                      setSelected(c);
                      setShowList(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${isSelected ? "bg-muted" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center font-semibold text-primary-foreground overflow-hidden">
                        {c.profileImage ? (
                          <img
                            src={c.profileImage}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        {c.lastMessageAt && (
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                            {formatLastMsgTime(c.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          {c.lastMessage ?? "Start a conversation"}
                        </p>
                        {c.unread > 0 && (
                          <span className="shrink-0 h-5 min-w-5 px-1 rounded-full gradient-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── CHAT WINDOW ── */}
        <div className={`${selected && !showList ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
          {selected ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-border flex items-center gap-3">
                <button
                  onClick={() => setShowList(true)}
                  className="md:hidden p-2 rounded-lg hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center font-semibold text-primary-foreground text-sm overflow-hidden">
                  {selected.profileImage ? (
                    <img
                      src={selected.profileImage}
                      alt={selected.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{selected.name}</p>
                  {onlineUsers.has(sid(selected._id)) ? (
                    <p className="text-xs text-success">● Online</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Offline</p>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {chatError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium text-center"
                  >
                    {chatError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {messages.map((m) => {
                  // Single, unambiguous sender check using our sid() helper
                  const isMine = sid(m.senderId) === sid(currentUserId);
                  const isOptimistic = sid(m._id).startsWith("optimistic_");
                  return (
                    <motion.div
                      key={m._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      {/* Avatar for other user only */}
                      {!isMine && (
                        <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs shrink-0 overflow-hidden">
                          {selected.profileImage ? (
                            <img
                              src={selected.profileImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? "gradient-primary text-primary-foreground rounded-br-sm"
                            : "bg-card rounded-bl-sm"
                        } ${isOptimistic ? "opacity-70" : ""}`}
                      >
                        <p className="text-sm leading-relaxed">{m.message}</p>
                        <p
                          className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/70 text-right" : "text-muted-foreground"}`}
                        >
                          {formatTime(m.createdAt)}
                          {isMine && <span className="ml-1">{isOptimistic ? "○" : "✓"}</span>}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs shrink-0 overflow-hidden">
                      {selected.profileImage ? (
                        <img
                          src={selected.profileImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="bg-card rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full bg-muted-foreground typing-dot"
                          style={{ animationDelay: `${delay}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border flex items-center gap-2">
                <input
                  value={input}
                  onChange={handleTypingInput}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 h-11 px-4 rounded-full bg-muted outline-none text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-11 w-11 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-glow hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Send className="h-8 w-8 opacity-50" />
              </div>
              <div className="text-center">
                <p className="font-medium">Select a conversation</p>
                <p className="text-xs mt-1 max-w-xs">
                  Pick a mentorship contact from the left to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
