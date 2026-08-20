import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, MessageSquareOff, Send, X, Lock } from "lucide-react";

import {
  sendMessage,
  deleteMessage,
  subscribeToMessages,
  subscribeToMessageDeleted,
  subscribeToOnline,
  subscribeToOffline,
  subscribeToConnectionError,
  getChatHistory,
  getConversations,
} from "../services/chatService";

import { authorityService } from "../services/authorityService";
import { formatRelativeTime } from "../utils/time";
import { useToast, useConfirm } from "../components/ui/UIProvider";
import { useAutoExpire } from "../hooks/useAutoExpire";

function AuthorityChat() {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const token = sessionStorage.getItem("privatevoice_token");
  const currentUserId = Number(sessionStorage.getItem("privatevoice_user_id"));
  const role = sessionStorage.getItem("privatevoice_role") || "member";
  const myAnonymousId = sessionStorage.getItem("privatevoice_anonymous_id") || "Anonymous";
  const myFullName = sessionStorage.getItem("privatevoice_full_name") || "Admin";

  const [options, setOptions] = useState([]);
  const [isPrivileged, setIsPrivileged] = useState(role === "admin");
  const [selectedId, setSelectedId] = useState(null);
  const [onlineIds, setOnlineIds] = useState(new Set());

  const [messages, setMessages] = useState([]);
  useAutoExpire(messages, setMessages, (m) => m.createdAt);

  const [message, setMessage] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [connectionError, setConnectionError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);

        if (!token) {
          showToast("Authentication required. Please login again.", "error");
          setLoadingOptions(false);
          return;
        }

        const authorityData = await authorityService.getAuthorities();
        const authorities = authorityData.authorities || [];

        const selfIsAuthority = authorities.some((item) => Number(item.userId) === currentUserId);
        const privileged = role === "admin" || selfIsAuthority;

        if (cancelled) return;
        setIsPrivileged(privileged);

        if (privileged) {
          const conversationData = await getConversations();
          const conversations = conversationData.conversations || [];

          if (cancelled) return;

          setOptions(
            conversations.map((item) => ({
              id: item.memberId,
              label: item.anonymousId,
              subLabel: "Anonymous member",
            }))
          );

          if (conversations.length > 0) setSelectedId(conversations[0].memberId);
        } else {
          setOptions(
            authorities.map((item) => ({
              id: item.userId,
              label: item.displayName,
              subLabel: item.authorityType,
            }))
          );

          if (authorities.length > 0) setSelectedId(authorities[0].userId);
        }
      } catch (err) {
        console.error("Failed to load chat options.");
        if (!cancelled) showToast("Unable to load chat contacts.", "error");
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };

    loadOptions();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribeConnectError = subscribeToConnectionError(() => {
      console.error("Socket connection error.");
      setConnectionError("Could not connect to chat. Please refresh the page or login again.");
    });

    const unsubscribeOnline = subscribeToOnline(({ userId }) => {
      setOnlineIds((previous) => new Set(previous).add(Number(userId)));
    });

    const unsubscribeOffline = subscribeToOffline(({ userId }) => {
      setOnlineIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(userId));
        return next;
      });
    });

    return () => {
      unsubscribeConnectError();
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMessages((incomingMessage) => {
      if (!incomingMessage) return;

      const otherId = incomingMessage.senderId === currentUserId ? incomingMessage.receiverId : incomingMessage.senderId;
      if (Number(otherId) !== Number(selectedId)) return;

      setMessages((previousMessages) => {
        const alreadyExists = previousMessages.some((item) => item.id && incomingMessage.id && item.id === incomingMessage.id);
        if (alreadyExists) return previousMessages;
        return [...previousMessages, incomingMessage];
      });
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, currentUserId]);

  useEffect(() => {
    const unsubscribe = subscribeToMessageDeleted((payload) => {
      if (!payload) return;
      setMessages((previousMessages) => previousMessages.filter((item) => item.id !== payload.id));
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const data = await getChatHistory(selectedId);
        if (!cancelled) setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load chat history.");
        if (!cancelled) showToast("Unable to load conversation history.", "error");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    loadHistory();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedOption = useMemo(
    () => options.find((item) => item.id === selectedId) || null,
    [options, selectedId]
  );

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending || !selectedId) return;
    if (text.length > 500) return;

    try {
      setSending(true);
      const response = await sendMessage(selectedId, text);

      if (!response?.success) {
        showToast(response?.message || "Message could not be sent.", "error");
        return;
      }

      setMessage("");
    } catch (err) {
      console.error("Message sending failed.");
      showToast(err?.message || "Message could not be sent. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    const ok = await confirm({
      title: "Delete this message?",
      message: "This cannot be undone.",
    });

    if (!ok) return;

    try {
      setDeletingId(messageId);
      const response = await deleteMessage(messageId);

      if (!response?.success) {
        showToast(response?.message || "Message could not be deleted.", "error");
        return;
      }

      setMessages((previousMessages) => previousMessages.filter((item) => item.id !== messageId));
    } catch (err) {
      console.error("Message deletion failed.");
      showToast(err?.message || "Message could not be deleted. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const online = selectedId ? onlineIds.has(Number(selectedId)) : false;

  return (
    <div className="mx-auto w-full max-w-[920px] animate-[chatPage_0.45s_ease-out]">

      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Private communication</p>
        <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.5px] text-[#202725]">Authority Chat</h1>
        <p className="mt-2 max-w-[600px] text-[13px] leading-5 text-[#6E7B76]">
          {isPrivileged
            ? "Reply privately to members who have contacted you. Only conversations from the last 24 hours are shown."
            : "Speak directly with a verified authority while keeping your identity anonymous."}
        </p>
      </div>

      {connectionError && (
        <div className="mb-4 rounded-lg border border-[#E6D2CF] bg-[#FFF9F8] px-4 py-3">
          <p className="text-[12px] text-[#94655D]">{connectionError}</p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#DDE6E1] bg-white shadow-[0_18px_50px_rgba(48,65,58,0.07)]">

        {!loadingOptions && options.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-[#E7ECE9] bg-[#FBFCFB] px-4 py-3">
            {options.map((item) => {
              const isActive = item.id === selectedId;
              const itemOnline = onlineIds.has(Number(item.id));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium transition-all duration-200 ${isActive ? "border-[#78958B] bg-[#EEF4F1] text-[#4B6D62]" : "border-[#E1E7E4] bg-white text-[#4F5D57] hover:border-[#C8D5CF]"
                    }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${itemOnline ? "bg-[#78958B]" : "bg-[#C3CCC8]"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {selectedId && (
          <header className="flex items-center justify-between border-b border-[#E7ECE9] bg-[#FBFCFB] px-5 py-4 sm:px-6">

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E4EFEA] text-[#557267]">
                  <ShieldCheck size={19} strokeWidth={1.8} />
                </div>
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${online ? "bg-[#78958B]" : "bg-[#B7BFBB]"}`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[13px] font-semibold text-[#2B3532]">{selectedOption?.label}</h2>
                  {!isPrivileged && (
                    <span className="rounded-full bg-[#EAF2EE] px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.7px] text-[#557267]">
                      Verified
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-[#7C8985]">{selectedOption?.subLabel || ""}</span>
                  <span className="h-1 w-1 rounded-full bg-[#C3CCC8]" />
                  <span className={`text-[10px] ${online ? "text-[#557267]" : "text-[#8D9994]"}`}>
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-[#E0E8E4] bg-white px-3 py-2 sm:flex">
              <Lock size={12} className="text-[#78958B]" />
              <span className="text-[10px] text-[#5B6863]">Private</span>
            </div>
          </header>
        )}

        {selectedId && (
          <div className="border-b border-[#E9EEEB] bg-[#F7FAF8] px-5 py-2.5 sm:px-6">
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E2EEE9] text-[#557267]">
                <ShieldCheck size={10} />
              </span>
              <p className="text-[10px] text-[#5B6863]">
                {isPrivileged ? (
                  <>Replying as <span className="font-semibold text-[#3D4844]">{myFullName}</span> · The member's identity stays anonymous</>
                ) : (
                  <>You're chatting as <span className="font-semibold text-[#3D4844]">{myAnonymousId}</span> · Your real identity is hidden</>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="relative h-[500px] overflow-y-auto bg-[#F7F9F8] px-4 py-6 sm:px-7">

          {(loadingOptions || loadingHistory) && (
            <div className="flex h-[350px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[#DCE6E1] border-t-[#78958B]" />
                <p className="text-[11px] text-[#6E7B76]">Loading...</p>
              </div>
            </div>
          )}

          {!loadingOptions && !loadingHistory && selectedId && messages.length === 0 && (
            <div className="flex h-[350px] items-center justify-center">
              <div className="max-w-[280px] text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF2EE] text-[#78958B]">
                  <MessageSquareOff size={17} />
                </div>
                <p className="text-[12px] font-medium text-[#3D4844]">No messages in the last 24 hours</p>
                <p className="mt-1 text-[10px] leading-4 text-[#8D9994]">Start the conversation.</p>
              </div>
            </div>
          )}

          {!loadingOptions && !loadingHistory && messages.length > 0 && (
            <div className="space-y-5">
              {messages.map((item, index) => {
                const isMine = Number(item.senderId) === currentUserId;
                const key = item.id || `${index}`;

                return (
                  <div key={key} className={`group flex animate-[messageAppear_0.3s_ease-out] ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex max-w-[82%] flex-col sm:max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                      <div className={`mb-1.5 flex items-center gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] font-semibold text-[#5B6863]">
                          {isMine ? "You" : selectedOption?.label || "Them"}
                        </span>
                        <span className="text-[9px] text-[#9AA4A0]">{formatRelativeTime(item.createdAt)}</span>
                      </div>

                      <div className="relative flex items-end gap-1.5">
                        {isMine && item.id && (
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            title="Delete message"
                            className="mb-1 hidden h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#B4A6A3] opacity-0 transition-all duration-150 hover:bg-[#FBF4F2] hover:text-[#94655D] group-hover:opacity-100 disabled:opacity-40 sm:flex"
                            aria-label="Delete message"
                          >
                            <X size={11} />
                          </button>
                        )}

                        <div
                          className={`relative rounded-2xl px-4 py-3 text-[12px] leading-[1.7] ${isMine
                              ? "rounded-br-[5px] bg-[#718F84] text-white shadow-[0_5px_15px_rgba(84,112,101,0.15)]"
                              : "rounded-bl-[5px] border border-[#E1E7E4] bg-white text-[#3D4844] shadow-[0_4px_14px_rgba(48,65,58,0.035)]"
                            }`}
                        >
                          {item.message}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {!loadingOptions && !selectedId && (
            <div className="flex h-[350px] items-center justify-center px-8">
              <div className="max-w-[320px] text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF2EE] text-[#78958B]">
                  <MessageSquareOff size={17} />
                </div>
                <p className="text-[12px] font-medium text-[#3D4844]">
                  {isPrivileged ? "No members have contacted you yet." : "No verified authorities are available in your organization yet."}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-[#8D9994]">
                  {isPrivileged ? "Once a member sends you a message, it will appear here." : "Check back once your organization admin has verified an authority."}
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedId && (
          <div className="border-t border-[#E6EBE8] bg-white p-4 sm:p-5">
            <div className="rounded-xl border border-[#DEE7E2] bg-[#FAFBFA] p-2 transition-all duration-200 focus-within:border-[#AFC2B9] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(234,241,238,0.8)]">
              <div className="flex items-end gap-2">
                <textarea
                  rows="1"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                  disabled={sending}
                  placeholder="Write a message..."
                  className="max-h-24 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[12px] leading-5 text-[#3D4844] outline-none placeholder:text-[#9AA4A0] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#718F84] text-white transition-all duration-200 hover:bg-[#5F7D72] hover:shadow-[0_6px_15px_rgba(84,112,101,0.18)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Send message"
                >
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between px-2 pb-1 pt-1">
                <span className="text-[9px] text-[#A0A9A5]">Press Enter to send · Shift + Enter for new line</span>
                <span className="text-[9px] text-[#A0A9A5]">{message.length}/500</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-col items-center justify-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#78958B]" />
          <p className="text-[10px] text-[#8D9994]">This conversation is anonymous and protected.</p>
        </div>
        <p className="text-[10px] italic text-[#9AA4A0]">"Users can speak anonymously. Officials must speak transparently."</p>
      </div>

      <style>{`
        @keyframes chatPage {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes messageAppear {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default AuthorityChat;