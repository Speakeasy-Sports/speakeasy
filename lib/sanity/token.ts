import "server-only";

// Read token for draft mode. Server only; never import this from a client component.
export const readToken = process.env.SANITY_API_READ_TOKEN;

// Write token for the Circle sync handler. Server only.
export const writeToken = process.env.SANITY_API_WRITE_TOKEN;
