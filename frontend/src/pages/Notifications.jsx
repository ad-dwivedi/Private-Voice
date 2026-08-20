import React, { useEffect, useState } from "react";
import { Megaphone, AlertCircle, Lightbulb, BarChart3, ShieldCheck, Bell, CheckCheck } from "lucide-react";
import { notificationService, subscribeToNewNotification } from "../services/notificationService";
import { formatRelativeTime } from "../utils/time";
import { useToast } from "../components/ui/UIProvider";

function Notifications() {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      showToast(err.message || "Unable to load notifications.", "error");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNewNotification((notification) => {
      setNotifications((previous) => {
        if (previous.some((n) => n.id === notification.id)) return previous;
        return [notification, ...previous];
      });
      setUnreadCount((previous) => previous + 1);
    });

    return unsubscribe;
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read.", "success");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      showToast(err.message || "Could not mark all as read.", "error");
    }
  };

  const getNotificationMeta = (type) => {
    switch (type) {
      case "announcement":
        return { Icon: Megaphone, bg: "#FBF3E5", fg: "#84693F" };
      case "complaint_status":
        return { Icon: AlertCircle, bg: "#FBF4F2", fg: "#94655D" };
      case "suggestion_status":
        return { Icon: Lightbulb, bg: "#F5F9ED", fg: "#5F7D4F" };
      case "new_poll":
        return { Icon: BarChart3, bg: "#F0F5F2", fg: "#557267" };
      case "authority_verified":
        return { Icon: ShieldCheck, bg: "#E8F0EC", fg: "#557267" };
      default:
        return { Icon: Bell, bg: "#F8FAF9", fg: "#6E7B76" };
    }
  };

  return (
    <div className="mx-auto w-full max-w-[900px] pb-12">

      <section className="relative mb-8 overflow-hidden rounded-2xl border border-[#E1E7E4] bg-white px-6 py-7 shadow-[0_10px_30px_rgba(48,65,58,0.035)] sm:px-8">

        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#EEF4F1]" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-[#F6F0E7]" />

        <div className="relative">

          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#78958B]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Your activity</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.6px] text-[#202725] sm:text-[32px]">Notifications</h1>
              <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-[#4F5D57]">
                Stay updated with announcements, responses, and organization activity.
              </p>
            </div>

            {unreadCount > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-[#DCE7E2] bg-[#F0F7F3] px-4 py-2.5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#78958B]" />
                <span className="text-[11px] font-semibold text-[#4B6D62]">{unreadCount} unread</span>
              </div>
            )}
          </div>

        </div>

      </section>

      {loading ? (
        <section className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DCE5E1] border-t-[#6F8580]" />
            <p className="mt-4 text-[12px] text-[#6E7B76]">Loading notifications...</p>
          </div>
        </section>
      ) : (
        <>

          {unreadCount > 0 && notifications.length > 0 && (
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#4B6D62] transition-colors hover:text-[#3B5A50]"
              >
                <CheckCheck size={13} />
                Mark all as read
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#DCE4E0] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF4F1] text-[#78958B]">
                <CheckCheck size={20} />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[#3D4844]">All caught up!</h3>
              <p className="mx-auto mt-2 max-w-[380px] text-[12px] leading-5 text-[#6E7B76]">
                You're all set. New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const { Icon, bg, fg } = getNotificationMeta(notification.type);

                return (
                  <article
                    key={notification.id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    className={`group relative cursor-pointer rounded-xl border p-5 transition-all duration-200 ${
                      notification.isRead
                        ? "border-[#E3E8E5] bg-white hover:border-[#D3DFD9]"
                        : "border-[#D8E5DD] bg-[#F7FBF8] hover:border-[#C5DDD1]"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: bg, color: fg }}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-[13px] font-semibold ${notification.isRead ? "text-[#4F5D57]" : "text-[#202725]"}`}>
                              {notification.title}
                            </h3>
                            <p className={`mt-1 text-[12px] leading-5 ${notification.isRead ? "text-[#8D9994]" : "text-[#4F5D57]"}`}>
                              {notification.content}
                            </p>
                          </div>

                          {!notification.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#78958B]" />}
                        </div>

                        <p className="mt-2 text-[10px] text-[#8D9994]">{formatRelativeTime(notification.createdAt)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </>
      )}

    </div>
  );
}

export default Notifications;