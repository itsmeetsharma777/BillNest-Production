import {
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  FileText,
  Loader2,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

type NotificationType =
  | "invoice_created"
  | "invoice_paid"
  | "warranty_expiring"
  | "warranty_expired"
  | "document_uploaded"
  | "system";

interface Notification {
  _id: string;
  userId: string;
  shopId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data?: {
    notifications?: Notification[];
    unreadCount?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  message?: string;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "invoice_created":
      return Receipt;

    case "invoice_paid":
      return Wallet;

    case "warranty_expiring":
      return ShieldAlert;

    case "warranty_expired":
      return ShieldCheck;

    case "document_uploaded":
      return FileText;

    case "system":
    default:
      return Bell;
  }
}

function getNotificationIconContainer(type: NotificationType) {
  switch (type) {
    case "invoice_created":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "invoice_paid":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "warranty_expiring":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    case "warranty_expired":
      return "bg-red-500/10 text-red-600 dark:text-red-400";

    case "document_uploaded":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400";

    case "system":
    default:
      return "bg-primary/10 text-primary";
  }
}

function getNotificationTypeLabel(type: NotificationType) {
  switch (type) {
    case "invoice_created":
      return "Invoice";

    case "invoice_paid":
      return "Payment";

    case "warranty_expiring":
      return "Warranty";

    case "warranty_expired":
      return "Warranty";

    case "document_uploaded":
      return "Document";

    case "system":
    default:
      return "System";
  }
}

export default function CustomerNotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/customer/notifications?page=1&limit=20`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as NotificationsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to load your notifications.",
        );
      }

      setNotifications(
        result.data?.notifications ?? [],
      );

      setUnreadCount(
        result.data?.unreadCount ?? 0,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load your notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        setMarkingId(notificationId);

        const response = await fetch(
          `${API_URL}/customer/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            credentials: "include",
          },
        );

        const result =
          (await response.json()) as {
            success: boolean;
            data?: {
              notification?: Notification;
            };
            message?: string;
          };

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ??
              "Unable to mark notification as read.",
          );
        }

        setNotifications((current) =>
          current.map((notification) =>
            notification._id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  readAt:
                    result.data?.notification?.readAt ??
                    new Date().toISOString(),
                }
              : notification,
          ),
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1),
        );
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to mark notification as read.",
        );
      } finally {
        setMarkingId(null);
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    if (unreadCount === 0) {
      return;
    }

    try {
      setIsMarkingAll(true);
      setError("");

      const response = await fetch(
        `${API_URL}/customer/notifications/read-all`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to mark all notifications as read.",
        );
      }

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt ?? readAt,
        })),
      );

      setUnreadCount(0);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to mark all notifications as read.",
      );
    } finally {
      setIsMarkingAll(false);
    }
  }, [unreadCount]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      ),
    [notifications],
  );

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      if (notification.link) {
        navigate(notification.link);
      }
    },
    [markAsRead, navigate],
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />

            <p className="text-sm text-muted-foreground">
              Loading your notifications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="size-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Notifications
                </h1>

                {unreadCount > 0 && (
                  <Badge variant="default">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Stay updated about your invoices, payments,
                warranties and documents.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            isDisabled={
              unreadCount === 0 ||
              isMarkingAll
            }
            onClick={() => {
              void markAllAsRead();
            }}
          >
            {isMarkingAll ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 size-4" />
            )}
            Mark all as read
          </Button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <Card className="mt-6 border-destructive/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />

              <div>
                <p className="font-medium">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {error}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    void loadNotifications();
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>
                Your notifications
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {notifications.length === 0
                  ? "You're all caught up."
                  : `${notifications.length} notification${
                      notifications.length === 1
                        ? ""
                        : "s"
                    }`}
              </p>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          {sortedNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center sm:px-8">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Check className="size-8" />
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                You're all caught up
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                You don't have any notifications right now.
                We'll show important updates here when
                something needs your attention.
              </p>
            </div>
          ) : (
            <div>
              {sortedNotifications.map(
                (notification, index) => {
                  const Icon =
                    getNotificationIcon(
                      notification.type,
                    );

                  const iconContainerClass =
                    getNotificationIconContainer(
                      notification.type,
                    );

                  return (
                    <div key={notification._id}>
                      <div
                        className={`group relative flex flex-col gap-4 p-5 transition-colors sm:flex-row sm:items-start sm:p-6 ${
                          notification.isRead
                            ? "bg-card"
                            : "bg-primary/[0.035] hover:bg-primary/[0.06]"
                        } ${
                          notification.link
                            ? "cursor-pointer"
                            : ""
                        }`}
                        onClick={() => {
                          if (notification.link) {
                            void handleNotificationClick(
                              notification,
                            );
                          }
                        }}
                        onKeyDown={(event) => {
                          if (
                            notification.link &&
                            (event.key === "Enter" ||
                              event.key === " ")
                          ) {
                            event.preventDefault();

                            void handleNotificationClick(
                              notification,
                            );
                          }
                        }}
                        role={
                          notification.link
                            ? "button"
                            : undefined
                        }
                        tabIndex={
                          notification.link
                            ? 0
                            : undefined
                        }
                      >
                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <span
                            className="absolute left-0 top-0 h-full w-1 bg-primary"
                            aria-label="Unread"
                          />
                        )}

                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconContainerClass}`}
                        >
                          <Icon className="size-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className={`font-semibold ${
                                    notification.isRead
                                      ? "text-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {notification.title}
                                </h3>

                                <Badge
                                  variant="outline"
                                  className="text-[11px]"
                                >
                                  {getNotificationTypeLabel(
                                    notification.type,
                                  )}
                                </Badge>

                                {!notification.isRead && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                                    <span className="size-1.5 rounded-full bg-primary" />
                                    New
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {notification.message}
                              </p>
                            </div>

                            <time
                              dateTime={
                                notification.createdAt
                              }
                              className="shrink-0 text-xs text-muted-foreground sm:pt-1"
                            >
                              {formatDate(
                                notification.createdAt,
                              )}
                            </time>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            {notification.link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  void handleNotificationClick(
                                    notification,
                                  );
                                }}
                              >
                                View details
                              </Button>
                            )}

                            {!notification.isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                isDisabled={
                                  markingId ===
                                  notification._id
                                }
                                onClick={(event) => {
                                  event.stopPropagation();

                                  void markAsRead(
                                    notification._id,
                                  );
                                }}
                              >
                                {markingId ===
                                notification._id ? (
                                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                                ) : (
                                  <Check className="mr-2 size-3.5" />
                                )}
                                Mark as read
                              </Button>
                            )}

                            {notification.isRead && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Check className="size-3.5" />
                                Read
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {index <
                        sortedNotifications.length -
                          1 && <Separator />}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}