type ProductReviewActionsProps = {
  approveAction: () => void | Promise<void>;
  rejectAction: (formData: FormData) => void | Promise<void>;
  requestChangesAction: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  error?: string;
};

export function ProductReviewActions({
  approveAction,
  rejectAction,
  requestChangesAction,
  disabled = false,
  error,
}: ProductReviewActionsProps) {
  if (disabled) {
    return <p className="empty-state">This submission is no longer awaiting review.</p>;
  }

  return (
    <section className="admin-form">
      <h2 className="section-title">Review decision</h2>
      {error ? <p className="form-error">{error}</p> : null}

      <form action={approveAction}>
        <button className="primary-button" type="submit">
          Approve
        </button>
      </form>

      <form className="section-stack" action={requestChangesAction}>
        <label className="field">
          <span>Admin notes</span>
          <textarea name="admin_notes" required />
        </label>
        <button className="secondary-button" type="submit">
          Request changes
        </button>
      </form>

      <form className="section-stack" action={rejectAction}>
        <label className="field">
          <span>Admin notes</span>
          <textarea name="admin_notes" required />
        </label>
        <button className="danger-button" type="submit">
          Reject
        </button>
      </form>
    </section>
  );
}
