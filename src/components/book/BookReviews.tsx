"use client"

import { useEffect, useState } from "react"

type Review = {
  id: string
  rating: number
  content: string | null
  created_at: string
  profiles: { username: string; avatar_url: string | null } | null
}

type Props = { bookId: string }

export default function BookReviews({ bookId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [libraryEntryId, setLibraryEntryId] = useState<string | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)

  useEffect(() => {
    const fetchUserReview = async () => {
      const res = await fetch(`/api/books/${bookId}/reviews/me`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setUserReview(data)
          setRating(data.rating)
          setContent(data.content ?? "")
        }
      }
    }
    fetchUserReview()
  }, [bookId])
  useEffect(() => {
    const fetchLibraryEntry = async () => {
      const res = await fetch(`/api/library/check/${bookId}`)
      if (res.ok) {
        const { exists, entry } = await res.json()
        if (exists && entry?.rating) {
          setRating(entry.rating) // precarga el rating
        }
        if (exists && entry?.id) {
          setLibraryEntryId(entry.id)
        }
      }
    }
    fetchLibraryEntry()
  }, [bookId])
  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch(`/api/books/${bookId}/reviews`)
      if (res.ok) setReviews(await res.json())
      setLoading(false)
    }
    fetch_()
  }, [bookId, refresh]) // refresh para actualizar después de publicar una reseña

  async function handleSubmit() {
    if (!rating) return
    setSaving(true)
    await fetch(`/api/books/${bookId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content }),
    })
    // Actualizar rating en user_library si el libro está en la biblioteca
    if (libraryEntryId) {
      await fetch(`/api/library/${libraryEntryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      })
    }
    setRating(0)
    setContent("")
    setShowForm(false)
    setSaving(false)
    setRefresh((r) => r + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Reseñas{" "}
          {reviews.length > 0 && (
            <span className="text-zinc-500 font-normal">
              ({reviews.length})
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition cursor-pointer"
        >
           {showForm ? "Cancelar" : userReview ? "Editar reseña" : "Escribir reseña"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Calificación
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-2xl transition-transform hover:scale-110"
                >
                  <span
                    className={
                      star <= (hoverRating || rating)
                        ? "text-amber-400"
                        : "text-zinc-700"
                    }
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-2">Reseña</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu opinión sobre este libro..."
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!rating || saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition cursor-pointer"
          >
            {saving ? "Guardando..." : "Publicar reseña"}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-8">
          Aún no hay reseñas. ¡Sé el primero en escribir una!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                    {review.profiles?.avatar_url ? (
                      <img
                        src={review.profiles.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                        {review.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <span className="text-white text-sm font-medium">
                    @{review.profiles?.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">
                    {"★".repeat(review.rating)}
                  </span>
                  <span className="text-zinc-600 text-xs">
                    {new Date(review.created_at).toLocaleDateString("es-CR")}
                  </span>
                </div>
              </div>

              {review.content && (
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {review.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
