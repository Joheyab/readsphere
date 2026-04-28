/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { FeedItem, useFeed } from "@/hooks/useFeed"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"

export default function FeedPage() {
  const { feed, loading } = useFeed()
  const router = useRouter()
  const t = useTranslations("feed")

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-app mb-6">{t("title")}</h1>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-secondary">{t("empty")}</p>
          <p className="text-zinc-600 text-sm mt-1">{t("emptyDesc")}</p>
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
  const t = useTranslations("feed")
  const { data, isFollowing } = item
  return (
    <div className="bg-card border border-app rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/profile/${data.profiles?.username}`)}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-input flex-shrink-0">
            {data.profiles?.avatar_url ? (
              <img
                src={data.profiles.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary text-xs font-medium">
                {data.profiles?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="text-left">
            <p className="text-app text-sm font-medium">
              @{data.profiles?.username}
            </p>
            <p className="text-zinc-600 text-xs">
              {new Date(data.created_at).toLocaleDateString("es-CR")}
            </p>
          </div>
        </button>
        {isFollowing && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30">
            {t("empty")}
          </span>
        )}
      </div>

      {data.books && (
        <button
          onClick={() => router.push(`/books/${data.books.id}`)}
          className="flex items-center gap-3 w-full text-left hover:opacity-80 transition"
        >
          <div className="w-10 h-14 rounded-lg overflow-hidden bg-input flex-shrink-0">
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
            <p className="text-app text-sm font-medium">{data.books.title}</p>
            {data.books.authors && (
              <p className="text-muted text-xs">{data.books.authors.name}</p>
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
  const t = useTranslations("feed")
  if (!data) return null
  return (
    <div className="bg-card border border-app rounded-2xl p-5">
      <p className="text-xs text-muted mb-3">📖 {t("mightLike")}</p>
      <button
        onClick={() => router.push(`/books/${data.id}`)}
        className="flex items-center gap-3 w-full text-left hover:opacity-80 transition"
      >
        <div className="w-12 h-16 rounded-lg overflow-hidden bg-input flex-shrink-0">
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
          <p className="text-app text-sm font-medium">{data.title}</p>
          {data.authors && (
            <p className="text-muted text-xs mt-0.5">{data.authors.name}</p>
          )}
          {data.book_genres?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.book_genres.slice(0, 2).map(
                (bg: any, i: number) =>
                  bg.genres && (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs rounded-md bg-input text-secondary"
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
  const t = useTranslations()
  const normalizeGenreKey = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD") // separa tildes
      .replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/[^a-z0-9\s]/g, "") // quita símbolos
      .trim()
      .replace(/\s+/g, "_") // espacios → _
  if (!data) return null
  return (
    <div className="bg-card border border-app rounded-2xl p-5">
      <p className="text-xs text-muted mb-3">👤 {t("feed.suggestFollow")}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/profile/${data.username}`)}
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-input flex-shrink-0">
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary font-medium">
                {data.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col text-left">
            <div className="flex gap-2">
              <p className="text-app text-sm font-medium">{data.full_name}</p>
              <p className="text-muted text-sm font-medium">@{data.username}</p>
            </div>
            {data.favorite_genres?.length > 0 && (
              <p className="text-muted text-xs mt-0.5">
                {data.favorite_genres
                  .slice(0, 3)
                  .map((genre: any) => t(`genres.${normalizeGenreKey(genre)}`))
                  .join(", ")}
              </p>
            )}
          </div>
        </button>
        <button
          onClick={() => router.push(`/profile/${data.username}`)}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-button text-xs rounded-xl transition"
        >
          {t("feed.viewProfile")}
        </button>
      </div>
    </div>
  )
}

function ActivityCard({ item, router }: { item: FeedItem; router: any }) {
  const { data } = item
  const t= useTranslations("feed")
  if (!data) return null

  const statusLabel: Record<string, string> = {
    want_to_read: t("want_to_read"),
    reading: t("reading"),
    finished: t("finished"),
  }

  return (
    <div className="bg-card border border-app rounded-2xl p-5 space-y-3">
      <button
        onClick={() => router.push(`/profile/${data.profiles?.username}`)}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden bg-input flex-shrink-0">
          {data.profiles?.avatar_url ? (
            <img
              src={data.profiles.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-secondary text-xs">
              {data.profiles?.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <p className="text-secondary text-sm">
          <span className="text-app font-medium">
            {data.profiles?.full_name}
          </span>{" "}
          <span className=" font-medium">@{data.profiles?.username}</span>{" "}
          {statusLabel[data.status] ?? (t("feed.add"))}
        </p>
      </button>

      {data.books && (
        <button
          onClick={() => router.push(`/books/${data.books.id}`)}
          className="flex items-center gap-3 w-full text-left hover:opacity-80 transition"
        >
          <div className="w-10 h-14 rounded-lg overflow-hidden bg-input flex-shrink-0">
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
            <p className="text-app text-sm font-medium">{data.books.title}</p>
            {data.books.authors && (
              <p className="text-muted text-xs">{data.books.authors.name}</p>
            )}
          </div>
        </button>
      )}
    </div>
  )
}
