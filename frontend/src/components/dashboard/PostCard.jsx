import React, { useState } from "react";

function PostCard({ post, onLike, onReport }) {
  const [showMenu, setShowMenu] = useState(false);

  if (!post) return null;

  const {
    anonymousName = "Anonymous User",
    content = "",
    createdAt = "Recently",
    likes = 0,
    comments = 0,
    category = "Community",
  } = post;

  const handleLike = () => {
    if (onLike) {
      onLike(post.id);
    }
  };

  const handleReport = () => {
    setShowMenu(false);

    if (onReport) {
      onReport(post.id);
    }
  };

  return (
    <article className="border border-[#E5E7E6] bg-white p-5 shadow-[0_8px_25px_rgba(30,35,35,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#CDD6D3] hover:shadow-[0_12px_30px_rgba(30,35,35,0.06)] sm:p-6">

      {/* Header */}

      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          {/* Anonymous Avatar */}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2F1] text-[10px] font-bold text-[#6F8580]">
            A
          </div>

          <div>
            <p className="text-[10px] font-bold text-[#20252B]">
              {anonymousName}
            </p>

            <p className="mt-1 text-[8px] text-[#8991A0]">
              {createdAt}
            </p>
          </div>
        </div>

        {/* More */}

        <div className="relative">

          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent text-[12px] text-[#8991A0] transition-all duration-200 hover:bg-[#F5F7F6] hover:text-[#56606A]"
            aria-label="Post options"
          >
            •••
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-20 w-28 border border-[#E5E7E6] bg-white p-1 shadow-[0_10px_30px_rgba(30,35,35,0.10)]">

              <button
                type="button"
                onClick={handleReport}
                className="w-full px-3 py-2 text-left text-[9px] font-semibold text-[#737C85] transition-colors hover:bg-[#FBF3F3] hover:text-[#9A5F5F]"
              >
                Report post
              </button>

            </div>
          )}
        </div>
      </div>

      {/* Post Content */}

      <p className="mt-5 text-[11px] leading-[1.8] text-[#56606A] sm:text-[12px]">
        {content}
      </p>

      {/* Category */}

      <div className="mt-4">
        <span className="rounded-full bg-[#F5F7F6] px-2.5 py-1 text-[8px] font-semibold text-[#6F8580]">
          {category}
        </span>
      </div>

      {/* Actions */}

      <div className="mt-5 flex items-center gap-5 border-t border-[#E5E7E6] pt-4">

        <button
          type="button"
          onClick={handleLike}
          className="border-0 bg-transparent p-0 text-[9px] text-[#8991A0] transition-colors duration-200 hover:text-[#6F8580]"
        >
          ♡ {likes}
        </button>

        <button
          type="button"
          className="border-0 bg-transparent p-0 text-[9px] text-[#8991A0] transition-colors duration-200 hover:text-[#6F8580]"
        >
          💬 {comments} replies
        </button>

        <span className="ml-auto text-[8px] text-[#A1A8AE]">
          Anonymous
        </span>
      </div>
    </article>
  );
}

export default PostCard;