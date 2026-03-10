import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://jiamart-backend-851457000209.europe-west2.run.app/api/v1',
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('jiamart_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('jiamart_token')
      localStorage.removeItem('jiamart_user')
      // dispatch 事件让 AuthContext 同步清空 user state
      window.dispatchEvent(new Event('jiamart:logout'))
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err.response?.data || err)
  }
)

export default api
