"use client"

import { FeedItem, useFeed } from "@/hooks/useFeed"
import { useRouter } from "next/navigation"

export default function FeedPage() {
  const { feed, loading } = useFeed()
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-white mb-6">Para ti</h1>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-zinc-400">No hay nada por aquí aún.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Sigue a otros usuarios para ver sus reseñas.
          </p>
        </div>
      ) : (
        feed.map((item, i) => {
          if (item.type === "review")
            return <ReviewCard key={i} item={item} router={router} />
          if (item.type === "book")
            return <BookCard key={i} item={item} router={router} />
          if (item.type === "person")
            return <PersonCard key={i} item={item} router={router} />
          if (item.type === "activity")
            return <ActivityCard key={i} item={item} router={router} />
          return null
        })
      )}
    </div>
  )
}

function ReviewCard({ item, router }: { item: FeedItem; router: any }) {
  const { data, isFollowing } = item
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/profile/${data.profiles?.username}`)}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
            {data.profiles?.avatar_url ? (
              <img
                src={data.profiles.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-medium">
                {data.profiles?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">
              @{data.profiles?.username}
            </p>
            <p className="text-zinc-600 text-xs">
              {new Date(data.created_at).toLocaleDateString("es-CR")}
            </p>
          </div>
        </button>
        {isFollowing && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30">
            Siguiendo
          </span>
        )}
      </div>

      {data.books && (
        <button
          onClick={() => router.push(`/books/${data.books.id}`)}
          className="flex items-center gap-3 w-full text-left hover:opacity-80 transition"
        >
          <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
            {data.books.cover_url ? (
              <img
                src={data.books.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                📚
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{data.books.title}</p>
            {data.books.authors && (
              <p className="text-zinc-500 text-xs">{data.books.authors.name}</p>
            )}
          </div>
        </button>
      )}

      <div className="space-y-1">
        <span className="text-amber-400">
          {"★".repeat(data.rating)}
          {"☆".repeat(5 - data.rating)}
        </span>
        {data.content && (
          <p className="text-zinc-300 text-sm leading-relaxed">
            {data.content}
          </p>
        )}
      </div>
    </div>
  )
}

function BookCard({ item, router }: { item: FeedItem; router: any }) {
  const { data } = item
  if (!data) return null
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs text-zinc-500 mb-3">📖 Te podría gustar</p>
      <button
        onClick={() => router.push(`/books/${data.id}`)}
        className="flex items-center gap-3 w-full text-left hover:opacity-80 transition"
      >
        <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
          {data.cover_url ? (
            <img
              src={data.cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              📚
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{data.title}</p>
          {data.authors && (
            <p className="text-zinc-500 text-xs mt-0.5">{data.authors.name}</p>
          )}
          {data.book_genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.book_genres.slice(0, 2).map(
                (bg: any, i: number) =>
                  bg.genres && (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs rounded-md bg-zinc-800 text-zinc-400"
                    >
                      {bg.genres.name}
                    </span>
                  ),
              )}
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

function PersonCard({ item, router }: { item: FeedItem; router: any }) {
  const { data } = item
  if (!data) return null
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-xs text-zinc-500 mb-3">👤 Quizás te interese seguir</p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/profile/${data.username}`)}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">
                {data.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col text-left">
            <div className="flex gap-2">
              <p className="text-white text-sm font-medium">{data.full_name}</p>
              <p className="text-zinc-500 text-sm font-medium">
                @{data.username}
              </p>
            </div>
            {data.favorite_genres?.length > 0 && (
              <p className="text-zinc-500 text-xs mt-0.5">
                {data.favorite_genres.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
        </button>
        <button
          onClick={() => router.push(`/profile/${data.username}`)}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-xl transition"
        >
          Ver perfil
        </button>
      </div>
    </div>
  )
}

function ActivityCard({ item, router }: { item: FeedItem; router: any }) {
  const { data } = item
  if (!data) return null

  const statusLabel: Record<string, string> = {
    want_to_read: "quiere leer",
    reading: "está leyendo",
    finished: "terminó",
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
      <button
        onClick={() => router.push(`/profile/${data.profiles?.username}`)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
          {data.profiles?.avatar_url ? (
            <img
              src={data.profiles.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
              {data.profiles?.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-zinc-400 text-sm">
          <span className="text-white font-medium">
            {data.profiles?.full_name}
          </span>{" "}
          <span className=" font-medium">
            @{data.profiles?.username}
          </span>{" "}
          {statusLabel[data.status] ?? "agregó"}
        </p>
      </button>

      {data.books && (
        <button
          onClick={() => router.push(`/books/${data.books.id}`)}
          className="flex items-center gap-3 w-full text-left hover:opacity-80 transition"
        >
          <div className="w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
            {data.books.cover_url ? (
              <img
                src={data.books.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                📚
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{data.books.title}</p>
            {data.books.authors && (
              <p className="text-zinc-500 text-xs">{data.books.authors.name}</p>
            )}
          </div>
        </button>
      )}
    </div>
  )
}
