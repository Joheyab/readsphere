"use client"

import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Genre = { id: string; name: string }
type BookResult = {
  id: string
  title: string
  cover_url: string | null
  authors: { name: string } | null
}

type Props = {
  onClose: () => void
  onAdded: () => void
}

type Step = "search" | "create" | "status"

const STATUS_OPTIONS = [
  { value: "want_to_read", label: "🔖 Quiero leer" },
  { value: "reading", label: "📖 Leyendo" },
  { value: "finished", label: "✅ Terminado" },
]

export default function AddBookModal({ onClose, onAdded }: Props) {
  const [step, setStep] = useState<Step>("search")

  // Search
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BookResult[]>([])
  const [searching, setSearching] = useState(false)

  // Selected book (from search or newly created)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  // Create form
  const [genres, setGenres] = useState<Genre[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newAuthor, setNewAuthor] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newIsbn, setNewIsbn] = useState("")
  const [newPages, setNewPages] = useState("")
  const [newYear, setNewYear] = useState("")
  const [newCoverUrl, setNewCoverUrl] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverMode, setCoverMode] = useState<"url" | "upload">("url")

  // Status step
  const [status, setStatus] = useState("want_to_read")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Load genres on mount
  useEffect(() => {
    supabase
      .from("genres")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setGenres(data)
      })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!query.trim()) setResults([])
  }, [query])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from("books")
        .select("id, title, cover_url, authors(name)")
        .ilike("title", `%${query}%`)
        .limit(8)
      setResults((data as unknown as BookResult[]) ?? [])
      setSearching(false)
    }, 400)

    return () => clearTimeout(timeout)
  }, [query])

  function toggleGenre(id: string) {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newAuthor.trim()) return
    if (!newIsbn.trim()) {
      setError("El ISBN es obligatorio.")
      return
    }
    setCreating(true)
    setError("")

    const { data: existingBook } = await supabase
      .from("books")
      .select("id, title")
      .eq("isbn", newIsbn.trim())
      .single()

    if (existingBook) {
      setError(`Ya existe un libro con ese ISBN: "${existingBook.title}"`)
      setCreating(false)
      return
    }

    // 1. Upsert author
    const { data: authorData, error: authorError } = await supabase
      .from("authors")
      .upsert({ name: newAuthor.trim() }, { onConflict: "name" })
      .select("id")
      .single()

    if (authorError || !authorData) {
      setError("Error al crear el autor.")
      setCreating(false)
      return
    }

    // 2. Insert book
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        isbn: newIsbn.trim() || null,
        cover_url: newCoverUrl.trim() || null,
        pages: newPages ? parseInt(newPages) : null,
        published_year: newYear ? parseInt(newYear) : null,
        author_id: authorData.id,
      })
      .select("id")
      .single()

    if (bookError || !bookData) {
      setError("Error al crear el libro.")
      setCreating(false)
      return
    }

    // Si hay imagen para subir, súbela y actualiza cover_url
    if (coverMode === "upload" && coverFile) {
      const uploadedUrl = await uploadCover(bookData.id)
      if (uploadedUrl) {
        await supabase
          .from("books")
          .update({ cover_url: uploadedUrl })
          .eq("id", bookData.id)
      }
    }

    // 3. Insert book_genres
    if (selectedGenres.length > 0) {
      await supabase.from("book_genres").insert(
        selectedGenres.map((genre_id) => ({
          book_id: bookData.id,
          genre_id,
        })),
      )
    }

    setSelectedBookId(bookData.id)
    setCreating(false)
    setStep("status")
  }

  async function handleAddToLibrary() {
    if (!selectedBookId) return
    setSaving(true)
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError("No autenticado.")
      setSaving(false)
      return
    }

    const { error: libError } = await supabase.from("user_library").upsert(
      {
        user_id: user.id,
        book_id: selectedBookId,
        status,
      },
      { onConflict: "user_id,book_id" },
    )

    const res = await fetch("/api/achievements/check", { method: "POST" })
    const { unlocked } = await res.json()

    unlocked.forEach((achievement: { title: string; description: string }) => {
      toast.success(`🏆 ${achievement.title}`, {
        description: achievement.description,
        duration: 5000,
      })
    })
    if (libError) {
      setError(libError.message)
      setSaving(false)
    } else {
      onAdded()
    }
  }

  // Función para subir la imagen
  async function uploadCover(bookId: string): Promise<string | null> {
    if (!coverFile) return null
    const ext = coverFile.name.split(".").pop()
    const path = `${bookId}/cover.${ext}`
    const { error } = await supabase.storage
      .from("covers")
      .upload(path, coverFile, { upsert: true })
    if (error) return null
    return supabase.storage.from("covers").getPublicUrl(path).data.publicUrl
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {step !== "search" && (
              <button
                onClick={() =>
                  setStep(
                    step === "status"
                      ? selectedBookId
                        ? "search"
                        : "create"
                      : "search",
                  )
                }
                className="text-zinc-400 hover:text-white transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-white font-medium text-sm">
              {step === "search" && "Agregar libro"}
              {step === "create" && "Nuevo libro"}
              {step === "status" && "¿Cómo lo estás leyendo?"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {/* ── STEP: SEARCH ── */}
          {step === "search" && (
            <div className="space-y-4">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por título..."
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-2">
                  {results.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBookId(book.id)
                        setStep("status")
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl transition text-left"
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-700 shrink-0">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-zinc-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium line-clamp-1">
                          {book.title}
                        </p>
                        {book.authors && (
                          <p className="text-zinc-500 text-xs mt-0.5">
                            {book.authors.name}
                          </p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-zinc-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}
                  {query.trim() && !searching && results.length != 0 && (
                    <div className="text-center py-8">
                      <p className="text-zinc-400 text-sm">
                        ¿No es el que andabas buscando?
                      </p>
                      <p className="text-zinc-600 text-xs mt-1 mb-4">
                        Puedes agregarlo manualmente
                      </p>
                      <button
                        onClick={() => {
                          setNewTitle(query)
                          setStep("create")
                        }}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition"
                      >
                        + Agregar {query}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No results */}
              {query.trim() && !searching && results.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-zinc-400 text-sm">
                    No encontramos{" "}
                    <span className="text-white">&quot;{query}&quot;</span>
                  </p>
                  <p className="text-zinc-600 text-xs mt-1 mb-4">
                    ¿Quieres agregarlo manualmente?
                  </p>
                  <button
                    onClick={() => {
                      setNewTitle(query)
                      setStep("create")
                    }}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition"
                  >
                    + Agregar {query}
                  </button>
                </div>
              )}

              {/* Empty query hint */}
              {!query.trim() && (
                <p className="text-center text-zinc-600 text-xs py-6">
                  Escribe el título del libro que quieres agregar
                </p>
              )}
            </div>
          )}

          {/* ── STEP: CREATE ── */}
          {step === "create" && (
            <div className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título del libro"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Autor <span className="text-red-400">*</span>
                </label>
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Nombre del autor"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Año
                  </label>
                  <input
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="2024"
                    type="number"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Páginas
                  </label>
                  <input
                    value={newPages}
                    onChange={(e) => setNewPages(e.target.value)}
                    placeholder="320"
                    type="number"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  ISBN <span className="text-red-400">*</span>
                </label>
                <input
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  placeholder="978-3-16-148410-0"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Portada
                </label>

                {/* Toggle URL / Subir */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCoverMode("url")}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${
                      coverMode === "url"
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("upload")}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${
                      coverMode === "upload"
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Subir imagen
                  </button>
                </div>

                {coverMode === "url" ? (
                  <input
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                  />
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-violet-500 transition bg-zinc-800/50">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Preview"
                          className="h-full w-full object-contain rounded-xl p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-zinc-500">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                          </svg>
                          <span className="text-xs">Haz clic para subir</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setCoverFile(file)
                          setCoverPreview(URL.createObjectURL(file))
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Sinopsis del libro..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition resize-none"
                />
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-2">
                    Géneros
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((g) => {
                      const selected = selectedGenres.includes(g.id)
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => toggleGenre(g.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selected
                              ? "bg-violet-600 text-white border border-violet-500"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={
                  creating ||
                  !newTitle.trim() ||
                  !newAuthor.trim() ||
                  !newIsbn.trim()
                }
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
              >
                {creating ? "Creando libro..." : "Crear y continuar →"}
              </button>
            </div>
          )}

          {/* ── STEP: STATUS ── */}
          {step === "status" && (
            <div className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <p className="text-zinc-400 text-sm">
                ¿En qué estado está este libro para ti?
              </p>

              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition text-sm ${
                      status === opt.value
                        ? "bg-violet-600/10 border-violet-500 text-white"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {opt.label}
                    {status === opt.value && (
                      <svg
                        className="w-4 h-4 text-violet-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddToLibrary}
                disabled={saving}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors mt-2"
              >
                {saving ? "Guardando..." : "Agregar a mi biblioteca"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
