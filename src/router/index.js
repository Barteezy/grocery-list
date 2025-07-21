import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/supabase'
import ListsView from '@/views/ListsView.vue'
import ListDetailView from '@/views/ListDetailView.vue'
import LoginView from '@/views/LoginView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'

const routes = [
  // public
  { path: '/login',  name: 'Login',      component: LoginView },

  // protected
  { path: '/',        name: 'Lists',      component: ListsView },
  { path: '/lists/:id', name: 'ListDetail', component: ListDetailView, props: true },

  // catch-all: redirect unknown routes to /
  { path: '/:pathMatch(.*)*', redirect: '/' },

  // reset password
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView,
  },

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global guard: redirect to login if no session
router.beforeEach(async (to) => {
  const publicPages = ['Login']
  const authNeeded  = !publicPages.includes(to.name)
  const { data: { session } } = await supabase.auth.getSession()

  if (authNeeded && !session) {
    return { name: 'Login' }
  }
  // if you're on /login but already signed in, bounce to your lists
  if (to.name === 'Login' && session) {
    return { name: 'Lists' }
  }
})

export default router
