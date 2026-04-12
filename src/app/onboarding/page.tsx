"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Image from "next/image";

const GENRES = [
  "Acción", "Aventura", "Comedia", "Drama", "Terror",
  "Ciencia ficción", "Fantasía", "Romance", "Thriller", "Animación",
  "Documental", "Musical", "Misterio", "Crimen", "Biografía",
];

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleGenre(genre: string) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarFile) return null;

    const ext = avatarFile.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });

    if (error) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      setError("El username solo puede tener letras, números y guiones bajos (3-30 caracteres).");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const avatarUrl = await uploadAvatar(user.id);

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      username: username.toLowerCase(),
      full_name: fullName,
      bio,
      favorite_genres: selectedGenres,
      ...(avatarUrl && { avatar_url: avatarUrl }),
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      if (upsertError.code === "23505") {
        setError("Ese username ya está en uso. Prueba con otro.");
      } else {
        setError(upsertError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/library");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Completa tu perfil</h1>
          <p className="text-zinc-500 text-sm mt-1">Personaliza tu experiencia antes de continuar</p>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl p-8 shadow-xl shadow-black/40">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 hover:border-violet-500 transition overflow-hidden"
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1">
                    <svg className="w-6 h-6 text-zinc-500 group-hover:text-violet-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
              <p className="text-zinc-600 text-xs">Foto de perfil (máx. 2MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="tu_username"
                  maxLength={30}
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Cuéntanos qué lees..."
                rows={3}
                maxLength={160}
                className="w-full px-4 py-2.5 bg-zinc-800/60 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition resize-none"
              />
              <p className="text-zinc-600 text-xs mt-1 text-right">{bio.length}/160</p>
            </div>

            {/* Favorite Genres */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Géneros favoritos
                <span className="text-zinc-600 font-normal ml-2">({selectedGenres.length} seleccionados)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => {
                  const selected = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selected
                          ? "bg-violet-600 text-white border border-violet-500"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-colors"
            >
              {loading ? "Guardando..." : "Continuar →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}