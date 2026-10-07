import { apiClient } from './api';
import { Todo } from '@/types/todo';

// Bentuk data todo dari backend Express (lihat TodoResponse di backend)
interface TodoDto {
  id: number;
  todo: string;
  completed: boolean;
}

interface ApiEnvelope<T = undefined> {
  success: boolean;
  message: string;
  data: T;
}

export interface UpdateTodoInput {
  task?: string;
  is_completed?: boolean;
}

// Tabel todos tidak punya kolom created_at, jadi createdAt diisi tanggal saat data dimuat
const toTodo = (dto: TodoDto): Todo => ({
  id: dto.id,
  title: dto.todo,
  completed: dto.completed,
  createdAt: new Date().toISOString().split('T')[0],
});

export const todoService = {
  // GET /api/todos — semua todo milik user yang sedang login
  async getTodos(page = 1, perPage = 50): Promise<Todo[]> {
    const res = await apiClient<ApiEnvelope<TodoDto[]>>(
      `/todos?page=${page}&perPage=${perPage}`
    );
    return res.data.map(toTodo);
  },

  // GET /api/todos/:id
  async getTodoById(id: number | string): Promise<Todo> {
    const res = await apiClient<ApiEnvelope<TodoDto>>(`/todos/${id}`);
    return toTodo(res.data);
  },

  // POST /api/todos
  async createTodo(task: string): Promise<Todo> {
    const res = await apiClient<ApiEnvelope<TodoDto>>('/todos', {
      method: 'POST',
      body: JSON.stringify({ task }),
    });
    return toTodo(res.data);
  },

  // PUT /api/todos/:id — update parsial (task dan/atau is_completed)
  async updateTodo(id: number | string, input: UpdateTodoInput): Promise<void> {
    await apiClient<ApiEnvelope>(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  // DELETE /api/todos/:id
  async deleteTodo(id: number | string): Promise<void> {
    await apiClient<ApiEnvelope>(`/todos/${id}`, {
      method: 'DELETE',
    });
  },
};
