'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import { Button } from '@/app/components/ui/button';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { todoService } from '@/services/todoService';
import { Todo } from '@/types/todo';

export default function TodoApp() {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = useCallback(() => {
    authService.logout();
    router.replace('/login');
  }, [router]);

  // Tangani error API: sesi habis -> logout, selain itu tampilkan pesan
  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        handleLogout();
        return;
      }
      setError(err instanceof Error ? err.message : fallback);
    },
    [handleLogout]
  );

  useEffect(() => {
    // Wajib login: tanpa token arahkan ke halaman login
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const fetchTodos = async () => {
      try {
        const data = await todoService.getTodos();
        setTodos(data);
      } catch (err) {
        handleError(err, 'Gagal memuat data tugas.');
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [router, handleError]);

  const handleAddTodo = async (title: string) => {
    setError('');
    try {
      const created = await todoService.createTodo(title);
      setTodos((prev) => [created, ...prev]);
    } catch (err) {
      handleError(err, 'Gagal menambahkan tugas.');
    }
  };

  const handleToggleTodo = async (id: number) => {
    const target = todos.find((todo) => todo.id === id);
    if (!target) return;

    setError('');
    const nextStatus = !target.completed;

    // Optimistic update, dikembalikan jika request gagal
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: nextStatus } : todo))
    );

    try {
      await todoService.updateTodo(id, { is_completed: nextStatus });
    } catch (err) {
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, completed: target.completed } : todo))
      );
      handleError(err, 'Gagal memperbarui status tugas.');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setError('');
    try {
      await todoService.deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      handleError(err, 'Gagal menghapus tugas.');
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Memuat tugas...</p>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form Input */}
      <TodoForm onAddTodo={handleAddTodo} />

      {/* List Tugas / tampilan kosong */}
      {todos.length === 0 ? (
        <div className="mt-6 p-8 text-center rounded-xl border border-dashed border-gray-70">
          <p className="text-sm font-medium text-gray-80">Belum ada tugas.</p>
          <p className="text-xs text-gray-80/70 mt-1">
            Tambahkan tugas baru di atas untuk memulai!
          </p>
        </div>
      ) : (
        <TodoList
          todos={todos}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
        />
      )}

      {/* Logout */}
      <div className="mt-6 pt-4 border-t border-gray-70 flex justify-end">
        <Button type="button" onClick={handleLogout} variant="destructive" size="xs">
          Logout →
        </Button>
      </div>
    </div>
  );
}
