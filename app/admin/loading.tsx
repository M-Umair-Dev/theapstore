/**
 * Shown while an admin page streams. Every admin route hits MongoDB, so the
 * panel never renders instantly on a cold request.
 */
export default function AdminLoading() {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <span className="admin-spinner" aria-hidden="true" />
      Loading…
    </div>
  );
}
