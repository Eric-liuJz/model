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
    },
    {
      path: '/v2',
      name: 'V2Demo',
      component: () => import('../views/V2Demo/index.vue')
    },
    {
      path: '/v2-remote',
      name: 'V2RemoteDemo',
      component: () => import('../views/V2RemoteDemo/index.vue')
    }
  ]
})

export default router
