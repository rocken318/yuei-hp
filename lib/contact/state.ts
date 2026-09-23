import type { ContactFieldErrors } from "./schema";

/** Result of the contact Server Action (and the form's initial state). */
export type ContactState =
  | { status: "idle" }
  | { status: "invalid"; errors: ContactFieldErrors }
  | { status: "success" }
  | { status: "error" }
  | { status: "disabled" };

export const initialContactState: ContactState = { status: "idle" };
