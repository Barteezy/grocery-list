<!-- src/views/ResetPasswordView.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Reset Your Password</h2>

      <input
        v-model="newPassword"
        type="password"
        placeholder="New password"
        class="auth-input"
      />
      <input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm password"
        class="auth-input"
      />

      <button
        @click="updatePassword"
        class="auth-button"
        :disabled="loading || !newPassword || newPassword !== confirmPassword"
      >
        {{ loading ? 'Updating…' : 'Set Password' }}
      </button>

      <p v-if="error" class="auth-error">{{ error }}</p>
      <p v-if="success" class="auth-info">Password updated! Redirecting…</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase }  from '@/lib/supabase'

const router          = useRouter()
const newPassword     = ref('')
const confirmPassword = ref('')
const loading         = ref(false)
const error           = ref(null)
const success         = ref(false)

async function updatePassword() {
  error.value   = null
  success.value = false

  if (newPassword.value !== confirmPassword.value) {
    error.value = "Passwords don't match"
    return
  }

  loading.value = true
  const { error: updErr } = await supabase.auth.updateUser({
    password: newPassword.value
  })
  loading.value = false

  if (updErr) {
    error.value = updErr.message
  } else {
    success.value = true
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, 2000)
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 1rem;
}

.auth-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border: 2px solid #cccccc;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 2rem;
  text-align: center;
}

.auth-card h2 {
  margin-bottom: 1.5rem;
  color: #222;
  font-size: 1.5rem;
  font-weight: 600;
}

.auth-input {
  width: 100%;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #bbbbbb;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.auth-input:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 2px rgba(153,153,153,0.3);
}

.auth-button {
  width: 100%;
  padding: 0.6rem;
  background-color: #777;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.auth-button:hover:not(:disabled) {
  background-color: #555;
}

.auth-button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

.auth-error {
  margin-top: 1rem;
  color: #dc2626;
  font-size: 0.875rem;
}

.auth-info {
  margin-top: 1rem;
  color: #333;
  font-size: 0.875rem;
}
</style>
