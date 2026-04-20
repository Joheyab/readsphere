"use client";

import { useEffect, useState } from "react";

export type FeedItem = {
  type: "review" | "book" | "person" | "activity";
  isFollowing?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

export function useFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch("/api/feed");
      if (res.ok) setFeed(await res.json());
      setLoading(false);
    };
    fetch_();
  }, []);

  return { feed, loading };
}