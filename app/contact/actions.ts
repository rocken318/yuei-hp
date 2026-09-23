"use server";

import { contactValuesFromFormData } from "@/lib/contact/schema";
import type { ContactState } from "@/lib/contact/state";
import { submitContact } from "@/lib/contact/submit";

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  try {
    return await submitContact(contactValuesFromFormData(formData), {
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      CONTACT_TO: process.env.CONTACT_TO,
      CONTACT_FROM: process.env.CONTACT_FROM,
    });
  } catch (err) {
    console.error("contact: unexpected failure", err);
    return { status: "error" };
  }
}
