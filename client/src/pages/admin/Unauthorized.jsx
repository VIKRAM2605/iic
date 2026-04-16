import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-3 text-sm text-slate-600">
          You do not have permission to access this page. Please contact your administrator if you think this is a
          mistake.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Login
          </Link>
          <Link to="/eventdetails" className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Try Event Details
          </Link>
        </div>
      </div>
    </div>
  );
}


