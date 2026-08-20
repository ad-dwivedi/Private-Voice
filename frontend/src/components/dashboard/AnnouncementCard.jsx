import React from "react";

function AnnouncementCard({ announcement }) {
  if (!announcement) {
    return (
      <div className="border border-[#E5E7E6] bg-white p-6">
        <p className="text-[11px] text-[#8991A0]">
          No announcements available.
        </p>
      </div>
    );
  }

  const {
    title,
    content,
    authorityName,
    createdAt,
  } = announcement;

  return (
    <article className="border border-[#DADDDC] bg-white p-5 shadow-[0_8px_25px_rgba(30,35,35,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CDD6D3] hover:shadow-[0_12px_30px_rgba(30,35,35,0.06)] sm:p-6">
      
      {/* Header */}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          
          {/* Announcement Icon */}

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2F1] text-[13px] text-[#6F8580]">
            📢
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold text-[#20252B]">
                Official Announcement
              </p>

              {/* Verified */}

              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6F8580] text-[7px] font-bold text-white">
                ✓
              </span>
            </div>

            <p className="mt-1 text-[8px] text-[#8991A0]">
              {createdAt || "Recently"}
            </p>
          </div>
        </div>

        {/* Official Badge */}

        <span className="whitespace-nowrap rounded-full bg-[#F5F7F6] px-2.5 py-1 text-[8px] font-semibold text-[#6F8580]">
          Official
        </span>
      </div>

      {/* Announcement Content */}

      <div className="mt-5">
        <h3 className="text-[13px] font-semibold leading-[1.5] text-[#20252B]">
          {title}
        </h3>

        <p className="mt-2 text-[10px] leading-[1.8] text-[#56606A] sm:text-[11px]">
          {content}
        </p>
      </div>

      {/* Authority */}

      <div className="mt-5 flex items-center justify-between border-t border-[#E5E7E6] pt-4">
        <div>
          <p className="text-[8px] text-[#8991A0]">
            Published by
          </p>

          <p className="mt-1 text-[9px] font-semibold text-[#56606A]">
            {authorityName}
          </p>
        </div>

        <span className="text-[9px] text-[#8991A0]">
          Verified authority
        </span>
      </div>
    </article>
  );
}

export default AnnouncementCard;