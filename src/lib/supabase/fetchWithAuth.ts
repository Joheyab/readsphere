// src/lib/fetchWithAuth.ts
export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init)
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/auth/login"
  }
  return res
}
