<script setup lang="ts">
import { computed } from 'vue'
import { useTableContext } from '../../core/context'

const table = useTableContext<any>()
const pagination = table.state.pagination
const currentPage = computed(() => pagination?.currentPage.value ?? 1)
const pageSize = computed(() => pagination?.pageSize.value ?? 10)
const total = computed(() => pagination?.total.value ?? 0)
</script>

<template>
  <div v-if="pagination" class="star-table-v2-pagination">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      :layout="pagination.layout"
      :background="pagination.background"
      :page-sizes="pagination.pageSizes"
      :hide-on-single-page="pagination.hideOnSinglePage"
      :small="pagination.small"
      @current-change="table.actions.setPage"
      @size-change="table.actions.setPageSize"
    />
  </div>
</template>
