"use client";

import { useEffect, useState } from "react";

type Achievement = {
  unlocked_at: string;
  achievements: {
    id: string;
    code: string;
    title: string;
    description: string;
  };
};

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      const res = await fetch("/api/achievements");
      if (res.ok) setAchievements(await res.json());
      setLoading(false);
    };
    fetch_();
  }, []);

  return { achievements, loading };
}