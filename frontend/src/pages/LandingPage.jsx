
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";




function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleGetStarted = () => {
    navigate("/organization");
  };



  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#20252B]">
      {/* =========================
          NAVBAR
      ========================= */}
      <header
        className={`sticky top-0 z-[1000] h-[72px] border-b border-[#E5E7E6] bg-white/95 transition-all duration-300 max-[700px]:h-[65px] ${
          scrolled ? "border-[#DADDDC] shadow-[0_3px_12px_rgba(25,25,25,0.06)]" : ""
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1160px] items-center justify-between px-7 max-[700px]:px-[18px]">
          <a
            href="/"
            className="flex items-center gap-[10px] text-[#20252B] no-underline"
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center gap-[2px] rounded-[7px] bg-[#6F8580] max-[700px]:h-[30px] max-[700px]:w-[30px]">
              <span className="h-[15px] w-[3px] rounded-[2px] bg-white" />
              <span className="h-[11px] w-[3px] rounded-[2px] bg-white" />
            </span>

            <span className="text-[17px] font-bold tracking-[-0.3px] max-[700px]:text-[16px]">
              PrivateVoice
            </span>
          </a>

          <button
            type="button"
           onClick={handleGetStarted}
            className="rounded-[6px] border border-[#DADDDC] bg-white px-[15px] py-[9px] text-[13px] font-semibold text-[#20252B] transition-all duration-200 hover:border-[#bfb7b7] hover:bg-[#EEF2F1] hover:text-[#6F8580] max-[700px]:px-[11px] max-[700px]:py-2 max-[700px]:text-[11px]"
          >
            Get Started
          </button>
        </div>
      </header>

      <main>
        {/* =========================
            HERO
        ========================= */}
        <section className="border-b border-[#E5E7E6] bg-[#F7F7F7]">
          <div className="mx-auto grid min-h-[650px] max-w-[1160px] grid-cols-[0.92fr_1.08fr] items-center gap-[70px] px-7 py-[78px] pb-[84px] max-[950px]:grid-cols-1 max-[950px]:gap-[70px] max-[700px]:px-5 max-[700px]:py-[60px] max-[700px]:pb-[85px]">
            {/* Hero Content */}
            <div className="max-w-[530px] animate-[heroContentIn_0.7s_ease-out_both] max-[950px]:max-w-[650px]">
              <div className="mb-6 flex items-center gap-[10px] text-[10px] font-bold tracking-[1.25px] text-[#6F8580]">
                <span className="h-px w-6 bg-[#6F8580]" />
                PRIVATE COMMUNICATION PLATFORM
              </div>

              <h1 className="mb-6 text-[clamp(48px,5vw,68px)] font-[650] leading-[1.02] tracking-[-3.2px] text-[#20252B] max-[700px]:text-[47px] max-[700px]:tracking-[-2px] max-[420px]:text-[41px]">
                Speak freely.
                <br />
                <em className="not-italic text-[#6F8580]">Stay private.</em>
              </h1>

              <p className="mb-[30px] max-w-[510px] text-base leading-[1.75] text-[#56606A] max-[700px]:text-sm">
                A private communication space for colleges and companies —
                built for honest conversations, concerns, suggestions, and
                ideas.
              </p>

              <div className="flex items-center gap-[18px] max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-2">
                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="flex min-h-[44px] items-center gap-[22px] rounded-[6px] border-0 bg-[#6F8580] px-5 pr-[17px] text-[13px] font-[650] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5D716D]"
                >
                  Get Started
                  <span className="text-[18px] transition-transform duration-200 group-hover:translate-x-[3px]">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleGetStarted}
                  className="min-h-[44px] border-0 bg-transparent px-[2px] text-[13px] font-[650] text-[#20252B] transition-colors duration-200 hover:text-[#6F8580]"
                >
                  Get Started
                </button>
              </div>

              <div className="mt-[25px] flex flex-wrap gap-4 text-[11px] text-[#8991A0] max-[700px]:flex-col max-[700px]:gap-2">
                <div className="flex items-center gap-[6px]">
                  <span className="font-bold text-[#6F8580]">✓</span>
                  Anonymous participation
                </div>

                <div className="flex items-center gap-[6px]">
                  <span className="font-bold text-[#6F8580]">✓</span>
                  Organization-only spaces
                </div>
              </div>
            </div>

            {/* =========================
                PRODUCT PREVIEW
            ========================= */}
            <div className="relative w-full max-w-[570px] animate-[productPreviewIn_0.8s_ease-out_0.12s_both] max-[950px]:max-w-[650px]">
              <div className="overflow-hidden border border-[#E5E7E6] bg-white shadow-[0_24px_60px_rgba(30,25,25,0.08),0_4px_12px_rgba(30,25,25,0.035)]">
                {/* Window Header */}
                <div className="flex h-[70px] items-center justify-between border-b border-[#E5E7E6] px-5">
                  <div className="flex items-center gap-[10px]">
                    <div className="flex h-7 w-7 items-center justify-center gap-[2px] rounded-[6px] bg-[#EEF2F1]">
                      <span className="h-[13px] w-[2px] bg-[#6F8580]" />
                      <span className="h-[9px] w-[2px] bg-[#6F8580]" />
                    </div>

                    <div>
                      <strong className="block text-[12px] font-bold text-[#20252B]">
                        PrivateVoice
                      </strong>

                      <small className="mt-0.5 block text-[9px] text-[#8991A0]">
                        ABC University
                      </small>
                    </div>
                  </div>

                  <div className="flex items-center gap-[6px] text-[10px] font-[650] text-[#53715f]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5b8c6c]" />
                    Private
                  </div>
                </div>

                {/* Window Body */}
                <div className="grid min-h-[380px] grid-cols-[145px_1fr] max-[700px]:grid-cols-1">
                  {/* Sidebar */}
                  <aside className="relative border-r border-[#E5E7E6] bg-[#FAFAFA] px-3 py-[22px] max-[700px]:hidden">
                    <div className="px-[9px] pb-3 text-[8px] font-bold tracking-[1px] text-[#8991A0]">
                      COMMUNITY
                    </div>

                    <div className="flex h-[35px] items-center gap-[9px] rounded-[5px] bg-[#EEF2F1] px-[9px] text-[10px] font-[550] text-[#6F8580]">
                      <span className="text-[11px] text-[#6F8580]">◉</span>
                      Community
                    </div>

                    <div className="mt-0 flex h-[35px] items-center gap-[9px] rounded-[5px] px-[9px] text-[10px] font-[550] text-[#737C85] transition-colors duration-200 hover:bg-[#EEF2F1] hover:text-[#6F8580]">
                      <span className="text-[11px] text-[#8991A0]">□</span>
                      Concerns
                    </div>

                    <div className="flex h-[35px] items-center gap-[9px] rounded-[5px] px-[9px] text-[10px] font-[550] text-[#737C85] transition-colors duration-200 hover:bg-[#EEF2F1] hover:text-[#6F8580]">
                      <span className="text-[11px] text-[#8991A0]">◇</span>
                      Suggestions
                    </div>

                    <div className="flex h-[35px] items-center gap-[9px] rounded-[5px] px-[9px] text-[10px] font-[550] text-[#737C85] transition-colors duration-200 hover:bg-[#EEF2F1] hover:text-[#6F8580]">
                      <span className="text-[11px] text-[#8991A0]">○</span>
                      Polls
                    </div>

                    <div className="absolute bottom-4 left-3 right-3 flex items-center gap-2 border-t border-[#E5E7E6] pt-[15px]">
                      <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-[#EEF2F1] text-[9px] font-bold text-[#6F8580]">
                        A
                      </div>

                      <div>
                        <strong className="block text-[8px] font-[650]">
                          Anonymous #184
                        </strong>

                        <small className="mt-0.5 block text-[7px] text-[#8991A0]">
                          Private identity
                        </small>
                      </div>
                    </div>
                  </aside>

                  {/* Feed */}
                  <div className="p-[25px] max-[700px]:p-5">
                    <div className="flex items-center justify-between border-b border-[#E5E7E6] pb-[19px]">
                      <div>
                        <h3 className="text-[14px] font-bold">Community</h3>

                        <p className="mt-[3px] text-[8px] text-[#8991A0] max-[420px]:hidden">
                          Open conversations in your organization
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-[5px] border border-[#DADDDC] bg-white px-[9px] py-[7px] text-[8px] font-[650] text-[#20252B] transition-colors duration-200 hover:border-[#bdb7b7] hover:bg-[#EEF2F1] max-[420px]:hidden"
                      >
                        + New post
                      </button>
                    </div>

                    {/* Post 1 */}
                    <article className="border-b border-[#E5E7E6] py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[9px]">
                          <div className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EEF2F1] text-[9px] font-bold text-[#6F8580]">
                            A
                          </div>

                          <div>
                            <strong className="block text-[9px] font-bold">
                              Anonymous Member
                            </strong>

                            <span className="mt-0.5 block text-[7px] text-[#8991A0]">
                              2 min ago
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="border-0 bg-transparent text-[10px] text-[#8991A0]"
                        >
                          •••
                        </button>
                      </div>

                      <p className="mb-[15px] ml-[38px] mt-[13px] max-w-[390px] text-[10px] leading-[1.6] text-[#56606A]">
                        I think we should have a better way to communicate
                        student concerns with the administration.
                      </p>

                      <div className="ml-[38px] flex gap-5 text-[8px] text-[#8991A0]">
                        <span>♡ 24</span>
                        <span>12 replies</span>
                      </div>
                    </article>

                    {/* Post 2 */}
                    <article className="border-b border-[#E5E7E6] pb-2 pt-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-[9px]">
                          <div className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#EEEEEE] text-[9px] font-bold text-[#737C85]">
                            P
                          </div>

                          <div>
                            <strong className="block text-[9px] font-bold">
                              Anonymous Member
                            </strong>

                            <span className="mt-0.5 block text-[7px] text-[#8991A0]">
                              18 min ago
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="border-0 bg-transparent text-[10px] text-[#8991A0]"
                        >
                          •••
                        </button>
                      </div>

                      <p className="mb-[15px] ml-[38px] mt-[13px] max-w-[390px] text-[10px] leading-[1.6] text-[#56606A]">
                        Could we create a space where people can ask questions
                        without worrying about who will see their name?
                      </p>

                      <div className="ml-[38px] flex gap-5 text-[8px] text-[#8991A0]">
                        <span>♡ 17</span>
                        <span>8 replies</span>
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="absolute -bottom-[27px] -right-[22px] flex w-[255px] gap-[10px] bg-[#202524] p-[14px] text-white shadow-[0_12px_30px_rgba(20,20,20,0.15)] max-[950px]:right-[10px] max-[700px]:static max-[700px]:mt-3 max-[700px]:w-full">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#292929] text-[15px] text-[#d0c8c8]">
                  ⌑
                </span>

                <div>
                  <strong className="mb-[3px] block text-[10px]">
                    Your identity stays private
                  </strong>

                  <p className="text-[8px] leading-[1.5] text-[#aab0b8]">
                    Participate using an anonymous identity created for your
                    organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            INTRO
        ========================= */}
        <section className="bg-white px-0 py-[110px] pb-[100px] max-[700px]:py-[75px]">
          <div className="mx-auto max-w-[1100px] px-7 max-[700px]:px-5">
            <div className="text-[9px] font-[750] tracking-[1.3px] text-[#6F8580]">
              WHY PRIVATEVOICE
            </div>

            <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] items-start gap-[90px] max-[950px]:gap-[50px] max-[700px]:grid-cols-1 max-[700px]:gap-7">
              <h2 className="text-[38px] font-[620] leading-[1.15] tracking-[-1.5px] text-[#20252B] max-[700px]:text-[31px]">
                Good communication needs
                <br />
                <span className="text-[#8991A0]">a safe environment.</span>
              </h2>

              <p className="max-w-[440px] text-[14px] leading-[1.8] text-[#56606A]">
                People don't always speak when they feel their identity could
                affect how their words are received. PrivateVoice gives
                organizations a dedicated space where people can participate
                openly while keeping privacy at the center.
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            FEATURES
        ========================= */}
        <section className="border-y border-[#E5E7E6] bg-[#F7F7F7]">
          <div className="mx-auto max-w-[1100px] px-7 max-[700px]:px-5">
            <div className="border-t border-[#DADDDC]">
              {/* Feature 01 */}
              <article className="grid min-h-[150px] grid-cols-[70px_1fr_1fr] items-center gap-10 border-b border-[#DADDDC] transition-all duration-300 hover:bg-[rgba(82,121,111,0.025)] hover:pl-2 max-[700px]:min-h-0 max-[700px]:grid-cols-[45px_1fr] max-[700px]:gap-[15px] max-[700px]:py-7">
                <div className="text-[11px] font-bold text-[#8991A0]">
                  01
                </div>

                <div>
                  <h3 className="text-[19px] font-[620] tracking-[-0.4px]">
                    Privacy by design
                  </h3>
                </div>

                <p className="max-w-[430px] text-[13px] leading-[1.7] text-[#56606A] max-[700px]:col-start-2">
                  Participate through an anonymous identity instead of putting
                  your personal profile at the center of every conversation.
                </p>
              </article>

              {/* Feature 02 */}
              <article className="grid min-h-[150px] grid-cols-[70px_1fr_1fr] items-center gap-10 border-b border-[#DADDDC] transition-all duration-300 hover:bg-[rgba(82,121,111,0.025)] hover:pl-2 max-[700px]:min-h-0 max-[700px]:grid-cols-[45px_1fr] max-[700px]:gap-[15px] max-[700px]:py-7">
                <div className="text-[11px] font-bold text-[#8991A0]">
                  02
                </div>

                <div>
                  <h3 className="text-[19px] font-[620] tracking-[-0.4px]">
                    Built for organizations
                  </h3>
                </div>

                <p className="max-w-[430px] text-[13px] leading-[1.7] text-[#56606A] max-[700px]:col-start-2">
                  Every community belongs to its organization, keeping
                  conversations focused and separated.
                </p>
              </article>

              {/* Feature 03 */}
              <article className="grid min-h-[150px] grid-cols-[70px_1fr_1fr] items-center gap-10 border-b border-[#DADDDC] transition-all duration-300 hover:bg-[rgba(82,121,111,0.025)] hover:pl-2 max-[700px]:min-h-0 max-[700px]:grid-cols-[45px_1fr] max-[700px]:gap-[15px] max-[700px]:py-7">
                <div className="text-[11px] font-bold text-[#8991A0]">
                  03
                </div>

                <div>
                  <h3 className="text-[19px] font-[620] tracking-[-0.4px]">
                    More honest conversations
                  </h3>
                </div>

                <p className="max-w-[430px] text-[13px] leading-[1.7] text-[#56606A] max-[700px]:col-start-2">
                  Share concerns, suggestions, questions and ideas in a space
                  designed to make participation easier.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* =========================
            HOW IT WORKS
        ========================= */}
        <section className="bg-white py-[105px] max-[700px]:py-[75px]">
          <div className="mx-auto max-w-[1100px] px-7 max-[700px]:px-5">
            <div className="grid grid-cols-2 max-[700px]:grid-cols-1 max-[700px]:gap-[18px]">
              <div className="text-[9px] font-[750] tracking-[1.3px] text-[#6F8580]">
                HOW IT WORKS
              </div>

              <h2 className="text-[38px] font-[620] leading-[1.15] tracking-[-1.5px] max-[700px]:text-[31px]">
                From invitation
                <br />
                to conversation.
              </h2>
            </div>

            <div className="mt-[65px] grid grid-cols-3 border-t border-[#DADDDC] max-[700px]:mt-[45px] max-[700px]:grid-cols-1">
              {/* Step 1 */}
              <div className="flex gap-5 border-r border-[#DADDDC] px-0 pt-[25px] max-[700px]:border-b max-[700px]:border-r-0 max-[700px]:py-[25px]">
                <div className="text-[10px] font-[750] text-[#6F8580]">
                  01
                </div>

                <div>
                  <h3 className="mb-[10px] text-[15px] font-[650]">
                    Join your organization
                  </h3>

                  <p className="max-w-[260px] text-[12px] leading-[1.7] text-[#56606A]">
                    Enter the organization code or invitation provided by your
                    college or company.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-5 border-r border-[#DADDDC] px-7 pt-[25px] max-[700px]:border-b max-[700px]:border-r-0 max-[700px]:px-0 max-[700px]:py-[25px]">
                <div className="text-[10px] font-[750] text-[#6F8580]">
                  02
                </div>

                <div>
                  <h3 className="mb-[10px] text-[15px] font-[650]">
                    Create your private identity
                  </h3>

                  <p className="max-w-[260px] text-[12px] leading-[1.7] text-[#56606A]">
                    Get an anonymous identity that lets you participate without
                    making your personal identity the focus.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-5 px-7 pt-[25px] max-[700px]:px-0 max-[700px]:py-[25px]">
                <div className="text-[10px] font-[750] text-[#6F8580]">
                  03
                </div>

                <div>
                  <h3 className="mb-[10px] text-[15px] font-[650]">
                    Start communicating
                  </h3>

                  <p className="max-w-[260px] text-[12px] leading-[1.7] text-[#56606A]">
                    Join conversations, raise concerns, share ideas and connect
                    with your community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            CTA
        ========================= */}
        <section className="bg-[#202524] text-white">
          <div className="mx-auto flex min-h-[245px] max-w-[1100px] items-center justify-between gap-10 px-7 py-[50px] max-[700px]:min-h-0 max-[700px]:flex-col max-[700px]:items-start max-[700px]:px-5 max-[700px]:py-[55px]">
            <div>
              <div className="text-[9px] font-[750] tracking-[1.3px] text-[#c6bcbc]">
                PRIVATEVOICE
              </div>

              <h2 className="my-[10px] mb-[7px] text-[30px] font-semibold leading-[1.2] tracking-[-0.8px] max-[700px]:text-[27px]">
                Your voice deserves a safe space.
              </h2>

              <p className="text-[13px] text-[#a8adb5]">
                Get started with PrivateVoice and experience secure, private communication.
              </p>
            </div>

            <button
              type="button"
            onClick={handleGetStarted}
              className="flex min-h-[45px] items-center gap-[25px] rounded-[6px] border-0 bg-white px-[17px] text-[13px] font-[650] text-[#20252B] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EEF2F1]"
            >
              Get Started
              <span className="text-[17px] text-[#6F8580]">→</span>
            </button>
          </div>
        </section>
      </main>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="border-t border-[#292929] bg-[#202524]">
        <div className="mx-auto grid min-h-[75px] max-w-[1100px] grid-cols-3 items-center px-7 max-[700px]:min-h-0 max-[700px]:grid-cols-1 max-[700px]:justify-items-start max-[700px]:gap-[13px] max-[700px]:px-5 max-[700px]:py-[22px]">
          <div className="flex items-center gap-[9px] text-[13px] font-[650] text-white">
            <span className="flex h-[25px] w-[25px] items-center justify-center gap-[2px] rounded-[5px] bg-[#6F8580]">
              <span className="h-[12px] w-[2px] rounded-[2px] bg-white" />
              <span className="h-[8px] w-[2px] rounded-[2px] bg-white" />
            </span>

            <span>PrivateVoice</span>
          </div>

          <p className="text-center text-[10px] text-[#838993] max-[700px]:text-left">
            Private communication for organizations.
          </p>

          <span className="text-right text-[9px] text-[#626873] max-[700px]:text-left">
            © 2026 PrivateVoice
          </span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;