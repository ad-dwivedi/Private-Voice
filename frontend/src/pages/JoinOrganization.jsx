import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function JoinOrganization() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("selection");

  const [organizationCode, setOrganizationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationDescription, setOrganizationDescription] =
    useState("");

  // =====================================================
  // START NEW AUTH FLOW
  // =====================================================

  const clearOldAnonymousIdentity = () => {
    sessionStorage.removeItem(
      "privatevoice_anonymous_id"
    );
  };

  // =====================================================
  // JOIN ORGANIZATION
  // =====================================================

  const handleJoin = async () => {
    const enteredCode =
      organizationCode.trim().toUpperCase();

    if (!enteredCode) {
      setError("Please enter your organization code.");
      return;
    }

    if (!enteredCode.startsWith("PV-")) {
      setError("Please enter a valid organization code.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/organizations/check?code=${encodeURIComponent(
          enteredCode
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      // IMPORTANT: never log the full API response — it may
      // contain organization/member details.

      if (!response.ok) {
        setError(
          data.message ||
            "Invalid organization code."
        );
        return;
      }

      if (!data.organization) {
        setError(
          "Organization information was not found."
        );
        return;
      }

      const organization = data.organization;

      // ---------------------------------------------------
      // CLEAR ANY OLD ANONYMOUS ID
      // ---------------------------------------------------

      clearOldAnonymousIdentity();

      // ---------------------------------------------------
      // SAVE ORGANIZATION INFO
      // ---------------------------------------------------
      //
      // Only the individual fields the UI actually needs are
      // stored, under the SAME keys that DashboardLayout,
      // AdminDashboard, and TopNavbar read from. We never
      // store the complete organization object, and never in
      // localStorage — everything here is session-scoped.
      //
      // ---------------------------------------------------

      sessionStorage.setItem(
        "privatevoice_organization_id",
        String(organization.id)
      );

      sessionStorage.setItem(
        "privatevoice_organization_code",
        organization.code
      );

      if (organization.name) {
        sessionStorage.setItem(
          "privatevoice_organization_name",
          organization.name
        );
      }

      if (organization.description) {
        sessionStorage.setItem(
          "privatevoice_organization_description",
          organization.description
        );
      }

      // ---------------------------------------------------
      // GO TO LOGIN
      // ---------------------------------------------------

      navigate(
        `/login?roomCode=${encodeURIComponent(
          organization.code
        )}`
      );
    } catch (error) {
      // Do not log the raw error object; it may include
      // stack traces or request details.

      setError(
        "Unable to connect to server. Please make sure backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CREATE ORGANIZATION
  // =====================================================

  const handleCreate = () => {
    const name =
      organizationName.trim();

    const description =
      organizationDescription.trim();

    if (!name) {
      setError(
        "Please enter an organization name."
      );
      return;
    }

    setError("");

    // ---------------------------------------------------
    // CLEAR OLD ANONYMOUS ID
    // ---------------------------------------------------

    clearOldAnonymousIdentity();

    // ---------------------------------------------------
    // SAVE ORGANIZATION DRAFT
    // ---------------------------------------------------

    sessionStorage.setItem(
      "privatevoice_create_org",
      JSON.stringify({
        name,
        description,
      })
    );

    // ---------------------------------------------------
    // GO TO REGISTER
    // ---------------------------------------------------

    navigate(
      "/register?createOrganization=true"
    );
  };

  // =====================================================
  // BACK TO OPTIONS
  // =====================================================

  const handleBackToOptions = () => {
    setMode("selection");
    setError("");
    setOrganizationCode("");
    setOrganizationName("");
    setOrganizationDescription("");
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    navigate("/");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-5 py-7 text-[#20252B] sm:px-8 lg:px-10">

      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-5xl">

        <div className="flex w-full flex-col">

          {/* =================================================
              TOP BAR
          ================================================= */}

          <div className="flex items-center">

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
              HEADER
          ================================================= */}

          <section className="mx-auto mt-16 max-w-2xl text-center sm:mt-20">

            <div className="mb-6 flex items-center justify-center gap-2.5 text-[10px] font-bold tracking-[0.18em] text-[#6F8580]">

              <span className="flex h-8 w-8 items-center justify-center gap-[2px] rounded-md bg-[#6F8580] shadow-sm transition-transform duration-300 hover:scale-105">

                <i className="h-4 w-[2px] rounded-full bg-white" />

                <i className="h-2.5 w-[2px] rounded-full bg-white" />

                <i className="h-1.5 w-[2px] rounded-full bg-white" />

              </span>

              <span>
                PRIVATEVOICE
              </span>

            </div>

            <h1 className="animate-[fadeUp_0.7s_ease-out] text-4xl font-semibold tracking-[-0.045em] text-[#20252B] sm:text-5xl lg:text-[52px]">
              Welcome to PrivateVoice
            </h1>

            <p className="mt-4 animate-[fadeUp_0.8s_ease-out] text-sm leading-7 text-[#56606A]">
              Choose how you want to continue
            </p>

          </section>

          {/* =================================================
              SELECTION
          ================================================= */}

          {mode === "selection" && (

            <section className="mt-12 grid gap-5 md:grid-cols-2">

              {/* CREATE */}

              <div className="group relative overflow-hidden border border-[#E5E7E6] bg-[#6F8580] p-7 text-white shadow-[0_20px_50px_rgba(30,35,35,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(30,35,35,0.13)] animate-[cardLeft_0.7s_ease-out] sm:p-8">

                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-125" />

                <div className="relative">

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-2xl transition-transform duration-300 group-hover:rotate-90">
                    +
                  </div>

                  <p className="mt-8 text-[9px] font-bold tracking-[0.16em] text-white/65">
                    NEW SPACE
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                    Create Organization
                  </h2>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
                    Create a private space for your organization.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      clearOldAnonymousIdentity();
                      setMode("create");
                      setError("");
                    }}
                    className="group/button mt-8 flex h-11 w-full items-center justify-between bg-white px-4 text-xs font-semibold text-[#20252B] transition-all duration-200 hover:bg-[#EEF2F1]"
                  >
                    <span>
                      Create Organization
                    </span>

                    <span className="text-lg text-[#6F8580] transition-transform duration-200 group-hover/button:translate-x-1">
                      →
                    </span>
                  </button>

                </div>

              </div>

              {/* JOIN */}

              <div className="group relative overflow-hidden border border-[#E5E7E6] bg-white p-7 shadow-[0_20px_50px_rgba(30,35,35,0.045)] transition-all duration-300 hover:-translate-y-2 hover:border-[#DADDDC] hover:shadow-[0_28px_60px_rgba(30,35,35,0.09)] animate-[cardRight_0.7s_ease-out] sm:p-8">

                <div className="absolute right-0 top-0 h-[2px] w-20 bg-[#6F8580] transition-all duration-300 group-hover:w-32" />

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EEF2F1] text-xl text-[#6F8580] transition-transform duration-300 group-hover:translate-x-1">
                  →
                </div>

                <p className="mt-8 text-[9px] font-bold tracking-[0.16em] text-[#6F8580]">
                  EXISTING SPACE
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#20252B]">
                  Join Organization
                </h2>

                <p className="mt-3 max-w-sm text-sm leading-6 text-[#56606A]">
                  Join your organization using the organization code.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    clearOldAnonymousIdentity();
                    setMode("join");
                    setError("");
                  }}
                  className="group/button mt-8 flex h-11 w-full items-center justify-between border border-[#DADDDC] bg-white px-4 text-xs font-semibold text-[#20252B] transition-all duration-200 hover:border-[#6F8580] hover:bg-[#EEF2F1]"
                >
                  <span>
                    Join Organization
                  </span>

                  <span className="text-lg text-[#6F8580] transition-transform duration-200 group-hover/button:translate-x-1">
                    →
                  </span>
                </button>

              </div>

            </section>

          )}

          {/* =================================================
              CREATE FORM
          ================================================= */}

          {mode === "create" && (

            <section className="mx-auto mt-12 w-full max-w-xl animate-[formIn_0.45s_ease-out]">

              <div className="border border-[#E5E7E6] bg-white p-6 shadow-[0_20px_50px_rgba(30,35,35,0.06)] sm:p-8">

                <button
                  type="button"
                  onClick={handleBackToOptions}
                  className="mb-7 border-0 bg-transparent p-0 text-xs font-semibold text-[#8991A0] transition hover:text-[#6F8580]"
                >
                  ← Back to options
                </button>

                <p className="text-[9px] font-bold tracking-[0.16em] text-[#6F8580]">
                  CREATE NEW SPACE
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Create Organization
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#56606A]">
                  Create a private space for your organization.
                </p>

                <div className="mt-7">

                  <label className="mb-2 block text-xs font-semibold">
                    Organization name
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. ABC College"
                    value={organizationName}
                    onChange={(e) => {
                      setOrganizationName(e.target.value);
                      setError("");
                    }}
                    className="h-12 w-full border border-[#DADDDC] bg-white px-4 text-sm text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10"
                  />

                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-xs font-semibold">

                    Description

                    <span className="ml-1 font-normal text-[#8991A0]">
                      (optional)
                    </span>

                  </label>

                  <textarea
                    rows="3"
                    placeholder="Tell members what this organization is about..."
                    value={organizationDescription}
                    onChange={(e) => {
                      setOrganizationDescription(e.target.value);
                      setError("");
                    }}
                    className="w-full resize-none border border-[#DADDDC] bg-white p-4 text-sm text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10"
                  />

                </div>

                {error && (
                  <p className="mt-3 text-[11px] text-[#9A5F5F]">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCreate}
                  className="group mt-6 flex h-12 w-full items-center justify-between bg-[#6F8580] px-5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5D716D] hover:shadow-lg"
                >
                  <span>
                    Create Organization
                  </span>

                  <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </button>

              </div>

            </section>

          )}

          {/* =================================================
              JOIN FORM
          ================================================= */}

          {mode === "join" && (

            <section className="mx-auto mt-12 w-full max-w-xl animate-[formIn_0.45s_ease-out]">

              <div className="border border-[#E5E7E6] bg-white p-6 shadow-[0_20px_50px_rgba(30,35,35,0.06)] sm:p-8">

                <button
                  type="button"
                  onClick={handleBackToOptions}
                  className="mb-7 border-0 bg-transparent p-0 text-xs font-semibold text-[#8991A0] transition hover:text-[#6F8580]"
                >
                  ← Back to options
                </button>

                <p className="text-[9px] font-bold tracking-[0.16em] text-[#6F8580]">
                  EXISTING SPACE
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Join Organization
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#56606A]">
                  Enter the organization code provided to you.
                </p>

                <div className="mt-7">

                  <label
                    htmlFor="organization-code"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Organization code
                  </label>

                  <input
                    id="organization-code"
                    type="text"
                    placeholder="PV-A7K92"
                    value={organizationCode}
                    onChange={(e) => {
                      setOrganizationCode(
                        e.target.value.toUpperCase()
                      );
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleJoin();
                      }
                    }}
                    className={`h-12 w-full border bg-white px-4 text-sm font-semibold tracking-wide text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] ${
                      error
                        ? "border-[#BD8585]"
                        : "border-[#DADDDC] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10"
                    }`}
                  />

                  {error && (
                    <p className="mt-2 text-[11px] text-[#9A5F5F]">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={loading}
                    className="group mt-5 flex h-12 w-full items-center justify-between bg-[#6F8580] px-5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5D716D] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {loading
                        ? "Checking Organization..."
                        : "Join Organization"}
                    </span>

                    <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </button>

                </div>

                <div className="mt-5 border-t border-[#E5E7E6] pt-4">

                  <p className="text-[10px] leading-5 text-[#8991A0]">
                    Organization members can see organization
                    information. The organization creator/admin
                    is identified as the administrator.
                  </p>

                </div>

              </div>

            </section>

          )}

          {/* =================================================
              FOOT NOTE
          ================================================= */}

          <div className="mt-auto flex flex-wrap items-center justify-center gap-3 pt-10 text-[9px] text-[#8991A0]">

            <span>
              Private by default
            </span>

            <span className="text-[#DADDDC]">
              /
            </span>

            <span>
              Organization controlled
            </span>

            <span className="text-[#DADDDC]">
              /
            </span>

            <span>
              Admin identified
            </span>

          </div>

        </div>

      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardLeft {
          from {
            opacity: 0;
            transform: translateX(-25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes cardRight {
          from {
            opacity: 0;
            transform: translateX(25px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes formIn {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

    </main>
  );
}

export default JoinOrganization;