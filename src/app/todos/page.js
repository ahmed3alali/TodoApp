'use client';

/**
 * TODOS PAGE — The main CRUD interface
 * -------------------------------------
 *   C — Create:  add a new todo with the form
 *   R — Read:    load todos on page mount
 *   U — Update:  toggle completed OR edit the title (inline)
 *   D — Delete:  click the delete button
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, getTodos, createTodo, updateTodo, deleteTodo, logout } from '@/lib/api';

export default function TodosPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inline edit state — which todo is being edited and its draft title
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [meData, todosData] = await Promise.all([getMe(), getTodos()]);
        setUser(meData.user);
        setTodos(todosData.todos);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // ── CREATE ──────────────────────────────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      const data = await createTodo(newTitle.trim());
      setTodos([data.todo, ...todos]);
      setNewTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── UPDATE: toggle completed ──────────────────────────────────────────
  async function handleToggle(todo) {
    try {
      const data = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos(todos.map((t) => (t.id === todo.id ? data.todo : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  // ── UPDATE: start editing a title ─────────────────────────────────────
  function startEditing(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle('');
  }

  // ── UPDATE: save edited title ─────────────────────────────────────────
  async function saveEdit(todoId) {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setError('Task title cannot be empty.');
      return;
    }

    try {
      const data = await updateTodo(todoId, { title: trimmed });
      setTodos(todos.map((t) => (t.id === todoId ? data.todo : t)));
      cancelEditing();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditKeyDown(e, todoId) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(todoId);
    }
    if (e.key === 'Escape') {
      cancelEditing();
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
      if (editingId === id) cancelEditing();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Still redirect even if the API call fails (e.g. rate limit)
    }
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="spinner" />
        <p className="text-white/70 text-sm">Loading your tasks...</p>
      </div>
    );
  }

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30">
                ✓
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">TaskFlow</h1>
            </div>
            <p className="text-indigo-200/70 text-sm ml-[52px]">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost text-white/70 hover:text-white hover:bg-white/10">
            Log out
          </button>
        </header>

        {/* Stats card */}
        {todos.length > 0 && (
          <div className="glass-card p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Progress</span>
              <span className="text-sm font-semibold text-indigo-600">
                {completedCount} / {todos.length} done
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">{progress}% complete</p>
          </div>
        )}

        {/* Main card */}
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Your Tasks</h2>
          <p className="text-slate-500 text-sm mb-5">Add, edit, complete, or delete tasks below</p>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-xl mb-4 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">
                ✕
              </button>
            </div>
          )}

          {/* CREATE form */}
          <form onSubmit={handleCreate} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="input-field flex-1"
            />
            <button type="submit" disabled={submitting || !newTitle.trim()} className="btn-primary shrink-0">
              {submitting ? '...' : 'Add'}
            </button>
          </form>

          {/* READ — todo list */}
          {todos.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-5xl mb-3 opacity-30">📝</div>
              <p className="text-slate-500 font-medium">No tasks yet</p>
              <p className="text-slate-400 text-sm mt-1">Add your first task above to get started!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all
                    ${todo.completed
                      ? 'bg-slate-50 border-slate-100'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                >
                  {/* Checkbox — toggle completed */}
                  <button
                    onClick={() => handleToggle(todo)}
                    className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                      ${todo.completed
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 hover:border-indigo-400'
                      }`}
                    aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {todo.completed && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Title or inline edit input */}
                  {editingId === todo.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(e, todo.id)}
                        className="input-field py-1.5 text-sm flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`flex-1 text-sm select-none cursor-default
                        ${todo.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
                      onDoubleClick={() => !todo.completed && startEditing(todo)}
                      title="Double-click to edit"
                    >
                      {todo.title}
                    </span>
                  )}

                  {/* Action buttons (hidden while editing) */}
                  {editingId !== todo.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditing(todo)}
                        className="text-xs font-medium text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-xs font-medium text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Workshop demo — Create · Read · Update · Delete
        </p>
      </div>
    </div>
  );
}
