import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CellLink from '../src/components/cells/CellLink.vue'

describe('CellLink', () => {
  it('当 options.href 为字段名时，应当解析为真实链接并透传 target/rel', () => {
    const wrapper = mount(CellLink, {
      props: {
        value: 'Open',
        row: { url: 'https://example.com' },
        options: { href: 'url', target: '_blank' }
      },
      global: {
        stubs: {
          'el-link': {
            name: 'ElLink',
            props: ['href', 'target', 'rel'],
            emits: ['click'],
            template: '<a :href="href" :target="target" :rel="rel"><slot /></a>'
          }
        }
      }
    })

    const elLink = wrapper.findComponent({ name: 'ElLink' })
    expect(elLink.props('href')).toBe('https://example.com')
    expect(elLink.props('target')).toBe('_blank')
    expect(elLink.props('rel')).toBe('noopener noreferrer')
  })

  it('未配置 href 时点击应当触发 click 事件并返回 row', async () => {
    const row = { id: 1, name: 'Alice' }
    const wrapper = mount(CellLink, {
      props: {
        value: 'Open',
        row
      },
      global: {
        stubs: {
          'el-link': {
            name: 'ElLink',
            props: ['href', 'target', 'rel'],
            emits: ['click'],
            template: '<a @click="$emit(\'click\', $event)"><slot /></a>'
          }
        }
      }
    })

    await wrapper.findComponent({ name: 'ElLink' }).vm.$emit('click', new MouseEvent('click'))

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([row])
  })
})
