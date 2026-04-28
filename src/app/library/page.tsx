"use client"

import AddBookModal from "@/components/library/AddBookModal"
import BookCard from "@/components/library/BookCard"
import { useLibrary } from "@/hooks/useLibrary"
import { LibraryStatus } from "@/types/library"
import { useTranslations } from "next-intl"
import { useState } from "react"



const STATUS_ORDER: LibraryStatus[] = ["reading", "want_to_read", "finished"]

export default function LibraryPage() {
  const { entries, loading, refetch } = useLibrary()
  const t = useTranslations()
  const [showModal, setShowModal] = useState(false)

  const grouped = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = entries.filter((e) => e.status === status)
      return acc
    },
    {} as Record<LibraryStatus, typeof entries>,
  )

  return (
    <div className="min-h-screen bg-mid px-4 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-app">{t("library.title")}</h1>
          <p className="text-muted text-sm mt-1">
            {entries.length} {t("library.books_in_your_library")}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-button rounded-xl cursor-pointer"
        >
          {t("library.addBook")}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-muted py-20">{t("common.loading")}</div>
      ) : (
        <div className="space-y-12">
          {STATUS_ORDER.map((status) => {
            const group = grouped[status]
            if (!group.length) return null

            return (
              <section key={status}>
                <h2 className="text-secondary mb-4">{t(`library.${status}`)}</h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {group.map((entry) => (
                    <BookCard
                      key={entry.id}
                      entry={entry}
                      onDeleted={refetch}
                      onUpdated={refetch}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddBookModal
          onClose={() => setShowModal(false)}
          onAdded={() => {
            setShowModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
