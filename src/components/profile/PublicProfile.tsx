"use client"

import { PublicProfile } from "@/types/profile"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PublicProfilePage({ username }: { username: string }) {
  const router = useRouter()
  const [data, setData] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    "library" | "reviews" | "achievements"
  >("library")
  const [followData, setFollowData] = useState({
    followers: 0,
    following: 0,
    isFollowing: false,
  })
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    if (!data?.profile.id) return
    const fetchIsFollowing = async () => {
      const res = await fetch(`/api/follows/${data.profile.id}`)
      if (res.ok) {
        const { isFollowing } = await res.json()
        setFollowData({
          followers: data.stats.followers,
          following: data.stats.following,
          isFollowing,
        })
      }
    }
    fetchIsFollowing()
  }, [data?.profile.id])

  async function handleFollow() {
    if (!data) return
    setFollowLoading(true)
    await fetch(`/api/follows/${data.profile.id}`, {
      method: followData.isFollowing ? "DELETE" : "POST",
    })
    setFollowData((prev) => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      followers: prev.isFollowing ? prev.followers - 1 : prev.followers + 1,
    }))
    setFollowLoading(false)
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch(`/api/profile/${username}`)
      if (res.ok) setData(await res.json())
      else router.push("/")
      setLoading(false)
    }
    fetchProfile()
  }, [username])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const { profile, stats, library, reviews, achievements } = data

  const tabs = [
    { key: "library", label: `Biblioteca (${library.length})` },
    { key: "reviews", label: `Reseñas (${reviews.length})` },
    { key: "achievements", label: `Logros (${achievements.length})` },
  ] as const

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-zinc-400">
              {profile.username[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile.full_name}
              </h1>
              <h2 className="text-xl font-bold text-zinc-400">
                @{profile.username}
              </h2>
            </div>
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={` rounded-xl text-sm font-medium transition cursor-pointer h-8 text-center justify-center items-center w-20  ${
                followData.isFollowing
                  ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                  : "bg-violet-600 hover:bg-violet-500 text-white"
              }`}
            >
              {followLoading
                ? "..."
                : followData.isFollowing
                  ? "Siguiendo"
                  : "Seguir"}
            </button>
          </div>
          {profile.bio && (
            <p className="text-zinc-400 text-sm mt-1">{profile.bio}</p>
          )}
          {profile.favorite_genres && profile.favorite_genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.favorite_genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-white font-medium">
              {followData.followers}{" "}
              <span className="text-zinc-500 font-normal">seguidores</span>
            </span>
            <span className="text-white font-medium">
              {followData.following}{" "}
              <span className="text-zinc-500 font-normal">siguiendo</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Libros leídos</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.booksFinished}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs text-zinc-500">Leyendo ahora</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.booksReading}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm transition ${
              activeTab === tab.key
                ? "text-white border-b-2 border-violet-500 -mb-px"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Library tab */}
      {activeTab === "library" && (
        <div>
          {library.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              No hay libros públicos.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {library.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => router.push(`/books/${entry.books.id}`)}
                  className="flex flex-col gap-2 cursor-pointer group"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                    {entry.books.cover_url ? (
                      <img
                        src={entry.books.cover_url}
                        alt={entry.books.title}
                        className="w-full h-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                        📚
                      </div>
                    )}
                    {entry.status === "finished" && entry.rating && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-amber-400">
                        ★ {entry.rating}
                      </div>
                    )}
                  </div>
                  <p className="text-white text-xs font-medium line-clamp-2">
                    {entry.books.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              No hay reseñas aún.
            </p>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                onClick={() =>
                  review.books && router.push(`/book/${review.books.id}`)
                }
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 cursor-pointer hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between">
                  {review.books && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                        {review.books.cover_url ? (
                          <img
                            src={review.books.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                            📚
                          </div>
                        )}
                      </div>
                      <p className="text-white text-sm font-medium line-clamp-1">
                        {review.books.title}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-shrink-0">
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
            ))
          )}
        </div>
      )}

      {/* Achievements tab */}
      {activeTab === "achievements" && (
        <div>
          {achievements.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">
              Aún no hay logros.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((entry, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 p-4 rounded-2xl border border-zinc-800 bg-zinc-900"
                >
                  <p className="text-white text-sm font-medium">
                    {entry.achievements?.title}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {entry.achievements?.description}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">
                    {new Date(entry.unlocked_at).toLocaleDateString("es-CR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
