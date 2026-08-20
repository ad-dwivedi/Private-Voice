import { useEffect, useState } from "react";
import { useAutoExpire } from "../hooks/useAutoExpire";
import { HelpCircle, Check } from "lucide-react";
import {
  pollService,
  subscribeToNewPoll,
  subscribeToPollVoted,
  subscribeToPollClosed,
} from "../services/pollService";
import { useToast } from "../components/ui/UIProvider";

function Polls() {
  const { showToast } = useToast();

  const [polls, setPolls] = useState([]);
  useAutoExpire(polls, setPolls, (p) => p.createdAt);

  const [selectedOptions, setSelectedOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState(null);
  const userRole = sessionStorage.getItem("privatevoice_role") || "";

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const data = await pollService.getPolls();
      setPolls(data.polls || []);
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      showToast(err.message || "Unable to load polls.", "error");
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  useEffect(() => {
    const unsubscribeNew = subscribeToNewPoll((poll) => {
      setPolls((previous) => {
        if (previous.some((p) => p.id === poll.id)) return previous;
        return [poll, ...previous];
      });
      showToast("A new poll was posted.", "success");
    });

    const unsubscribeVoted = subscribeToPollVoted(({ pollId, optionVotes, totalVotes }) => {
      setPolls((previous) =>
        previous.map((poll) => {
          if (poll.id !== pollId) return poll;
          return {
            ...poll,
            totalVotes,
            options: poll.options.map((option) => {
              const match = optionVotes.find((ov) => ov.id === option.id);
              return match ? { ...option, votes: match.votes } : option;
            }),
          };
        })
      );
    });

    const unsubscribeClosed = subscribeToPollClosed(({ pollId }) => {
      setPolls((previous) => previous.map((poll) => (poll.id === pollId ? { ...poll, isActive: false } : poll)));
    });

    return () => {
      unsubscribeNew();
      unsubscribeVoted();
      unsubscribeClosed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (pollId, optionId) => {
    const poll = polls.find((item) => item.id === pollId);
    if (!poll || poll.hasVoted) return;

    setSelectedOptions((previous) => ({ ...previous, [pollId]: optionId }));
  };

  const handleVote = async (pollId) => {
    const selectedOptionId = selectedOptions[pollId];
    if (!selectedOptionId) return;

    try {
      setVotingPollId(pollId);
      await pollService.votePoll(pollId, selectedOptionId);

      setPolls((previous) => previous.map((poll) => (poll.id === pollId ? { ...poll, hasVoted: true } : poll)));

      setSelectedOptions((previous) => {
        const next = { ...previous };
        delete next[pollId];
        return next;
      });

      showToast("Vote submitted.", "success");
    } catch (err) {
      console.error("Failed to vote:", err);
      showToast(err.message || "Failed to submit vote.", "error");
    } finally {
      setVotingPollId(null);
    }
  };

  const handleClosePoll = async (pollId) => {
    if (userRole !== "admin") return;

    try {
      setVotingPollId(pollId);
      await pollService.closePoll(pollId);
      setPolls((previous) => previous.map((poll) => (poll.id === pollId ? { ...poll, isActive: false } : poll)));
      showToast("Poll closed.", "success");
    } catch (err) {
      console.error("Failed to close poll:", err);
      showToast(err.message || "Failed to close poll.", "error");
    } finally {
      setVotingPollId(null);
    }
  };

  const getPercentage = (votes, totalVotes) => {
    if (!totalVotes) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className="max-w-[1050px]">

      <section className="relative overflow-hidden rounded-2xl border border-[#E3E8E5] bg-white px-7 py-8 shadow-[0_10px_35px_rgba(48,65,58,0.035)] sm:px-9 sm:py-9">

        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#EEF4F1]" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#F6F0E7]" />

        <div className="relative">

          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#78958B]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Polls</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.6px] text-[#202725] sm:text-[32px]">Make your voice count.</h1>
              <p className="mt-3 max-w-[650px] text-[13px] leading-6 text-[#5B6863]">
                Share your opinion anonymously and see what your organization thinks.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-[#E1E8E4] bg-[#F7FAF8] px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#78958B]" />
              <span className="text-[11px] text-[#4F5D57]">Anonymous voting</span>
            </div>
          </div>

        </div>

      </section>

      {loading ? (
        <section className="mt-9 flex min-h-[200px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DCE5E1] border-t-[#6F8580]" />
            <p className="mt-4 text-[12px] text-[#6E7B76]">Loading polls...</p>
          </div>
        </section>
      ) : (
        <>

          <section className="mt-9">

            <div className="mb-5 flex items-end justify-between border-b border-[#DDE3E0] pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">Active polls</p>
                <h2 className="mt-1 text-[20px] font-semibold text-[#2B3532]">What do people think?</h2>
              </div>
              <span className="text-[11px] text-[#8D9994]">{polls.length} poll{polls.length !== 1 ? "s" : ""}</span>
            </div>

            {polls.length === 0 ? (
              <div className="rounded-xl border border-[#E3E8E5] bg-white p-8 text-center">
                <HelpCircle size={22} className="mx-auto text-[#9FADA7]" />
                <p className="mt-3 text-[13px] text-[#6E7B76]">No active polls at the moment. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-5">

                {polls.map((poll) => {

                  const selectedOption = selectedOptions[poll.id];

                  return (
                    <article
                      key={poll.id}
                      className="group relative overflow-hidden rounded-xl border border-[#E1E7E4] bg-white p-6 shadow-[0_8px_25px_rgba(48,65,58,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C8D5CF] hover:shadow-[0_16px_35px_rgba(48,65,58,0.07)] sm:p-7"
                    >

                      <div className="absolute left-0 top-0 h-full w-[3px] bg-[#78958B] transition-all duration-300 group-hover:w-[5px]" />

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF4F1] text-[#557267]">
                            <HelpCircle size={15} />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold text-[#4F5D57]">Anonymous poll</p>
                            <p className="mt-0.5 text-[10px] text-[#8D9994]">{poll.isActive ? "Active" : "Closed"}</p>
                          </div>
                        </div>

                        {poll.expiresAt && (
                          <span className="rounded-full border border-[#E8E0D3] bg-[#FBF8F2] px-3 py-1.5 text-[10px] font-medium text-[#7C6540]">
                            Expires: {new Date(poll.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-6 max-w-[720px] text-[17px] font-semibold leading-7 text-[#2B3532] sm:text-[19px]">
                        {poll.title || "Poll Question"}
                      </h3>

                      {poll.description && <p className="mt-2 text-[13px] text-[#6E7B76]">{poll.description}</p>}

                      <div className="mt-6 space-y-2.5">
                        {(poll.options || []).map((option) => {
                          const isSelected = selectedOption === option.id;
                          const percentage = getPercentage(option.votes, poll.totalVotes);

                          return (
                            <button
                              key={option.id}
                              type="button"
                              disabled={poll.hasVoted || !poll.isActive}
                              onClick={() => handleSelect(poll.id, option.id)}
                              className={`relative w-full overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-200 ${poll.hasVoted
                                ? "cursor-default border-[#E3E8E5] bg-[#FAFBFA]"
                                : isSelected
                                  ? "border-[#9FB8AD] bg-[#F1F7F4] shadow-[0_4px_15px_rgba(48,65,58,0.05)]"
                                  : "border-[#E3E8E5] bg-white hover:-translate-y-0.5 hover:border-[#B9CCC3] hover:bg-[#F8FBF9]"
                                }`}
                            >

                              {poll.hasVoted && (
                                <div
                                  className="absolute inset-y-0 left-0 bg-[#EEF4F1] transition-all duration-700"
                                  style={{ width: `${percentage}%` }}
                                />
                              )}

                              <div className="relative flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-[#78958B] bg-[#78958B] text-white" : "border-[#CBD8D2] bg-white text-transparent"
                                      }`}
                                  >
                                    <Check size={11} strokeWidth={3} />
                                  </span>

                                  <span className="text-[12px] font-medium text-[#3D4844]">{option.option_text || option.text}</span>
                                </div>

                                {poll.hasVoted && (
                                  <span className="text-[11px] font-semibold text-[#4B6D62]">{percentage}%</span>
                                )}
                              </div>

                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 border-t border-[#EEF1EF] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#6E7B76]">{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}</span>

                          {poll.hasVoted && (
                            <span className="text-[11px] font-medium text-[#4B6D62]">✓ Your response has been recorded</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {userRole === "admin" && poll.isActive && (
                            <button
                              type="button"
                              disabled={votingPollId === poll.id}
                              onClick={() => handleClosePoll(poll.id)}
                              className="text-[11px] font-medium text-[#94655D] transition-colors hover:text-[#7C5850] disabled:opacity-50"
                            >
                              Close
                            </button>
                          )}

                          {!poll.hasVoted && poll.isActive && (
                            <button
                              type="button"
                              disabled={!selectedOption || votingPollId === poll.id}
                              onClick={() => handleVote(poll.id)}
                              className="rounded-lg bg-[#718F84] px-5 py-2.5 text-[11px] font-semibold text-white transition-all duration-200 hover:bg-[#5F7D72] hover:shadow-[0_5px_15px_rgba(48,65,58,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {votingPollId === poll.id ? "Submitting..." : "Submit vote"}
                            </button>
                          )}
                        </div>
                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>

        </>
      )}

      <section className="mt-10 border-t border-[#E2E7E4] pb-5 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF2EE] text-[#557267]">
              <Check size={13} strokeWidth={2.5} />
            </span>
            <p className="text-[11px] text-[#6E7B76]">Your vote is anonymous and cannot be linked to your real identity.</p>
          </div>
          <p className="text-[11px] text-[#8D9994]">PrivateVoice · Speak Freely. Stay Private.</p>
        </div>
      </section>

    </div>
  );
}

export default Polls;