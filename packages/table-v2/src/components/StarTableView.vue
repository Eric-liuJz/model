<script setup lang="ts">
import { computed } from 'vue'
import { useTableContext } from '../core/context'
import TableView from '../adapters/element-table/TableView.vue'
import VirtualTableView from '../adapters/element-table-v2/VirtualTableView.vue'

const table = useTableContext<any>()
const currentView = computed(() => (table.view.isVirtual ? VirtualTableView : TableView))
</script>

<template>
  <component :is="currentView" />
</template>
