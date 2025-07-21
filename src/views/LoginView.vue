<!-- src/views/LoginView.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Title -->
      <h2>{{ isSignUp ? 'Create an Account' : 'Sign In' }}</h2>

      <!-- Form Fields -->
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="auth-input"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="auth-input"
      />
      <input
        v-if="isSignUp"
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        class="auth-input"
      />

      <!-- Submit Button -->
      <button
        @click="submit"
        :disabled="loading || (isSignUp && password !== confirmPassword)"
        class="auth-button"
      >
        <span v-if="loading">
          {{ isSignUp ? 'Signing Up…' : 'Signing In…' }}
        </span>
        <span v-else>
          {{ isSignUp ? 'Sign Up' : 'Sign In' }}
        </span>
      </button>

      <!-- Error Message -->
      <p v-if="error" class="auth-error">{{ error }}</p>

      <!-- Toggle Link -->
      <a href="#" @click.prevent="toggleMode" class="auth-link">
        {{ isSignUp
          ? 'Already have an account? Sign In'
          : "Don't have an account? Sign Up" }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase }  from '@/lib/supabase'

const router          = useRouter()
const isSignUp        = ref(false)
const email           = ref('')
const password        = ref('')
const confirmPassword = ref('')
const loading         = ref(false)
const error           = ref(null)

function toggleMode() {
  isSignUp.value = !isSignUp.value
  error.value    = null
}

async function submit() {
  loading.value = true
  error.value   = null

  if (isSignUp.value) {
    if (password.value !== confirmPassword.value) {
      error.value = "Passwords don't match"
      loading.value = false
      return
    }

    const { error: signUpErr } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })
    await supabase.auth.signOut()
    loading.value = false

    if (signUpErr) {
      error.value = signUpErr.message
    } else {
      isSignUp.value = false
      error.value    = 'Registration successful! Check your email to confirm, then sign in.'
    }
  } else {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })
    loading.value = false

    if (signInErr) {
      error.value = signInErr.message
    } else {
      router.push({ name: 'Lists' })
    }
  }
}
</script>
