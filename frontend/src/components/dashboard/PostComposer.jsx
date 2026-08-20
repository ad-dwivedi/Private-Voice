import React, { useState } from "react";

function PostComposer({ onPost }) {
  const [content, setContent] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent) return;

    const newPost = {
      content: trimmedContent,
    };

    // Later:
    // POST /api/posts
    // Backend ko newPost bhejenge.

    if (onPost) {
      onPost(newPost);
    }

    setContent("");
  };

  return (
    <section className="border border-[#E5E7E6] bg-white p-5 shadow-[0_8px_25px_rgba(30,35,35,0.025)] transition-all duration-300 focus-within:border-[#CDD6D3] focus-within:shadow-[0_12px_30px_rgba(30,35,35,0.05)] sm:p-6">
      
      {/* Header */}

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2F1] text-[10px] font-bold text-[#6F8580]">
          A
        </div>

        <div>
          <p className="text-[10px] font-bold text-[#20252B]">
            Share anonymously
          </p>

          <p className="mt-1 text-[8px] text-[#8991A0]">
            Your real identity will not be displayed
          </p>
        </div>
      </div>

      {/* Form */}

      <form onSubmit={handleSubmit} className="mt-5">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share something anonymously..."
          maxLength={1000}
          rows={4}
          className="w-full resize-none border border-[#E5E7E6] bg-[#FAFAFA] px-4 py-3 text-[11px] leading-[1.7] text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#A1A8AE] focus:border-[#6F8580] focus:bg-white focus:ring-2 focus:ring-[#EEF2F1]"
        />

        {/* Bottom */}

        <div className="mt-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6F8580]" />

            <span className="text-[8px] text-[#8991A0]">
              Anonymous post
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[8px] text-[#8991A0]">
              {content.length}/1000
            </span>

            <button
              type="submit"
              disabled={!content.trim()}
              className={`rounded-[6px] px-4 py-2 text-[9px] font-bold transition-all duration-200 ${
                content.trim()
                  ? "bg-[#6F8580] text-white hover:-translate-y-0.5 hover:bg-[#5F7671] hover:shadow-sm"
                  : "cursor-not-allowed bg-[#EEF2F1] text-[#A1AAA7]"
              }`}
            >
              Post anonymously
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default PostComposer;