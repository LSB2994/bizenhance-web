/**
 * Biz-scoped API helper: tries biz endpoints first, falls back to system endpoints
 * when backend returns 404/405/501 (not implemented yet).
 */
import api from './api';

function isNotImplemented(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === 404 || status === 405 || status === 501;
}

export async function tryBizThenSystem<T>(
  bizFn: () => Promise<T>,
  systemFn: () => Promise<T>
): Promise<T> {
  try {
    return await bizFn();
  } catch (err) {
    if (isNotImplemented(err)) {
      return await systemFn();
    }
    throw err;
  }
}

/** GET: try /api/biz/{bizId}/... then fallback to system URL */
export function bizGet<T>(
  bizId: number,
  bizPath: string,
  systemPath: string,
  config?: Parameters<typeof api.get>[1]
) {
  return tryBizThenSystem(
    () => api.get<T>(`/api/biz/${bizId}${bizPath}`, config),
    () => api.get<T>(systemPath, config)
  );
}

/** POST: try /api/biz/{bizId}/... then fallback */
export function bizPost<T>(
  bizId: number,
  bizPath: string,
  systemPath: string,
  data?: unknown,
  config?: Parameters<typeof api.post>[2]
) {
  return tryBizThenSystem(
    () => api.post<T>(`/api/biz/${bizId}${bizPath}`, data, config),
    () => api.post<T>(systemPath, data, config)
  );
}

/** PUT: try /api/biz/{bizId}/... then fallback */
export function bizPut<T>(
  bizId: number,
  bizPath: string,
  systemPath: string,
  data?: unknown,
  config?: Parameters<typeof api.put>[2]
) {
  return tryBizThenSystem(
    () => api.put<T>(`/api/biz/${bizId}${bizPath}`, data, config),
    () => api.put<T>(systemPath, data, config)
  );
}

/** DELETE: try /api/biz/{bizId}/... then fallback */
export function bizDelete<T>(
  bizId: number,
  bizPath: string,
  systemPath: string,
  config?: Parameters<typeof api.delete>[1]
) {
  return tryBizThenSystem(
    () => api.delete<T>(`/api/biz/${bizId}${bizPath}`, config),
    () => api.delete<T>(systemPath, config)
  );
}
