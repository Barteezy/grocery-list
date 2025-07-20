<template>
  <header class="p-4 bg-gray-100 flex justify-end">
    <button @click="signOut" class="text-red-600">Logout</button>
  </header>
  <router-view />
</template>

<script setup>
import { supabase } from '@/lib/supabase'

async function signOut() {
  await supabase.auth.signOut()
}
</script>
