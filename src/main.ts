import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config'

createApp(App)
  .use(PrimeVue, {
    theme: 'none',
  })
  .mount('#app')
