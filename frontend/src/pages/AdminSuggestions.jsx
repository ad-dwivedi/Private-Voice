import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import {
  suggestionService,
  subscribeToNewSuggestion,
  subscribeToSuggestionUpdated,
} from "../services/suggestionService";
import { formatRelativeTime } from "../utils/time";
import { useToast } from "../components/ui/UIProvider";

function AdminSuggestions() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const role = sessionStorage.getItem("privatevoice_role") || "member";

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [responseDrafts, setResponseDrafts] = useState({});

  useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const data = await suggestionService.getAdminSuggestions();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error("Failed to fetch admin suggestions:", err);
      showToast(err.message || "Unable to load suggestions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribeNew = subscribeToNewSuggestion((suggestion) => {
      setSuggestions((previous) => {
        if (previous.some((s) => s.id === suggestion.id)) return previous;
        return [suggestion, ...previous];
      });
    });

    const unsubscribeUpdated = subscribeToSuggestionUpdated((payload) => {
      setSuggestions((previous) =>
        previous.map((s) =>
          s.id === payload.id ? { ...s, status: payload.status, response: payload.response ?? s.response } : s
        )
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
    };
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      setUpdatingId(id);
      await suggestionService.updateSuggestionStatus(id, status, responseDrafts[id]);
      await fetchSuggestions();
      showToast("Suggestion updated.", "success");
    } catch (err) {
      console.error("Failed to update suggestion:", err);
      showToast(err.message || "Failed to update suggestion.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusOptions = ["PENDING", "REVIEWED", "ACCEPTED", "REJECTED", "IMPLEMENTED"];

  const statusStyle = (status) => {
    switch (status) {
      case "ACCEPTED":
      case "IMPLEMENTED":
        return "border-[#D9E8DF] bg-[#F1F8F4] text-[#4E7666]";
      case "REVIEWED":
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
        <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.6px] text-[#202725]">Manage Suggestions</h1>
        <p className="mt-2 max-w-[650px] text-[13px] leading-6 text-[#4F5D57]">
          Review and respond to ideas submitted by members of your organization.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#E1E8E4] bg-[#F7FAF8] px-3 py-2">
          <Clock size={13} className="text-[#78958B]" />
          <span className="text-[11px] text-[#4F5D57]">Showing suggestions from the last 24 hours only</span>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DCE5E1] border-t-[#6F8580]" />
            <p className="mt-4 text-[12px] text-[#6E7B76]">Loading suggestions...</p>
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="rounded-xl border border-[#E3E8E5] bg-white p-8 text-center">
          <p className="text-[13px] text-[#6E7B76]">No suggestions in the last 24 hours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-xl border border-[#E3E8E5] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[1px] text-[#8D9994]">#{suggestion.id}</span>
                    {suggestion.createdAt && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[#C5A77A]" />
                        <span className="text-[10px] text-[#8D9994]">{formatRelativeTime(suggestion.createdAt)}</span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-[14px] font-semibold text-[#3D4844]">{suggestion.title}</h3>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusStyle(suggestion.status)}`}>
                  {suggestion.status}
                </span>
              </div>

              <p className="mt-3 text-[13px] leading-6 text-[#4F5D57]">{suggestion.description}</p>

              {suggestion.response && (
                <div className="mt-3 rounded-lg border-l-2 border-[#78958B] bg-[#F7FAF8] p-3">
                  <p className="text-[11px] font-semibold text-[#3D4844]">Previous response</p>
                  <p className="mt-1 text-[12px] text-[#4F5D57]">{suggestion.response}</p>
                </div>
              )}

              <div className="mt-4 border-t border-[#EEF1EF] pt-4">
                <label className="text-[11px] font-semibold text-[#3D4844]">Response (optional)</label>
                <textarea
                  rows={2}
                  value={responseDrafts[suggestion.id] || ""}
                  onChange={(e) => setResponseDrafts((prev) => ({ ...prev, [suggestion.id]: e.target.value }))}
                  placeholder="Write a response to the member..."
                  className="mt-2 w-full resize-none rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3 py-2 text-[12px] text-[#3D4844] outline-none focus:border-[#AFC2B9] focus:bg-white"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === suggestion.id}
                      onClick={() => handleStatusChange(suggestion.id, status)}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition-all disabled:opacity-50 ${
                        suggestion.status === status
                          ? "border-[#78958B] bg-[#EEF4F1] text-[#4B6D62]"
                          : "border-[#E1E7E4] bg-white text-[#4F5D57] hover:border-[#C8D5CF]"
                      }`}
                    >
                      {status}
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

export default AdminSuggestions;