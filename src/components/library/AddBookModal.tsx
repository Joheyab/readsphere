/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { supabase } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Genre = { id: string; name: string }
type BookResult = {
  id: string
  title: string
  cover_url: string | null
  authors: { name: string } | null
  isbn: string | null
  published_year: string | null
  pages: number | null
}

type Props = {
  onClose: () => void
  onAdded: () => void
}

type Step = "search" | "create" | "status"

const STATUS_OPTIONS = [
  { value: "want_to_read" },
  { value: "reading" },
  { value: "finished" },
]
type OpenLibraryResult = {
  work: {
    key: string
    title: string
    author?: string
    year?: number
    number_of_pages?: number
    pagination?: string
  }
  editions: {
    key: string
    title: string
    cover_i?: number
    language: string[]
    isbn: string[]
    publish_date?: string
    pagination?: string
    number_of_pages?: string
  }[]
}

export default function AddBookModal({ onClose, onAdded }: Props) {
  const t = useTranslations()
  const [step, setStep] = useState<Step>("search")

  // Search
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BookResult[]>([])
  const [searching, setSearching] = useState(false)

  const [openLibraryResults, setOpenLibraryResults] =
    useState<OpenLibraryResult | null>(null)
  const [searchingExternal, setSearchingExternal] = useState(false)

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
  const [searchLang, setSearchLang] = useState<"spa" | "eng">("spa")

  const normalizeGenreKey = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[-]/g, " ") // 👈 convierte guiones a espacio
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")

  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .trim()

  async function searchWithEditions(query: string) {
    if (!query.trim()) return

    try {
      setSearchingExternal(true)

      // 🔍 1. SEARCH
      const searchRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          query,
        )}&limit=10&fields=key,title,author_name,first_publish_year,editions`,
      )

      const searchData = await searchRes.json()
      const normalizedQuery = normalizeText(query)

      // 🧠 2. SCORING
      const scored = (searchData.docs ?? []).map((book: any) => {
        const title = normalizeText(book.title || "")
        const hasExactEdition = book.editions?.docs?.some(
          (e: any) => normalizeText(e.title || "") === normalizedQuery,
        )

        let score = 0

        const editionsCount = book.editions?.numFound || 0

        // 📚 primero calidad del work (LO MÁS IMPORTANTE)
        score += Math.min(editionsCount * 3, 150)

        // 🎯 match (pero con menos peso)
        if (title === normalizedQuery) score += 40
        if (hasExactEdition) score += 40
        if (title.startsWith(normalizedQuery)) score += 25
        if (title.includes(normalizedQuery)) score += 15

        // ⚠️ penalizaciones
        if (editionsCount <= 1) score -= 80

        if (book.first_publish_year > new Date().getFullYear()) {
          score -= 40
        }

        return { ...book, _score: score }
      })

      const bestMatch = scored.sort((a: any, b: any) => b._score - a._score)[0]

      if (!bestMatch) {
        setOpenLibraryResults(null)
        return
      }

      // 📚 3. TRAER EDICIONES
      const editionsRes = await fetch(
        `https://openlibrary.org${bestMatch.key}/editions.json?limit=50`,
      )

      const editionsData = await editionsRes.json()

      console.log(editionsData)
      // 🔢 función ISBN limpia
      const cleanIsbns = (isbns: string[] = []) => {
        const cleaned = isbns
          .map((i) => i.replace(/[^0-9X]/gi, ""))
          .filter((i) => i.length === 13 || i.length === 10)

        const isbn13 = cleaned.filter((i) => i.length === 13)
        const isbn10 = cleaned.filter((i) => i.length === 10)

        return [...new Set([...isbn13, ...isbn10])]
      }

      // 🧼 4. NORMALIZAR EDICIONES
      const editions = (editionsData.entries ?? []).map((e: any) => {
        const languages =
          e.languages?.map((l: any) => l.key?.split("/").pop()) || []

        const isSpanish = languages.includes("spa")

        return {
          key: e.key,
          title: e.title,
          publish_date: e.publish_date,
          number_of_pages:
            e.number_of_pages ||
            (e.pagination ? parseInt(e.pagination) : undefined),
          cover_i: e.covers?.[0],
          language: languages,
          isbn: cleanIsbns(e.isbn_13 || e.isbn_10 || []),
          _isSpanish: isSpanish,
        }
      })
      // 🇪🇸 5. ORDEN POR IDIOMA (PRIORIDAD)
      let sortedEditions = editions

      if (searchLang === "spa") {
        sortedEditions = [
          ...editions.filter((e: { _isSpanish: any }) => e._isSpanish),
          ...editions.filter((e: { _isSpanish: any }) => !e._isSpanish),
        ]
      }

      if (searchLang === "eng") {
        sortedEditions = [
          ...editions.filter((e: { _isSpanish: any }) => !e._isSpanish),
          ...editions.filter((e: { _isSpanish: any }) => e._isSpanish),
        ]
      }

      // 🧼 limpiar flags internos
      const finalEditions = sortedEditions.map(
        ({
          _isSpanish,
          ...rest
        }: { _isSpanish: any } & Record<string, unknown>) => rest,
      )

      // 🎯 6. RESULTADO FINAL
      setOpenLibraryResults({
        work: {
          key: bestMatch.key,
          title: bestMatch.title,
          author: bestMatch.author_name?.[0],
          year: bestMatch.publish_date,
          number_of_pages: bestMatch.number_of_pages,
        },
        editions: finalEditions,
      })
      console.log(openLibraryResults)
    } catch (error) {
      console.error(error)
    } finally {
      setSearchingExternal(false)
    }
  }

  async function handleSelectOpenLibraryBook(book: any, work: any) {
    setCreating(true)
    setError("")
    console.log("Selected Open Library book:", { book, work })

    const authorName = work.author ?? "Autor desconocido"
    const isbn = book.isbn?.[0] ?? null

    setCreating(false)
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
      : null

    // 1. Upsert author
    const { data: authorData, error: authorError } = await supabase
      .from("authors")
      .upsert({ name: authorName }, { onConflict: "name" })
      .select("id")
      .single()

    if (authorError || !authorData) {
      setError("Error al guardar el autor.")
      setCreating(false)
      return
    }

    // 2. Verificar si el ISBN ya existe
    if (isbn) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("isbn", isbn)
        .single()

      if (existing) {
        setSelectedBookId(existing.id)
        setCreating(false)
        setStep("status")
        return
      }
    }

    // 3. Insert book
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .insert({
        title: book.title,
        isbn,
        cover_url: coverUrl,
        pages: book.number_of_pages || null,
        published_year: book.publish_date ?? null,
        author_id: authorData.id,
      })
      .select("id")
      .single()

    if (bookError || !bookData) {
      setError("Error al guardar el libro.")
      setCreating(false)
      return
    }
    setStep("status")
    setCreating(false)
    setSelectedBookId(bookData.id)
  }
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
    if (!query.trim()) setResults([])
  }, [query])

  useEffect(() => {
    if (!query.trim()) return

    const controller = new AbortController()

    const timeout = setTimeout(() => {
      searchWithEditions(query)
    }, 300) // debounce

    return () => {
      clearTimeout(timeout)
      controller.abort() // cancela request anterior
    }
  }, [query, searchLang])
  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        setOpenLibraryResults(null) // ✅ correcto
        setSearching(false)
        return
      }

      setSearching(true)

      const { data } = await supabase
        .from("books")
        .select(
          "id, title, cover_url, authors(name), isbn, published_year, pages",
        )
        .ilike("title", `%${query}%`)
        .limit(8)

      setResults((data as unknown as BookResult[]) ?? [])
      setOpenLibraryResults(null) // ✅ reset correcto
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
        published_year: newYear ? newYear : null,
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

  const filteredEditions = (() => {
    if (!openLibraryResults) return []

    const withLang = openLibraryResults.editions.filter(
      (b) => b.language?.length,
    )

    const noLang = openLibraryResults.editions.filter(
      (b) => !b.language?.length,
    )

    const filtered = withLang.filter((b) => {
      if (searchLang === "spa") return b.language.includes("spa")
      if (searchLang === "eng") return b.language.includes("eng")
      return false
    })

    return [...filtered, ...noLang] // 👈 sin idioma al final
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-app rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app">
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
                className="text-secondary hover:text-app transition"
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
            <h2 className="text-app font-medium text-sm">
              {step === "search" && t("library.addBook")}
              {step === "create" && t("library.newBook")}
              {step === "status" && t("library.readingStatus")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-app transition"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
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
                  placeholder={t("library.search")}
                  className="w-full pl-9 pr-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Results from DB */}
              {results.length > 0 && (
                <div className="space-y-2">
                  {results.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBookId(book.id)
                        setStep("status")
                      }}
                      className="w-full flex items-center gap-3 p-3 bg-input/50 hover:bg-input border border-zinc-700 rounded-xl transition text-left"
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
                              className="w-4 h-4 text-muted"
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
                        <p className="text-app text-sm font-medium line-clamp-1">
                          {book.title}
                        </p>
                        {book.authors && (
                          <p className="text-muted text-xs mt-0.5">
                            {book.authors.name}
                          </p>
                        )}
                        {book.isbn && (
                          <p className="text-muted text-xs mt-0.5">
                            ISBN: {book.isbn}
                          </p>
                        )}
                        {book.published_year && (
                          <p className="text-muted text-xs mt-0.5">
                            {t("book.dateOfPublication")} {book.published_year}
                          </p>
                        )}
                        {book.pages ? (
                          <p className="text-muted text-xs mt-0.5">
                            {t("book.pages")}: {book.pages}
                          </p>
                        ) : (
                          <p className="text-muted text-xs mt-0.5">
                            {t("book.noPages")}
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

                  {/* Opciones adicionales cuando hay resultados en DB */}
                  {query.trim() && !searching && (
                    <div className="text-center py-4 flex flex-col items-center gap-3">
                      <p className="text-secondary text-sm">
                        {t("library.notIsYourBookSearching")}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setSearchLang("eng")}
                          className={`px-3 py-1.5 rounded-lg text-xs transition ${
                            searchLang === "eng"
                              ? "bg-violet-600 text-button"
                              : "bg-input text-secondary hover:text-app"
                          }`}
                        >
                          🇺🇸 {t("common.english")}
                        </button>
                        <button
                          onClick={() => setSearchLang("spa")}
                          className={`px-3 py-1.5 rounded-lg text-xs transition ${
                            searchLang === "spa"
                              ? "bg-violet-600 text-button"
                              : "bg-input text-secondary hover:text-app"
                          }`}
                        >
                          🇪🇸 {t("common.spanish")}
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          setNewTitle(query)
                          setStep("create")
                        }}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-button text-sm font-medium rounded-xl transition"
                      >
                        {t("library.addTo")} &quot;{query}&quot;{" "}
                        {t("library.manually")}
                      </button>

                      {/* Spinner Open Library */}
                      {searchingExternal && (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}

                      {/* Resultados Open Library debajo de los de DB */}
                      {openLibraryResults &&
                        openLibraryResults.editions.length > 0 &&
                        !searchingExternal && (
                          <div className="space-y-2 mt-3 text-left">
                            <p className="text-xs text-muted">
                              {t("library.openLibraryResults")}
                            </p>
                            {filteredEditions.map((book, i) => {
                              const lang = book.language?.[0]
                              return (
                                <button
                                  key={i}
                                  onClick={() =>
                                    handleSelectOpenLibraryBook(
                                      book,
                                      openLibraryResults.work,
                                    )
                                  }
                                  className="w-full flex items-center gap-3 p-3 bg-input/50 hover:bg-input border border-zinc-700 rounded-xl transition text-left"
                                >
                                  <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                                    {book.cover_i ? (
                                      <img
                                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                                        📚
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-app text-sm font-medium line-clamp-1">
                                      {book.title}
                                    </p>

                                    {/* ⚠️ author_name ya no existe aquí */}
                                    {openLibraryResults.work?.author && (
                                      <p className="text-muted text-xs mt-0.5">
                                        {openLibraryResults.work.author}
                                      </p>
                                    )}
                                    <p className="text-muted text-xs mt-0.5">
                                      ISBN: {book.isbn?.[0] ?? "N/A"}
                                    </p>
                                    <p className="text-muted text-xs mt-0.5">
                                      {t("book.dateOfPublication")}:{" "}
                                      {book.publish_date ?? "Sin fecha"}
                                    </p>
                                    <p className="text-muted text-xs mt-0.5">
                                      {t("book.Pages")}:{" "}
                                      {book.number_of_pages
                                        ? book.number_of_pages
                                        : "Sin información"}
                                    </p>

                                    <p className="text-xs text-green-500 mt-0.5">
                                      {lang === "spa"
                                        ? t("common.spanish")
                                        : lang === "eng"
                                          ? t("common.english")
                                          : t("common.languageNotDefined")}
                                    </p>
                                  </div>

                                  <svg
                                    className="w-4 h-4 text-zinc-600 flex-shrink-0"
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
                              )
                            })}
                            <button
                              onClick={() => {
                                setNewTitle(query)
                                setStep("create")
                              }}
                              className="w-full py-2 text-muted hover:text-zinc-300 text-xs transition text-center"
                            >
                              {t("library.noneCorrect")}
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* No results in DB */}
              {query.trim() && !searching && results.length === 0 && (
                <div className="space-y-3">
                  <p className="text-secondary text-sm text-center">
                    {t("library.notFound")}{" "}
                    <span className="text-app">&quot;{query}&quot;</span>{" "}
                    {t("library.inYourLibrary")}.
                  </p>
                  <div className="flex gap-2 items-center justify-center">
                    <button
                      onClick={() => setSearchLang("eng")}
                      className={`px-3 py-1.5 rounded-lg text-xs transition ${
                        searchLang === "eng"
                          ? "bg-violet-600 text-button"
                          : "bg-input text-secondary hover:text-app"
                      }`}
                    >
                      🇺🇸 {t("common.english")}
                    </button>
                    <button
                      onClick={() => setSearchLang("spa")}
                      className={`px-3 py-1.5 rounded-lg text-xs transition ${
                        searchLang === "spa"
                          ? "bg-violet-600 text-button"
                          : "bg-input text-secondary hover:text-app"
                      }`}
                    >
                      🇪🇸 {t("common.spanish")}
                    </button>
                  </div>
                  {/* Botón buscar en Open Library */}
                  {(!openLibraryResults ||
                    openLibraryResults.editions.length === 0) &&
                    !searchingExternal && (
                      <button
                        onClick={() => searchWithEditions(query)}
                        className="w-full py-2 bg-input hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm rounded-xl transition"
                      >
                        🌐 {t("library.searchOpenLibrary")}
                      </button>
                    )}

                  {/* Spinner Open Library */}
                  {searchingExternal && (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Resultados Open Library */}
                  {openLibraryResults && filteredEditions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted">
                        {t("library.openLibraryResults")}
                      </p>

                      {filteredEditions.map((book, i) => {
                        const lang = book.language?.[0]
                        return (
                          <button
                            key={i}
                            onClick={() =>
                              handleSelectOpenLibraryBook(
                                book,
                                openLibraryResults.work,
                              )
                            }
                            className="w-full flex items-center gap-3 p-3 bg-input/50 hover:bg-input border border-zinc-700 rounded-xl transition text-left"
                          >
                            <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                              {book.cover_i ? (
                                <img
                                  src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                                  📚
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-app text-sm font-medium line-clamp-1">
                                {book.title}
                              </p>

                              {/* Autor ahora viene del work */}
                              {openLibraryResults.work?.author && (
                                <p className="text-muted text-xs mt-0.5">
                                  {openLibraryResults.work.author}
                                </p>
                              )}
                              <p className="text-muted text-xs mt-0.5">
                                ISBN: {book.isbn?.[0] ?? "N/A"}
                              </p>
                              <p className="text-muted text-xs mt-0.5">
                                {t("book.dateOfPublication")}:{" "}
                                {book.publish_date ??
                                  t("book.noPublicationDate")}
                              </p>
                              <p className="text-muted text-xs mt-0.5">
                                {t("book.Pages")}:{" "}
                                {book.number_of_pages
                                  ? book.number_of_pages
                                  : t("book.noPages")}
                              </p>

                              <p className="text-xs text-green-500 mt-0.5">
                                {lang === "spa"
                                  ? t("common.spanish")
                                  : lang === "eng"
                                    ? t("common.english")
                                    : t("common.languageNotDefined")}
                              </p>
                            </div>

                            <svg
                              className="w-4 h-4 text-zinc-600 flex-shrink-0"
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
                        )
                      })}

                      <button
                        onClick={() => {
                          setNewTitle(query)
                          setStep("create")
                        }}
                        className="w-full py-2 text-muted hover:text-zinc-300 text-xs transition text-center"
                      >
                        {t("library.noneCorrect")}
                      </button>
                    </div>
                  )}

                  {/* Si buscó en OL y no encontró nada */}
                  {!searchingExternal &&
                    (!openLibraryResults ||
                      openLibraryResults.editions.length === 0) && (
                      <button
                        onClick={() => {
                          setNewTitle(query)
                          setStep("create")
                        }}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-button text-sm font-medium rounded-xl transition"
                      >
                        {t("library.addTo")} &quot;{query}&quot;{" "}
                        {t("library.manually")}
                      </button>
                    )}
                </div>
              )}

              {/* Empty query hint */}
              {!query.trim() && (
                <p className="text-center text-zinc-600 text-xs py-6">
                  {t("library.addTitleToAdd")}
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
                <label className="block text-xs text-secondary mb-1.5">
                  {t("library.title")} <span className="text-red-400">*</span>
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t("library.addTitleToAdd")}
                  className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-secondary mb-1.5">
                  {t("book.author")} <span className="text-red-400">*</span>
                </label>
                <input
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder={t("library.addAuthorToAdd")}
                  className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-secondary mb-1.5">
                    {t("library.year")}
                  </label>
                  <input
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="dd-mm-yyyy"
                    className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-secondary mb-1.5">
                    {t("book.Pages")}
                  </label>
                  <input
                    value={newPages}
                    onChange={(e) => setNewPages(e.target.value)}
                    placeholder="320"
                    type="number"
                    className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-secondary mb-1.5">
                  ISBN <span className="text-red-400">*</span>
                </label>
                <input
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  placeholder="978-3-16-148410-0"
                  className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-secondary mb-1.5">
                  {t("library.cover")}
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCoverMode("url")}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${
                      coverMode === "url"
                        ? "bg-violet-600 text-button"
                        : "bg-input text-secondary hover:text-app"
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("upload")}
                    className={`px-3 py-1.5 rounded-lg text-xs transition ${
                      coverMode === "upload"
                        ? "bg-violet-600 text-button"
                        : "bg-input text-secondary hover:text-app"
                    }`}
                  >
                    {t("library.uploadImage")}
                  </button>
                </div>

                {coverMode === "url" ? (
                  <input
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition"
                  />
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-28 border border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-violet-500 transition bg-input/50">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Preview"
                          className="h-full w-full object-contain rounded-xl p-1"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted">
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
                          <span className="text-xs">
                            {t("library.clickToUpload")}
                          </span>
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
                <label className="block text-xs text-secondary mb-1.5">
                  {t("book.description")}
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t("library.addSinopsis")}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-input border border-zinc-700 rounded-xl text-app placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition resize-none"
                />
              </div>

              {genres.length > 0 && (
                <div>
                  <label className="block text-xs text-secondary mb-2">
                    {t("library.genres")}
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
                              ? "bg-violet-600 text-app border border-violet-500"
                              : "bg-input text-secondary border border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {t(`genres.${normalizeGenreKey(g.name)}`)}
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
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-button font-medium rounded-xl text-sm transition-colors"
              >
                {creating
                  ? t("library.creatingBook")
                  : t("library.createAndContinue")}
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

              <p className="text-secondary text-sm">
                {t("library.wichStatus")}
              </p>

              <div className="space-y-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition text-sm ${
                      status === opt.value
                        ? "bg-violet-600/10 border-violet-500 text-app"
                        : "bg-input/50 border-zinc-700 text-secondary hover:border-zinc-600"
                    }`}
                  >
                    {t(opt.value)}
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
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-button font-medium rounded-xl text-sm transition-colors mt-2"
              >
                {saving ? t("library.saving") : t("library.addToLibrary")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
