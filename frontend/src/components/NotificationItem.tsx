import { MessageCircle, UserPlus, BookOpen, ShieldAlert, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: any;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isUnread = !notification.isRead;

  const getIcon = () => {
    switch (notification.type) {
      case "message":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "mentorship":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      case "resource":
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case "admin":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div
      className={`relative p-3 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer group ${isUnread ? "bg-muted/20" : ""}`}
      onClick={() => isUnread && onRead(notification._id)}
    >
      <div
        className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isUnread ? "bg-background shadow-glow" : "bg-muted"}`}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p
          className={`text-sm mb-0.5 ${isUnread ? "font-semibold text-foreground" : "text-foreground/80"}`}
        >
          {notification.title}
        </p>
        <p
          className={`text-xs truncate ${isUnread ? "text-foreground/90" : "text-muted-foreground"}`}
        >
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {isUnread && <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification._id);
        }}
        className="absolute bottom-3 right-3 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
