import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, AlertCircle, Lightbulb, BarChart3, Megaphone, ShieldCheck } from "lucide-react";
import { pollService, subscribeToNewPoll } from "../services/pollService";
import { announcementService, subscribeToNewAnnouncement } from "../services/announcementService";
import { useToast } from "../components/ui/UIProvider";

function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const role = sessionStorage.getItem("privatevoice_role") || "member";
  const isAdmin = role === "admin";

  const [user] = useState({
    name: isAdmin
      ? sessionStorage.getItem("privatevoice_full_name") || "Admin"
      : sessionStorage.getItem("privatevoice_anonymous_id") || "Anonymous",
  });

  const [organization] = useState({
    name: sessionStorage.getItem("privatevoice_organization_name") || "your organization",
  });

  const [latestPoll, setLatestPoll] = useState(null);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [loadingUpdates, setLoadingUpdates] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const loadUpdates = async () => {
      try {
        setLoadingUpdates(true);

        const [pollData, announcementData] = await Promise.all([
          pollService.getPolls().catch(() => ({ polls: [] })),
          announcementService.getAnnouncements().catch(() => ({ announcements: [] })),
        ]);

        const activePoll = (pollData.polls || []).find((poll) => poll.isActive);
        setLatestPoll(activePoll || null);
        setLatestAnnouncement((announcementData.announcements || [])[0] || null);
      } catch (err) {
        console.error("Failed to load dashboard updates:", err);
        showToast("Unable to load latest updates.", "error");
      } finally {
        setLoadingUpdates(false);
      }
    };

    loadUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================================================
  // REAL-TIME: KEEP "STAY INFORMED" CARDS FRESH WITHOUT
  // A FULL DASHBOARD REFRESH
  // =====================================================

  useEffect(() => {
    const unsubscribePoll = subscribeToNewPoll((poll) => {
      setLatestPoll(poll);
    });

    const unsubscribeAnnouncement = subscribeToNewAnnouncement((announcement) => {
      setLatestAnnouncement(announcement);
    });

    return () => {
      unsubscribePoll();
      unsubscribeAnnouncement();
    };
  }, []);

  const handleQuickAction = (action) => {
    if (action === "conversation") return navigate("/community");
    if (action === "concern") return navigate("/complaints");
    if (action === "idea") return navigate("/suggestions");
  };

  const QuickAction = ({ number, title, description, accent, icon: Icon, onClick }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-xl border border-[#E3E8E5] bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#B8C8C1] hover:shadow-[0_16px_35px_rgba(48,65,58,0.08)]"
      >
        <div
          className={`absolute left-0 top-0 h-full w-[3px] transition-all duration-300 group-hover:w-[5px] ${
            accent === "green" ? "bg-[#78958B]" : accent === "sand" ? "bg-[#C5A77A]" : "bg-[#91A5B1]"
          }`}
        />
        <div className="flex items-start justify-between">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              accent === "green" ? "bg-[#EEF4F1] text-[#557267]" : accent === "sand" ? "bg-[#FBF3E5] text-[#84693F]" : "bg-[#EDF2F5] text-[#4C6B7A]"
            }`}
          >
            <Icon size={16} />
          </span>
          <span className="text-[11px] font-bold tracking-[1px] text-[#8D9994]">{number}</span>
        </div>
        <h3 className="mt-6 text-[15px] font-semibold text-[#202725]">{title}</h3>
        <p className="mt-2 max-w-[300px] text-[13px] leading-[1.7] text-[#6E7B76]">{description}</p>
      </button>
    );
  };

  return (
    <div className="max-w-[1050px]">

      <section className="relative overflow-hidden rounded-2xl border border-[#E3E8E5] bg-white px-7 py-8 shadow-[0_10px_35px_rgba(48,65,58,0.035)] sm:px-9 sm:py-10">

        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#EEF4F1]" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-[#F6F0E7]" />

        <div className="relative">

          <div className="flex items-center gap-2">
            <span className="h-[2px] w-7 bg-[#78958B]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Private space</span>
          </div>

          <h1 className="mt-5 text-[29px] font-semibold tracking-[-0.8px] text-[#202725] sm:text-[36px]">
            {getGreeting()}, {user.name} 👋
          </h1>

          <p className="mt-3 text-[14px] text-[#4F5D57]">
            Welcome back to {organization.name}.
          </p>

          <div className="mt-7 inline-flex items-center gap-3 rounded-xl border border-[#E1E8E4] bg-[#F7FAF8] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5EFEA] text-[#557267]">
              <ShieldCheck size={15} />
            </span>
            <div>
              <p className="text-[12px] font-semibold text-[#3D4844]">
                {isAdmin ? "You are signed in as organization admin" : "You're participating anonymously"}
              </p>
              <p className="mt-0.5 text-[11px] text-[#6E7B76]">
                {isAdmin ? "Your real identity is visible to members as the admin." : "Your real identity stays protected."}
              </p>
            </div>
            <span className="ml-2 h-2 w-2 animate-pulse rounded-full bg-[#78958B]" />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Quick actions</p>
          <h2 className="mt-2 text-[22px] font-semibold text-[#202725]">What would you like to do?</h2>
          <p className="mt-2 text-[13px] text-[#6E7B76]">Choose how you'd like to participate.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <QuickAction number="01" title="Start a conversation" description="Talk with your organization anonymously." accent="green" icon={MessageCircle} onClick={() => handleQuickAction("conversation")} />
          <QuickAction number="02" title="Raise a concern" description="Bring an issue forward privately." accent="sand" icon={AlertCircle} onClick={() => handleQuickAction("concern")} />
          <QuickAction number="03" title="Share an idea" description="Start a discussion and share something that could improve your organization." accent="blue" icon={Lightbulb} onClick={() => handleQuickAction("idea")} />
        </div>
      </section>

      <section className="mt-14 border-t border-[#E2E7E4] pt-8">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Stay informed</p>
          <p className="mt-2 text-[13px] text-[#6E7B76]">Important updates from your organization appear here.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/polls")}
            className="group rounded-xl border border-[#E3E8E5] bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#B8C8C1] hover:shadow-[0_12px_28px_rgba(48,65,58,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EEF4F1] text-[#557267]">
                  <BarChart3 size={12} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-[#4B6D62]">
                  {latestPoll ? "Active poll" : "Polls"}
                </span>
              </div>
              <span className="text-[17px] text-[#78958B] transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>

            <p className="mt-4 text-[13px] font-medium text-[#3D4844]">
              {loadingUpdates ? "Checking for active polls..." : latestPoll ? latestPoll.title : "No active poll right now."}
            </p>

            <p className="mt-1.5 text-[11px] text-[#8D9994]">
              {latestPoll ? "Tap to participate." : "Check back later."}
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/announcements")}
            className="group rounded-xl border border-[#E3E8E5] bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#B8C8C1] hover:shadow-[0_12px_28px_rgba(48,65,58,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FBF3E5] text-[#84693F]">
                  <Megaphone size={12} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-[#84693F]">
                  {latestAnnouncement ? "Latest announcement" : "Announcements"}
                </span>
              </div>
              <span className="text-[17px] text-[#78958B] transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>

            <p className="mt-4 text-[13px] font-medium text-[#3D4844]">
              {loadingUpdates ? "Checking announcements..." : latestAnnouncement ? latestAnnouncement.title : "No announcements yet."}
            </p>

            <p className="mt-1.5 text-[11px] text-[#8D9994]">
              {latestAnnouncement ? "Tap to view." : "Check back later."}
            </p>
          </button>
        </div>
      </section>

      <section className="mt-10 border-t border-[#E2E7E4] pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF2EE] text-[#557267]">
              <ShieldCheck size={13} />
            </span>
            <p className="text-[11px] text-[#6E7B76]">Your real identity is not shown in PrivateVoice.</p>
          </div>
          <span className="text-[11px] text-[#8D9994]">PrivateVoice · Speak Freely. Stay Private.</span>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;