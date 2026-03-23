import React from "react";

function Login() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-900"
      style={{ fontFamily: '"Space Grotesk", "Segoe UI", sans-serif' }}
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-3 text-2xl font-semibold text-gray-900">
            <img
              src="/bit-logo.jpg"
              alt="BIT Logo"
              className="h-12 w-12 object-contain"
            />
            IIC Portal
          </h1>
          <p className="text-base text-gray-600">Sign in to continue</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-base font-medium text-gray-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@institution.edu"
              className="w-full rounded border border-gray-300 bg-white p-2.5 text-base text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-base font-medium text-gray-800">
                Password
              </label>
              <a href="/forgot-password" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="w-full rounded border border-gray-300 bg-white p-2.5 text-base text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded bg-black px-4 py-3 text-base font-medium text-white hover:opacity-90"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
