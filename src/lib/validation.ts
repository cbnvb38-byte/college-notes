import { z } from "zod";

// Zod Schema to validate Note Upload data inputs
export const noteUploadSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters long")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  branchId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid branch ID"),
  semester: z
    .coerce.number()
    .int()
    .min(1, "Semester must be between 1 and 8")
    .max(8, "Semester must be between 1 and 8"),
  subjectId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid subject ID"),
  college: z
    .string()
    .min(2, "College must be at least 2 characters long")
    .max(100, "College must be less than 100 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  professor: z
    .string()
    .min(2, "Professor name must be at least 2 characters long")
    .max(100, "Professor name must be less than 100 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  file: z
    .any()
    .refine((file) => file instanceof File, "A valid PDF file is required")
    .refine(
      (file) => file instanceof File && file.type === "application/pdf",
      "Only PDF files are supported"
    )
    .refine(
      (file) => file instanceof File && file.size > 0,
      "File cannot be empty"
    )
    .refine(
      (file) => file instanceof File && file.size <= 20 * 1024 * 1024,
      "File size must be less than 20MB (20971520 bytes)"
    ),
});

export type NoteUploadInput = z.infer<typeof noteUploadSchema>;
