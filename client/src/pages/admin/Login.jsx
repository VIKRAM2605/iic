import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { googleLoginUser, loginUser } from "../../../config/api";
import { setAuthSession } from "../../utils/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const finalizeLogin = ({ token, user }) => {
    if (!token || !user) {
      throw new Error("Invalid login response.");
    }

    setAuthSession({ token, user });

    const fromPath =
      typeof location.state?.from === "string" && location.state.from.startsWith("/")
        ? location.state.from
        : "";

    if (fromPath && fromPath !== "/login") {
      navigate(fromPath, { replace: true });
      return;
    }

    if (user.roleName === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (user.roleName === "faculty") {
      navigate("/teacher/dashboard", { replace: true });
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
      className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900"
      style={{ fontFamily: '"Space Grotesk", "Segoe UI", sans-serif' }}
    >
      <div className="w-full max-w-md rounded-md border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Login</h2>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@bitsathy.ac.in"
              className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
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
              placeholder="Enter your password"
              className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
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
  );
}

export default Login;
