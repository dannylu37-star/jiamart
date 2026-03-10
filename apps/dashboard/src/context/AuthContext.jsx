import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jiamart_user')) } catch { return null }
  })

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    if (!res.success) throw new Error(res.message || '登录失败')
    localStorage.setItem('jiamart_token', res.data.access_token)
    localStorage.setItem('jiamart_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('jiamart_token')
    localStorage.removeItem('jiamart_user')
    setUser(null)
  }

  // 监听 api.js 发出的 401 登出事件，同步清空 user state
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('jiamart:logout', handler)
    return () => window.removeEventListener('jiamart:logout', handler)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
