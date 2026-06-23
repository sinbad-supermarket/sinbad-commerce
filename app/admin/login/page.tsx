import { redirect } from "next/navigation";
import { loginAdmin } from "./actions";
import { getCurrentAdmin } from "@/lib/auth/admin";

const errorMessages = {
  invalid: "Invalid email or password.",
  missing: "Email and password are required.",
  "not-admin": "This account is not configured for admin access.",
  required: "Please sign in to continue.",
} as const;

type LoginError = keyof typeof errorMessages;

function getErrorMessage(error: string | undefined) {
  if (!error || !(error in errorMessages)) {
    return null;
  }

  return errorMessages[error as LoginError];
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="admin-login-title">
        <h1 id="admin-login-title" className="page-title">
          Admin Login
        </h1>
        <p className="page-copy">Sign in with your admin email and password.</p>
        <form className="auth-form" action={loginAdmin}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          <button className="primary-button" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
