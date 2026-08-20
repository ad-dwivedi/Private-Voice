import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import TopNavbar from "../components/dashboard/TopNavbar";

import { connectSocket, disconnectSocket } from "../services/socket";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const user = useMemo(() => {
    const userId = sessionStorage.getItem("privatevoice_user_id");

    if (!userId) {
      return null;
    }

    return {
      id: userId,
      fullName: sessionStorage.getItem("privatevoice_full_name") || null,
      anonymousId:
        sessionStorage.getItem("privatevoice_anonymous_id") || null,
    };
  }, []);

  const organization = useMemo(() => {
    const organizationId = sessionStorage.getItem(
      "privatevoice_organization_id"
    );

    if (!organizationId) {
      return null;
    }

    return {
      id: organizationId,
      name:
        sessionStorage.getItem("privatevoice_organization_name") || "",
      description:
        sessionStorage.getItem(
          "privatevoice_organization_description"
        ) || "",
      code:
        sessionStorage.getItem("privatevoice_organization_code") || "",
      role: sessionStorage.getItem("privatevoice_role") || "member",
      approvalStatus:
        sessionStorage.getItem("privatevoice_approval_status") || "",
    };
  }, []);

  const navbarUser = useMemo(() => {
    if (!user) {
      return null;
    }

    const isAdmin = (organization?.role || "member") === "admin";

    return {
      id: user.id,
      name: isAdmin ? user.fullName || "Admin" : null,
      anonymousId: user.anonymousId || "Anonymous",
    };
  }, [user, organization]);

  const navbarOrganization = useMemo(() => {
    if (!organization) {
      return null;
    }

    return {
      id: organization.id,
      name: organization.name || "Organization",
      description: organization.description || "",
      code: organization.code || "",
      role: organization.role || "member",
      approvalStatus: organization.approvalStatus || "",
    };
  }, [organization]);

  useEffect(() => {
    const token = sessionStorage.getItem("privatevoice_token");

    if (token) {
      connectSocket(token);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  // Close the mobile drawer automatically whenever the route
  // changes, so it doesn't stay open after navigating.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const getActiveSection = () => {
    switch (location.pathname) {
      case "/community":
        return "Community";
      case "/complaints":
        return "Complaints";
      case "/suggestions":
        return "Suggestions";
      case "/polls":
        return "Polls";
      case "/create-poll":
        return "Create Poll";
      case "/announcements":
        return "Announcements";
      case "/authority-chat":
        return "Authority Chat";
      case "/settings":
        return "Settings";
      case "/admin-complaints":
        return "Admin Complaints";
      case "/admin-suggestions":
        return "Admin Suggestions";
      case "/dashboard":
      default:
        return "Home";
    }
  };

  const activeSection = getActiveSection();

  const handleSectionChange = (section) => {
    const routes = {
      Home: "/dashboard",
      Community: "/community",
      Complaints: "/complaints",
      Suggestions: "/suggestions",
      Polls: "/polls",
      "Create Poll": "/create-poll",
      Announcements: "/announcements",
      "Authority Chat": "/authority-chat",
      Settings: "/settings",
      "Admin Complaints": "/admin-complaints",
      "Admin Suggestions": "/admin-suggestions",
    };

    const route = routes[section];

    if (route) {
      navigate(route);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("privatevoice_user_id");
    sessionStorage.removeItem("privatevoice_full_name");
    sessionStorage.removeItem("privatevoice_organization_id");
    sessionStorage.removeItem("privatevoice_organization_name");
    sessionStorage.removeItem("privatevoice_organization_description");
    sessionStorage.removeItem("privatevoice_organization_code");
    sessionStorage.removeItem("privatevoice_role");
    sessionStorage.removeItem("privatevoice_approval_status");
    sessionStorage.removeItem("privatevoice_anonymous_id");

    navigate("/");
  };

  if (!navbarUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#F7F8F7] text-[#202725]">

      <TopNavbar
        user={navbarUser}
        organization={navbarOrganization}
        onLogout={handleLogout}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      <div className="mx-auto flex min-h-[calc(100vh-76px)] max-w-[1440px]">

        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        <section className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-11">
          <div
            key={location.pathname}
            className="animate-[fadeUp_0.45s_ease-out]"
          >
            <Outlet />
          </div>
        </section>

      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </main>
  );
}

export default DashboardLayout;