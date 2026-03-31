import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { VERSION } from '@star-table/core'

console.log('StarTableCore Version:', VERSION)

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
