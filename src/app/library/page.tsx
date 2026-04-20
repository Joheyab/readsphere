"use client";

import { useState } from "react";
import AddBookModal from "@/components/library/AddBookModal";
import BookCard from "@/components/library/BookCard";
import { useLibrary } from "@/hooks/useLibrary";
import { LibraryStatus } from "@/types/library";

const STATUS_LABELS: Record<LibraryStatus, string> = {
  reading: "📖 Leyendo",
  want_to_read: "🔖 Quiero leer",
  finished: "✅ Terminados",
};

const STATUS_ORDER: LibraryStatus[] = [
  "reading",
  "want_to_read",
  "finished",
];

export default function LibraryPage() {
  const { entries, loading, refetch } = useLibrary();
  const [showModal, setShowModal] = useState(false);

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = entries.filter((e) => e.status === status);
    return acc;
  }, {} as Record<LibraryStatus, typeof entries>);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Mi biblioteca
          </h1>
          <p className="text-zinc-500 text-sm mt-1">

            {entries.length} libros en tu colección
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl cursor-pointer"
        >
          Agregar libro
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-20">
          Cargando...
        </div>
      ) : (
        <div className="space-y-12">
          {STATUS_ORDER.map((status) => {
            const group = grouped[status];
            if (!group.length) return null;

            return (
              <section key={status}>
                <h2 className="text-zinc-400 mb-4">
                  {STATUS_LABELS[status]}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {group.map((entry) => (
                    <BookCard key={entry.id} entry={entry} onDeleted={refetch} onUpdated={refetch}/>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showModal && (
        <AddBookModal
          onClose={() => setShowModal(false)}
          onAdded={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}