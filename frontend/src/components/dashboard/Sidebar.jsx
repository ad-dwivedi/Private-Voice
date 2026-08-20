import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  AlertCircle,
  Lightbulb,
  BarChart3,
  PlusCircle,
  Megaphone,
  MessageCircle,
  Settings as SettingsIcon,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

function Sidebar({
  activeSection,
  onSectionChange,
  mobileOpen,
  onMobileClose,
}) {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("privatevoice_role") || "member";
  const isAdmin = role === "admin";

  const mainItems = [
    { label: "Home", icon: Home, route: "/dashboard" },
    { label: "Community", icon: Users, route: "/community" },
  ];

  const participateItems = [
    { label: "Complaints", icon: AlertCircle, route: "/complaints" },
    { label: "Suggestions", icon: Lightbulb, route: "/suggestions" },
    { label: "Polls", icon: BarChart3, route: "/polls" },
  ].filter((item) => {
    if (isAdmin && (item.label === "Complaints" || item.label === "Suggestions")) {
      return false;
    }
    return true;
  });

  const informationItems = [
    { label: "Announcements", icon: Megaphone, route: "/announcements" },
  ];

  const communicationItems = [
    { label: "Authority Chat", icon: MessageCircle, route: "/authority-chat" },
  ];

  const adminItems = [
    { label: "Create Poll", icon: PlusCircle, route: "/create-poll" },
    { label: "Admin Complaints", icon: ShieldAlert, route: "/admin-complaints" },
    { label: "Admin Suggestions", icon: ShieldCheck, route: "/admin-suggestions" },
  ];

  const handleClick = (item) => {
    navigate(item.route);
    onSectionChange(item.label);
    if (onMobileClose) onMobileClose();
  };

  const NavItem = ({ item }) => {
    const isActive = activeSection === item.label;
    const Icon = item.icon;

    return (
      <button
        type="button"
        onClick={() => handleClick(item)}
        className={`group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-all duration-200 ${
          isActive
            ? "bg-[#EEF4F1] text-[#526F65]"
            : "text-[#5B6863] hover:bg-[#F6F8F7] hover:text-[#374440]"
        }`}
      >
        <span
          className={`absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full transition-all duration-200 ${
            isActive ? "w-[3px] bg-[#78958B]" : "w-0 bg-transparent"
          }`}
        />

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-white text-[#648278] shadow-sm"
              : "bg-transparent text-[#7C8B85] group-hover:bg-white"
          }`}
        >
          <Icon size={16} strokeWidth={2} />
        </span>

        <span
          className={`text-[13px] transition-all duration-200 ${
            isActive ? "font-semibold" : "font-medium"
          }`}
        >
          {item.label}
        </span>

        {isActive && (
          <span className="ml-auto text-[13px] text-[#78958B]">→</span>
        )}
      </button>
    );
  };

  const SectionTitle = ({ children }) => {
    return (
      <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[1.5px] text-[#8D9994]">
        {children}
      </p>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">

      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#E8ECEA] px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F0EC]">
            <span className="text-[15px] font-bold text-[#68867B]">
              P
            </span>
          </div>

          <div>

            <h2 className="text-[15px] font-bold tracking-[-0.2px] text-[#28322F]">
              PrivateVoice
            </h2>

            <p className="mt-0.5 text-[9px] tracking-[0.4px] text-[#8D9994]">
              PRIVATE COMMUNITY
            </p>

          </div>

        </div>

        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7C8B85] hover:bg-[#F6F8F7] lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}

      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-7">

        <div className="mb-7">
          <SectionTitle>Main</SectionTitle>
          <div className="space-y-1">
            {mainItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </div>
        </div>

        {participateItems.length > 0 && (
          <div className="mb-7">
            <SectionTitle>Participate</SectionTitle>
            <div className="space-y-1">
              {participateItems.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-7">
          <SectionTitle>Information</SectionTitle>
          <div className="space-y-1">
            {informationItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </div>
        </div>

        <div className={isAdmin ? "mb-7" : ""}>
          <SectionTitle>Communication</SectionTitle>
          <div className="space-y-1">
            {communicationItems.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </div>
        </div>

        {isAdmin && (
          <div>
            <SectionTitle>Admin</SectionTitle>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </div>
          </div>
        )}

      </nav>

      <div className="shrink-0 border-t border-[#E8ECEA] p-3">
        <NavItem item={{ label: "Settings", icon: SettingsIcon, route: "/settings" }} />

        <div className="mx-1 mt-3 flex items-center gap-2 rounded-lg border border-[#E4EBE7] bg-[#F7FAF8] px-3 py-3">

          <span className="h-2 w-2 animate-pulse rounded-full bg-[#78958B]" />

          <div>
            <p className="text-[10px] font-semibold text-[#5B6863]">
              {isAdmin ? "Admin mode" : "Anonymous mode"}
            </p>
            <p className="mt-0.5 text-[9px] text-[#8D9994]">
              {isAdmin ? "Identity visible to members" : "Identity protected"}
            </p>
          </div>

        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

      <aside className="sticky top-0 hidden h-screen w-[245px] shrink-0 border-r border-[#E1E6E3] bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}
      {/*
        Root cause fix: the sidebar was previously `hidden lg:block`
        with no mobile alternative at all — mobile users had no way
        to navigate to Community, Complaints, Polls, etc. This adds
        a slide-in drawer controlled from DashboardLayout.
      */}

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute inset-0 bg-[#1A211F]/40 backdrop-blur-[1px]"
            onClick={onMobileClose}
          />

          <aside className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] animate-[drawerIn_0.25s_ease-out] bg-white shadow-[0_0_40px_rgba(0,0,0,0.15)]">
            <SidebarContent />
          </aside>
        </div>
      )}

      <style>{`
        @keyframes drawerIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

export default Sidebar;