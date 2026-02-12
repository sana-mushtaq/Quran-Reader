import { fetch } from "expo/fetch"
import { QueryClient } from "@tanstack/react-query"

// returns base api url using env domain
// example: https://example.com
export function getApiUrl() {
  const host = process.env.EXPO_PUBLIC_DOMAIN

  // fail early if env variable is missing
  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set")
  }

  const url = new URL(`https://${host}`)
  return url.href
}

// helper to throw useful errors for non-200 responses
async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText
    throw new Error(`${res.status}: ${text}`)
  }
}

// generic api request helper (POST, PUT, DELETE, etc)
export async function apiRequest(method, route, data) {
  const baseUrl = getApiUrl()
  const url = new URL(route, baseUrl)

  const res = await fetch(url.toString(), {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include"
  })

  await throwIfResNotOk(res)
  return res
}

// factory for react-query query function
// handles 401 behavior in one place
export const getQueryFn =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl()
    const url = new URL(queryKey.join("/"), baseUrl)

    const res = await fetch(url.toString(), {
      credentials: "include"
    })

    // sometimes we want to silently ignore unauthorized
    if (on401 === "returnNull" && res.status === 401) {
      return null
    }

    await throwIfResNotOk(res)
    return await res.json()
  }

// shared query client for the app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
})
