import { useProfile } from "@/context/ProfileContext"
import { useAchievements } from "@/hooks/useAchievements"
import { useHomeStats } from "@/hooks/useHomeStats"
import { useEffect, useState } from "react"
export default function OwnProfile() {
  const { stats, loading: statsLoading } = useHomeStats()
  const { profile } = useProfile()
  const { achievements, loading: achievementsLoading } = useAchievements()
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 })

  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch("/api/follows/me")
      if (res.ok) setFollowStats(await res.json())
    }
    fetch_()
  }, [])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold">
          Bienvenido, {profile?.username ?? "lector"} 👋
        </h2>
        <p className="mt-2 text-secondary">
          Lleva control de tus libros, comparte reseñas y mide tu progreso.
        </p>

        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-app font-medium">
            {followStats.followers}{" "}
            <span className="text-muted font-normal">seguidores</span>
          </span>
          <span className="text-app font-medium">
            {followStats.following}{" "}
            <span className="text-muted font-normal">siguiendo</span>
          </span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-app bg-card p-6">
          <p className="text-sm text-secondary">Libros leídos</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading ? "..." : stats?.booksFinished}
          </h3>
        </div>

        <div className="rounded-2xl border border-app bg-card p-6">
          <p className="text-sm text-secondary">Páginas este mes</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading ? "..." : stats?.pagesThisMonth.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl border border-app bg-card p-6">
          <p className="text-sm text-secondary">Leyendo actualmente</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading
              ? "..."
              : stats?.recent.filter((r) => r.status === "reading").length}
          </h3>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-semibold">Lecturas recientes</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsLoading ? (
            <p className="text-muted text-sm">Cargando...</p>
          ) : (
            stats?.recent.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-app bg-card p-5"
              >
                <h4 className="text-lg font-semibold">{entry.books.title}</h4>
                <p className="mt-1 text-sm text-secondary">
                  {entry.books.authors?.name}
                </p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Progreso</span>
                    <span>{entry.progress_percent ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-input">
                    <div
                      className="h-2 rounded-full bg-violet-500"
                      style={{ width: `${entry.progress_percent ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <section>
        <h3 className="text-xl font-semibold mb-4">Logros</h3>

        {achievementsLoading ? (
          <p className="text-muted text-sm">Cargando...</p>
        ) : achievements.length === 0 ? (
          <p className="text-muted text-sm">
            Aún no tienes logros desbloqueados.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((entry) => (
              <div
                key={entry.achievements.id}
                className="flex flex-col gap-1 p-4 rounded-2xl border border-app bg-card"
              >
                <p className="text-app text-sm font-medium">
                  {entry.achievements.title}
                </p>
                <p className="text-muted text-xs">
                  {entry.achievements.description}
                </p>
                <p className="text-zinc-600 text-xs mt-1">
                  {new Date(entry.unlocked_at).toLocaleDateString("es-CR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
