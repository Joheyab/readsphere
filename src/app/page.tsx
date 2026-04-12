const recentBooks = [
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    progress: 65,
  },
  {
    id: 3,
    title: "Harry Potter",
    author: "J.K. Rowling",
    progress: 30,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-3xl font-bold">Bienvenido a ReadSphere 👋</h2>
        <p className="mt-2 text-zinc-400">
          Lleva control de tus libros, comparte reseñas y mide tu progreso.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Libros leídos</p>
          <h3 className="mt-2 text-3xl font-bold">12</h3>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Páginas este mes</p>
          <h3 className="mt-2 text-3xl font-bold">1,240</h3>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Meta anual</p>
          <h3 className="mt-2 text-3xl font-bold">12 / 20</h3>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-semibold">Lecturas recientes</h3>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentBooks.map((book) => (
            <div
              key={book.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <h4 className="text-lg font-semibold">{book.title}</h4>
              <p className="mt-1 text-sm text-zinc-400">{book.author}</p>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Progreso</span>
                  <span>{book.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-white"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
