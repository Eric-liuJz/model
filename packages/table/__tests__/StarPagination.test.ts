import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarPagination from '../src/components/StarPagination.vue'

describe('StarPagination 原子组件', () => {
  it('如果传入 config 为 false 或 undefined，整个分页 DOM 应该被摧毁 (v-if)', () => {
    const wrapper = mount(StarPagination, {
      props: {
        config: false,
        total: 100
      },
      global: {
        // StarPagination 内部使用了 el-pagination
        stubs: { 'el-pagination': true }
      }
    })

    // 断言 DOM 节点消失
    expect(wrapper.find('.star-table-pagination-wrapper').exists()).toBe(false)
  })

  it('如果传入 config 为 true，容器及默认 el-pagination 应该挂载', () => {
    const wrapper = mount(StarPagination, {
      props: {
        config: true,
        total: 100
        // vue 3.4 defineModel 会默认接驳
      },
      global: {
        stubs: { 'el-pagination': true }
      }
    })

    expect(wrapper.find('.star-table-pagination-wrapper').exists()).toBe(true)

    // 检查传给 el-pagination 的 total 是否正确透传
    const elPag = wrapper.findComponent({ name: 'el-pagination' }) // 名字匹配
    expect(elPag.exists()).toBe(true)
    expect(elPag.attributes('total')).toBe('100')
  })

  it('当内部引发 current-change 或 size-change 时，应该抛出 change 统合事件并带上 update:* 双向绑定指令', async () => {
    const wrapper = mount(StarPagination, {
      props: {
        config: true,
        total: 100,
        currentPage: 2,
        pageSize: 50
      },
      global: {
        plugins: [],
        stubs: {
          'el-pagination': {
            name: 'el-pagination',
            template: `<div class="el-pagination"></div>`,
            props: ['currentPage', 'pageSize']
          }
        }
      }
    })

    const elPag = wrapper.findComponent({ name: 'el-pagination' })

    // 假设内部用户点击了第三页（el-pagination 发出了 @current-change 与 @update:currentPage）
    elPag.vm.$emit('current-change', 3)
    elPag.vm.$emit('update:current-page', 3) // 模拟 vue 内置模型通讯

    elPag.vm.$emit('size-change', 100)
    elPag.vm.$emit('update:page-size', 100)

    // 等待 DOM/Vue 更新循环
    await wrapper.vm.$nextTick()
    // StarPagination 自己的事件应当向父级上抛
    expect(wrapper.emitted()).toHaveProperty('change')
    expect(wrapper.emitted('change')?.length).toBe(2)

    // defineModel 本身的向外推演 update:xxx 也会抛出
    expect(wrapper.emitted()).toHaveProperty('update:currentPage')
    expect(wrapper.emitted('update:currentPage')![0]).toEqual([3])

    expect(wrapper.emitted()).toHaveProperty('update:pageSize')
    expect(wrapper.emitted('update:pageSize')![0]).toEqual([100])
  })
})
