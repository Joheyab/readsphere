export type Book = {
  id: string;
  title: string;
  cover_url: string | null;
  authors: { name: string } | null;
};

export type LibraryStatus = "want_to_read" | "reading" | "finished";

export type UserLibraryEntry = {
  id: string;
  status: LibraryStatus;
  rating: number | null;
  progress_percent: number | null;
  books: Book;
};