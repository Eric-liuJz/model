import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { usePagination } from '../src/hooks/usePagination'
import type { PaginationConfig } from '../src/types/pagination'

describe('usePagination Hook', () => {
  const defaultConfig: PaginationConfig = {
    layout: 'total, sizes, prev, pager, next, jumper',
    background: true,
    pageSizes: [10, 20, 50, 100],
    hideOnSinglePage: false,
    small: false
  }

  it('当 config 为 false 或 undefined 时，应该返回 null', () => {
    const configRef1 = ref<boolean>(false)
    const { mergedConfig: config1 } = usePagination(configRef1)
    expect(config1.value).toBeNull()

    const configRef2 = ref(undefined)
    const { mergedConfig: config2 } = usePagination(configRef2)
    expect(config2.value).toBeNull()
  })

  it('当 config 为 true 时，应当使用默认的企业级分页配置', () => {
    const configRef = ref<boolean>(true)
    const { mergedConfig } = usePagination(configRef)
    expect(mergedConfig.value).toEqual(defaultConfig)
  })

  it('当 config 是空对象 {} 时，应当同样回退到基础配置', () => {
    const configRef = ref<PaginationConfig>({})
    const { mergedConfig } = usePagination(configRef)
    expect(mergedConfig.value).toEqual(defaultConfig)
  })

  it('当传入特定的配置覆盖时，应该执行深层次浅合并，保留其自身特有的配置', () => {
    const customConfig: PaginationConfig = {
      small: true,
      layout: 'prev, pager, next', // 定制极简版
      pageCount: 7 // 这是 element-plus 的原生覆盖属性，虽未在 base 显式列出
    }

    const configRef = ref(customConfig)
    const { mergedConfig } = usePagination(configRef)

    // 覆盖过的值
    expect(mergedConfig.value?.small).toBe(true)
    expect(mergedConfig.value?.layout).toBe('prev, pager, next')
    expect(mergedConfig.value?.pageCount).toBe(7)

    // 原有未覆盖的值应该保持 defaultBase 的默认行为
    expect(mergedConfig.value?.background).toBe(true)
    expect(mergedConfig.value?.pageSizes).toEqual([10, 20, 50, 100])
  })

  it('验证 Vue 响应式数据穿透（改变 Ref 后 mergedConfig 应保持自动运算一致）', () => {
    const configRef = ref<boolean | PaginationConfig>(false)
    const { mergedConfig } = usePagination(configRef)

    // 初始态
    expect(mergedConfig.value).toBeNull()

    // 动态启用 true
    configRef.value = true
    expect(mergedConfig.value?.background).toBe(true)

    // 动态更替为特定对象
    configRef.value = { background: false }
    expect(mergedConfig.value?.background).toBe(false)
    expect(mergedConfig.value?.layout).toBe(defaultConfig.layout) // base value persist
  })
})
