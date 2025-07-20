<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-2xl mb-4">List: {{ list?.name }}</h1>

    <!-- New Item form -->
    <div class="flex mb-6">
      <input
        v-model="newItem"
        type="text"
        placeholder="Add item…"
        class="flex-grow border rounded-l px-3 py-2"
      />
      <button
        :disabled="adding || !newItem"
        @click="addItem"
        class="bg-green-600 text-white px-4 rounded-r"
      >
        {{ adding ? 'Adding…' : 'Add' }}
      </button>
    </div>

    <!-- Items list -->
    <div v-if="loading">Loading items…</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <ul v-else>
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-center mb-2"
      >
        <input
          type="checkbox"
          v-model="item.is_completed"
          @change="toggleComplete(item)"
          class="mr-2"
        />
        <span :class="{ 'line-through': item.is_completed }">
          {{ item.content }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase }      from '@/lib/supabase'

const route   = useRoute()
const router  = useRouter()
const list    = ref(null)
const items   = ref([])
const loading = ref(true)
const error   = ref(null)
const newItem = ref('')
const adding  = ref(false)

async function fetchDetail() {
  loading.value = true
  error.value   = null

  // load list name
  const { data: l, error: e1 } = await supabase
    .from('lists')
    .select('id,name')
    .eq('id', route.params.id)
    .single()

  if (e1 || !l) {
    error.value = e1?.message || 'Failed to load list'
    loading.value = false
    return
  }
  list.value = l

  // load items
  const { data: its, error: e2 } = await supabase
    .from('list_items')
    .select('id,content,is_completed')
    .eq('list_id', route.params.id)
    .order('created_at', { ascending: true })

  if (e2) {
    error.value = e2.message
  } else {
    items.value = its
  }

  loading.value = false
}

async function addItem() {
  adding.value = true
  error.value  = null

  // get current user
  const {
    data: { user },
    error: uErr
  } = await supabase.auth.getUser()

  if (uErr || !user) {
    error.value = uErr?.message || 'Not signed in'
    adding.value = false
    return
  }

  const { data, error: insErr } = await supabase
    .from('list_items')
    .insert({
      list_id: route.params.id,
      content: newItem.value,
      created_by: user.id
    })
    .select('id,content,is_completed')
    .single()

  if (insErr) {
    error.value = insErr.message
  } else {
    items.value.push(data)
    newItem.value = ''
  }

  adding.value = false
}

async function toggleComplete(item) {
  const { error: updErr } = await supabase
    .from('list_items')
    .update({ is_completed: item.is_completed })
    .eq('id', item.id)

  if (updErr) {
    error.value = updErr.message
    // revert on error
    item.is_completed = !item.is_completed
  }
}

onMounted(fetchDetail)
</script>
