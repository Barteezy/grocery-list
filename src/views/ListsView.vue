<!-- src/views/ListsView.vue -->
<template>
  <div class="lists-container">
    <div class="lists-card">
      <h1>My Shopping Lists</h1>

      <!-- New List form -->
      <div class="new-list-form">
        <input
          v-model="newName"
          type="text"
          placeholder="New list name…"
          class="list-input"
        />
        <button
          :disabled="creating || !newName"
          @click="createList"
          class="btn-add"
        >
          {{ creating ? 'Saving…' : 'Add' }}
        </button>
      </div>

      <!-- Feedback -->
      <div v-if="loading" class="info">Loading lists…</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <!-- List display -->
      <ul v-else class="list-group">
        <li v-for="list in lists" :key="list.id" class="list-item">
          <router-link
            :to="{ name: 'ListDetail', params: { id: list.id } }"
            class="list-link"
          >
            {{ list.name }}
          </router-link>
          <button
            @click="deleteList(list)"
            class="delete-button"
            title="Delete list"
          >❌</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const lists    = ref([])
const loading  = ref(true)
const error    = ref(null)
const newName  = ref('')
const creating = ref(false)

async function fetchLists() {
  loading.value = true
  error.value   = null

  // get current session
  const { data: { session }, error: sessErr } = await supabase.auth.getSession()
  if (sessErr) {
    error.value   = sessErr.message
    loading.value = false
    return
  }
  if (!session) {
    lists.value   = []
    loading.value = false
    return
  }

  // fetch owned lists
  const { data: owned, error: ownErr } = await supabase
    .from('lists')
    .select('*')
    .eq('owner_id', session.user.id)

  if (ownErr) {
    error.value   = ownErr.message
    loading.value = false
    return
  }

  // fetch collaborator rows
  const { data: collabRows, error: collErr } = await supabase
    .from('list_collaborators')
    .select('list_id')
    .eq('user_id', session.user.id)

  if (collErr) {
    error.value   = collErr.message
    loading.value = false
    return
  }

  // if any, fetch those lists
  let collabLists = []
  const ids = collabRows.map(r => r.list_id)
  if (ids.length) {
    const { data, error: cListErr } = await supabase
      .from('lists')
      .select('*')
      .in('id', ids)
    if (cListErr) {
      error.value   = cListErr.message
      loading.value = false
      return
    }
    collabLists = data
  }

  // combine & sort
  lists.value = [...owned, ...collabLists]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  loading.value = false
}

async function createList() {
  creating.value = true
  error.value    = null

  const { data: { user }, error: uErr } = await supabase.auth.getUser()
  if (uErr || !user) {
    error.value    = uErr?.message || 'Not signed in'
    creating.value = false
    return
  }

  const { data, error: insErr } = await supabase
    .from('lists')
    .insert({ name: newName.value, owner_id: user.id })
    .select()
    .single()

  if (insErr) {
    error.value = insErr.message
  } else {
    lists.value.unshift(data)
    newName.value = ''
  }

  creating.value = false
}

async function deleteList(list) {
  if (!confirm(`Permanently delete list “${list.name}”?`)) return

  const { error: delErr } = await supabase
    .from('lists')
    .delete()
    .eq('id', list.id)

  if (delErr) {
    alert('Failed to delete list: ' + delErr.message)
  } else {
    lists.value = lists.value.filter(l => l.id !== list.id)
  }
}

// call it on mount
onMounted(fetchLists)
</script>

<style scoped>
/* ===== LAYOUT ===== */
.lists-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #fafafa);
  padding: 1rem;
  box-sizing: border-box;
}

.lists-card {
  background: #ffffff;
  border: 2px solid #cccccc;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
  text-align: center;
}

.lists-card h1 {
  margin-bottom: 1rem;
  font-size: 1.75rem;
  color: #222222;
}

/* ===== NEW LIST FORM ===== */
.new-list-form {
  display: flex;
  margin-bottom: 1.5rem;
}

.list-input {
  flex-grow: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #bbbbbb;
  border-radius: 0.375rem 0 0 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.list-input:focus {
  outline: none;
  border-color: #999999;
  box-shadow: 0 0 0 2px rgba(153, 153, 153, 0.3);
}

.btn-add {
  padding: 0 1rem;
  background-color: #777777;
  color: #ffffff;
  border: none;
  border-radius: 0 0.375rem 0.375rem 0;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-add:hover:not(:disabled) {
  background-color: #555555;
}
.btn-add:disabled {
  background-color: #dddddd;
  cursor: not-allowed;
}

/* ===== LIST ITEMS ===== */
.list-group {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eeeeee;
}

.list-link {
  color: #555555;
  text-decoration: none;
  font-weight: 500;
}
.list-link:hover {
  color: #333333;
  text-decoration: underline;
}

.delete-button {
  background: none;
  border: none;
  color: #e3342f;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;
  transition: color 0.2s;
}
.delete-button:hover {
  color: #c02222;
}

/* ===== MESSAGES ===== */
.info {
  color: #666666;
  margin-bottom: 1rem;
}
.error {
  color: #dc2626;
  margin-bottom: 1rem;
}
</style>
