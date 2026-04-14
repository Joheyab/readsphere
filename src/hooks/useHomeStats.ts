"use client";

import { useEffect, useState } from "react";

type RecentBook = {
  id: string;
  status: string;
  progress_percent: number | null;
  books: {
    title: string;
    authors: { name: string } | null;
  };
};

type HomeStats = {
  booksFinished: number;
  pagesThisMonth: number;
  recent: RecentBook[];
};

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch("/api/home");
      if (res.ok) setStats(await res.json());
      setLoading(false);
    };
    fetch_();
  }, []);

  return { stats, loading };
}