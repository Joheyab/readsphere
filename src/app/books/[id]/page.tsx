"use client"

import BookReviews from "@/components/book/BookReviews"
import { useTranslations } from "next-intl"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Book = {
  id: string
  title: string
  description_en: string | null
  description_es: string | null
  isbn: string | null
  cover_url: string | null
  pages: number | null
  published_year: number | null
  authors: { name: string; bio: string | null } | null
  book_genres: { genres: { id: string; name: string } | null }[]
}

export default function BookPage() {
  const router = useRouter()
  const params = useParams()
  const t = useTranslations()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [inLibrary, setInLibrary] = useState<boolean | null>(null)
  const [addingToLibrary, setAddingToLibrary] = useState(false)

  useEffect(() => {
    const checkLibrary = async () => {
      const res = await fetch(`/api/library/check/${id}`)
      if (res.ok) {
        const { exists } = await res.json()
        setInLibrary(exists)
      }
    }
    checkLibrary()
  }, [id])

  async function handleAddToLibrary() {
    setAddingToLibrary(true)
    await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book_id: id, status: "want_to_read" }),
    })
    setInLibrary(true)
    setAddingToLibrary(false)
  }
  useEffect(() => {
    if (!id) return // 👈 evita fetch sin id
    const fetchBook = async () => {
      const res = await fetch(`/api/books/${id}`)
      if (res.ok) setBook(await res.json())
      setLoading(false)
    }
    fetchBook()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="text-center py-32">
        <p className="text-secondary">{t("book.book_not_found")}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-secondary hover:text-app transition text-sm"
      >
        <svg
          className="w-4 h-4"
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
        {t("common.back")}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Cover */}
        <div className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 mx-auto sm:mx-0 rounded-xl overflow-hidden bg-card border border-app">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-3xl">
              📚
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold text-app">{book.title}</h1>
          {book.authors && (
            <p className="text-secondary">{book.authors.name}</p>
          )}

          {/* Genres */}
          {book.book_genres.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {book.book_genres.map((bg, i) =>
                bg.genres ? (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-lg bg-input text-secondary border border-zinc-700"
                  >
                    {bg.genres.name}
                  </span>
                ) : null,
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex gap-4 pt-2 text-xs text-muted">
            {book.pages ? (
              <span>
                {book.pages} {t("book.pages")}
              </span>
            ) : (
              <span>
                {t("book.noPages")} 
              </span>
            )}

            {book.published_year && <span>{book.published_year}</span>}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
          </div>
        </div>

        <div className="pt-2">
          {inLibrary === null ? null : inLibrary ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-input text-secondary text-sm">
              ✓ {t("book.inLibrary")}
            </span>
          ) : (
            <button
              onClick={handleAddToLibrary}
              disabled={addingToLibrary}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-app text-sm font-medium transition disabled:opacity-50 cursor-pointer"
            >
              {addingToLibrary
                ? t("book.addingToLibrary")
                : t("book.addToLibrary")}
            </button>
          )}
        </div>
      </div>

      {/* Description */}

      <div>
        <h2 className="text-lg font-semibold text-app mb-2">
          {t("book.description")}
        </h2>
        <p className="text-secondary leading-relaxed text-sm">
          {book.description_es
            ? book.description_es
            : book.description_en || t("book.noDescription")}
        </p>
      </div>

      {/* Author bio */}
      {book.authors?.bio && (
        <div>
          <h2 className="text-lg font-semibold text-app mb-2">
            {t("book.aboutAuthor")}
          </h2>
          <p className="text-secondary leading-relaxed text-sm">
            {book.authors.bio}
          </p>
        </div>
      )}
      <BookReviews bookId={id as string} />
    </div>
  )
}
