<!-- src/views/LoginView.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isSignUp ? 'Create an account' : 'Sign In' }}</h2>

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
        placeholder="Confirm password"
        class="auth-input"
      />

      <button
        @click="submit"
        class="auth-button"
        :disabled="loading || (isSignUp && password !== confirmPassword)"
      >
        {{ loading
            ? (isSignUp ? 'Signing up…' : 'Signing in…')
            : (isSignUp ? 'Sign Up' : 'Sign In')
        }}
      </button>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <p class="text-center text-sm">
        <a
          v-if="!isSignUp"
          href="#"
          @click.prevent="resetPassword"
          class="auth-link"
        >Forgot your password?</a>
        <br v-if="!isSignUp" />

        <a
          href="#"
          @click.prevent="toggleMode"
          class="auth-link"
        >
          {{ isSignUp
             ? 'Already have an account? Sign In'
             : "Don't have an account? Sign Up"
          }}
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

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

// handle both sign in and sign up
async function submit() {
  loading.value = true
  error.value   = null

  if (isSignUp.value) {
    // sign up flow
    if (password.value !== confirmPassword.value) {
      error.value     = "Passwords don't match"
      loading.value   = false
      return
    }

    const { error: signUpErr } = await supabase.auth.signUp({
      email:    email.value,
      password: password.value
    })
    // immediately clear any session
    await supabase.auth.signOut()

    loading.value = false
    if (signUpErr) {
      error.value = signUpErr.message
    } else {
      isSignUp.value = false
      error.value    = 'Registration successful! Check your email to confirm.'
    }

  } else {
    // sign in flow
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email:    email.value,
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

// forgot‑password flow
async function resetPassword() {
  if (!email.value) {
    error.value = 'Please enter your email.'
    return
  }

  loading.value = true
  error.value   = null

  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
    email.value,
    { redirectTo: `${window.location.origin}/reset-password` }
  )

  loading.value = false
  if (resetErr) {
    error.value = resetErr.message
  } else {
    error.value = 'Check your inbox for the reset link!'
  }
}
</script>

<style scoped>
/* ===== AUTH PAGE LAYOUT ===== */
.auth-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7f7f7, #efefef);
  padding: 1rem;
  box-sizing: border-box;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border: 2px solid #cccccc;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 2rem;
  box-sizing: border-box;
  text-align: center;
}

.auth-card h2 {
  margin-bottom: 1.5rem;
  color: #222222;
  font-size: 1.5rem;
  font-weight: 600;
}

/* ===== INPUTS ===== */
.auth-input {
  width: 100%;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #bbbbbb;
  border-radius: 0.375rem;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.auth-input:focus {
  outline: none;
  border-color: #999999;
  box-shadow: 0 0 0 2px rgba(153,153,153,0.3);
}

/* ===== BUTTON ===== */
.auth-button {
  width: 100%;
  padding: 0.6rem;
  background-color: #555555;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}
.auth-button:hover:not(:disabled) {
  background-color: #333333;
}
.auth-button:disabled {
  background-color: #dddddd;
  cursor: not-allowed;
}

/* ===== ERROR ===== */
.auth-error {
  margin-top: 1rem;
  color: #dc2626;
  font-size: 0.875rem;
}

/* ===== TOGGLE LINK ===== */
.auth-link {
  display: block;
  margin-top: 1rem;
  color: #555555;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}
.auth-link:hover {
  color: #333333;
}
</style>
