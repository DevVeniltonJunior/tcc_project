import axios from 'axios'

export const openRouterApi = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
    'X-Title': process.env.APP_NAME || 'TCC Project',
  },
})

openRouterApi.interceptors.request.use(
  (config) => {
    const apiKey = process.env.AI_KEY
    if (apiKey) {
      config.headers.Authorization = `Bearer ${apiKey}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

openRouterApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('OpenRouter API Error:', error.response.status, error.response.data)
    } else if (error.request) {
      console.error('No response from OpenRouter API')
    }
    return Promise.reject(error)
  }
)

export const externalApi = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

