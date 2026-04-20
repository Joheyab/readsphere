export type Profile = {
  id: string;
  full_name: string
  username: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_genres: string[] | null;
};

export type LibraryEntry = {
  id: string;
  status: string;
  rating: number | null;
  progress_percent: number | null;
  books: {
    id: string;
    title: string;
    cover_url: string | null;
    authors: { name: string } | null;
  };
};

export type Review = {
  id: string;
  rating: number;
  content: string | null;
  created_at: string;
  books: { id: string; title: string; cover_url: string | null } | null;
};

export type Achievement = {
  unlocked_at: string;
  achievements: { code: string; title: string; description: string } | null;
};

export type PublicProfile = {
  profile: Profile;
  stats: { booksFinished: number; booksReading: number, followers: number; following: number };
  library: LibraryEntry[];
  reviews: Review[];
  achievements: Achievement[];
};