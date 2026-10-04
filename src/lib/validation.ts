import { z } from "zod"
import { SOURCES } from "./constants"
import { SHARE_VARIANTS } from "./share-variants"

// ---------------------------------------------------------------------------
// Registration validation — shared by the client form and the API route.
// ---------------------------------------------------------------------------

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Please enter your full name (at least 3 characters).")
    .max(80, "Name is too long.")
    .regex(/^[a-zA-Z][a-zA-Z .'-]*$/, "Name can only contain letters, spaces, dots and hyphens."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required.")
    .email("Enter a valid email address, e.g. you@college.ac.in"),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Enter a valid 10-digit WhatsApp number.")
    .max(15, "Enter a valid WhatsApp number with country code.")
    .regex(/^\+?[0-9]{10,15}$/, "WhatsApp number can only contain digits (optionally starting with +)."),
  college: z
    .string()
    .trim()
    .min(2, "College name is required.")
    .max(120, "College name is too long."),
  branch: z
    .string()
    .trim()
    .min(1, "Please select your branch.")
    .max(60),
  graduationYear: z
    .number({ message: "Please select your graduation year." })
    .int()
    .min(2025, "Graduation year looks incorrect.")
    .max(2030, "Graduation year looks incorrect."),
  source: z.enum(SOURCES, { message: "Please select how you heard about us." }),
  sourceCode: z.string().trim().max(40).optional().nullable(),
  refCode: z.string().trim().max(20).optional().nullable(),
  shareVariant: z.enum(SHARE_VARIANTS).optional().nullable(),
})

export type RegistrationInput = z.infer<typeof registrationSchema>

/** Parse a form payload (strings) into the typed shape, collecting field errors. */
export function parseRegistrationPayload(payload: unknown) {
  return registrationSchema.safeParse(payload)
}

export function flattenZodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    if (!out[key]) out[key] = issue.message
  }
  return out
}
