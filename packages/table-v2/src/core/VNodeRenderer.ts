import { defineComponent } from 'vue'

export const VNodeRenderer = defineComponent({
  name: 'VNodeRenderer',
  props: {
    content: {
      type: null,
      required: true
    }
  },
  render() {
    return this.content
  }
})
