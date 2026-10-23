// 极简 fetch 封装：统一 JSON、错误抛出、基址可控
const BASE = import.meta.env.VITE_API_BASE || ''

interface RequestOptions {
  method?: string
  body?: unknown
}

async function request<T = unknown>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let message = `请求失败(${res.status})`
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      /* 忽略解析失败 */
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

export const http = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
}
