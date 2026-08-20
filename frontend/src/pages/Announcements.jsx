import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Megaphone,
  AlertTriangle,
  CalendarDays,
  Send,
  FileText,
} from "lucide-react";
import {
  announcementService,
  subscribeToNewAnnouncement,
  subscribeToAnnouncementUpdated,
} from "../services/announcementService";
import { formatRelativeTime } from "../utils/time";
import { useToast } from "../components/ui/UIProvider";
import { useAutoExpire } from "../hooks/useAutoExpire";

function Announcements() {
  const { showToast } = useToast();

  const userRole = sessionStorage.getItem("privatevoice_role") || "member";
  const isAdmin = userRole === "admin";

  const [announcements, setAnnouncements] = useState([]);
  useAutoExpire(announcements, setAnnouncements, (a) => a.createdAt);

  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [creating, setCreating] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      showToast(err.message || "Unable to load announcements.", "error");
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const unsubscribeNew = subscribeToNewAnnouncement((announcement) => {
      setAnnouncements((previous) => {
        if (previous.some((a) => a.id === announcement.id)) return previous;
        return [announcement, ...previous];
      });

      if (!isAdmin) {
        showToast(`New announcement: ${announcement.title}`, "success");
      }
    });

    const unsubscribeUpdated = subscribeToAnnouncementUpdated((updated) => {
      setAnnouncements((previous) => {
        const exists = previous.some((a) => a.id === updated.id);

        if (updated.status !== "published") {
          return previous.filter((a) => a.id !== updated.id);
        }

        if (!exists) return [updated, ...previous];

        return previous.map((a) =>
          a.id === updated.id ? { ...a, ...updated } : a
        );
      });
    });

    return () => {
      unsubscribeNew();
      unsubscribeUpdated();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) return;

    try {
      setCreating(true);

      await announcementService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        priority,
        status: "published",
      });

      setTitle("");
      setContent("");
      setPriority("medium");

      showToast("Announcement published.", "success");
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to create announcement:", err);
      showToast(err.message || "Failed to create announcement.", "error");
    } finally {
      setCreating(false);
    }
  };

  const isUrgent = (item) =>
    item.priority === "high" || item.priority === "urgent";

  const getDateParts = (date) => {
    if (!date) {
      return {
        day: "--",
        month: "---",
        year: "----",
      };
    }

    const parsed = new Date(date);

    return {
      day: parsed.getDate().toString().padStart(2, "0"),
      month: parsed
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase(),
      year: parsed.getFullYear(),
    };
  };

  return (
    <div className="min-h-full bg-[#F6F4EF] pb-14">

      {/* =========================================================
          HEADER / BULLETIN DESK
      ========================================================== */}

      <section className="relative overflow-hidden border-b border-[#DEDCD5] bg-[#F6F4EF]">

        <div className="pointer-events-none absolute right-[-80px] top-[-90px] h-64 w-64 rounded-full border border-[#DDD9CE]" />
        <div className="pointer-events-none absolute right-[-30px] top-[-40px] h-40 w-40 rounded-full border border-[#E4E1D9]" />

        <div className="relative mx-auto w-full max-w-[1050px] px-5 py-8 sm:px-8 sm:py-10">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#263B34] text-[#F7F4EC] shadow-[0_8px_18px_rgba(38,59,52,0.12)]">
                <Megaphone size={18} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#71847D]">
                  PrivateVoice / Broadcast
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-[#737872]">
                  Official information desk
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#718F84]" />
              <span className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#737872]">
                Verified channel
              </span>
            </div>

          </div>

          <div className="mt-10 max-w-[720px]">

            <p className="text-[11px] font-bold uppercase tracking-[2px] text-[#718F84]">
              Organization bulletin
            </p>

            <h1 className="mt-3 text-[34px] font-semibold tracking-[-1.2px] text-[#26312D] sm:text-[46px]">
              Official announcements
            </h1>

            <p className="mt-4 max-w-[620px] text-[13px] leading-6 text-[#656C68]">
              Important notices, decisions, updates, and information
              officially shared with your organization.
            </p>

          </div>

          <div className="mt-9 flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 rounded-md border border-[#DDDCD5] bg-[#FBFAF6] px-3 py-2">
              <CheckCircle2 size={13} className="text-[#668276]" />
              <span className="text-[10px] font-semibold text-[#59635F]">
                Official information
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-[#DDDCD5] bg-[#FBFAF6] px-3 py-2">
              <FileText size={13} className="text-[#8A7B61]" />
              <span className="text-[10px] font-semibold text-[#59635F]">
                Organization wide
              </span>
            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          ADMIN PUBLISHING DESK
      ========================================================== */}

      {isAdmin && (
        <section className="mx-auto mt-7 w-full max-w-[1050px] px-5 sm:px-8">

          <div className="overflow-hidden rounded-xl border border-[#DCDDD7] bg-[#FBFAF6] shadow-[0_8px_25px_rgba(48,65,58,0.035)]">

            <div className="flex items-center justify-between border-b border-[#E4E3DD] bg-[#F1F0EA] px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#263B34] text-white">
                  <Send size={13} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#71847D]">
                    Admin publishing desk
                  </p>

                  <h2 className="mt-0.5 text-[14px] font-semibold text-[#303A36]">
                    Publish an official notice
                  </h2>
                </div>

              </div>

              <span className="hidden text-[10px] text-[#8A8D88] sm:block">
                Visible to all members
              </span>

            </div>

            <form onSubmit={handleCreate} className="p-5 sm:p-6">

              <div className="grid gap-4 md:grid-cols-[1fr_170px]">

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[1px] text-[#69736F]">
                    Notice title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Semester examination schedule"
                    className="mt-2 w-full rounded-lg border border-[#DDDCD5] bg-white px-3.5 py-3 text-[12px] text-[#303A36] outline-none transition-all placeholder:text-[#A0A39E] focus:border-[#9EADA5] focus:ring-4 focus:ring-[#E9EEEB]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[1px] text-[#69736F]">
                    Priority
                  </label>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-[#DDDCD5] bg-white px-3.5 py-3 text-[12px] text-[#303A36] outline-none transition-all focus:border-[#9EADA5] focus:ring-4 focus:ring-[#E9EEEB]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Normal</option>
                    <option value="high">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

              </div>

              <div className="mt-4">

                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[1px] text-[#69736F]">
                    Notice content
                  </label>

                  <span className="text-[10px] text-[#969994]">
                    {content.length}/2000
                  </span>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Write the official information here..."
                  className="mt-2 w-full resize-none rounded-lg border border-[#DDDCD5] bg-white px-3.5 py-3 text-[12px] leading-5 text-[#303A36] outline-none transition-all placeholder:text-[#A0A39E] focus:border-[#9EADA5] focus:ring-4 focus:ring-[#E9EEEB]"
                />

              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-[#E7E5DE] pt-4 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-[10px] text-[#898D88]">
                  Publishing this notice will make it visible immediately.
                </p>

                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || creating}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#263B34] px-5 py-2.5 text-[11px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1E302A] hover:shadow-[0_8px_18px_rgba(38,59,52,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={12} />
                  {creating ? "Publishing..." : "Publish notice"}
                </button>

              </div>

            </form>

          </div>
        </section>
      )}


      {/* =========================================================
          CONTENT
      ========================================================== */}

      <main className="mx-auto mt-9 w-full max-w-[1050px] px-5 sm:px-8">

        {loading ? (

          <section className="flex min-h-[250px] items-center justify-center rounded-xl border border-[#DDDCD5] bg-[#FBFAF6]">

            <div className="text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D9D9D2] border-t-[#637A70]" />

              <p className="mt-4 text-[11px] text-[#777C78]">
                Loading official notices...
              </p>

            </div>

          </section>

        ) : (

          <>

            {/* =====================================================
                FEATURED LATEST NOTICE
            ====================================================== */}

            {announcements.length > 0 && (
              <section>

                <div className="mb-4 flex items-end justify-between">

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#71847D]">
                      Current bulletin
                    </p>

                    <h2 className="mt-1 text-[19px] font-semibold text-[#303A36]">
                      Latest notice
                    </h2>
                  </div>

                  <span className="text-[10px] text-[#8C908C]">
                    {announcements.length} published
                  </span>

                </div>


                <article
                  className={`relative overflow-hidden rounded-xl border bg-[#FBFAF6] shadow-[0_12px_35px_rgba(48,65,58,0.05)] ${isUrgent(announcements[0])
                      ? "border-[#D8D2C4]"
                      : "border-[#DDDCD5]"
                    }`}
                >

                  <div
                    className={`absolute left-0 top-0 h-full w-1 ${isUrgent(announcements[0])
                        ? "bg-[#A48452]"
                        : "bg-[#718F84]"
                      }`}
                  />

                  <div className="grid md:grid-cols-[110px_1fr]">

                    {/* DATE STAMP */}

                    <div className="border-b border-[#E5E3DC] bg-[#F1F0EA] px-5 py-6 md:border-b-0 md:border-r">

                      <div className="flex items-center gap-2 md:block">

                        <CalendarDays
                          size={15}
                          className="text-[#71847D]"
                        />

                        <div className="mt-0 md:mt-4">

                          <p className="text-[25px] font-semibold leading-none text-[#303A36]">
                            {getDateParts(
                              announcements[0].createdAt
                            ).day}
                          </p>

                          <p className="mt-1 text-[10px] font-bold tracking-[1.5px] text-[#71847D]">
                            {getDateParts(
                              announcements[0].createdAt
                            ).month}
                          </p>

                          <p className="mt-1 text-[10px] text-[#969994]">
                            {getDateParts(
                              announcements[0].createdAt
                            ).year}
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* NOTICE */}

                    <div className="p-6 sm:p-7">

                      <div className="flex flex-wrap items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E7EEEA] text-[#587267]">
                            <Megaphone size={13} />
                          </span>

                          <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-[#587267]">
                            Official notice
                          </span>

                        </div>

                        {isUrgent(announcements[0]) && (
                          <span className="flex items-center gap-1.5 rounded-md border border-[#E5D9C6] bg-[#F8F3E9] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[1px] text-[#806B48]">
                            <AlertTriangle size={10} />

                            {announcements[0].priority === "urgent"
                              ? "Urgent notice"
                              : "Important"}
                          </span>
                        )}

                      </div>


                      <h3 className="mt-5 max-w-[760px] text-[22px] font-semibold tracking-[-0.4px] text-[#29342F] sm:text-[27px]">
                        {announcements[0].title}
                      </h3>


                      <div className="mt-4 max-w-[780px] border-l border-[#B9C7C0] pl-4">

                        <p className="text-[13px] leading-6 text-[#59635F]">
                          {announcements[0].content}
                        </p>

                      </div>


                      <div className="mt-6 flex flex-col gap-2 border-t border-[#E5E4DE] pt-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2">

                          <span className="text-[10px] font-semibold text-[#59635F]">
                            {announcements[0].creatorName || "Organization official"}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-[#B8BCB8]" />

                          <span className="text-[10px] text-[#8B908C]">
                            {formatRelativeTime(
                              announcements[0].createdAt
                            )}
                          </span>

                        </div>

                        <span className="text-[9px] font-bold uppercase tracking-[1.3px] text-[#9A9D98]">
                          PrivateVoice Bulletin
                        </span>

                      </div>

                    </div>

                  </div>

                </article>

              </section>
            )}


            {/* =====================================================
                ARCHIVE / PREVIOUS NOTICES
            ====================================================== */}

            {announcements.length > 1 && (
              <section className="mt-10">

                <div className="mb-5">

                  <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#71847D]">
                    Bulletin archive
                  </p>

                  <div className="mt-1 flex items-center justify-between">

                    <h2 className="text-[19px] font-semibold text-[#303A36]">
                      Previous notices
                    </h2>

                    <span className="text-[10px] text-[#8C908C]">
                      Older broadcasts
                    </span>

                  </div>

                </div>


                <div className="relative">

                  {/* TIMELINE */}

                  <div className="absolute bottom-4 left-[23px] top-4 hidden w-px bg-[#DADBD5] sm:block" />

                  <div className="space-y-3">

                    {announcements.slice(1).map(
                      (announcement, index) => {

                        const date = getDateParts(
                          announcement.createdAt
                        );

                        return (
                          <article
                            key={announcement.id}
                            className="group relative rounded-xl border border-[#DDDCD5] bg-[#FBFAF6] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9CEC9] hover:bg-[#FDFCFA] hover:shadow-[0_10px_25px_rgba(48,65,58,0.045)]"
                          >

                            <div className="flex gap-4 p-4 sm:p-5">

                              {/* TIMELINE NODE */}

                              <div className="relative z-10 hidden shrink-0 sm:block">

                                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D7DDD8] bg-[#F6F4EF] text-[#71847D]">
                                  <span className="h-2 w-2 rounded-full bg-[#718F84]" />
                                </div>

                              </div>


                              {/* DATE */}

                              <div className="hidden w-[70px] shrink-0 border-r border-[#E4E3DD] pr-4 sm:block">

                                <p className="text-[18px] font-semibold leading-none text-[#3B4541]">
                                  {date.day}
                                </p>

                                <p className="mt-1 text-[9px] font-bold tracking-[1.2px] text-[#71847D]">
                                  {date.month}
                                </p>

                                <p className="mt-0.5 text-[9px] text-[#969994]">
                                  {date.year}
                                </p>

                              </div>


                              {/* CONTENT */}

                              <div className="min-w-0 flex-1">

                                <div className="flex flex-wrap items-center gap-2">

                                  <span className="text-[9px] font-bold uppercase tracking-[1.3px] text-[#71847D]">
                                    Official
                                  </span>

                                  {isUrgent(announcement) && (
                                    <>
                                      <span className="h-1 w-1 rounded-full bg-[#C5A77A]" />

                                      <span className="text-[9px] font-bold uppercase tracking-[1px] text-[#8A704A]">
                                        {announcement.priority === "urgent"
                                          ? "Urgent"
                                          : "Important"}
                                      </span>
                                    </>
                                  )}

                                </div>


                                <h3 className="mt-1.5 text-[14px] font-semibold text-[#37423D] transition-colors group-hover:text-[#557267]">
                                  {announcement.title}
                                </h3>


                                <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#717873]">
                                  {announcement.content}
                                </p>


                                <div className="mt-3 flex items-center justify-between">

                                  <span className="text-[9px] text-[#969994]">
                                    {formatRelativeTime(
                                      announcement.createdAt
                                    )}
                                  </span>

                                  <span className="text-[9px] font-semibold uppercase tracking-[1px] text-[#A0A39E]">
                                    Notice
                                  </span>

                                </div>

                              </div>

                            </div>

                          </article>
                        );
                      }
                    )}

                  </div>

                </div>

              </section>
            )}


            {/* EMPTY */}

            {announcements.length === 0 && !loading && (
              <section className="rounded-xl border border-dashed border-[#D7D8D2] bg-[#FBFAF6] px-6 py-16 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-[#DDDCD5] bg-[#F1F0EA] text-[#71847D]">
                  <Megaphone size={21} />
                </div>

                <h3 className="mt-5 text-[15px] font-semibold text-[#3D4844]">
                  The bulletin is quiet
                </h3>

                <p className="mx-auto mt-2 max-w-[390px] text-[11px] leading-5 text-[#7B817D]">
                  Official announcements from your organization will appear
                  here when they are published.
                </p>

              </section>
            )}


            {/* MEMBER INFO */}

            {userRole === "member" && announcements.length > 0 && (
              <div className="mt-7 flex items-center gap-2 border-t border-[#DDDCD5] pt-5">

                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E7EEEA] text-[#587267]">
                  <CheckCircle2 size={12} />
                </span>

                <span className="text-[10px] text-[#7D827E]">
                  Only verified organization officials can publish announcements.
                </span>

              </div>
            )}

          </>
        )}

      </main>


      {/* FOOTER PRINCIPLE */}

      <section className="mx-auto mt-12 w-full max-w-[1050px] border-t border-[#DDDCD5] px-5 pt-7 sm:px-8">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#718F84]" />

            <p className="text-[10px] font-medium text-[#737873]">
              Information shared here is officially published by authorized
              officials.
            </p>

          </div>

          <p className="text-[9px] font-bold uppercase tracking-[1.4px] text-[#9A9D98]">
            PrivateVoice • Official Bulletin
          </p>

        </div>

      </section>

    </div>
  );
}

export default Announcements;