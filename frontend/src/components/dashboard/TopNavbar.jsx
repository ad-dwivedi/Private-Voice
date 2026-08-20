import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LayoutDashboard, Settings as SettingsIcon, LogOut, Menu } from "lucide-react";
import { notificationService, subscribeToNewNotification } from "../../services/notificationService";

function TopNavbar({
  user,
  organization,
  onLogout,
  onMenuClick,
}) {
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await notificationService.getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch (err) {
        console.error("Failed to fetch unread count:", err);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNewNotification(() => {
      setUnreadCount((previous) => previous + 1);
    });

    return unsubscribe;
  }, []);

  const role =
    organization?.role ||
    user?.role ||
    "member";

  const isAdmin = role === "admin";

  const anonymousId =
    user?.anonymousId || "Anonymous";

  const displayName = isAdmin
    ? user?.name || "Admin"
    : anonymousId;

  const displayInitial = displayName.charAt(0).toUpperCase();

  const organizationName =
    organization?.name || "Organization";

  const handleSettings = () => {
    setShowProfile(false);
    navigate("/settings");
  };

  return (
    <header className="sticky top-0 z-50 h-[76px] border-b border-[#E1E6E3] bg-white/95 backdrop-blur-md">

      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-5 sm:px-7 lg:px-10">

        <div className="flex min-w-0 items-center gap-3">

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#5B6863] hover:bg-[#F3F6F4] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EC] lg:hidden">
            <span className="text-[15px] font-bold text-[#68867B]">
              P
            </span>
          </div>

          <div className="min-w-0">

            <p className="truncate text-[14px] font-semibold text-[#2B3532] sm:text-[15px]">
              {organizationName}
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#78958B]" />
              <span className="truncate text-[11px] text-[#6E7B76]">
                Private organization space
              </span>
            </div>

          </div>

        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">

          {!isAdmin && (
            <div className="hidden items-center gap-2 rounded-lg border border-[#E1E8E4] bg-[#F7FAF8] px-3 py-2 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#78958B]" />
              <span className="text-[12px] font-medium text-[#4F5D57]">
                {anonymousId}
              </span>
            </div>
          )}

          {isAdmin && (
            <div className="hidden items-center gap-2 rounded-lg border border-[#E7E0D3] bg-[#FBF8F2] px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#C5A77A]" />
              <span className="text-[12px] font-medium text-[#6E5D42]">
                Organization Admin
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate("/notifications")}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5B6863] transition-all duration-200 hover:bg-[#F3F6F4] hover:text-[#3C4A44]"
          >
            <Bell size={19} strokeWidth={1.8} />

            {unreadCount > 0 && (
              <span className="absolute right-[7px] top-[6px] flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C5A77A] px-1 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden h-8 w-px bg-[#E3E8E5] sm:block" />

          <div className="relative">

            <button
              type="button"
              onClick={() => setShowProfile((previous) => !previous)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-[#F5F7F6]"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0EC] text-[12px] font-semibold text-[#557267]">
                {displayInitial}
              </div>

              <div className="hidden text-left sm:block">

                <p className="max-w-[120px] truncate text-[12px] font-semibold text-[#2B3532]">
                  {displayName}
                </p>

                {!isAdmin && (
                  <p className="mt-0.5 text-[10px] text-[#6E7B76]">
                    Anonymous user
                  </p>
                )}

                {isAdmin && (
                  <p className="mt-0.5 text-[10px] text-[#84693F]">
                    Organization Admin
                  </p>
                )}

              </div>

              <ChevronDown
                size={14}
                className={`hidden text-[#7C8B85] transition-transform duration-200 sm:block ${
                  showProfile ? "rotate-180" : ""
                }`}
              />

            </button>

            {showProfile && (
              <div className="absolute right-0 top-[54px] w-[235px] overflow-hidden rounded-xl border border-[#E0E6E3] bg-white shadow-[0_18px_45px_rgba(48,65,58,0.12)]">

                <div className="border-b border-[#E8ECEA] px-4 py-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0EC] text-[12px] font-semibold text-[#557267]">
                      {displayInitial}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-[#2B3532]">
                        {displayName}
                      </p>

                      {!isAdmin && (
                        <p className="mt-0.5 truncate text-[10px] text-[#6E7B76]">
                          {anonymousId}
                        </p>
                      )}

                      {isAdmin && (
                        <p className="mt-0.5 truncate text-[10px] text-[#84693F]">
                          Organization Admin
                        </p>
                      )}
                    </div>

                  </div>

                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(false);
                      navigate("/admin-dashboard");
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] text-[#4F5D57] transition-colors hover:bg-[#F5F7F6] hover:text-[#374440]"
                  >
                    <LayoutDashboard size={15} />
                    Admin Dashboard
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSettings}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] text-[#4F5D57] transition-colors hover:bg-[#F5F7F6] hover:text-[#374440]"
                >
                  <SettingsIcon size={15} />
                  Settings
                </button>

                <div className="border-t border-[#E8ECEA]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(false);
                      onLogout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] text-[#94655D] transition-colors hover:bg-[#FBF6F5]"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </header>
  );
}

export default TopNavbar;