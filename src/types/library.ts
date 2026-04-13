

export type LibraryStatus = "want_to_read" | "reading" | "finished";

export type UserLibraryEntry = {
  id: string;
  status: "want_to_read" | "reading" | "finished";
  rating: number | null;
  progress_percent: number | null;
  books: {
    id: string;
    title: string;
    cover_url: string | null;
    authors: { name: string } | null;
    book_genres: {
      genres: { name: string } | null;
    }[];
  };
};