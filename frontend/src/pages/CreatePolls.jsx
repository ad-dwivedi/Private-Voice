import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Check, Plus, X } from "lucide-react";
import { pollService } from "../services/pollService";
import { useToast } from "../components/ui/UIProvider";

function CreatePolls() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const role = sessionStorage.getItem("privatevoice_role") || "member";
    if (role !== "admin") {
      navigate("/dashboard");
    }
  }, [navigate]);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (options.length < 5) setOptions([...options, ""]);
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, optionIndex) => optionIndex !== index));
  };

  const handleCreatePoll = async () => {
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);

    if (!cleanQuestion) {
      showToast("Please enter a poll question.", "error");
      return;
    }

    if (cleanOptions.length < 2) {
      showToast("Please provide at least 2 options.", "error");
      return;
    }

    try {
      setLoading(true);

      await pollService.createPoll({
        title: cleanQuestion,
        options: cleanOptions,
      });

      setQuestion("");
      setOptions(["", ""]);
      setCreated(true);
      showToast("Poll created and published to your organization.", "success");

      setTimeout(() => setCreated(false), 3000);
    } catch (err) {
      console.error("Failed to create poll:", err);
      showToast(err.message || "Failed to create poll.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isValid = question.trim() && options.filter((option) => option.trim()).length >= 2;

  return (
    <div className="mx-auto w-full max-w-[900px] pb-12">

      <section className="relative overflow-hidden rounded-2xl border border-[#E1E7E4] bg-white px-6 py-7 shadow-[0_10px_35px_rgba(48,65,58,0.04)] sm:px-9 sm:py-9">

        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#EEF4F1]" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-[#F6F0E7]" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2EE] text-[#557267] shadow-sm">
              <BarChart3 size={20} />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Community poll</p>
              <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.7px] text-[#202725] sm:text-[34px]">Create a poll</h1>
            </div>
          </div>

          <p className="mt-4 max-w-[600px] text-[13px] leading-6 text-[#4F5D57]">
            Ask your organization a question and let members share their opinion anonymously.
          </p>
        </div>

      </section>

      {created ? (
        <section className="mt-7 animate-[pollSuccess_0.4s_ease-out] rounded-2xl border border-[#DCE7E2] bg-white p-8 text-center shadow-[0_12px_30px_rgba(48,65,58,0.04)]">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF2EE] text-[#557267]">
            <Check size={23} strokeWidth={2.5} />
          </div>

          <h2 className="mt-5 text-[18px] font-semibold text-[#202725]">Poll created successfully</h2>

          <p className="mx-auto mt-2 max-w-[430px] text-[12px] leading-5 text-[#6E7B76]">
            Your poll is ready. Members can now participate and share their opinion anonymously.
          </p>

          <button
            type="button"
            onClick={() => {
              setQuestion("");
              setOptions(["", ""]);
              setCreated(false);
            }}
            className="mt-6 rounded-lg bg-[#718F84] px-5 py-2.5 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5F7D72] hover:shadow-[0_8px_18px_rgba(95,125,114,0.2)]"
          >
            Create another poll
          </button>

        </section>
      ) : (
        <section className="mt-7">

          <div className="group rounded-xl border border-[#E1E7E4] bg-white p-6 shadow-[0_8px_25px_rgba(48,65,58,0.025)] transition-all duration-300 hover:border-[#CBD9D3] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">01 · Question</p>
                <h2 className="mt-1 text-[17px] font-semibold text-[#202725]">What would you like to ask?</h2>
              </div>
            </div>

            <textarea
              value={question}
              maxLength={180}
              rows={3}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. What should we improve in our organization?"
              className="mt-5 w-full resize-none rounded-xl border border-[#E1E7E4] bg-[#FAFBFA] px-4 py-3.5 text-[13px] leading-6 text-[#3D4844] outline-none transition-all duration-200 placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:bg-white focus:ring-4 focus:ring-[#EEF4F1]"
            />

            <div className="mt-2 text-right text-[10px] text-[#8D9994]">{question.length}/180</div>
          </div>

          <div className="mt-5 rounded-xl border border-[#E1E7E4] bg-white p-6 shadow-[0_8px_25px_rgba(48,65,58,0.025)] sm:p-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">02 · Options</p>
                <h2 className="mt-1 text-[17px] font-semibold text-[#202725]">Give members a choice</h2>
              </div>
              <span className="text-[10px] text-[#8D9994]">{options.length}/5</span>
            </div>

            <div className="mt-5 space-y-3">
              {options.map((option, index) => (
                <div key={index} className="group/option flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F5F2] text-[11px] font-semibold text-[#557267] transition-all duration-200 group-hover/option:bg-[#E4EEE9]">
                    {index + 1}
                  </div>

                  <input
                    type="text"
                    value={option}
                    maxLength={100}
                    onChange={(event) => updateOption(index, event.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 rounded-xl border border-[#E1E7E4] bg-[#FAFBFA] px-4 py-3 text-[13px] text-[#3D4844] outline-none transition-all duration-200 placeholder:text-[#9AA4A0] focus:border-[#AFC2B9] focus:bg-white focus:ring-4 focus:ring-[#EEF4F1]"
                  />

                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#A5AFAB] opacity-60 transition-all duration-200 hover:bg-[#FBF4F2] hover:text-[#94655D] hover:opacity-100"
                      aria-label={`Remove option ${index + 1}`}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-[#C9D8D1] px-3.5 py-2.5 text-[11px] font-medium text-[#557267] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#78958B] hover:bg-[#F7FAF8] hover:text-[#3B5A50]"
              >
                <Plus size={14} />
                Add another option
              </button>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-[#E6E0D6] bg-[#FCFAF6] p-6 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C5A77A]" />
              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#84693F]">Preview</p>
            </div>

            <div className="mt-4">
              <p className="text-[14px] font-semibold text-[#3D4844]">{question.trim() || "Your poll question will appear here"}</p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-[#E7E2D9] bg-white px-4 py-3 transition-all duration-200 hover:border-[#CFC3B2] hover:translate-x-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#CFCBC3] text-[9px] text-[#8D8880]">
                      {index + 1}
                    </span>
                    <span className="truncate text-[11px] text-[#6E7B76]">{option.trim() || `Option ${index + 1}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#E2E7E4] pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF2EE] text-[#557267]">
                <Check size={11} strokeWidth={2.5} />
              </span>
              <p className="text-[11px] text-[#6E7B76]">Members can vote anonymously.</p>
            </div>

            <button
              type="button"
              disabled={!isValid || loading}
              onClick={handleCreatePoll}
              className="group flex items-center gap-3 rounded-xl bg-[#718F84] px-6 py-3 text-[12px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#5F7D72] hover:shadow-[0_10px_24px_rgba(95,125,114,0.22)] disabled:cursor-not-allowed disabled:bg-[#BFCBC5] disabled:shadow-none"
            >
              {loading ? "Creating..." : "Create poll"}
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>

        </section>
      )}

      <div className="mt-7 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#78958B]" />
        <p className="text-[11px] text-[#8D9994]">Polls are part of your private organization space.</p>
      </div>

      <style>{`
        @keyframes pollSuccess {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

    </div>
  );
}

export default CreatePolls;