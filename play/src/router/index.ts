import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'BasicDemo',
      component: () => import('../views/BasicDemo/index.vue')
    },
    {
      path: '/virtual',
      name: 'VirtualDemo',
      component: () => import('../views/VirtualDemo/index.vue')
    }
  ]
})

export default router
