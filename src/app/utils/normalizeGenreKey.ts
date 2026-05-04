export function normalizeGenreKey(text: string): string {
  if (!text) return ""

  return text
    .toLowerCase()
    .normalize("NFD") // separa tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/[^a-z0-9\s]/g, "") // elimina símbolos
    .trim()
    .replace(/\s+/g, "_") // espacios → _
}
