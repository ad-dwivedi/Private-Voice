import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

function AnonymousIdentity() {
  const navigate = useNavigate();

  // =====================================================
  // GET LOGGED-IN USER FROM SESSION STORAGE
  // =====================================================
  //
  // IMPORTANT: this used to read localStorage.getItem("user")
  // and localStorage.getItem("organization") as JSON blobs —
  // keys that nothing in the app ever wrote to. Because of
  // that, this page ALWAYS fell through to the "Session
  // information missing" state immediately after a
  // successful login, before the user ever reached
  // /dashboard or /admin-dashboard through the normal
  // "Continue" button. Login.jsx / Register.jsx /
  // JoinOrganization.jsx write individual sessionStorage
  // keys, so we read those same keys here — the same
  // contract every other component in the app uses.
  //
  // =====================================================

  const user = useMemo(() => {
    const userId = sessionStorage.getItem("privatevoice_user_id");

    if (!userId) {
      return null;
    }

    return {
      id: userId,
      // Only ever present for admins — members never have a
      // real name written to storage (see Login.jsx).
      fullName: sessionStorage.getItem("privatevoice_full_name") || null,
      email: null, // Real email is intentionally never stored client-side.
    };
  }, []);

  // =====================================================
  // GET ORGANIZATION FROM SESSION STORAGE
  // =====================================================

  const organization = useMemo(() => {
    const organizationId = sessionStorage.getItem(
      "privatevoice_organization_id"
    );

    if (!organizationId) {
      return null;
    }

    return {
      id: organizationId,
      name:
        sessionStorage.getItem("privatevoice_organization_name") || "",
      description:
        sessionStorage.getItem(
          "privatevoice_organization_description"
        ) || "",
      code:
        sessionStorage.getItem("privatevoice_organization_code") || "",
      role: sessionStorage.getItem("privatevoice_role") || "member",
    };
  }, []);

  // =====================================================
  // GET ROLE
  // =====================================================

  const role = organization?.role || "";

  // =====================================================
  // CHECK ADMIN
  // =====================================================

  const isAdmin = role === "admin";

  // =====================================================
  // SESSION ANONYMOUS ID
  //
  // IMPORTANT:
  //
  // Same browser session:
  // Same anonymous ID
  //
  // New session:
  // New anonymous ID
  //
  // Anonymous ID is NEVER stored in localStorage.
  //
  // The storage key here MUST match the key used everywhere
  // else in the app (Login.jsx createSessionAnonymousId,
  // JoinOrganization.jsx clearOldAnonymousIdentity,
  // DashboardLayout.jsx / AdminDashboard.jsx logout). It was
  // previously the bare "anonymousId" here, which meant the
  // rest of the app clearing "privatevoice_anonymous_id"
  // never actually cleared this value.
  // =====================================================

  const anonymousId = useMemo(() => {
    const storageKey = "privatevoice_anonymous_id";

    try {
      const existingId = sessionStorage.getItem(storageKey);

      // -------------------------------------------------
      // EXISTING ID
      // -------------------------------------------------

      if (existingId) {
        return existingId;
      }

      // -------------------------------------------------
      // CREATE NEW ID
      // -------------------------------------------------

      const newId =
        "Anonymous #" +
        Math.floor(100000 + Math.random() * 900000);

      sessionStorage.setItem(storageKey, newId);

      return newId;
    } catch (error) {
      // Do not log the raw error object.
      return (
        "Anonymous #" +
        Math.floor(100000 + Math.random() * 900000)
      );
    }
  }, []);

  // =====================================================
  // DISPLAY NAME
  // =====================================================
  //
  // ROLE-BASED IDENTITY RULE: admins retain their real,
  // legitimate display name. This is intentionally NEVER
  // used for members — members are identified solely by
  // their anonymous ID, both here and everywhere else.
  // =====================================================

  const displayName = isAdmin
    ? user?.fullName || "Organization Admin"
    : "Organization Admin"; // unreachable for members; member branch never reads this

  // =====================================================
  // CONTINUE
  // =====================================================

  const handleContinue = () => {
    navigate("/dashboard");
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    navigate(-1);
  };

  // =====================================================
  // NO USER / ORGANIZATION SAFETY
  // =====================================================

  if (!user || !organization) {
    return (
      <main className="min-h-screen bg-[#F7F7F7] px-5 py-7 text-[#20252B] sm:px-8">

        <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-5xl flex-col">

          <section className="flex flex-1 items-center justify-center">

            <div className="w-full max-w-md border border-[#E5E7E6] bg-white p-8 text-center shadow-[0_20px_50px_rgba(30,35,35,0.06)]">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EEF2F1] text-xl text-[#6F8580]">
                !
              </div>

              <h1 className="mt-5 text-xl font-semibold text-[#20252B]">
                Session information missing
              </h1>

              <p className="mt-3 text-xs leading-6 text-[#737C85]">
                Your login session could not be found.
                Please log in again.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-6 flex h-12 w-full items-center justify-between bg-[#6F8580] px-5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5D716D] hover:shadow-lg"
              >
                <span>
                  Back to Login
                </span>

                <span className="text-lg">
                  →
                </span>
              </button>

            </div>

          </section>

        </div>

      </main>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-5 py-7 text-[#20252B] sm:px-8">

      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-5xl flex-col">

        {/* =================================================
            BACK
        ================================================= */}

        <div>
          <button
            type="button"
            onClick={handleBack}
            className="group flex items-center gap-2 border-0 bg-transparent px-0 py-2 text-sm font-semibold text-[#737C85] transition-all duration-200 hover:text-[#6F8580]"
          >
            <span className="text-lg transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>

            <span>
              Back
            </span>
          </button>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <section className="flex flex-1 items-center justify-center py-10">

          <div className="w-full max-w-md">

            {/* =================================================
                BRAND
            ================================================= */}

            <div className="mb-8 text-center">

              <div className="mb-5 flex items-center justify-center gap-2.5">

                <span className="flex h-9 w-9 items-center justify-center gap-[2px] rounded-md bg-[#6F8580]">

                  <span className="h-[17px] w-[2px] rounded-full bg-white" />

                  <span className="h-3 w-[2px] rounded-full bg-white" />

                  <span className="h-[7px] w-[2px] rounded-full bg-white" />

                </span>

                <span className="text-sm font-bold tracking-[0.08em]">
                  PRIVATEVOICE
                </span>

              </div>

              {/* =================================================
                  TITLE
              ================================================= */}

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[38px]">

                {isAdmin
                  ? "Organization Admin"
                  : "Your Private Identity"}

              </h1>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <p className="mt-3 text-sm leading-6 text-[#56606A]">

                {isAdmin
                  ? "You are signed in as the administrator of this organization."
                  : "This identity will be used when you participate in your organization's conversations."}

              </p>

            </div>

            {/* =================================================
                CARD
            ================================================= */}

            <div className="border border-[#E5E7E6] bg-white p-6 shadow-[0_20px_50px_rgba(30,35,35,0.06)] sm:p-8">

              <div className="text-center">

                {/* =================================================
                    ADMIN
                ================================================= */}

                {isAdmin ? (
                  <>

                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1px] text-[#8991A0]">
                      Organization Admin
                    </p>

                    {/* ADMIN AVATAR */}

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF2F1] text-xl font-bold text-[#6F8580]">
                      {displayName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* ADMIN NAME */}

                    <h2 className="mt-5 text-xl font-semibold text-[#20252B]">
                      {displayName}
                    </h2>

                    {/* ADMIN DESCRIPTION */}

                    <p className="mx-auto mt-4 max-w-sm text-xs leading-6 text-[#737C85]">
                      You are the administrator of this
                      organization. Members can see your
                      administrator role, but this account
                      does not use an anonymous community ID.
                    </p>

                  </>
                ) : (
                  /* =================================================
                     MEMBER
                  ================================================= */

                  <>

                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[1px] text-[#8991A0]">
                      Your anonymous identity
                    </p>

                    {/* ANONYMOUS AVATAR */}

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF2F1] text-xl font-bold text-[#6F8580]">
                      A
                    </div>

                    {/* ANONYMOUS ID */}

                    <h2 className="mt-5 text-xl font-semibold text-[#20252B]">
                      {anonymousId}
                    </h2>

                    {/* MEMBER DESCRIPTION */}

                    <p className="mx-auto mt-3 max-w-sm text-xs leading-6 text-[#737C85]">
                      Your real name will not be displayed
                      in community conversations. You can
                      participate using this identity during
                      your current session.
                    </p>

                  </>
                )}

              </div>

              {/* =================================================
                  INFO BOX
              ================================================= */}

              <div className="mt-7 border border-[#E5E7E6] bg-[#FAFAFA] p-4">

                <div className="flex gap-3">

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2F1] text-sm text-[#6F8580]">
                    ✓
                  </span>

                  <div>

                    <h3 className="text-xs font-semibold text-[#20252B]">

                      {isAdmin
                        ? "Administrator account"
                        : "Session privacy"}

                    </h3>

                    <p className="mt-1 text-[10px] leading-5 text-[#8991A0]">

                      {isAdmin
                        ? "Your administrator role is visible to organization members. You do not use an anonymous identity."
                        : "Your anonymous ID is kept only for the current browser session. It is not stored permanently in localStorage."}

                    </p>

                  </div>

                </div>

              </div>

              {/* =================================================
                  CONTINUE
              ================================================= */}

              <button
                type="button"
                onClick={handleContinue}
                className="group mt-6 flex h-12 w-full items-center justify-between bg-[#6F8580] px-5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5D716D] hover:shadow-lg"
              >

                <span>
                  Continue to PrivateVoice
                </span>

                <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>

              </button>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="mt-5 flex items-center justify-center gap-2 text-[9px] text-[#8991A0]">

              <span className="h-1.5 w-1.5 rounded-full bg-[#6F8580]" />

              <span>

                {isAdmin
                  ? "Administrator account"
                  : "Anonymous for this session"}

              </span>

              <span className="text-[#DADDDC]">
                /
              </span>

              <span>
                Private communication
              </span>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

export default AnonymousIdentity;