import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// import { provideStoreToApp } from '@reduxjs/vue-redux'
// import store from './app/store'

createApp(App).use(router).mount('#app')
