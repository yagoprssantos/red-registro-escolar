import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: number | string;
  isRead?: boolean;
  notificationType?: string | null;
  title?: string | null;
  body?: string | null;
  createdAt?: string | Date | null;
};

const NOTIFICATION_ICONS: Record<string, string> = {
  absence_alert: "🔴",
  grade_published: "📘",
  comment_received: "💬",
  communication: "📢",
  event_reminder: "📅",
  justification_pending: "📋",
  justification_result: "✅",
  general: "🔔",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const { data: notifications, refetch } =
    trpc.registry.notifications.mine.useQuery(
      { unreadOnly: false, limit: 20 },
      { refetchInterval: 30000 }
    );

  const items = (notifications ?? []) as unknown as NotificationItem[];

  const unreadCount = items.filter(n => !n.isRead).length;

  const markRead = trpc.registry.notifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllRead = trpc.registry.notifications.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative">
      <button
        ref={bellRef}
        className="relative flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`${unreadCount} notificações não lidas`}
        onClick={() => setOpen(!open)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-red-brand text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notificações</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="size-3" />
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-muted-foreground">
                <Bell className="size-8 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            )}

            {items.map(n => {
              const isUnread = !n.isRead;
              const icon =
                NOTIFICATION_ICONS[String(n.notificationType ?? "general")] ??
                "🔔";

              const createdAt = n.createdAt
                ? new Date(String(n.createdAt)).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              const bodyText = typeof n.body === "string" ? n.body.trim() : "";

              return (
                <div
                  key={String(n.id)}
                  className={`flex gap-3 border-b px-4 py-3 transition-colors last:border-b-0 ${
                    isUnread
                      ? "bg-red-50/30 dark:bg-red-950/10"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex-shrink-0 pt-0.5 text-base">{icon}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-snug ${
                          isUnread
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {String(n.title ?? "")}
                      </p>

                      {isUnread && (
                        <button
                          onClick={() => markRead.mutate({ id: Number(n.id) })}
                          className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Marcar como lida"
                        >
                          <Check className="size-3" />
                        </button>
                      )}
                    </div>

                    {bodyText && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {bodyText}
                      </p>
                    )}

                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {createdAt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
