import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, LogOut, Check, X, Users, Clock, Shield } from "lucide-react";
import { adminService } from "../services/adminService";
import { useToast } from "../components/ui/UIProvider";

function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const userId = sessionStorage.getItem("privatevoice_user_id");
    const organizationId = sessionStorage.getItem("privatevoice_organization_id");
    const role = sessionStorage.getItem("privatevoice_role");
    const token = sessionStorage.getItem("privatevoice_token");

    if (!userId || !organizationId || !token) {
      navigate("/login");
      return;
    }

    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }

    const loadedUser = {
      id: userId,
      fullName: sessionStorage.getItem("privatevoice_full_name") || "Admin",
    };

    const loadedOrganization = {
      id: organizationId,
      name: sessionStorage.getItem("privatevoice_organization_name") || "Organization",
      description: sessionStorage.getItem("privatevoice_organization_description") || "",
      code: sessionStorage.getItem("privatevoice_organization_code") || "",
      role,
    };

    setUser(loadedUser);
    setOrganization(loadedOrganization);

    loadAdminData(loadedOrganization.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadAdminData = async (organizationId) => {
    try {
      setLoading(true);

      const [requestsData, membersData] = await Promise.all([
        adminService.getPendingRequests(organizationId),
        adminService.getMembers(organizationId),
      ]);

      setRequests(Array.isArray(requestsData.requests) ? requestsData.requests : []);
      setMembers(Array.isArray(membersData.members) ? membersData.members : []);
    } catch (err) {
      console.error("Load admin dashboard error:", err);
      showToast(err.message || "Unable to load admin dashboard.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!organization?.id) return;

    try {
      setActionLoading(`approve-${requestId}`);
      await adminService.approveRequest(requestId);
      showToast("Join request approved.", "success");
      await loadAdminData(organization.id);
    } catch (err) {
      console.error("Approve request error:", err);
      showToast(err.message || "Unable to approve request.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!organization?.id) return;

    try {
      setActionLoading(`reject-${requestId}`);
      await adminService.rejectRequest(requestId);
      showToast("Join request rejected.", "success");
      await loadAdminData(organization.id);
    } catch (err) {
      console.error("Reject request error:", err);
      showToast(err.message || "Unable to reject request.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = () => {
    if (!organization?.id) return;
    loadAdminData(organization.id);
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
    sessionStorage.removeItem("privatevoice_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F7] px-5 py-8 text-[#202725] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DCE5E1] border-t-[#6F8580]" />
              <p className="mt-4 text-[12px] text-[#6E7B76]">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-5 py-7 text-[#202725] sm:px-8 lg:px-10">

      <div className="mx-auto w-full max-w-5xl">

        <header className="flex flex-col gap-5 border-b border-[#E2E7E4] pb-6 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-7 bg-[#6F8580]" />
              <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#6F8580]">Admin space</span>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.7px] text-[#202725]">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-[#4F5D57]">Manage your organization and member requests.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 rounded-lg border border-[#DCE4E0] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#4F5D57] transition-all hover:border-[#B8C8C1] hover:text-[#374440]"
            >
              <RefreshCw size={13} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-[#E2D9D5] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#94655D] transition-all hover:border-[#CDBBB5]"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>

        </header>

        <section className="mt-8 rounded-2xl border border-[#E3E8E5] bg-white p-6 shadow-[0_10px_35px_rgba(48,65,58,0.035)]">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">Organization</p>
              <h2 className="mt-2 text-xl font-semibold text-[#202725]">{organization?.name || "Organization"}</h2>
              {organization?.description && <p className="mt-1 text-[13px] text-[#6E7B76]">{organization.description}</p>}
            </div>

            <div className="rounded-lg border border-[#E1E8E4] bg-[#F7FAF8] px-5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[1.3px] text-[#7C8985]">Organization Code</p>
              <p className="mt-1 text-sm font-bold tracking-[1px] text-[#3B5A50]">{organization?.code || "—"}</p>
            </div>
          </div>

        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-[#E3E8E5] bg-white p-5">
            <div className="flex items-center gap-2 text-[#94655D]">
              <Clock size={14} />
              <p className="text-[10px] font-bold uppercase tracking-[1.3px]">Pending requests</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#202725]">{requests.length}</p>
          </div>

          <div className="rounded-xl border border-[#E3E8E5] bg-white p-5">
            <div className="flex items-center gap-2 text-[#557267]">
              <Users size={14} />
              <p className="text-[10px] font-bold uppercase tracking-[1.3px]">Approved members</p>
            </div>
            <p className="mt-3 text-3xl font-semibold text-[#202725]">{members.length}</p>
          </div>

          <div className="rounded-xl border border-[#E3E8E5] bg-white p-5">
            <div className="flex items-center gap-2 text-[#84693F]">
              <Shield size={14} />
              <p className="text-[10px] font-bold uppercase tracking-[1.3px]">Your role</p>
            </div>
            <p className="mt-3 text-lg font-semibold capitalize text-[#3B5A50]">{organization?.role || "Admin"}</p>
          </div>

        </section>

        <section className="mt-10">

          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Access requests</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#202725]">Pending Join Requests</h2>
            <p className="mt-2 text-[13px] text-[#6E7B76]">Review requests from people who want to join your organization.</p>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-xl border border-[#E3E8E5] bg-white p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4F1] text-[#557267]">
                <Check size={16} />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#3D4844]">No pending requests</h3>
              <p className="mt-1 text-[12px] text-[#8D9994]">New join requests will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.request_id} className="rounded-xl border border-[#E3E8E5] bg-white p-5 transition-all hover:border-[#C8D5D0]">

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4F1] text-xs font-semibold text-[#557267]">
                          {request.full_name?.charAt(0)?.toUpperCase() || "U"}
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-[#202725]">{request.full_name || "Unknown user"}</h3>
                          <p className="mt-0.5 text-[12px] text-[#6E7B76]">{request.email || "No email"}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#E6EDE9] bg-[#F8FAF9] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.8px] text-[#4F5D57]">
                          Member
                        </span>
                        <span className="rounded-full border border-[#E9DFC9] bg-[#FCF9F3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.8px] text-[#84693F]">
                          Pending
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => handleReject(request.request_id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E2D5D1] bg-white px-5 py-2.5 text-[11px] font-semibold text-[#94655D] transition-all hover:border-[#CDBBB5] hover:bg-[#FFF9F8] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                      >
                        <X size={13} />
                        {actionLoading === `reject-${request.request_id}` ? "Rejecting..." : "Reject"}
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => handleApprove(request.request_id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#6F8580] px-5 py-2.5 text-[11px] font-semibold text-white transition-all hover:bg-[#5D716D] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                      >
                        <Check size={13} />
                        {actionLoading === `approve-${request.request_id}` ? "Approving..." : "Approve"}
                      </button>
                    </div>

                  </div>

                </div>
              ))}
            </div>
          )}

        </section>

        <section className="mt-12">

          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Organization</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#202725]">Approved Members</h2>
            <p className="mt-2 text-[13px] text-[#6E7B76]">People who currently have access to this organization.</p>
          </div>

          {members.length === 0 ? (
            <div className="rounded-xl border border-[#E3E8E5] bg-white p-8 text-center">
              <p className="text-[13px] text-[#6E7B76]">No approved members found.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E3E8E5] bg-white">
              {members.map((member, index) => (
                <div
                  key={member.membership_id}
                  className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    index !== members.length - 1 ? "border-b border-[#EDF0EE]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF4F1] text-[11px] font-semibold text-[#557267]">
                      {member.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#202725]">{member.full_name}</p>
                      <p className="mt-0.5 text-[11px] text-[#6E7B76]">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-[#E2EAE6] bg-[#F7FAF8] px-2.5 py-1 text-[10px] font-semibold capitalize text-[#4F5D57]">
                      {member.role}
                    </span>
                    <span className="rounded-full border border-[#DCE8DF] bg-[#F5FAF6] px-2.5 py-1 text-[10px] font-semibold text-[#4E7360]">
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

        <section className="mt-12 border-t border-[#E2E7E4] pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#8D9994]">PrivateVoice · Organization Admin</p>
            <p className="text-[11px] text-[#8D9994]">Manage all organization features and member access.</p>
          </div>
        </section>

      </div>

    </main>
  );
}

export default AdminDashboard;