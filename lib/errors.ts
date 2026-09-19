/**
 * Turns the common database and auth failures into plain English.
 *
 * Deliberately dependency-free so both the server and the client error
 * boundary can import it.
 */
export function explainError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("querySrv")) {
    return (
      "Your network refused the DNS SRV lookup this connection string needs. " +
      'Set MONGODB_DNS_SERVERS="1.1.1.1,8.8.8.8" in .env.local and restart, or ' +
      "switch MONGODB_URI to Atlas's Standard (non-SRV) connection string."
    );
  }
  if (message.includes("MONGODB_URI is not set")) {
    return (
      "No database configured yet. Paste your MongoDB Atlas connection string " +
      "into MONGODB_URI in .env.local, then restart the server."
    );
  }
  if (
    message.includes("bad auth") ||
    message.includes("Authentication failed") ||
    message.includes("SCRAM")
  ) {
    return "The database username or password in MONGODB_URI is wrong.";
  }
  if (message.includes("whitelist") || message.includes("not allowed to access")) {
    return (
      "This machine's IP is not on the Atlas allowlist. Add it under " +
      "Security -> Network Access in Atlas."
    );
  }
  if (message.includes("ENOTFOUND")) {
    return "The cluster hostname in MONGODB_URI could not be resolved. Check it for typos.";
  }
  if (message.includes("Server selection timed out")) {
    return (
      "Could not reach the cluster. Check the Atlas allowlist and your " +
      "internet connection."
    );
  }

  return message;
}
