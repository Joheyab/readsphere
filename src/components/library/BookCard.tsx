"use client"

import { UserLibraryEntry } from "@/types/library"
import { useEffect, useState } from "react"
import EditBookModal from "./EditBookModal"
import { on } from "process"

type Props = {
  entry: UserLibraryEntry
  onDeleted: () => void
  onUpdated: () => void
}

export default function BookCard({ entry, onDeleted, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  async function handleDelete() {
    await fetch(`/api/library/${entry.id}`, { method: "DELETE" })
    onDeleted() // callback para refetch
  }
  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [menuOpen])
  return (
    <>
      <div
        onClick={(e) => {
          if (window.innerWidth < 1024) return // lg breakpoint
          setOpen(true)
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex flex-col gap-2 cursor-pointer"
      >
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="lg:hidden absolute top-2 left-2 z-10 p-1.5 bg-black/70 rounded-lg text-zinc-400"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm0 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className={`hidden lg:block absolute top-2 left-2 z-10 p-1.5 bg-black/70 rounded-lg text-zinc-400 hover:text-red-400 transition ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute top-10 left-2 z-20 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setOpen(true)
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false)
                  handleDelete()
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Eliminar
              </button>
            </div>
          )}
          {entry.books.cover_url ? (
            <img
              src={entry.books.cover_url}
              alt={entry.books.title}
              className="object-contain transition group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
              📚
            </div>
          )}

          {entry.status === "reading" && entry.progress_percent !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
              <div
                className="h-full bg-violet-500"
                style={{ width: `${entry.progress_percent}%` }}
              />
            </div>
          )}

          {entry.status === "finished" && entry.rating && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded-md text-xs text-amber-400">
              ★ {entry.rating}
            </div>
          )}
        </div>

        <div>
          <p className="text-white text-sm font-medium line-clamp-2">
            {entry.books.title}
          </p>
          {entry.books.authors && (
            <p className="text-zinc-500 text-xs">{entry.books.authors.name}</p>
          )}
        </div>
      </div>

      <EditBookModal
        entry={entry}
        open={open}
        onClose={() => setOpen(false)}
        onUpdated={() => {
          setOpen(false)
          onUpdated() // 👈
        }}
      />
    </>
  )
}
