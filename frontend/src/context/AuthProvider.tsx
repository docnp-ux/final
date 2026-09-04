import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { login as loginRequest, me as fetchMe } from '@/api/auth'
import { ApiError } from '@/api/client'
import type { LoginFields, User } from '@/schemas/auth'
import { deleteCookie, getCookie, setCookie } from '@/utils/cookies'

type AuthContextProps = {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  loginUser: (fields: LoginFields) => Promise<void>
  logoutUser: () => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => getCookie('access_token') ?? null,
  )
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) {
      setUser(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    fetchMe()
      .then(setUser)
      .catch((err) => {
        // Only a confirmed-invalid token (401) should log the user out. Any
        // other failure (e.g. a network error from navigating away mid-request)
        // is transient — keep the cookie so the next mount can retry.
        if (err instanceof ApiError && err.status === 401) {
          deleteCookie('access_token')
          setAccessToken(null)
        }
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [accessToken])

  const loginUser = async (fields: LoginFields) => {
    const res = await loginRequest(fields)
    setCookie('access_token', res.access_token, {
      expires: 1,
      sameSite: 'Lax',
      secure: false,
      path: '/',
    })
    setAccessToken(res.access_token)
  }

  const logoutUser = () => {
    deleteCookie('access_token')
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!user, isLoading, user, loginUser, logoutUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
