import { describe, it, expect } from 'vitest'
import { resolveRenderer, CellRendererRegistry } from '../src/components/renderer'

describe('CellRendererRegistry', () => {

  it('应当注册所有预设渲染器类型', () => {
    const expectedTypes = ['text', 'date', 'tag', 'link', 'action']
    for (const type of expectedTypes) {
      expect(CellRendererRegistry[type]).toBeDefined()
    }
  })

  it('resolveRenderer 应当根据 type 正确返回对应组件', () => {
    expect(resolveRenderer('date')).toBe(CellRendererRegistry.date)
    expect(resolveRenderer('tag')).toBe(CellRendererRegistry.tag)
    expect(resolveRenderer('action')).toBe(CellRendererRegistry.action)
  })

  it('resolveRenderer 未传 type 时应当回退到 text', () => {
    expect(resolveRenderer()).toBe(CellRendererRegistry.text)
    expect(resolveRenderer(undefined)).toBe(CellRendererRegistry.text)
  })

  it('resolveRenderer 传入未注册的 type 时应当回退到 text', () => {
    expect(resolveRenderer('unknown_type')).toBe(CellRendererRegistry.text)
  })
})
