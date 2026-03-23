import React from "react";

function Login() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900"
      style={{ fontFamily: '"Space Grotesk", "Segoe UI", sans-serif' }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col justify-between gap-10 border-b border-gray-200 bg-slate-50 p-8 md:border-b-0 md:border-r md:p-10">
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
            </div>

            <div className="grid gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gray-800" />
                Secure access for IIC & BIP coordinators
              </div>
            
            </div>
          </div>

          <div className="p-8 md:p-10">
            <h2 className="text-xl font-semibold text-gray-900">Login</h2>
            <p className="mt-2 text-sm text-gray-600">Use your email and password to continue.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@institution.edu"
                  className="w-full rounded border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-500"
                />
              </div>

              <div className="space-y-2">
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
                  className="w-full rounded border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-black px-4 py-3 text-sm font-medium text-white hover:opacity-90"
              >
                Login
              </button>

              <p className="text-xs text-gray-500">
                Trouble signing in? Contact your ICC coordinator for access.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
