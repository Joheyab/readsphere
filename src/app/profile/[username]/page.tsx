"use client"

import { useProfile } from "@/context/ProfileContext"
import { useAchievements } from "@/hooks/useAchievements"
import { useHomeStats } from "@/hooks/useHomeStats"

export default function OwnProfile() {
  const { stats, loading: statsLoading } = useHomeStats()
  const { profile } = useProfile()
  const { achievements, loading: achievementsLoading } = useAchievements()

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold">
          Bienvenido, {profile?.username ?? "lector"} 👋
        </h2>
        <p className="mt-2 text-zinc-400">
          Lleva control de tus libros, comparte reseñas y mide tu progreso.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Libros leídos</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading ? "..." : stats?.booksFinished}
          </h3>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Páginas este mes</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading ? "..." : stats?.pagesThisMonth.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Leyendo actualmente</p>
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
            <p className="text-zinc-500 text-sm">Cargando...</p>
          ) : (
            stats?.recent.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
              >
                <h4 className="text-lg font-semibold">{entry.books.title}</h4>
                <p className="mt-1 text-sm text-zinc-400">
                  {entry.books.authors?.name}
                </p>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Progreso</span>
                    <span>{entry.progress_percent ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-800">
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
          <p className="text-zinc-500 text-sm">Cargando...</p>
        ) : achievements.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            Aún no tienes logros desbloqueados.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((entry) => (
              <div
                key={entry.achievements.id}
                className="flex flex-col gap-1 p-4 rounded-2xl border border-zinc-800 bg-zinc-900"
              >
                <p className="text-white text-sm font-medium">
                  {entry.achievements.title}
                </p>
                <p className="text-zinc-500 text-xs">
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
