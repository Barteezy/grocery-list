<!-- src/views/ListDetailView.vue -->
<template>
  <div class="detail-container">
    <div class="detail-card">
      <!-- List heading -->
      <h1 class="detail-title">List: {{ list?.name }}</h1>
      <p class="owner-line">Owner: {{ ownerEmail }}</p>

      <!-- New Item form -->
      <div class="new-item-form">
        <input
          v-model="newItem"
          type="text"
          placeholder="Add item…"
          class="item-input"
        />
        <button
          :disabled="adding || !newItem"
          @click="addItem"
          class="btn-add"
        >
          {{ adding ? "Adding…" : "Add" }}
        </button>
      </div>

      <!-- Items list -->
      <div v-if="loading" class="info">Loading items…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else class="item-list">
        <li v-for="item in items" :key="item.id" class="item-row">
          <input
            type="checkbox"
            v-model="item.is_completed"
            @change="toggleComplete(item)"
            class="item-checkbox"
          />
          <span :class="{ completed: item.is_completed }" class="item-text">
            {{ item.content }}
          </span>
          <button
            @click="deleteItem(item)"
            class="item-delete"
            title="Delete item"
          >
            🗑️
          </button>
        </li>
      </ul>

      <!-- Collaborators section -->
      <div class="collab-section">
        <h2 class="collab-heading">Collaborators</h2>

        <!-- Invite form -->
        <div class="invite-form">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="User email…"
            class="collab-input"
          />
          <button
            @click="sendInvite"
            :disabled="inviting || !inviteEmail"
            class="btn-invite"
          >
            {{ inviting ? "Inviting…" : "Invite" }}
          </button>
        </div>
        <div v-if="inviteError" class="error">{{ inviteError }}</div>

        <!-- Collaborators list -->
        <ul class="collab-list">
          <li
            v-for="c in collaborators"
            :key="c.user_id"
            class="collab-row"
          >
            <span>{{ c.user_email }} ({{ c.role }})</span>
            <button
              v-if="currentUser === list.owner_id && c.user_id !== list.owner_id"
              @click="removeCollaborator(c)"
              class="item-delete"
              title="Remove collaborator"
            >
              ❌
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";

const route = useRoute();
const list = ref(null);
const ownerEmail = ref("");
const items = ref([]);
const loading = ref(true);
const error = ref(null);
const newItem = ref("");
const adding = ref(false);

const inviteEmail = ref("");
const inviting = ref(false);
const inviteError = ref(null);
const collaborators = ref([]);
const currentUser = ref(null);

let itemsSub, collabSub;

// ——— FETCH LIST, OWNER, ITEMS & COLLABS ———
async function fetchDetail() {
  loading.value = true;
  error.value = null;

  // get current user
  const { data: sessionData } = await supabase.auth.getUser();
  if (sessionData.user) {
    currentUser.value = sessionData.user.id;
  }

  // load list + owner_id
  const { data: l, error: e1 } = await supabase
    .from("lists")
    .select("id,name,owner_id")
    .eq("id", route.params.id)
    .single();
  if (e1 || !l) {
    error.value = e1?.message || "Could not load list";
    loading.value = false;
    return;
  }
  list.value = l;

  // fetch owner email
  const { data: ownerRec, error: oe } = await supabase
    .from("auth_users")
    .select("email")
    .eq("id", l.owner_id)
    .single();
  ownerEmail.value = oe ? "Unknown" : ownerRec.email;

  // load items
  const { data: its, error: e2 } = await supabase
    .from("list_items")
    .select("id,content,is_completed")
    .eq("list_id", route.params.id)
    .order("created_at", { ascending: true });
  if (e2) error.value = e2.message;
  else items.value = its;

  // load collaborators
  await loadCollaborators();

  loading.value = false;
}

// ——— ADD ITEM ———
async function addItem() {
  adding.value = true;
  error.value = null;

  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) {
    error.value = uErr?.message || "Not signed in";
    adding.value = false;
    return;
  }

  const { data, error: insErr } = await supabase
    .from("list_items")
    .insert({
      list_id: route.params.id,
      content: newItem.value,
      created_by: user.id,
    })
    .select("id,content,is_completed")
    .single();

  if (insErr) error.value = insErr.message;
  else {
    items.value.push(data);
    newItem.value = "";
  }

  adding.value = false;
}

// ——— TOGGLE COMPLETE ———
async function toggleComplete(item) {
  const { error: updErr } = await supabase
    .from("list_items")
    .update({ is_completed: item.is_completed })
    .eq("id", item.id);

  if (updErr) {
    error.value = updErr.message;
    item.is_completed = !item.is_completed;
  }
}

// ——— DELETE ITEM ———
async function deleteItem(item) {
  if (!confirm(`Delete “${item.content}”?`)) return;

  const { error: delErr } = await supabase
    .from("list_items")
    .delete()
    .eq("id", item.id);

  if (delErr) alert("Delete failed: " + delErr.message);
  else items.value = items.value.filter((i) => i.id !== item.id);
}

// ——— LOAD COLLABORATORS ———
async function loadCollaborators() {
  const { data: rows, error: rowErr } = await supabase
    .from("list_collaborators")
    .select("user_id,role")
    .eq("list_id", route.params.id);

  if (rowErr) {
    console.error(rowErr);
    return;
  }

  if (!rows.length) {
    collaborators.value = [];
    return;
  }

  const ids = rows.map((r) => r.user_id);
  const { data: users, error: userErr } = await supabase
    .from("auth_users")
    .select("id,email")
    .in("id", ids);

  if (userErr) {
    console.error(userErr);
    return;
  }

  collaborators.value = rows.map((r) => {
    const u = users.find((u) => u.id === r.user_id);
    return {
      user_id: r.user_id,
      role: r.role,
      user_email: u?.email ?? "Unknown",
    };
  });
}

// ——— SEND INVITE ———
async function sendInvite() {
  inviting.value = true;
  inviteError.value = null;

  const { data: userRec, error: lookupErr } = await supabase
    .from("auth_users")
    .select("id")
    .eq("email", inviteEmail.value)
    .single();

  if (lookupErr || !userRec) {
    inviteError.value = lookupErr?.message || "No user with that email";
    inviting.value = false;
    return;
  }

  const { error: insErr } = await supabase
    .from("list_collaborators")
    .insert({
      list_id: route.params.id,
      user_id: userRec.id,
      role: "editor",
    });

  inviting.value = false;
  if (insErr) inviteError.value = insErr.message;
}

// ——— REMOVE COLLABORATOR ———
async function removeCollaborator(c) {
  if (!confirm(`Remove ${c.user_email} from this list?`)) return;

  const { error } = await supabase
    .from("list_collaborators")
    .delete()
    .match({
      list_id: route.params.id,
      user_id: c.user_id,
    });

  if (error) {
    alert("Failed to remove collaborator: " + error.message);
  } else {
    collaborators.value = collaborators.value.filter(
      (x) => x.user_id !== c.user_id
    );
  }
}

// ——— REALTIME SUBSCRIPTIONS ———
onMounted(() => {
  fetchDetail();

  itemsSub = supabase
    .channel(`items:list_${route.params.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "list_items",
        filter: `list_id=eq.${route.params.id}`,
      },
      ({ new: itm, eventType, old }) => {
        if (eventType === "INSERT") items.value.push(itm);
        if (eventType === "UPDATE") {
          const idx = items.value.findIndex((i) => i.id === itm.id);
          if (idx !== -1) items.value[idx] = itm;
        }
        if (eventType === "DELETE") {
          items.value = items.value.filter((i) => i.id !== old.id);
        }
      }
    )
    .subscribe();

  collabSub = supabase
    .channel(`collabs:list_${route.params.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "list_collaborators",
        filter: `list_id=eq.${route.params.id}`,
      },
      loadCollaborators
    )
    .subscribe();
});

onUnmounted(() => {
  if (itemsSub) supabase.removeChannel(itemsSub);
  if (collabSub) supabase.removeChannel(collabSub);
});
</script>

<style scoped>
/* ===== LAYOUT ===== */
.detail-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 1rem;
  box-sizing: border-box;
}
.detail-card {
  background: #fff;
  border: 2px solid #ccc;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
}
/* ===== TITLES ===== */
.detail-title {
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
  color: #222;
}
.owner-line {
  margin-bottom: 1.5rem;
  color: #555;
  font-size: 0.95rem;
}
/* ===== NEW ITEM FORM ===== */
.new-item-form {
  display: flex;
  margin-bottom: 1.5rem;
}
.item-input {
  flex-grow: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #bbb;
  border-radius: 0.375rem 0 0 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.item-input:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 2px rgba(153, 153, 153, 0.3);
}
.btn-add {
  padding: 0 1rem;
  background-color: #777;
  color: #fff;
  border: none;
  border-radius: 0 0.375rem 0.375rem 0;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-add:hover:not(:disabled) {
  background-color: #555;
}
.btn-add:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}
/* ===== ITEMS LIST ===== */
.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.item-row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
.item-checkbox {
  margin-right: 0.75rem;
}
.item-text {
  flex-grow: 1;
  color: #333;
}
.completed {
  text-decoration: line-through;
  color: #888;
}
.item-delete {
  background: none;
  border: none;
  color: #e3342f;
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;
}
.item-delete:hover {
  color: #c02222;
}
/* ===== COLLABORATORS ===== */
.collab-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}
.collab-heading {
  margin-bottom: 0.75rem;
  font-size: 1.125rem;
  color: #222;
}
.invite-form {
  display: flex;
  margin-bottom: 0.75rem;
}
.collab-input {
  flex-grow: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #bbb;
  border-radius: 0.375rem 0 0 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.collab-input:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 2px rgba(153, 153, 153, 0.3);
}
.btn-invite {
  padding: 0 1rem;
  background-color: #777;
  color: #fff;
  border: none;
  border-radius: 0 0.375rem 0.375rem 0;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-invite:hover:not(:disabled) {
  background-color: #555;
}
.btn-invite:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}
.collab-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.collab-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
  color: #333;
  font-size: 0.95rem;
}
/* ===== MESSAGES ===== */
.info {
  color: #666;
  margin-bottom: 1rem;
}
.error {
  color: #dc2626;
  margin-bottom: 1rem;
}
</style>
