<script setup lang="ts">
import { useRoute } from 'vue-router'
import './styles/layout.scss'

const route = useRoute()
</script>

<template>
  <el-container class="layout-container">
    <!-- 侧边菜单栏 -->
    <el-aside width="240px" class="aside">
      <div class="logo">
        <el-icon :size="20" color="#409eff"><Odometer /></el-icon>
        <span>@star-table/play</span>
      </div>
      <el-menu :default-active="route.path" router class="menu">
        <el-menu-item index="/">
          <el-icon><IconMenu /></el-icon>
          <span>基础表格演示</span>
        </el-menu-item>
        <el-menu-item index="/virtual">
          <el-icon><DataLine /></el-icon>
          <span>虚拟列表 (WIP)</span>
        </el-menu-item>
        <el-menu-item index="/v2">
          <el-icon><Grid /></el-icon>
          <span>Table V2</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体内容区 -->
    <el-main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script lang="ts">
// 注册图标
import { Odometer, Menu as IconMenu, DataLine, Grid } from '@element-plus/icons-vue'
export default {
  components: {
    Odometer,
    IconMenu,
    DataLine,
    Grid
  }
}
</script>
