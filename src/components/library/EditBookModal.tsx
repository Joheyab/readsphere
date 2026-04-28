"use client"

import { UserLibraryEntry } from "@/types/library"
import { useMemo, useState } from "react"
import { toast } from "sonner"
type ReadingStatus = "want_to_read" | "reading" | "finished"
type Props = {
  entry: UserLibraryEntry
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function EditBookModal({
  entry,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [status, setStatus] = useState(entry.status)
  const [purchasePlace, setPurchasePlace] = useState(entry.purchase_place || "")
  const [startDate, setStartDate] = useState(entry.start_date || "")
  const [finishDate, setFinishDate] = useState(entry.finish_date || "")
  const [currentPage, setCurrentPage] = useState(entry.current_page || "")
  const [rating, setRating] = useState(entry.rating || "")
  const [price, setPrice] = useState(entry.purchase_price || "")
  const [format, setFormat] = useState(entry.format || "sinDefinir")
  const [isPrivate, setIsPrivate] = useState(entry.is_private ?? false)

  const totalPages = entry.books.pages || 1

  const [hoverRating, setHoverRating] = useState(0)

  const progressPercent = useMemo(() => {
    return Math.min(
      Math.round(
        ((currentPage === "" ? 0 : Number(currentPage)) / totalPages) * 100,
      ),
      100,
    )
  }, [currentPage, totalPages])

  function handleStatusChange(newStatus: ReadingStatus) {
    setStatus(newStatus)
    if (newStatus === "finished") {
      setFinishDate(new Date().toISOString().split("T")[0])
      setCurrentPage(totalPages)
    } else if (newStatus === "reading") {
      setCurrentPage(entry.current_page || "") // vuelve al valor original
    } else {
      setCurrentPage("")
    }
  }

  const handleSave = async () => {
    const payload = {
      ...(status && { status }),
      ...(purchasePlace && { purchase_place: purchasePlace }),
      ...(startDate && { start_date: startDate }),
      ...(finishDate && { finish_date: finishDate }),
      ...(isPrivate !== undefined && { is_private: isPrivate }),
      ...(status === "finished"
        ? { progress_percent: 100, current_page: totalPages }
        : progressPercent && {
            progress_percent: progressPercent,
            current_page: currentPage,
          }),
      ...(rating && { rating }),
      ...(price && { purchase_price: price }),
      ...(format !== "sinDefinir" && { format }),
    }

    await fetch(`/api/library/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const res = await fetch("/api/achievements/check", { method: "POST" })
    const { unlocked } = await res.json()

    unlocked.forEach((achievement: { title: string; description: string }) => {
      toast.success(`🏆 ${achievement.title}`, {
        description: achievement.description,
        duration: 5000,
      })
    })
    onClose()
    onUpdated()
  }

  const disabledButton = () => {
    if (status === "reading") {
      return currentPage === "" || Number(currentPage) === 0
    }
    if (status === "finished") {
      return rating === "" || Number(rating) === 0
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 text-sm">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-app p-6">
        <h2 className="text-lg font-semibold text-app mb-4">Editar libro</h2>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm text-app">Libro privado</p>
            <p className="text-xs text-muted">Solo tú puedes verlo</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${
              isPrivate ? "bg-violet-600" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isPrivate ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block text-xs text-secondary mb-1.5">
            ¿En que estado estás con este libro?
            <span className="text-red-400"> *</span>
          </label>
          <select
            value={status}
            onChange={(e) =>
              handleStatusChange(e.target.value as ReadingStatus)
            }
            className="w-full bg-input rounded-lg p-3 text-app text-sm focus:outline-none focus:border-violet-500 transition border border-zinc-700 cursor-pointer"
          >
            <option value="want_to_read">Quiero leer</option>
            <option value="reading">Leyendo</option>
            <option value="finished">Terminado</option>
          </select>

          <div>
            <label className="block text-xs text-secondary mb-1.5">
              ¿Donde compraste este libro?
            </label>
            <input
              value={purchasePlace}
              onChange={(e) => setPurchasePlace(e.target.value)}
              placeholder="Libreria X, Amazon, etc."
              className="w-full bg-input rounded-lg p-3 text-app focus:outline-none focus:border-violet-500 transition border border-zinc-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="h-full flex flex-col">
              <label className="block text-xs text-secondary mb-1.5">
                ¿Cuándo comenzaste a leer este libro?
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-input rounded-lg p-3 text-app focus:outline-none focus:border-violet-500 transition border border-zinc-700 cursor-pointer"
              />
            </div>
            <div className="h-full flex flex-col">
              <label className="block text-xs text-secondary mb-1.5">
                ¿Cuándo terminaste de leer este libro?
              </label>
              <input
                type="date"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
                className="bg-input rounded-lg p-3 text-app focus:outline-none focus:border-violet-500 transition border border-zinc-700 cursor-pointer"
              />
            </div>
          </div>

          {status === "reading" && (
            <div>
              <label className="block text-xs text-secondary mb-1.5">
                ¿Por cuál página estás?
                <span className="text-red-400"> *</span>
              </label>
              <input
                type="number"
                min={0}
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                placeholder="Página actual"
                className="w-full bg-input rounded-lg p-3 text-app focus:outline-none focus:border-violet-500 transition border border-zinc-700"
              />
              <p className="text-sm text-secondary mt-1">
                Progreso: {progressPercent}%
              </p>
            </div>
          )}

          {status === "finished" && (
            <div>
              <label className="block text-xs text-secondary mb-1.5">
                ¿Qué calificación le das a este libro?
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-transform hover:scale-110 cursor-pointer"
                  >
                    <span
                      className={
                        star <= (hoverRating || Number(rating))
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
          )}
          <div>
            <label className="block text-xs text-secondary mb-1.5">
              Precio de compra
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1000"
              className="w-full bg-input rounded-lg p-3 text-app focus:outline-none focus:border-violet-500 transition border border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1.5">
              Formato del libro
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-input rounded-lg p-3 text-app focus:outline-none focus:border-violet-500 transition border border-zinc-700 cursor-pointer"
            >
              <option value="">Sin definir</option>
              <option value="physical">Físico</option>
              <option value="digital">Digital</option>
              <option value="audiobook">Audiolibro</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-700 text-app cursor-pointer hover:bg-zinc-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={disabledButton()}
            className="px-4 py-2 rounded-lg bg-violet-600 text-app cursor-pointer hover:bg-violet-500 transition disabled:bg-input disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
