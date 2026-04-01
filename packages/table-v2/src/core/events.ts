import type { TableActionPayload } from '../types'

export function createActionChannel<T>() {
  const listeners = new Set<(payload: TableActionPayload<T>) => void>()

  return {
    emit(payload: TableActionPayload<T>) {
      listeners.forEach((listener) => listener(payload))
    },
    on(handler: (payload: TableActionPayload<T>) => void) {
      listeners.add(handler)
      return () => {
        listeners.delete(handler)
      }
    }
  }
}
