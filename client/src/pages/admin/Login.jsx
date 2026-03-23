import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { googleLoginUser, loginUser } from "../../../config/api";
import { setAuthSession } from "../../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const finalizeLogin = ({ token, user }) => {
    if (!token || !user) {
      throw new Error("Invalid login response.");
    }

    setAuthSession({ token, user });

    if (["admin", "faculty"].includes(user.roleName)) {
      navigate("/eventdetails", { replace: true });
      return;
    }

    navigate("/unauthorized", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await loginUser({ email, password });
      const token = response?.data?.token;
      const user = response?.data?.user;
      finalizeLogin({ token, user });
    } catch (error) {
      setErrorMessage(error.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    const credential = String(credentialResponse?.credential ?? "").trim();

    if (!credential) {
      setErrorMessage("Google sign-in failed. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await googleLoginUser({ credential });
      const token = response?.data?.token;
      const user = response?.data?.user;
      finalizeLogin({ token, user });
    } catch (error) {
      setErrorMessage(error.message || "Google login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900"
      style={{ fontFamily: '"Space Grotesk", "Segoe UI", sans-serif' }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col justify-between gap-12 border-b border-gray-200 bg-white p-12 md:border-b-0 md:border-r md:p-12">
            <div className="flex h-full flex-col">
              <div>
                <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold tracking-[0.2em] text-gray-700">
                  IIC PORTAL
                </span>
                <h1 className="mt-6 text-3xl font-semibold leading-tight text-gray-900 md:text-4xl">
                  Welcome back.
                </h1>
                <p className="mt-4 text-sm text-gray-600">
                  Sign in to manage event documentation, attachments, and official reports with ease.
                </p>

                <div className="mt-6 space-y-3 text-xs text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-800" />
                    Make sure to login with proper credentials.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-800" />
                    Track events, uploads, and approvals in one place.
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-800" />
                    Trouble signing in? Contact your IIC coordinator for access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h2 className="text-2xl font-semibold text-gray-900\">Login</h2>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label htmlFor="email\" className="block text-sm font-medium text-gray-800">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="example@bitsathy.ac.in"
                  className="w-full rounded border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="password"
                  className="w-full rounded border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                <span>OR</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              {googleClientId ? (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => setErrorMessage("Google sign-in failed. Please try again.")}
                    useOneTap={false}
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500">Google Sign-In is unavailable. Configure `VITE_GOOGLE_CLIENT_ID`.</p>
              )}

              {errorMessage && <p className="text-sm font-medium text-red-600">{errorMessage}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
