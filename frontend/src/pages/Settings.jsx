import { useState } from "react";
import { User, Bell as BellIcon, Palette, Shield, Check } from "lucide-react";

function Settings() {
  const [activeTab, setActiveTab] = useState("Account");

  const [notifications, setNotifications] = useState(
    localStorage.getItem("privatevoice-notifications") !== "false"
  );

  const [chatNotifications, setChatNotifications] = useState(
    localStorage.getItem("privatevoice-chat-notifications") !== "false"
  );

  const handleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem("privatevoice-notifications", String(newValue));
  };

  const handleChatNotifications = () => {
    const newValue = !chatNotifications;
    setChatNotifications(newValue);
    localStorage.setItem("privatevoice-chat-notifications", String(newValue));
  };

  const tabs = [
    { name: "Account", description: "Your anonymous identity", icon: User },
    { name: "Notifications", description: "Control your alerts", icon: BellIcon },
    { name: "Appearance", description: "Coming soon", icon: Palette },
    { name: "Privacy", description: "Your privacy", icon: Shield },
  ];

  const Toggle = ({ enabled, onChange }) => {
    return (
      <button
        type="button"
        onClick={onChange}
        aria-label="Toggle setting"
        className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${
          enabled ? "bg-[#78958B]" : "bg-[#D7DEDA]"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  };

  const renderAccount = () => {
    const role = sessionStorage.getItem("privatevoice_role") || "member";
    const isAdmin = role === "admin";

    const anonymousId =
      sessionStorage.getItem("privatevoice_anonymous_id") || "Anonymous";

    const fullName =
      sessionStorage.getItem("privatevoice_full_name") || "Admin";

    const displayName = isAdmin ? fullName : anonymousId;
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
      <div className="animate-[settingsContent_0.3s_ease-out]">

        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">
            Account
          </p>
          <h2 className="mt-2 text-[22px] font-semibold text-[#202725]">
            {isAdmin ? "Your admin identity" : "Anonymous identity"}
          </h2>
          <p className="mt-1.5 text-[12px] text-[#6E7B76]">
            {isAdmin
              ? "Members see this identity in admin-facing areas of the app."
              : "The identity other members see inside your organization."}
          </p>
        </div>

        <div className="rounded-xl border border-[#DFE7E3] bg-[#FBFCFB] p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E4EFEA] text-[15px] font-semibold text-[#557267]">
              {displayInitial}
            </div>

            <div>
              <p className="text-[14px] font-semibold text-[#3D4844]">
                {displayName}
              </p>
              <p className="mt-1 text-[11px] text-[#7C8985]">
                {isAdmin
                  ? "You do not use an anonymous identity."
                  : "Your real identity is hidden."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 border-t border-[#E4EAE7] pt-5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E7F1EC] text-[#557267]">
              <Check size={12} strokeWidth={2.5} />
            </span>
            <p className="text-[11px] text-[#6E7B76]">
              {isAdmin
                ? "Your administrator role is visible to organization members."
                : "You are participating anonymously."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderNotifications = () => {
    return (
      <div className="animate-[settingsContent_0.3s_ease-out]">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">Notifications</p>
          <h2 className="mt-2 text-[22px] font-semibold text-[#202725]">Stay informed</h2>
          <p className="mt-1.5 text-[12px] text-[#6E7B76]">Choose which activity should notify you.</p>
        </div>

        <div className="divide-y divide-[#E8ECEA] rounded-xl border border-[#DFE7E3] bg-white">
          <div className="flex items-center justify-between gap-5 px-5 py-5">
            <div>
              <p className="text-[12px] font-semibold text-[#3D4844]">Community activity</p>
              <p className="mt-1 text-[10px] leading-4 text-[#7C8985]">Notifications about important community activity.</p>
            </div>
            <Toggle enabled={notifications} onChange={handleNotifications} />
          </div>

          <div className="flex items-center justify-between gap-5 px-5 py-5">
            <div>
              <p className="text-[12px] font-semibold text-[#3D4844]">Authority chat</p>
              <p className="mt-1 text-[10px] leading-4 text-[#7C8985]">Get notified when an authority replies.</p>
            </div>
            <Toggle enabled={chatNotifications} onChange={handleChatNotifications} />
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // APPEARANCE
  // =====================================================
  //
  // NOTE: the previous version had a Light/Dark/System theme
  // switcher that toggled a `dark` class on <html>, but the
  // rest of the app has zero `dark:` Tailwind classes anywhere
  // — so the toggle looked functional but visually did
  // nothing. Rather than ship a fake control, this now
  // honestly says dark mode isn't available yet instead of
  // silently failing.
  // =====================================================

  const renderAppearance = () => {
    return (
      <div className="animate-[settingsContent_0.3s_ease-out]">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">Appearance</p>
          <h2 className="mt-2 text-[22px] font-semibold text-[#202725]">Make it yours</h2>
          <p className="mt-1.5 text-[12px] text-[#6E7B76]">Theme customization is on the way.</p>
        </div>

        <div className="rounded-xl border border-[#E5EAE8] bg-[#FBFCFB] px-5 py-6 text-center">
          <Palette size={22} className="mx-auto text-[#9FADA7]" />
          <p className="mt-3 text-[12px] leading-5 text-[#7C8985]">
            Dark mode and custom themes are coming in a future update.
          </p>
        </div>
      </div>
    );
  };

  const renderPrivacy = () => {
    return (
      <div className="animate-[settingsContent_0.3s_ease-out]">
        <div className="mb-7">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#78958B]">Privacy</p>
          <h2 className="mt-2 text-[22px] font-semibold text-[#202725]">Your private space</h2>
          <p className="mt-1.5 text-[12px] text-[#6E7B76]">A few things to remember about PrivateVoice.</p>
        </div>

        <div className="space-y-3">

          <div className="flex gap-4 rounded-xl border border-[#DCE7E2] bg-[#F6FAF8] p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E3EFEA] text-[#557267]">
              <Shield size={16} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#3D4844]">Anonymous by default</p>
              <p className="mt-1 text-[11px] leading-5 text-[#6E7B76]">
                Other members see your anonymous identity, not your real name.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-xl border border-[#E8E0D3] bg-[#FCFAF6] p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EBDD] text-[11px] font-semibold text-[#84693F]">
              24h
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[#5C4F3A]">Temporary conversations</p>
              <p className="mt-1 text-[11px] leading-5 text-[#84775F]">
                Community content and conversations are designed around a 24-hour retention period.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-[#E6ECE9] pt-5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EAF2EE] text-[#557267]">
              <Check size={12} strokeWidth={2.5} />
            </span>
            <p className="text-[11px] text-[#6E7B76]">
              These privacy protections are built into PrivateVoice.
            </p>
          </div>

        </div>

      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Notifications":
        return renderNotifications();
      case "Appearance":
        return renderAppearance();
      case "Privacy":
        return renderPrivacy();
      case "Account":
      default:
        return renderAccount();
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1050px] animate-[settingsPage_0.45s_ease-out]">

      <section className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[1.7px] text-[#78958B]">Preferences</p>
        <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.7px] text-[#202725]">Settings</h1>
        <p className="mt-2 max-w-[620px] text-[13px] leading-5 text-[#6E7B76]">
          Keep your PrivateVoice experience comfortable, private, and personal.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">

        <aside className="h-fit rounded-xl border border-[#E1E7E4] bg-white p-2 shadow-[0_8px_25px_rgba(48,65,58,0.025)]">

          {tabs.map((tab) => {
            const active = activeTab === tab.name;
            const Icon = tab.icon;

            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => setActiveTab(tab.name)}
                className={`relative mb-1 flex w-full items-center gap-3 overflow-hidden rounded-lg px-4 py-3 text-left transition-all duration-200 ${
                  active ? "bg-[#EEF4F1]" : "bg-white hover:bg-[#F7FAF8]"
                }`}
              >

                {active && (
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-[#78958B]" />
                )}

                <Icon
                  size={16}
                  className={active ? "text-[#557267]" : "text-[#8D9994]"}
                />

                <div>
                  <p
                    className={`text-[12px] font-semibold ${
                      active ? "text-[#4B6D62]" : "text-[#3D4844]"
                    }`}
                  >
                    {tab.name}
                  </p>

                  <p className="mt-0.5 text-[10px] text-[#8D9994]">
                    {tab.description}
                  </p>
                </div>

              </button>
            );
          })}

        </aside>

        <section className="min-w-0 rounded-xl border border-[#E1E7E4] bg-white p-6 shadow-[0_10px_30px_rgba(48,65,58,0.03)] sm:p-7">
          {renderContent()}
        </section>

      </div>

      <section className="mt-10 border-t border-[#E2E7E4] pt-6 text-center">
        <p className="text-[11px] italic tracking-wide text-[#8D9994]">
          "Users can speak anonymously. Officials must speak transparently."
        </p>
      </section>

      <style>{`
        @keyframes settingsPage {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes settingsContent {
          from { opacity: 0; transform: translateX(7px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

    </div>
  );
}

export default Settings;