import './style.css'   
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { supabase } from '@/lib/supabase'

const app = createApp(App)
app.use(router)
app.mount('#app')

// redirect to /login when auth state changes to signed out
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    router.push({ name: 'Login' })
  }
})
