import { redirect } from "next/navigation";
import { getCurrentVendorMemberships, validDashboardMemberships } from "@/lib/auth/vendor";
import { loginVendor } from "./actions";

const errorMessages = {
  invalid: "Invalid email or password.",
  missing: "Email and password are required.",
  required: "Please sign in to continue.",
} as const;

type LoginError = keyof typeof errorMessages;

function getErrorMessage(error: string | undefined) {
  if (!error || !(error in errorMessages)) {
    return null;
  }

  return errorMessages[error as LoginError];
}

export default async function VendorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const memberships = validDashboardMemberships(await getCurrentVendorMemberships());

  if (memberships.length > 0) {
    redirect(memberships.length === 1 ? "/vendor" : "/vendor/select");
  }

  const { error } = await searchParams;
  const errorMessage = getErrorMessage(error);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="vendor-login-title">
        <h1 id="vendor-login-title" className="page-title">
          Vendor Login
        </h1>
        <p className="page-copy">Sign in with your vendor email and password.</p>
        <form className="auth-form" action={loginVendor}>
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
