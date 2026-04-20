"use client"

import BookReviews from "@/components/book/BookReviews"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  cover_url: string | null
  pages: number | null
  published_year: number | null
  authors: { name: string; bio: string | null } | null
  book_genres: { genres: { id: string; name: string } | null }[]
}

export default function BookPage() {
  const { id } = useParams()
  const router = useRouter()
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
        <p className="text-zinc-400">Libro no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm"
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
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        
        {/* Cover */}
       <div className="w-24 h-36 sm:w-32 sm:h-48 shrink-0 mx-auto sm:mx-0 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
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
          <h1 className="text-2xl font-bold text-white">{book.title}</h1>
          {book.authors && <p className="text-zinc-400">{book.authors.name}</p>}

          {/* Genres */}
          {book.book_genres.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {book.book_genres.map((bg, i) =>
                bg.genres ? (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700"
                  >
                    {bg.genres.name}
                  </span>
                ) : null,
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex gap-4 pt-2 text-xs text-zinc-500">
            {book.pages && <span>{book.pages} páginas</span>}
            {book.published_year && <span>{book.published_year}</span>}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
          </div>
        </div>

        <div className="pt-2">
          {inLibrary === null ? null : inLibrary ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-sm">
              ✓ En tu biblioteca
            </span>
          ) : (
            <button
              onClick={handleAddToLibrary}
              disabled={addingToLibrary}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition disabled:opacity-50 cursor-pointer"
            >
              {addingToLibrary ? "Agregando..." : "＋ Quiero leer"}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {book.description && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Descripción</h2>
          <p className="text-zinc-400 leading-relaxed text-sm">
            {book.description}
          </p>
        </div>
      )}

      {/* Author bio */}
      {book.authors?.bio && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">
            Sobre el autor
          </h2>
          <p className="text-zinc-400 leading-relaxed text-sm">
            {book.authors.bio}
          </p>
        </div>
      )}
      <BookReviews bookId={id as string} />
    </div>
  )
}
