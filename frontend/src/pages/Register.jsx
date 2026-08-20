import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roomCode = searchParams.get("roomCode");

  const createOrganization =
    searchParams.get("createOrganization") === "true";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [organizationCode, setOrganizationCode] = useState(
    roomCode ? roomCode.toUpperCase() : ""
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // HANDLE ORGANIZATION CODE
  // =====================================================

  const handleOrganizationCodeChange = (e) => {
    setOrganizationCode(e.target.value.toUpperCase());

    setError("");
    setSuccess("");
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // ===================================================
    // JOIN ORGANIZATION VALIDATION
    // ===================================================

    let code = "";

    if (!createOrganization) {
      code = organizationCode.trim().toUpperCase();

      if (!code) {
        setError("Please enter your organization code.");
        return;
      }

      if (!code.startsWith("PV-")) {
        setError("Please enter a valid organization code.");
        return;
      }
    }

    try {
      setLoading(true);

      // =================================================
      // STEP 1
      // CREATE USER ACCOUNT
      // =================================================

      const registerResponse = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            fullName,
            email,
            password,
          }),
        }
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(
          registerData.message || "Registration failed."
        );
        return;
      }

      // =================================================
      // GET TOKEN + USER ID
      // =================================================

      const token = registerData.token;
      const userId = registerData.userId;

      if (!token) {
        setError(
          "Account was created but authentication token was not returned."
        );
        return;
      }

      if (!userId) {
        setError(
          "Account was created but user ID was not returned."
        );
        return;
      }

      // =================================================
      // TEMPORARILY SAVE TOKEN
      //
      // Needed because create/join organization APIs
      // require authentication.
      //
      // It will be removed after the operation because
      // the user will login normally afterward.
      // =================================================

      sessionStorage.setItem(
        "privatevoice_token",
        token
      );

      // =================================================
      // STEP 2
      // CREATE ORGANIZATION
      // =================================================

      if (createOrganization) {
        const organizationDraft =
          sessionStorage.getItem(
            "privatevoice_create_org"
          );

        if (!organizationDraft) {
          sessionStorage.removeItem(
            "privatevoice_token"
          );

          setError(
            "Organization information is missing. Please start again."
          );

          return;
        }

        let organization;

        try {
          organization = JSON.parse(
            organizationDraft
          );
        } catch (parseError) {
          sessionStorage.removeItem(
            "privatevoice_token"
          );

          setError(
            "Invalid organization information. Please start again."
          );

          return;
        }

        if (!organization?.name?.trim()) {
          sessionStorage.removeItem(
            "privatevoice_token"
          );

          setError(
            "Organization name is required."
          );

          return;
        }

        // ===============================================
        // CREATE ORGANIZATION API
        // ===============================================

        const organizationResponse = await fetch(
          "http://localhost:5000/api/organizations/create",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              name: organization.name.trim(),

              description:
                organization.description?.trim() || "",
            }),
          }
        );

        const organizationData =
          await organizationResponse.json();

        if (!organizationResponse.ok) {
          sessionStorage.removeItem(
            "privatevoice_token"
          );

          setError(
            organizationData.message ||
              "Account created, but organization creation failed."
          );

          return;
        }

        // ===============================================
        // ORGANIZATION CREATED
        // ===============================================

        const createdOrganization =
          organizationData.organization;

        if (!createdOrganization) {
          sessionStorage.removeItem(
            "privatevoice_token"
          );

          setError(
            "Organization was created but organization information was not returned."
          );

          return;
        }

        if (
          !createdOrganization.id ||
          !createdOrganization.code
        ) {
          sessionStorage.removeItem(
            "privatevoice_token"
          );

          setError(
            "Organization was created but required details (id/code) were not returned."
          );

          return;
        }

        // ===============================================
        // SAVE ORGANIZATION INFO
        // ===============================================

        sessionStorage.setItem(
          "privatevoice_organization_id",
          String(createdOrganization.id)
        );

        sessionStorage.setItem(
          "privatevoice_organization_code",
          createdOrganization.code
        );

        if (createdOrganization.name) {
          sessionStorage.setItem(
            "privatevoice_organization_name",
            createdOrganization.name
          );
        }

        if (createdOrganization.description) {
          sessionStorage.setItem(
            "privatevoice_organization_description",
            createdOrganization.description
          );
        }

        // ===============================================
        // REMOVE TEMP DATA
        // ===============================================

        sessionStorage.removeItem(
          "privatevoice_create_org"
        );

        sessionStorage.removeItem(
          "privatevoice_token"
        );

        // ===============================================
        // CLEAR FORM
        // ===============================================

        setFormData({
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // ===============================================
        // SUCCESS
        // ===============================================

        setSuccess(
          `Organization created successfully! Your organization code is ${createdOrganization.code}`
        );

        // ===============================================
        // GO TO LOGIN
        // ===============================================

        setTimeout(() => {
          navigate(
            `/login?roomCode=${encodeURIComponent(
              createdOrganization.code
            )}`
          );
        }, 2500);

        return;
      }

      // =================================================
      // STEP 3
      // JOIN EXISTING ORGANIZATION
      // =================================================

      const joinResponse = await fetch(
        "http://localhost:5000/api/organizations/join",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            organizationCode: code,
          }),
        }
      );

      const joinData = await joinResponse.json();

      // =================================================
      // JOIN REQUEST ERROR
      // =================================================

      if (!joinResponse.ok) {
        sessionStorage.removeItem(
          "privatevoice_token"
        );

        setError(
          joinData.message ||
            "Unable to send organization request."
        );

        return;
      }

      // =================================================
      // SAVE ORGANIZATION INFO IF RETURNED
      // =================================================

      if (joinData.request) {
        if (
          joinData.request.organizationId
        ) {
          sessionStorage.setItem(
            "privatevoice_organization_id",
            String(
              joinData.request.organizationId
            )
          );
        }

        if (
          joinData.request.organizationCode
        ) {
          sessionStorage.setItem(
            "privatevoice_organization_code",
            joinData.request.organizationCode
          );
        }
      }

      // =================================================
      // REMOVE TEMP TOKEN
      // =================================================

      sessionStorage.removeItem(
        "privatevoice_token"
      );

      // =================================================
      // CLEAR FORM
      // =================================================

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // =================================================
      // SUCCESS
      // =================================================

      setSuccess(
        "Account created successfully. Your request has been sent to the organization admin for approval."
      );

      // =================================================
      // GO TO LOGIN
      // =================================================

      setTimeout(() => {
        navigate(
          `/login?roomCode=${encodeURIComponent(
            code
          )}`
        );
      }, 2500);
    } catch (error) {
      sessionStorage.removeItem(
        "privatevoice_token"
      );

      setError(
        "Unable to connect to server. Please make sure backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = () => {
    if (roomCode) {
      navigate(
        `/login?roomCode=${encodeURIComponent(
          roomCode
        )}`
      );
    } else {
      navigate("/login");
    }
  };

  // =====================================================
  // BACK
  // =====================================================

  const handleBack = () => {
    navigate("/organization");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-5 py-7 text-[#20252B] sm:px-8 lg:px-10">

      <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-5xl flex-col">

        {/* BACK */}

        <div>
          <button
            type="button"
            onClick={handleBack}
            disabled={loading}
            className="group flex items-center gap-2 border-0 bg-transparent px-0 py-2 text-sm font-semibold text-[#737C85] transition-all duration-200 hover:text-[#6F8580] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-lg transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>

            <span>Back</span>
          </button>
        </div>

        {/* AUTH SECTION */}

        <section className="flex flex-1 items-center justify-center py-8">

          <div className="w-full max-w-md animate-[authIn_0.5s_ease-out]">

            {/* BRAND */}

            <div className="mb-7 text-center">

              <div className="mb-5 flex items-center justify-center gap-2.5">

                <span className="flex h-9 w-9 items-center justify-center gap-[2px] rounded-md bg-[#6F8580] shadow-sm">

                  <span className="h-[17px] w-[2px] rounded-full bg-white" />

                  <span className="h-3 w-[2px] rounded-full bg-white" />

                  <span className="h-[7px] w-[2px] rounded-full bg-white" />

                </span>

                <span className="text-sm font-bold tracking-[0.08em]">
                  PRIVATEVOICE
                </span>

              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-[38px]">
                Create Your Account
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#56606A]">
                Create your account to continue with PrivateVoice.
              </p>

              {/* CREATE ORGANIZATION */}

              {createOrganization && (
                <p className="mt-3 text-[11px] font-semibold text-[#6F8580]">
                  Creating a new organization
                </p>
              )}

              {/* JOIN ORGANIZATION */}

              {roomCode && !createOrganization && (
                <p className="mt-3 text-[11px] font-semibold text-[#6F8580]">
                  Organization:{" "}
                  {roomCode.toUpperCase()}
                </p>
              )}

            </div>

            {/* CARD */}

            <div className="border border-[#E5E7E6] bg-white p-6 shadow-[0_20px_50px_rgba(30,35,35,0.06)] sm:p-8">

              <form onSubmit={handleSubmit}>

                {/* FULL NAME */}

                <div>

                  <label
                    htmlFor="register-name"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Full Name
                  </label>

                  <input
                    id="register-name"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                    className="h-12 w-full border border-[#DADDDC] bg-white px-4 text-sm text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10 disabled:bg-[#F7F7F7]"
                  />

                </div>

                {/* EMAIL */}

                <div className="mt-5">

                  <label
                    htmlFor="register-email"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Email address
                  </label>

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="h-12 w-full border border-[#DADDDC] bg-white px-4 text-sm text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10 disabled:bg-[#F7F7F7]"
                  />

                </div>

                {/* ORGANIZATION CODE - JOIN ONLY */}

                {!createOrganization && (
                  <div className="mt-5">

                    <label
                      htmlFor="organization-code"
                      className="mb-2 block text-xs font-semibold"
                    >
                      Organization Code
                    </label>

                    <input
                      id="organization-code"
                      type="text"
                      value={organizationCode}
                      onChange={
                        handleOrganizationCodeChange
                      }
                      placeholder="PV-A7K92"
                      autoComplete="off"
                      disabled={loading}
                      className="h-12 w-full border border-[#DADDDC] bg-white px-4 text-sm font-semibold tracking-wide text-[#20252B] uppercase outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10 disabled:bg-[#F7F7F7]"
                    />

                    <p className="mt-2 text-[10px] leading-5 text-[#8991A0]">
                      Your request will be sent to the organization admin for approval.
                    </p>

                  </div>
                )}

                {/* PASSWORD */}

                <div className="mt-5">

                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="register-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-12 w-full border border-[#DADDDC] bg-white px-4 pr-16 text-sm text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10 disabled:bg-[#F7F7F7]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent px-2 py-1 text-[10px] font-semibold text-[#8991A0] hover:text-[#6F8580] disabled:cursor-not-allowed"
                    >
                      {showPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

                {/* CONFIRM PASSWORD */}

                <div className="mt-5">

                  <label
                    htmlFor="register-confirm-password"
                    className="mb-2 block text-xs font-semibold"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.confirmPassword
                      }
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-12 w-full border border-[#DADDDC] bg-white px-4 pr-16 text-sm text-[#20252B] outline-none transition-all duration-200 placeholder:text-[#8991A0] focus:border-[#6F8580] focus:ring-4 focus:ring-[#6F8580]/10 disabled:bg-[#F7F7F7]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent px-2 py-1 text-[10px] font-semibold text-[#8991A0] hover:text-[#6F8580] disabled:cursor-not-allowed"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>

                  </div>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="mt-4 border border-[#E5CFCF] bg-[#FBF5F5] px-3 py-2.5">
                    <p className="text-[11px] leading-5 text-[#9A5F5F]">
                      {error}
                    </p>
                  </div>
                )}

                {/* SUCCESS */}

                {success && (
                  <div className="mt-4 border border-[#D7E4DA] bg-[#F5F9F6] px-3 py-2.5">
                    <p className="text-[11px] leading-5 text-[#53715F]">
                      {success}
                    </p>
                  </div>
                )}

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-6 flex h-12 w-full items-center justify-between bg-[#6F8580] px-5 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5D716D] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <span>
                    {loading
                      ? createOrganization
                        ? "Creating Organization..."
                        : "Sending Request..."
                      : createOrganization
                      ? "Create Organization"
                      : "Create Account & Request Access"}
                  </span>

                  <span className="text-lg transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>

                </button>

              </form>

              {/* LOGIN */}

              <div className="mt-6 border-t border-[#E5E7E6] pt-5 text-center">

                <span className="text-[11px] text-[#8991A0]">
                  Already have an account?
                </span>

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="ml-1 border-0 bg-transparent p-0 text-[11px] font-semibold text-[#6F8580] hover:text-[#5D716D] disabled:cursor-not-allowed"
                >
                  Login
                </button>

              </div>

            </div>

            {/* PRIVACY */}

            <div className="mt-5 flex items-center justify-center gap-2 text-[9px] text-[#8991A0]">

              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6F8580]" />

              <span>
                Private by default
              </span>

              <span className="text-[#DADDDC]">
                /
              </span>

              <span>
                No public profile
              </span>

            </div>

          </div>

        </section>

      </div>

      {/* ANIMATION */}

      <style>{`
        @keyframes authIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
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

export default Register;