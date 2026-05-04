import { useProfile } from "@/context/ProfileContext"
import { useAchievements } from "@/hooks/useAchievements"
import { useHomeStats } from "@/hooks/useHomeStats"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
export default function OwnProfile() {
  const { stats, loading: statsLoading } = useHomeStats()
  const { profile } = useProfile()
  const { achievements, loading: achievementsLoading } = useAchievements()
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 })
  const [showAllAchievements, setShowAllAchievements] = useState(false)

  const visibleAchievements = showAllAchievements
    ? achievements
    : achievements.slice(0, 6)

  const t = useTranslations()
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
          {t("profile.welcome", { name: profile?.username ?? "lector" })} 👋
        </h2>
        <p className="mt-2 text-secondary">{t("profile.description")}</p>

        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-app font-medium">
            {followStats.followers}{" "}
            <span className="text-muted font-normal">
              {t("profile.followers")}
            </span>
          </span>
          <span className="text-app font-medium">
            {followStats.following}{" "}
            <span className="text-muted font-normal">
              {t("profile.following")}
            </span>
          </span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-app bg-card p-6">
          <p className="text-sm text-secondary">{t("profile.booksFinished")}</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading ? "..." : stats?.booksFinished}
          </h3>
        </div>

        <div className="rounded-2xl border border-app bg-card p-6">
          <p className="text-sm text-secondary">
            {t("profile.pagesThisMonth")}
          </p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading ? "..." : stats?.pagesThisMonth.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl border border-app bg-card p-6">
          <p className="text-sm text-secondary">{t("profile.reading")}</p>
          <h3 className="mt-2 text-3xl font-bold">
            {statsLoading
              ? "..."
              : stats?.recent.filter((r) => r.status === "reading").length}
          </h3>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-semibold">
          {t("profile.recentReads")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsLoading ? (
            <p className="text-muted text-sm">{t("common.loading")}</p>
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
                    <span>{t("profile.progress")}</span>
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
        <h3 className="text-xl font-semibold mb-4">
          {t("profile.achievements")}
        </h3>

        {achievementsLoading ? (
          <p className="text-muted text-sm">{t("common.loading")}</p>
        ) : achievements.length === 0 ? (
          <p className="text-muted text-sm">{t("profile.noAchievements")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleAchievements.map((entry) => (
                <div
                  key={entry.achievements.id}
                  className="flex flex-col gap-1 p-4 rounded-2xl border border-app bg-card"
                >
                  <p className="text-app text-sm font-medium">
                    {t(`achievements.${entry.achievements.code}.title`)}
                  </p>
                  <p className="text-muted text-xs">
                    {t(`achievements.${entry.achievements.code}.description`)}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">
                    {new Date(entry.unlocked_at).toLocaleDateString("es-CR")}
                  </p>
                </div>
              ))}
            </div>

            {achievements.length > 6 && (
              <button
                onClick={() => setShowAllAchievements(!showAllAchievements)}
                className="mt-4 w-full py-2 text-sm text-muted hover:text-app border border-app rounded-xl transition"
              >
                {showAllAchievements
                  ? "Ver menos"
                  : `Ver todos (${achievements.length})`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
