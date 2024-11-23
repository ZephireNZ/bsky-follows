import { createApp } from 'vue'
import './assets/styles.scss'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { createPinia } from 'pinia'
import router from '@/router/router'

createApp(App)
  .use(router)
  .use(createPinia())
  .use(PrimeVue, {
    theme: 'none',
  })
  .use(ConfirmationService)
  .use(ToastService)
  .mount('#app')
