import React from "react";

function WelcomeSection({
  greeting,
  user,
  organization,
}) {
  const userName = user?.name || "Anonymous User";
  const anonymousId = user?.anonymousId || "Private Identity";
  const organizationName =
    organization?.name || "Your Organization";

  return (
    <section className="relative overflow-hidden border border-[#E5E7E6] bg-white shadow-[0_12px_40px_rgba(30,35,35,0.045)]">
      {/* Decorative background */}

      <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-[#EEF2F1] opacity-70" />

      <div className="pointer-events-none absolute -bottom-24 right-[20%] h-32 w-32 rounded-full bg-[#F5F7F6]" />

      <div className="relative p-6 sm:p-8 lg:p-9">
        {/* Small heading */}

        <div className="mb-5 flex items-center gap-2">
          <span className="h-px w-6 bg-[#6F8580]" />

          <p className="text-[9px] font-bold tracking-[1.3px] text-[#6F8580]">
            PRIVATE SPACE
          </p>
        </div>

        {/* Greeting */}

        <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-1px] text-[#20252B] sm:text-[36px] lg:text-[40px]">
          {greeting},{" "}
          <span className="text-[#6F8580]">
            {userName}
          </span>
          <span className="ml-1">👋</span>
        </h2>

        {/* Organization */}

        <p className="mt-4 text-[13px] font-medium text-[#56606A]">
          Welcome to{" "}
          <span className="font-semibold text-[#20252B]">
            {organizationName}
          </span>
        </p>

        {/* Privacy message */}

        <p className="mt-2 max-w-[620px] text-[11px] leading-[1.8] text-[#8991A0] sm:text-[12px]">
          Your identity stays private when you participate
          anonymously. Speak freely, share concerns, and
          contribute ideas without putting your personal
          identity at the center.
        </p>

        {/* Identity information */}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Anonymous identity */}

          <div className="flex items-center gap-3 border border-[#E5E7E6] bg-[#FAFAFA] px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF2F1] text-[9px] font-bold text-[#6F8580]">
              {anonymousId.charAt(
                anonymousId.length - 1
              )}
            </div>

            <div>
              <p className="text-[9px] font-semibold text-[#56606A]">
                {anonymousId}
              </p>

              <p className="mt-0.5 text-[8px] text-[#8991A0]">
                Anonymous identity
              </p>
            </div>
          </div>

          {/* Privacy indicator */}

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6F8580]" />

            <span className="text-[9px] text-[#8991A0]">
              Identity protected
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WelcomeSection;