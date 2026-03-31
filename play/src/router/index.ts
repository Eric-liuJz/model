import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'BasicDemo',
      component: () => import('../views/BasicDemo.vue')
    },
    {
      path: '/virtual',
      name: 'VirtualDemo',
      component: () => import('../views/VirtualDemo.vue')
    }
  ]
})

export default router
