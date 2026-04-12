"use client"

import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { useState } from "react"

export default function RegisterPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleRegister(): Promise<void> {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="relative text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Revisa tu correo!
          </h2>
          <p className="text-zinc-400 text-sm">
            Te enviamos un enlace de confirmación a{" "}
            <span className="text-white font-medium">{email}</span>
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-violet-400 hover:text-violet-300"
          >
            Volver al inicio de sesión →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Crea tu cuenta
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Empieza gratis, sin tarjeta de crédito
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
            />

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
            />

            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <button
            onClick={handleGoogleRegister}
            className="w-full mt-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl"
          >
            Continuar con Google
          </button>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
