import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Bell, Check, Clock, MessageCircle, X } from "lucide-react";
import { useState } from "react";

export default function NotificationsCenter() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } =
    trpc.registry.notifications.mine.useQuery(
      {
        limit: 50,
        offset: 0,
        unreadOnly: filter === "unread",
      },
      {
        enabled: !!user,
      }
    );

  const utils = trpc.useUtils();

  const markAsReadMutation = trpc.registry.notifications.markRead.useMutation({
    onSuccess: () => {
      void utils.registry.notifications.mine.invalidate();
    },
  });

  const markAllAsReadMutation =
    trpc.registry.notifications.markAllRead.useMutation({
      onSuccess: () => {
        void utils.registry.notifications.mine.invalidate();
      },
    });

  if (!user) {
    return <div>Unauthorized</div>;
  }

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Badge variant="destructive" className="hover:bg-destructive/20">
              {unreadCount} não lidas
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Bell
                  className={cn(
                    "h-4 w-4",
                    unreadCount > 0 ? "text-red-500" : "text-muted-foreground"
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>
                Todas as notificações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("unread")}>
                Apenas não lidas
              </DropdownMenuItem>
              <Separator className="my-1" />
              <DropdownMenuItem onClick={() => markAllAsReadMutation.mutate()}>
                Marcar todas como lidas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading && (
        <div className="h-96 flex items-center justify-center">
          <div className="space-y-3">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-4" />
          </div>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          Nenhuma notificação encontrada.
        </p>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map((notification: any) => (
            <Card
              key={notification.id}
              className={cn(
                "border",
                !notification.isRead && "border-blue-500"
              )}
            >
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(notification.notificationType)}
                  <h2 className="card-title text-sm font-semibold">
                    {notification.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "pt-BR",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                  {!notification.isRead && (
                    <Button variant="ghost" size="icon">
                      <Bell className="h-3 w-3 text-blue-500" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{notification.body}</p>
                {notification.actionUrl && (
                  <div className="mt-2">
                    <a
                      href={notification.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Ver detalhes →
                    </a>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      markAsReadMutation.mutate({
                        id: notification.id,
                      })
                    }
                  >
                    <Check className="h-3 w-3 mr-2" /> Marcar como lida
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // Delete notification (if implemented)
                  }}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "absence_alert":
      return <MessageCircle className="h-4 w-4 text-red-500" />;
    case "grade_published":
      return <Check className="h-4 w-4 text-green-500" />;
    case "event_reminder":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "general":
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}
