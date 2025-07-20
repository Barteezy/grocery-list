<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-2xl mb-4">My Grocery Lists</h1>

    <!-- New List form -->
    <div class="flex mb-6">
      <input
        v-model="newName"
        type="text"
        placeholder="New list name…"
        class="flex-grow border rounded-l px-3 py-2"
      />
      <button
        :disabled="creating || !newName"
        @click="createList"
        class="bg-blue-600 text-white px-4 rounded-r"
      >
        {{ creating ? 'Saving…' : 'Add' }}
      </button>
    </div>

    <!-- Existing Lists -->
    <div v-if="loading">Loading lists…</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <ul v-else>
      <li
        v-for="list in lists"
        :key="list.id"
        class="mb-2 text-blue-600 hover:underline"
      >
        <router-link :to="{ name: 'ListDetail', params: { id: list.id } }">
          {{ list.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase }      from '@/lib/supabase'

const lists    = ref([])
const loading  = ref(true)
const error    = ref(null)
const newName  = ref('')
const creating = ref(false)

async function fetchLists() {
  const { data, error: err } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: false })

  if (err) {
    error.value = err.message
  } else {
    lists.value = data
  }
  loading.value = false
}

// create a new list
async function createList() {
  creating.value = true
  error.value    = null

  // grab current user
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()

  if (userErr) {
    error.value = userErr.message
    creating.value = false
    return
  }

  // insert the list row
  const { data, error: insertErr } = await supabase
    .from('lists')
    .insert({
      name: newName.value,
      owner_id: user.id
    })
    .select() // return the created record
    .single()

  if (insertErr) {
    error.value = insertErr.message
  } else {
    // prepend to our array so UI updates instantly
    lists.value.unshift(data)
    newName.value = ''
  }

  creating.value = false
}

onMounted(fetchLists)
</script>
