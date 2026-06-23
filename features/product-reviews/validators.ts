export function parseRequiredAdminNotes(formData: FormData) {
  const notes = String(formData.get("admin_notes") ?? "").trim();

  if (!notes) {
    throw new Error("Admin notes are required for this review action.");
  }

  return notes;
}
