import { useEffect, useState } from "react";
import { useAutoExpire } from "../hooks/useAutoExpire";
import {
  ShieldCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  complaintService,
  subscribeToComplaintUpdated,
} from "../services/complaintService";
import { formatRelativeTime } from "../utils/time";
import { useToast } from "../components/ui/UIProvider";

function Complaints() {
  const { showToast } = useToast();

  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // UI only - form open/close
  const [isFormOpen, setIsFormOpen] = useState(false);

  // =====================================================
  // AUTO EXPIRE COMPLAINTS
  // =====================================================
  useAutoExpire(
    complaints,
    setComplaints,
    (complaint) => complaint.createdAt
  );

  const normalizeStatus = (status) => {
    switch (status) {
      case "PENDING":
        return "Submitted";
      case "IN_REVIEW":
        return "Under Review";
      case "RESOLVED":
        return "Resolved";
      case "REJECTED":
        return "Rejected";
      default:
        return status || "Submitted";
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const data = await complaintService.getComplaints();

      const normalized = (data.complaints || []).map((complaint) => ({
        ...complaint,
        subject:
          complaint.title ||
          complaint.subject ||
          "Untitled complaint",
        status: normalizeStatus(complaint.status),
      }));

      setComplaints(normalized);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);

      showToast(
        err.message || "Failed to load complaints.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToComplaintUpdated((payload) => {
      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint.id === payload.id
            ? {
              ...complaint,
              status: normalizeStatus(payload.status),
              response:
                payload.response ?? complaint.response,
              updatedAt:
                payload.updatedAt || complaint.updatedAt,
            }
            : complaint
        )
      );

      showToast(
        "An authority responded to your complaint.",
        "success"
      );
    });

    return unsubscribe;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !category ||
      !subject.trim() ||
      !description.trim()
    ) {
      return;
    }

    try {
      setSubmitting(true);

      await complaintService.createComplaint({
        category,
        title: subject.trim(),
        description: description.trim(),
      });

      setCategory("");
      setSubject("");
      setDescription("");

      showToast(
        "Concern submitted successfully.",
        "success"
      );

      await fetchComplaints();

      // UI only
      setIsFormOpen(false);
    } catch (err) {
      console.error("Complaint submission failed:", err);

      showToast(
        err.message || "Could not submit complaint.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Resolved":
        return {
          wrapper:
            "border-[#D7E8DF] bg-[#F1F8F4] text-[#4E7666]",
          icon: <CheckCircle2 size={11} />,
        };

      case "Under Review":
        return {
          wrapper:
            "border-[#E8DDC9] bg-[#FBF7EF] text-[#84693F]",
          icon: <Clock3 size={11} />,
        };

      case "Rejected":
        return {
          wrapper:
            "border-[#EBDDD9] bg-[#FBF5F3] text-[#94655D]",
          icon: <AlertCircle size={11} />,
        };

      default:
        return {
          wrapper:
            "border-[#DCE7E2] bg-[#F4F9F6] text-[#557267]",
          icon: <Clock3 size={11} />,
        };
    }
  };

  return (
    <div className="max-w-[1050px] animate-[fadeUp_0.45s_ease-out]">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-2xl border border-[#E3E8E5] bg-gradient-to-br from-[#F5FAF7] via-white to-[#F8F5EE] px-6 py-7 shadow-[0_10px_35px_rgba(48,65,58,0.04)] sm:px-8">

        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#E5F0EB] opacity-70" />

        <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-[#F4EBDD] opacity-70" />

        <div className="relative">

          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#78958B]" />

            <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">
              Private concern
            </span>
          </div>

          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.6px] text-[#202725] sm:text-[32px]">
            Raise a concern
          </h1>

          <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-[#5B6863]">
            Report an issue privately and anonymously. Your concern
            can be reviewed by the appropriate authority without
            revealing your identity.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#DCE7E2] bg-white px-3 py-2.5">

            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E5EFEA] text-[#557267]">
              <ShieldCheck size={13} />
            </span>

            <span className="text-[11px] text-[#4F5D57]">
              Your identity remains anonymous
            </span>

          </div>

        </div>
      </section>


      {/* =====================================================
          COMPACT COMPLAINT FORM
      ====================================================== */}

      <section className="mt-7 max-w-[850px]">

        <div className="rounded-2xl border border-[#DDE7E2] bg-[#F0F5F2] p-3 sm:p-4">

          <button
            type="button"
            onClick={() => setIsFormOpen((previous) => !previous)}
            className="group flex w-full items-center justify-between rounded-xl border border-[#DCE6E1] bg-white px-4 py-3.5 text-left transition-all duration-300 hover:border-[#C8D7D0] hover:shadow-[0_8px_22px_rgba(48,65,58,0.05)] sm:px-5"
          >

            <div className="flex min-w-0 items-center gap-3">

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F1EC] text-[#5E7C70] transition-transform duration-300 group-hover:scale-105">
                <Plus
                  size={16}
                  className={`transition-transform duration-300 ${isFormOpen ? "rotate-45" : ""
                    }`}
                />
              </span>

              <div className="min-w-0">

                <p className="text-[12px] font-semibold text-[#34423D]">
                  Raise a new complaint
                </p>

                <p className="mt-0.5 truncate text-[10px] text-[#84908B]">
                  Submit an issue privately and track its progress
                </p>

              </div>

            </div>

            <span className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F7F5] text-[#71877D]">

              {isFormOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}

            </span>

          </button>


          {isFormOpen && (

            <form
              onSubmit={handleSubmit}
              className="mt-3 rounded-xl border border-[#DDE7E2] bg-white p-4 shadow-[0_8px_25px_rgba(48,65,58,0.035)] sm:p-5"
            >

              <div className="mb-5 flex items-center gap-2 border-b border-[#EEF2F0] pb-4">

                <ShieldCheck
                  size={14}
                  className="text-[#718F84]"
                />

                <p className="text-[11px] text-[#6E7B76]">
                  Your complaint will be handled privately.
                </p>

              </div>

              <div>

                <label className="text-[11px] font-semibold text-[#3D4844]">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3 py-2.5 text-[12px] text-[#3D4844] outline-none transition-all focus:border-[#AFC2B9] focus:bg-white focus:ring-2 focus:ring-[#EAF1EE]"
                >
                  <option value="">
                    Select a category
                  </option>

                  <option value="workplace">
                    Workplace
                  </option>

                  <option value="facilities">
                    Facilities
                  </option>

                  <option value="management">
                    Management
                  </option>

                  <option value="harassment">
                    Harassment / Safety
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>

              </div>

              <div className="mt-4">

                <label className="text-[11px] font-semibold text-[#3D4844]">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
                  maxLength={100}
                  placeholder="Briefly describe the issue"
                  className="mt-1.5 w-full rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3 py-2.5 text-[12px] text-[#3D4844] outline-none transition-all placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:bg-white focus:ring-2 focus:ring-[#EAF1EE]"
                />

              </div>

              <div className="mt-4">

                <div className="flex items-center justify-between">

                  <label className="text-[11px] font-semibold text-[#3D4844]">
                    Your concern
                  </label>

                  <span className="text-[9px] text-[#9AA4A0]">
                    {description.length}/1000
                  </span>

                </div>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  maxLength={1000}
                  placeholder="Explain the issue in your own words..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3 py-2.5 text-[12px] leading-5 text-[#3D4844] outline-none transition-all placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:bg-white focus:ring-2 focus:ring-[#EAF1EE]"
                />

              </div>

              <div className="mt-4 flex items-center justify-between gap-4">

                <p className="hidden text-[10px] text-[#8D9994] sm:block">
                  Anonymous • Private • Trackable
                </p>

                <button
                  type="submit"
                  disabled={
                    !category ||
                    !subject.trim() ||
                    !description.trim() ||
                    submitting
                  }
                  className="ml-auto rounded-lg bg-[#718F84] px-5 py-2.5 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5F7D72] hover:shadow-[0_8px_18px_rgba(95,125,114,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Concern"}
                </button>

              </div>

            </form>

          )}

        </div>

      </section>


      {/* =====================================================
          COMPLAINT HISTORY
      ====================================================== */}

      <section className="mt-9 max-w-[850px]">

        <div className="rounded-2xl border border-[#E2E9E5] bg-[#F0F5F2] p-4 sm:p-5">

          <div className="flex items-end justify-between border-b border-[#D7E2DC] pb-4">

            <div>

              <div className="flex items-center gap-2">

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E3EDE8] text-[#607D72]">
                  <MessageSquare size={12} />
                </span>

                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">
                  Complaint history
                </p>

              </div>

              <h2 className="mt-2 text-[20px] font-semibold text-[#2B3532]">
                My complaints
              </h2>

              <p className="mt-1 text-[11px] text-[#7C8985]">
                Track your submitted concerns and authority responses
              </p>

            </div>

            <span className="rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-medium text-[#7C8985]">
              {complaints.length} complaint
              {complaints.length !== 1 ? "s" : ""}
            </span>

          </div>

          <div className="mt-5">

            {!loading && complaints.length === 0 && (

              <div className="rounded-xl border border-dashed border-[#D2DED8] bg-white/70 px-6 py-12 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF2EE] text-[#78958B]">
                  <ShieldCheck size={18} />
                </div>

                <h3 className="mt-4 text-[13px] font-semibold text-[#3D4844]">
                  No complaints yet
                </h3>

                <p className="mt-2 text-[11px] text-[#8D9994]">
                  If you have a concern, you can raise one privately above.
                </p>

              </div>

            )}

            {loading && (

              <div className="rounded-xl border border-[#DCE6E1] bg-white/70 px-6 py-10 text-center">

                <p className="text-[11px] text-[#8D9994]">
                  Loading your complaints...
                </p>

              </div>

            )}

            {!loading && complaints.length > 0 && (

              <div className="space-y-3">

                {complaints.map((complaint, index) => {

                  const statusStyle =
                    getStatusStyles(complaint.status);

                  return (

                    <article
                      key={complaint.id}
                      className="group rounded-2xl border border-[#DCE6E1] bg-white p-4 shadow-[0_5px_18px_rgba(48,65,58,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C7D6CF] hover:shadow-[0_12px_28px_rgba(48,65,58,0.055)] sm:p-5"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="flex min-w-0 items-start gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF4F1] text-[#607B70]">

                            <span className="text-[10px] font-bold">
                              #{index + 1}
                            </span>

                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="text-[9px] font-semibold uppercase tracking-[0.8px] text-[#9AA4A0]">
                                Case
                              </span>

                              <span className="text-[10px] font-semibold text-[#78958B]">
                                #{complaint.id}
                              </span>

                            </div>

                            <h3 className="mt-1 text-[13px] font-semibold text-[#34423D]">
                              {complaint.subject}
                            </h3>

                          </div>

                        </div>

                        <span
                          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px] font-semibold ${statusStyle.wrapper}`}
                        >
                          {statusStyle.icon}
                          {complaint.status}
                        </span>

                      </div>

                      {complaint.description && (

                        <div className="mt-4 rounded-xl border border-[#E9EFEC] bg-[#F8FAF9] px-4 py-3">

                          <p className="mb-1 text-[9px] font-bold uppercase tracking-[1px] text-[#8A9792]">
                            Your concern
                          </p>

                          <p className="text-[11px] leading-5 text-[#596660]">
                            {complaint.description}
                          </p>

                        </div>

                      )}

                      {complaint.response && (

                        <div className="relative mt-3 rounded-xl border border-[#DDE9E3] bg-[#F2F7F4] px-4 py-3">

                          <div className="flex items-center gap-2">

                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E0ECE6] text-[#5D7B70]">
                              <MessageSquare size={11} />
                            </span>

                            <p className="text-[10px] font-semibold text-[#3D4844]">
                              Response from authority
                            </p>

                          </div>

                          <p className="mt-2 pl-8 text-[11px] leading-5 text-[#4F5D57]">
                            {complaint.response}
                          </p>

                        </div>

                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF1EF] pt-3">

                        <div className="flex items-center gap-2">

                          <span className="h-1.5 w-1.5 rounded-full bg-[#78958B]" />

                          <span className="text-[9px] text-[#8D9994]">
                            Handled privately
                          </span>

                        </div>

                        {complaint.updatedAt && (

                          <span className="text-[9px] text-[#8D9994]">
                            Updated{" "}
                            {formatRelativeTime(
                              complaint.updatedAt
                            )}
                          </span>

                        )}

                      </div>

                    </article>

                  );
                })}

              </div>

            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          PRINCIPLE
      ====================================================== */}

      <section className="mt-10 border-t border-[#E2E7E4] pt-7 pb-5">

        <div className="max-w-[850px]">

          <p className="text-[15px] font-medium italic leading-7 text-[#4F5D57]">
            "Users can speak anonymously. Officials must speak transparently."
          </p>

          <div className="mt-3 flex items-center gap-2">

            <span className="h-[2px] w-5 bg-[#78958B]" />

            <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#8D9994]">
              PrivateVoice principle
            </span>

          </div>

        </div>

      </section>


      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}

export default Complaints;