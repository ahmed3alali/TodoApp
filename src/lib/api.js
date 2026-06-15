/**
 * API HELPER
 * ----------
 * All communication with the Express backend goes through this file.
 *
 * credentials: 'include' is IMPORTANT — it tells the browser to send
 * cookies (our JWT) with every request, even cross-origin.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Generic fetch wrapper — handles JSON and errors in one place.
 */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // send cookies with every request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ── AUTH ────────────────────────────────────────────────────────────────────

export async function register(email, password) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return apiFetch('/api/auth/me');
}

// ── TODOS (CRUD) ──────────────────────────────────────────────────────────

export async function getTodos() {
  return apiFetch('/api/todos');
}

export async function createTodo(title) {
  return apiFetch('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function updateTodo(id, updates) {
  return apiFetch(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTodo(id) {
  return apiFetch(`/api/todos/${id}`, { method: 'DELETE' });
}
