<template>
  <div class="p-4 max-w-sm mx-auto">
    <h2 class="text-xl mb-4">Sign In</h2>
    <input
      v-model="email"
      type="email"
      placeholder="Email"
      class="w-full mb-2 border px-2 py-1"
    />
    <input
      v-model="password"
      type="password"
      placeholder="Password"
      class="w-full mb-4 border px-2 py-1"
    />
    <button
      @click="signIn"
      class="w-full bg-blue-600 text-white py-2 rounded"
      :disabled="loading"
    >
      {{ loading ? 'Signing in…' : 'Sign In' }}
    </button>
    <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase }      from '@/lib/supabase'

const router  = useRouter()
const email   = ref('')
const password= ref('')
const loading = ref(false)
const error   = ref(null)

async function signIn() {
  loading.value = true
  error.value   = null

  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  loading.value = false

  if (err) {
    error.value = err.message
  } else {
    router.push('/')  // back to lists page
  }
}
</script>
