<script setup lang="ts" generic="T extends Record<string, any>">
import type { TableController } from '../types'
import { provideTableContext } from '../core/context'

const props = defineProps<{
  table: TableController<T>
}>()

provideTableContext(props.table)
</script>

<template>
  <div class="star-table-v2-root">
    <slot />
  </div>
</template>
