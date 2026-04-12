import Image from "next/image";
import { UserLibraryEntry } from "@/types/library";

type Props = {
  entry: UserLibraryEntry;
};

export default function BookCard({ entry }: Props) {
  return (
    <div className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
        {entry.books.cover_url ? (
          <Image
            src={entry.books.cover_url}
            alt={entry.books.title}
            fill
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
            📚
          </div>
        )}

        {entry.status === "reading" &&
          entry.progress_percent !== null && (
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
          <p className="text-zinc-500 text-xs">
            {entry.books.authors.name}
          </p>
        )}
      </div>
    </div>
  );
}