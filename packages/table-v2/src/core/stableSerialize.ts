function sortSerialized(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function serializeArrayValue(value: unknown, seen: WeakSet<object>) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return 'null'
  }

  return stableSerialize(value, seen)
}

function serializeObjectValue(value: unknown, seen: WeakSet<object>) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    return undefined
  }

  return stableSerialize(value, seen)
}

export function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return 'null'

  const valueType = typeof value

  if (valueType === 'string') return JSON.stringify(value)
  if (valueType === 'number') return Number.isFinite(value) ? String(value) : `"${String(value)}"`
  if (valueType === 'boolean') return value ? 'true' : 'false'
  if (valueType === 'bigint') return `{"$bigint":${JSON.stringify(String(value))}}`
  if (valueType === 'undefined') return '"[undefined]"'
  if (valueType === 'function') return '"[function]"'
  if (valueType === 'symbol') return `{"$symbol":${JSON.stringify(String(value))}}`

  if (value instanceof Date) {
    return `{"$date":${JSON.stringify(value.toISOString())}}`
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => serializeArrayValue(item, seen)).join(',')}]`
  }

  if (value instanceof Map) {
    const serializedEntries = sortSerialized(
      [...value.entries()].map(
        ([entryKey, entryValue]) =>
          `[${stableSerialize(entryKey, seen)},${stableSerialize(entryValue, seen)}]`
      )
    )
    return `{"$map":[${serializedEntries.join(',')}]}`
  }

  if (value instanceof Set) {
    const serializedValues = sortSerialized(
      [...value.values()].map((entryValue) => stableSerialize(entryValue, seen))
    )
    return `{"$set":[${serializedValues.join(',')}]}`
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '"[Circular]"'
    }

    seen.add(value)
    const serializedEntries = Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .flatMap((key) => {
        const serialized = serializeObjectValue((value as Record<string, unknown>)[key], seen)
        return serialized === undefined ? [] : [`${JSON.stringify(key)}:${serialized}`]
      })
    seen.delete(value)
    return `{${serializedEntries.join(',')}}`
  }

  return JSON.stringify(value)
}
