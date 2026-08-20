import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import {
  complaintService,
  subscribeToNewComplaint,
  subscribeToComplaintUpdated,
} from "../services/complaintService";
import { formatRelativeTime } from "../utils/time";
import { useToast } from "../components/ui/UIProvider";

function AdminComplaints() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role = sessionStorage.getItem("privatevoice_role") || "member";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [responseDrafts, setResponseDrafts] = useState({});

  useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintService.getAdminComplaints();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error("Failed to fetch admin complaints:", err);
      showToast(err.message || "Unable to load complaints.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeNew = subscribeToNewComplaint((complaint) => {
      setComplaints((previous) => {
        if (previous.some((c) => c.id === complaint.id)) return previous;
        return [complaint, ...previous];
      });
      showToast("New complaint received.", "success");
    });

    const unsubscribeUpdated = subscribeToComplaintUpdated((payload) => {
      setComplaints((previous) =>
        previous.map((c) =>
          c.id === payload.id
            ? { ...c, status: payload.status, response: payload.response ?? c.response }
            : c
        )
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingId(id);
      await complaintService.updateComplaintStatus(id, status, responseDrafts[id]);
      await fetchComplaints();
      showToast("Complaint updated.", "success");
    } catch (err) {
      console.error("Failed to update complaint:", err);
      showToast(err.message || "Failed to update complaint.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = ["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED"];

  const statusStyle = (status) => {
    switch (status) {
      case "RESOLVED":
        return "border-[#D9E8DF] bg-[#F1F8F4] text-[#4E7666]";
      case "IN_REVIEW":
        return "border-[#E6DDCC] bg-[#FBF7EF] text-[#84693F]";
      case "REJECTED":
        return "border-[#E6D2CF] bg-[#FFF9F8] text-[#94655D]";
      default:
        return "border-[#DCE7E2] bg-[#F5FAF7] text-[#557267]";
    }
  };

  return (
    <div className="max-w-[1050px]">
      <section className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Admin space</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.6px] text-[#202725]">Manage Complaints</h1>
        <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#4F5D57]">
          Review and respond to complaints submitted by members of your organization.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#E1E8E4] bg-[#F7FAF8] px-3 py-2">
          <Clock size={13} className="text-[#78958B]" />
          <span className="text-[11px] text-[#4F5D57]">Showing complaints from the last 24 hours only</span>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DCE5E1] border-t-[#6F8580]" />
            <p className="mt-4 text-[12px] text-[#6E7B76]">Loading complaints...</p>
          </div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-xl border border-[#E3E8E5] bg-white p-8 text-center">
          <p className="text-[13px] text-[#6E7B76]">No complaints in the last 24 hours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <article key={complaint.id} className="rounded-xl border border-[#E3E8E5] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#8D9994]">#{complaint.id}</span>
                    <span className="h-1 w-1 rounded-full bg-[#C5A77A]" />
                    <span className="text-[10px] text-[#8D9994]">{complaint.category}</span>
                    <span className="h-1 w-1 rounded-full bg-[#C5A77A]" />
                    <span className="text-[10px] text-[#8D9994]">{formatRelativeTime(complaint.createdAt)}</span>
                  </div>
                  <h3 className="mt-1.5 text-[14px] font-semibold text-[#3D4844]">{complaint.title}</h3>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyle(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>

              <p className="mt-3 text-[13px] leading-6 text-[#4F5D57]">{complaint.description}</p>

              {complaint.response && (
                <div className="mt-3 rounded-lg border-l-2 border-[#78958B] bg-[#F7FAF8] p-3">
                  <p className="text-[11px] font-semibold text-[#3D4844]">Previous response</p>
                  <p className="mt-1 text-[12px] text-[#4F5D57]">{complaint.response}</p>
                </div>
              )}

              <div className="mt-4 border-t border-[#EEF1EF] pt-4">
                <label className="text-[11px] font-semibold text-[#3D4844]">Response (optional)</label>
                <textarea
                  rows={2}
                  value={responseDrafts[complaint.id] || ""}
                  onChange={(e) => setResponseDrafts((prev) => ({ ...prev, [complaint.id]: e.target.value }))}
                  placeholder="Write a response to the member..."
                  className="mt-2 w-full resize-none rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3 py-2 text-[12px] text-[#3D4844] outline-none focus:border-[#AFC2B9] focus:bg-white"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === complaint.id}
                      onClick={() => handleStatusChange(complaint.id, status)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all disabled:opacity-50 ${
                        complaint.status === status
                          ? "border-[#78958B] bg-[#EEF4F1] text-[#4B6D62]"
                          : "border-[#E1E7E4] bg-white text-[#4F5D57] hover:border-[#C8D5CF]"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;