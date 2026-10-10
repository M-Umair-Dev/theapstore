"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for destructive forms. The confirmation is a native dialog, so
 * Cancel really does stop the request — nothing is sent until the admin agrees.
 * While the action is in flight the button locks, which keeps a double click
 * from firing a second delete.
 */
export default function ConfirmSubmit({
  message,
  label,
  pendingLabel = "Deleting…",
  className = "btn btn-danger btn-sm",
}: {
  message: string;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
