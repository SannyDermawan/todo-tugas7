'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiError } from '@/services/api';
import { authService } from '@/services/authService';
import { todoService } from '@/services/todoService';
import { Todo } from '@/types/todo';
import TaskNotFound from './components/TaskNotFound';
import TaskDetailCard from './components/TaskDetailCard';

export default function TodoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [todo, setTodo] = useState<Todo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Halaman ini hanya untuk user yang sudah login
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const fetchTodo = async () => {
      try {
        const data = await todoService.getTodoById(id);
        setTodo(data);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          // Token tidak valid / kedaluwarsa
          authService.logout();
          router.replace('/login');
        } else {
          setError(err instanceof Error ? err.message : 'Gagal memuat detail tugas.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Memuat detail tugas...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (notFound || !todo) {
    return <TaskNotFound id={id} />;
  }

  return <TaskDetailCard todo={todo} />;
}
