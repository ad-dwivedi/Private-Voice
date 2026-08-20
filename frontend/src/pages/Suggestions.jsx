import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Clock3,
  MessageCircle,
} from "lucide-react";
import {
  suggestionService,
  subscribeToNewSuggestion,
  subscribeToSuggestionUpdated,
} from "../services/suggestionService";
import { formatRelativeTime } from "../utils/time";
import { useToast } from "../components/ui/UIProvider";
import { useAutoExpire } from "../hooks/useAutoExpire";

function Suggestions() {
  const { showToast } = useToast();

  const [user] = useState({
    anonymousId:
      sessionStorage.getItem("privatevoice_anonymous_id") || "Anonymous User",
  });

  const [suggestions, setSuggestions] = useState([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Facilities");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);

  // Auto-expire suggestions after 24 hours
  useAutoExpire(
    suggestions,
    setSuggestions,
    (suggestion) => suggestion.createdAt
  );

  const normalizeStatus = (status) => {
    switch (status) {
      case "PENDING":
        return "Submitted";
      case "REVIEWED":
      case "IN_REVIEW":
        return "Under Review";
      case "ACCEPTED":
        return "Accepted";
      case "REJECTED":
        return "Rejected";
      case "IMPLEMENTED":
        return "Implemented";
      default:
        return status || "Submitted";
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      const data = await suggestionService.getSuggestions();

      const normalized = (data.suggestions || []).map((suggestion) => ({
        ...suggestion,
        subject:
          suggestion.title ||
          suggestion.subject ||
          "Untitled suggestion",
        status: normalizeStatus(suggestion.status),
        category: suggestion.category || category,
      }));

      setSuggestions(normalized);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
      showToast(err.message || "Failed to load suggestions.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribeNew = subscribeToNewSuggestion((suggestion) => {
      setSuggestions((previous) => {
        if (previous.some((s) => s.id === suggestion.id)) return previous;

        const normalized = {
          ...suggestion,
          subject: suggestion.title || "Untitled suggestion",
          status: normalizeStatus(suggestion.status),
          category: suggestion.category || category,
        };

        return [normalized, ...previous];
      });
    });

    const unsubscribeUpdated = subscribeToSuggestionUpdated((payload) => {
      setSuggestions((previous) =>
        previous.map((s) =>
          s.id === payload.id
            ? {
              ...s,
              status: normalizeStatus(payload.status),
              response: payload.response ?? s.response,
            }
            : s
        )
      );
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!subject.trim() || !description.trim()) return;

    try {
      setSubmitting(true);

      await suggestionService.createSuggestion({
        title: subject.trim(),
        description: description.trim(),
        category,
      });

      setSubject("");
      setCategory("Facilities");
      setDescription("");
      setShowForm(false);

      showToast("Idea shared with your organization.", "success");

      await fetchSuggestions();
    } catch (err) {
      console.error("Suggestion submission failed:", err);
      showToast(err.message || "Could not submit suggestion.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Accepted":
        return "border-[#D9E8DF] bg-[#F1F8F4] text-[#4E7666]";

      case "Implemented":
        return "border-[#D7E5DD] bg-[#EDF6F1] text-[#4A725F]";

      case "Under Review":
        return "border-[#E7DDCA] bg-[#FBF7EF] text-[#80683F]";

      case "Rejected":
        return "border-[#E9DDDA] bg-[#FBF4F2] text-[#8A625B]";

      default:
        return "border-[#DCE7E2] bg-[#F5FAF7] text-[#557267]";
    }
  };

  return (
    <div className="max-w-[1050px] animate-[suggestionFade_0.45s_ease-out]">

      {/* HERO */}

      <section className="relative overflow-hidden rounded-2xl border border-[#E3E8E5] bg-gradient-to-br from-[#F5FAF7] via-white to-[#F8F5EE] px-6 py-7 shadow-[0_10px_35px_rgba(48,65,58,0.035)] sm:px-8 sm:py-8">

        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#E7F1EC] opacity-80" />

        <div className="pointer-events-none absolute -bottom-20 -left-14 h-40 w-40 rounded-full bg-[#F4EBDD] opacity-70" />

        <div className="relative">

          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#78958B]" />

            <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">
              Suggestions
            </span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <h1 className="text-[29px] font-semibold tracking-[-0.7px] text-[#202725] sm:text-[35px]">
                Ideas that could make things better
              </h1>

              <p className="mt-3 max-w-[680px] text-[13px] leading-6 text-[#5B6863]">
                Share ideas, improvements, or practical changes anonymously.
                Every suggestion gives your organization another perspective to
                consider.
              </p>
            </div>

            <div className="flex w-fit shrink-0 items-center gap-3 rounded-xl border border-[#DFE8E3] bg-[#F7FAF8] px-3.5 py-2.5">

              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5EFEA] text-[#557267]">
                <Lightbulb size={13} />
              </span>

              <div>
                <p className="text-[11px] font-semibold text-[#3D4844]">
                  Anonymous by default
                </p>

                <p className="mt-0.5 text-[10px] text-[#7C8985]">
                  {user.anonymousId}
                </p>
              </div>

            </div>

          </div>

          <div className="mt-5 flex items-center gap-2 text-[11px] text-[#6E7B76]">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#78958B]" />

            <span>
              Your real identity is never displayed to other members.
            </span>

          </div>

        </div>
      </section>


      {/* COMPACT FORM */}

      <section className="mt-7">

        <div className="mb-3 flex items-end justify-between">

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">
              Your voice
            </p>

            <h2 className="mt-1 text-[19px] font-semibold text-[#2B3532]">
              Share an idea
            </h2>
          </div>

          <span className="hidden text-[11px] text-[#8D9994] sm:block">
            Anonymous suggestions
          </span>

        </div>


        {/* FORM TOGGLE */}

        <button
          type="button"
          onClick={() => setShowForm((previous) => !previous)}
          className={`group flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-all duration-300 ${showForm
              ? "border-[#C9D9D2] bg-[#F5F9F7] shadow-[0_8px_24px_rgba(48,65,58,0.035)]"
              : "border-[#E1E7E4] bg-white hover:border-[#C9D6D0] hover:bg-[#FAFCFB] hover:shadow-[0_8px_22px_rgba(48,65,58,0.035)]"
            }`}
        >

          <div className="flex items-center gap-3">

            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF2EE] text-[#557267] transition-transform duration-300 group-hover:scale-105">
              <Lightbulb size={16} />
            </span>

            <div>
              <p className="text-[12px] font-semibold text-[#3D4844]">
                {showForm ? "Write your suggestion" : "Have an idea to share?"}
              </p>

              <p className="mt-0.5 text-[10px] text-[#8D9994]">
                {showForm
                  ? "Keep it clear and practical."
                  : "Open the form and tell us what could be better."}
              </p>
            </div>

          </div>

          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#78958B] shadow-sm">
            {showForm ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </span>

        </button>


        {/* EXPANDED FORM */}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-3 rounded-xl border border-[#E1E7E4] bg-white p-5 shadow-[0_8px_25px_rgba(48,65,58,0.03)] sm:p-6"
          >

            <div className="grid gap-5 md:grid-cols-[1fr_190px]">

              <div>
                <label className="text-[12px] font-semibold text-[#3D4844]">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={100}
                  placeholder="Briefly describe your idea"
                  className="mt-2 w-full rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3.5 py-3 text-[13px] text-[#3D4844] outline-none transition-all placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:bg-white focus:ring-2 focus:ring-[#EAF1EE]"
                />
              </div>


              <div>
                <label className="text-[12px] font-semibold text-[#3D4844]">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3.5 py-3 text-[13px] text-[#3D4844] outline-none transition-all focus:border-[#AFC2B9] focus:bg-white focus:ring-2 focus:ring-[#EAF1EE]"
                >
                  <option>Facilities</option>
                  <option>Communication</option>
                  <option>Workplace</option>
                  <option>Learning</option>
                  <option>Process</option>
                  <option>Other</option>
                </select>
              </div>

            </div>


            <div className="mt-5">

              <div className="flex items-center justify-between">

                <label className="text-[12px] font-semibold text-[#3D4844]">
                  Your idea
                </label>

                <span className="text-[10px] text-[#8D9994]">
                  {description.length}/500
                </span>

              </div>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell us a little more about your idea..."
                className="mt-2 w-full resize-none rounded-lg border border-[#E1E7E4] bg-[#FAFBFA] px-3.5 py-3 text-[13px] leading-5 text-[#3D4844] outline-none transition-all placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:bg-white focus:ring-2 focus:ring-[#EAF1EE]"
              />

            </div>


            <div className="mt-4 flex flex-col gap-3 border-t border-[#EEF1EF] pt-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2 text-[10px] text-[#8D9994]">
                <CheckCircle2 size={13} className="text-[#78958B]" />
                <span>Your identity will remain anonymous.</span>
              </div>

              <button
                type="submit"
                disabled={
                  !subject.trim() ||
                  !description.trim() ||
                  submitting
                }
                className="rounded-lg bg-[#718F84] px-5 py-2.5 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5F7D72] hover:shadow-[0_8px_18px_rgba(95,125,114,0.18)] disabled:cursor-not-allowed disabled:bg-[#BFCBC5] disabled:shadow-none"
              >
                {submitting ? "Sharing..." : "Share idea"}
              </button>

            </div>

          </form>
        )}

      </section>


      {/* SUGGESTION FEED */}

      <section className="mt-10">

        <div className="mb-4 flex items-end justify-between border-b border-[#DDE3E0] pb-4">

          <div>

            <div className="flex items-center gap-2">

              <span className="h-[2px] w-6 bg-[#B79A6A]" />

              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">
                Idea board
              </p>

            </div>

            <h2 className="mt-1 text-[20px] font-semibold text-[#2B3532]">
              Ideas from your organization
            </h2>

            <p className="mt-1 text-[11px] text-[#8D9994]">
              Suggestions shared anonymously by members
            </p>

          </div>

          <span className="shrink-0 text-[11px] text-[#8D9994]">
            {suggestions.length} idea
            {suggestions.length !== 1 ? "s" : ""}
          </span>

        </div>


        {/* IDEA FEED BACKGROUND */}

        <div className="rounded-2xl border border-[#E4E8E5] bg-[#F7F9F7] p-3 sm:p-4">

          {loading && (
            <div className="rounded-xl border border-[#E1E7E4] bg-white px-5 py-8 text-center">

              <div className="mx-auto h-6 w-6 animate-pulse rounded-full bg-[#E2ECE7]" />

              <p className="mt-3 text-[11px] text-[#8D9994]">
                Loading suggestions...
              </p>

            </div>
          )}


          {!loading && suggestions.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#D5DFDA] bg-white px-6 py-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF4F1] text-[#78958B]">
                <Lightbulb size={20} />
              </div>

              <h3 className="mt-4 text-[14px] font-semibold text-[#3D4844]">
                No ideas yet
              </h3>

              <p className="mt-2 text-[12px] text-[#8D9994]">
                Be the first person to suggest an improvement.
              </p>

            </div>
          )}


          <div className="space-y-3">

            {suggestions.map((suggestion, index) => (

              <article
                key={suggestion.id}
                className="group relative overflow-hidden rounded-xl border border-[#E1E7E4] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9D6D0] hover:shadow-[0_12px_28px_rgba(48,65,58,0.055)]"
                style={{
                  animation: "suggestionCardIn 0.4s ease-out both",
                  animationDelay: `${index * 60}ms`,
                }}
              >

                {/* LEFT ACCENT */}

                <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#C5A77A] opacity-60 transition-all duration-300 group-hover:opacity-100" />


                <div className="p-4 pl-5 sm:p-5 sm:pl-6">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0 flex-1">

                      {/* META */}

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.8px] text-[#8D9994]">
                          <Lightbulb size={11} />
                          Idea #{String(suggestion.id).slice(-3)}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-[#C5A77A]" />

                        <span className="rounded-full bg-[#F6F1E8] px-2 py-0.5 text-[9px] font-semibold text-[#806B49]">
                          {suggestion.category}
                        </span>

                        {suggestion.createdAt && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#C5A77A]" />

                            <span className="flex items-center gap-1 text-[10px] text-[#8D9994]">
                              <Clock3 size={10} />
                              {formatRelativeTime(suggestion.createdAt)}
                            </span>
                          </>
                        )}

                      </div>


                      {/* TITLE */}

                      <h3 className="mt-2 text-[14px] font-semibold leading-5 text-[#34413C] transition-colors group-hover:text-[#557267]">
                        {suggestion.subject}
                      </h3>


                      {/* RESPONSE */}

                      {suggestion.response && (
                        <div className="mt-3 rounded-lg border border-[#E2EAE6] bg-[#F7FAF8] px-3 py-2.5">

                          <div className="flex items-center gap-1.5">

                            <MessageCircle
                              size={11}
                              className="text-[#78958B]"
                            />

                            <p className="text-[10px] font-semibold text-[#4B5A54]">
                              Response from authority
                            </p>

                          </div>

                          <p className="mt-1 text-[11px] leading-5 text-[#66736E]">
                            {suggestion.response}
                          </p>

                        </div>
                      )}

                    </div>


                    {/* STATUS */}

                    <span
                      className={`w-fit shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${getStatusStyle(
                        suggestion.status
                      )}`}
                    >
                      {suggestion.status}
                    </span>

                  </div>

                </div>

              </article>

            ))}

          </div>

        </div>

      </section>


      {/* FOOTER PRINCIPLE */}

      <section className="mt-10 border-t border-[#E2E7E4] py-7">

        <div className="flex flex-col items-center justify-center gap-2 text-center">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#78958B]" />

            <span className="text-[11px] font-medium text-[#5B6863]">
              Every idea deserves to be heard
            </span>

          </div>

          <p className="max-w-[500px] text-[10px] leading-5 text-[#8D9994]">
            Users can speak anonymously. Officials must speak transparently.
          </p>

        </div>

      </section>


      <style>{`
        @keyframes suggestionFade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes suggestionCardIn {
          from {
            opacity: 0;
            transform: translateY(8px);
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

export default Suggestions;