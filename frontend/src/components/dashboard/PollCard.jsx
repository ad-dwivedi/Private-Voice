import React, { useState } from "react";

function PollCard({ poll }) {
  const [selectedOption, setSelectedOption] = useState("");
  const [hasVoted, setHasVoted] = useState(false);

  if (!poll) {
    return (
      <div className="border border-[#E5E7E6] bg-white p-6">
        <p className="text-[11px] text-[#8991A0]">
          No active poll available.
        </p>
      </div>
    );
  }

  const options = poll.options || [];

  const handleVote = () => {
    if (!selectedOption) return;

    /*
     * Later this action will call the backend:
     *
     * POST /api/polls/:pollId/vote
     *
     * The UI structure will remain the same.
     */

    setHasVoted(true);
  };

  return (
    <article className="border border-[#E5E7E6] bg-white p-5 shadow-[0_8px_25px_rgba(30,35,35,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CDD6D3] hover:shadow-[0_12px_30px_rgba(30,35,35,0.06)] sm:p-6">
      
      {/* Header */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2F1] text-[13px] text-[#6F8580]">
            ◉
          </div>

          <div>
            <p className="text-[10px] font-bold text-[#20252B]">
              Active Poll
            </p>

            <p className="mt-1 text-[8px] text-[#8991A0]">
              Anonymous voting
            </p>
          </div>
        </div>

        {/* Expiry */}

        <span className="whitespace-nowrap rounded-full bg-[#F5F7F6] px-2.5 py-1 text-[8px] font-semibold text-[#6F8580]">
          Ends {poll.expiresIn || "soon"}
        </span>
      </div>

      {/* Question */}

      <div className="mt-5">
        <h3 className="text-[13px] font-semibold leading-[1.5] text-[#20252B]">
          {poll.question}
        </h3>

        <p className="mt-1.5 text-[9px] text-[#8991A0]">
          Choose one option.
        </p>
      </div>

      {/* Options */}

      {!hasVoted ? (
        <div className="mt-5 space-y-2">
          {options.map((option, index) => {
            const optionId = `${poll.id || "poll"}-${index}`;

            return (
              <label
                key={optionId}
                className={`group flex cursor-pointer items-center gap-3 border px-3 py-2.5 transition-all duration-200 ${
                  selectedOption === option
                    ? "border-[#6F8580] bg-[#EEF2F1]"
                    : "border-[#E5E7E6] bg-[#FAFAFA] hover:border-[#CDD6D3] hover:bg-[#F5F7F6]"
                }`}
              >
                <input
                  type="radio"
                  name={`poll-${poll.id || "active"}`}
                  value={option}
                  checked={selectedOption === option}
                  onChange={(event) =>
                    setSelectedOption(event.target.value)
                  }
                  className="h-3 w-3 accent-[#6F8580]"
                />

                <span
                  className={`text-[10px] font-medium transition-colors ${
                    selectedOption === option
                      ? "text-[#6F8580]"
                      : "text-[#56606A]"
                  }`}
                >
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        /* After voting */

        <div className="mt-5 border border-[#E5E7E6] bg-[#FAFAFA] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF2F1] text-[10px] font-bold text-[#6F8580]">
              ✓
            </span>

            <div>
              <p className="text-[10px] font-semibold text-[#56606A]">
                Vote submitted
              </p>

              <p className="mt-0.5 text-[8px] text-[#8991A0]">
                Your response has been recorded anonymously.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vote Button */}

      {!hasVoted && (
        <button
          type="button"
          disabled={!selectedOption}
          onClick={handleVote}
          className={`mt-5 w-full rounded-[6px] px-4 py-2.5 text-[10px] font-bold transition-all duration-200 ${
            selectedOption
              ? "bg-[#6F8580] text-white hover:-translate-y-0.5 hover:bg-[#5F7671] hover:shadow-sm"
              : "cursor-not-allowed bg-[#EEF2F1] text-[#A1AAA7]"
          }`}
        >
          Vote anonymously
        </button>
      )}

      {/* Footer */}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[8px] text-[#8991A0]">
          Your identity is not displayed
        </span>

        {hasVoted && (
          <span className="text-[8px] font-semibold text-[#6F8580]">
            Thank you for voting
          </span>
        )}
      </div>
    </article>
  );
}

export default PollCard;