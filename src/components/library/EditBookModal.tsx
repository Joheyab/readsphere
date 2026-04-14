"use client"

import { UserLibraryEntry } from "@/types/library"
import { useMemo, useState } from "react"
type ReadingStatus = "want_to_read" | "reading" | "finished"
type Props = {
  entry: UserLibraryEntry
  open: boolean
  onClose: () => void
}

export default function EditBookModal({ entry, open, onClose }: Props) {
  const [status, setStatus] = useState(entry.status)
  const [purchasePlace, setPurchasePlace] = useState(entry.purchase_place || "")
  const [startDate, setStartDate] = useState(entry.start_date || "")
  const [finishDate, setFinishDate] = useState(entry.finish_date || "")
  const [currentPage, setCurrentPage] = useState(entry.progress_percent || 0)
  const [rating, setRating] = useState(entry.rating || 0)
  const [price, setPrice] = useState(entry.purchase_price || "")
  const [format, setFormat] = useState(entry.format || "physical")

  const totalPages = entry.books.pages || 1

  const progressPercent = useMemo(() => {
    return Math.min(Math.round((currentPage / totalPages) * 100), 100)
  }, [currentPage, totalPages])

  function handleStatusChange(newStatus: ReadingStatus) {
    setStatus(newStatus)
    if (newStatus === "finished") {
      setCurrentPage(totalPages)
    }
  }

  const handleSave = async () => {
    const payload = {
      ...(status && { status }),
      ...(purchasePlace && { purchase_place: purchasePlace }),
      ...(startDate && { start_date: startDate }),
      ...(finishDate && { finish_date: finishDate }),
      ...(progressPercent && { progress_percent: progressPercent }),
      ...(rating && { rating }),
      ...(price && { purchase_price: price }),
      ...(format && { format }),
    }

    await fetch(`/api/library/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Editar libro</h2>

        <div className="space-y-4">
          <select
            value={status}
            onChange={(e) =>
              handleStatusChange(e.target.value as ReadingStatus)
            }
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
          >
            <option value="want_to_read">Quiero leer</option>
            <option value="reading">Leyendo</option>
            <option value="finished">Terminado</option>
          </select>

          <input
            value={purchasePlace}
            onChange={(e) => setPurchasePlace(e.target.value)}
            placeholder="Dónde lo compré"
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-800 rounded-lg p-3 text-white"
            />
            <input
              type="date"
              value={finishDate}
              onChange={(e) => setFinishDate(e.target.value)}
              className="bg-zinc-800 rounded-lg p-3 text-white"
            />
          </div>

          <div>
            <input
              type="number"
              min={0}
              max={totalPages}
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              placeholder="Página actual"
              className="w-full bg-zinc-800 rounded-lg p-3 text-white"
            />
            <p className="text-sm text-zinc-400 mt-1">
              Progreso: {progressPercent}%
            </p>
          </div>

          <input
            type="number"
            min={0}
            max={5}
            step={0.5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            placeholder="Rating"
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
          />

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Precio"
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
          />

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
          >
            <option value="physical">Físico</option>
            <option value="ebook">eBook</option>
            <option value="audiobook">Audiolibro</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-700 text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
