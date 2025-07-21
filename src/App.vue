<!-- src/App.vue -->
<template>
  <div id="app">
    <header class="app-header">
      <RouterLink to="/" class="logo">Don't You Forget About ...</RouterLink>
      <!-- only show logout if `session` is truthy -->
      <button
        v-if="session"
        @click="signOut"
        class="btn-logout"
      >
        Logout
      </button>
    </header>

    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const router  = useRouter()
const session = ref(null)

async function loadSession() {
  const { data: { session: s } } = await supabase.auth.getSession()
  session.value = s
}

// listen for changes (e.g. login, logout)
supabase.auth.onAuthStateChange((_event, s) => {
  session.value = s
})

onMounted(loadSession)

async function signOut() {
  await supabase.auth.signOut()
  session.value = null
  router.push({ name: 'Login' })
}
</script>

<style>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}
.logo {
  font-weight: bold;
  color: #333;
  text-decoration: none;
}
.btn-logout {
  background: #777;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}
.btn-logout:hover {
  background: #555;
}
</style>
