import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  RefreshCw,
  Trash2,
  WalletCards,
  ShieldCheck,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5001/api";

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
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    unreadCount?: number;
  };
  message?: string;
}

function getNotificationIcon(
  type: NotificationType,
) {
  switch (type) {
    case "invoice_created":
      return FileText;

    case "invoice_paid":
      return WalletCards;

    case "warranty_expiring":
    case "warranty_expired":
      return ShieldCheck;

    case "document_uploaded":
      return FileText;

    case "system":
    default:
      return Info;
  }
}

function formatNotificationDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = Date.now();
  const diff = now - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);

    return `${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    } ago`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);

    return `${hours} ${
      hours === 1 ? "hour" : "hours"
    } ago`;
  }

  if (diff < 7 * day) {
    const days = Math.floor(diff / day);

    return `${days} ${
      days === 1 ? "day" : "days"
    } ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [unreadOnly, setUnreadOnly] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const limit = 20;

  async function fetchNotifications(
    requestedPage = page,
    refresh = false,
  ) {
    try {
      setError("");

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: String(limit),
      });

      if (unreadOnly) {
        params.set("unreadOnly", "true");
      }

      const response = await fetch(
        `${API_URL}/notifications?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as NotificationsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to load notifications.",
        );
      }

      const data = result.data;

      setNotifications(
        data?.notifications ?? [],
      );

      setUnreadCount(
        data?.unreadCount ?? 0,
      );

      setPage(
        data?.pagination?.page ??
          requestedPage,
      );

      setHasMore(
        data?.pagination?.hasMore ??
          false,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load notifications.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchNotifications(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly]);

  async function markAsRead(
    notificationId: string,
  ) {
    try {
      setActionId(notificationId);

      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as NotificationsResponse;

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
          : "Unable to update notification.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    try {
      setActionId("all");

      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as NotificationsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to mark notifications as read.",
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt:
            notification.readAt ??
            new Date().toISOString(),
        })),
      );

      setUnreadCount(0);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update notifications.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteNotification(
    notificationId: string,
  ) {
    try {
      setActionId(notificationId);

      const response = await fetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result =
        (await response.json()) as NotificationsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to delete notification.",
        );
      }

      const deletedNotification =
        notifications.find(
          (notification) =>
            notification._id ===
            notificationId,
        );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification._id !==
            notificationId,
        ),
      );

      if (
        deletedNotification &&
        !deletedNotification.isRead
      ) {
        setUnreadCount((current) =>
          Math.max(0, current - 1),
        );
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete notification.",
      );
    } finally {
      setActionId(null);
    }
  }

  function openNotification(
    notification: Notification,
  ) {
    if (!notification.isRead) {
      void markAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  }

  const emptyMessage = useMemo(() => {
    if (unreadOnly) {
      return "You have no unread notifications.";
    }

    return "You're all caught up.";
  }, [unreadOnly]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bell className="size-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Stay updated with your BillNest activity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void fetchNotifications(
                page,
                true,
              )
            }
            disabled={isRefreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${
                isRefreshing
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              void markAllAsRead()
            }
            disabled={
              unreadCount === 0 ||
              actionId === "all"
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="size-4" />
            Mark all read
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Unread notifications
          </p>

          <p className="mt-1 text-2xl font-bold">
            {unreadCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Current view
          </p>

          <p className="mt-1 text-2xl font-bold">
            {unreadOnly
              ? "Unread"
              : "All"}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border bg-card p-3 shadow-sm">
        <div>
          <p className="text-sm font-medium">
            Notification inbox
          </p>

          <p className="text-xs text-muted-foreground">
            {unreadOnly
              ? "Showing unread notifications only."
              : "Showing all notifications."}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setUnreadOnly(
              (current) => !current,
            )
          }
          className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${
            unreadOnly
              ? "border-primary/30 bg-primary/10 text-primary"
              : "hover:bg-muted"
          }`}
        >
          <Check className="size-4" />
          Unread only
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void fetchNotifications(
                page,
                true,
              )
            }
            className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="flex gap-4 p-4"
              >
                <div className="size-11 shrink-0 animate-pulse rounded-2xl bg-muted" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <Bell className="size-7 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              {emptyMessage}
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {unreadOnly
                ? "There are currently no unread notifications."
                : "New invoice, payment, warranty and system updates will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(
              (notification) => {
                const Icon =
                  getNotificationIcon(
                    notification.type,
                  );

                const isActionRunning =
                  actionId ===
                  notification._id;

                return (
                  <div
                    key={notification._id}
                    className={`group flex gap-3 p-4 transition-colors sm:gap-4 ${
                      notification.isRead
                        ? "bg-card hover:bg-muted/40"
                        : "bg-primary/[0.035] hover:bg-primary/[0.06]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openNotification(
                          notification,
                        )
                      }
                      className="flex min-w-0 flex-1 gap-3 text-left sm:gap-4"
                    >
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                          notification.isRead
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm ${
                              notification.isRead
                                ? "font-medium"
                                : "font-semibold"
                            }`}
                          >
                            {notification.title}
                          </h3>

                          {!notification.isRead && (
                            <span className="size-2 rounded-full bg-primary" />
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatNotificationDate(
                            notification.createdAt,
                          )}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-start gap-1">
                      {!notification.isRead && (
                        <button
                          type="button"
                          title="Mark as read"
                          aria-label="Mark as read"
                          disabled={
                            isActionRunning
                          }
                          onClick={() =>
                            void markAsRead(
                              notification._id,
                            )
                          }
                          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Check className="size-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete notification"
                        aria-label="Delete notification"
                        disabled={
                          isActionRunning
                        }
                        onClick={() =>
                          void deleteNotification(
                            notification._id,
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading &&
        notifications.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border bg-card p-3 shadow-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                void fetchNotifications(
                  page - 1,
                )
              }
              className="inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>

            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>

            <button
              type="button"
              disabled={!hasMore}
              onClick={() =>
                void fetchNotifications(
                  page + 1,
                )
              }
              className="inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
    </div>
  );
}