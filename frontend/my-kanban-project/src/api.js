import axios from 'axios';

/**
 * Единый слой работы с REST API (Django REST Framework).
 * Базовые адреса соответствуют маршрутам бэкенда команды.
 */
export const BASE_URL = 'http://127.0.0.1:8000/api/v1';
export const LOGIN_API = 'http://127.0.0.1:8000/api/token/';
export const REGISTER_API = `${BASE_URL}/register/`;
export const TASKS_API = `${BASE_URL}/tasks/`;
export const COLUMNS_API = `${BASE_URL}/columns/`;

/** Подставляет сохранённый JWT-токен в заголовок Authorization. */
export const applyAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

/** Текущий пользователь (логин сохраняется при входе). */
export const getCurrentUser = () => localStorage.getItem('username') || 'guest';

/** Получить список колонок доски. */
export const fetchColumns = async () => {
  const { data } = await axios.get(COLUMNS_API);
  return Array.isArray(data) ? data : [];
};

/** Получить список задач. */
export const fetchTasks = async () => {
  const { data } = await axios.get(TASKS_API);
  return Array.isArray(data) ? data : [];
};

/** Получить только задачи текущего пользователя (фильтр по полю description). */
export const fetchUserTasks = async () => {
  const user = getCurrentUser();
  const tasks = await fetchTasks();
  return tasks.filter((t) => t.description === user);
};

/** Частично обновить задачу. */
export const patchTask = async (taskId, payload) => {
  const { data } = await axios.patch(`${TASKS_API}${taskId}/`, payload);
  return data;
};

/**
 * Сохранить координаты метки задачи на интерактивной схеме.
 * Координаты хранятся в долях размера изображения (0..1).
 */
export const saveTaskPosition = (taskId, x, y) =>
  patchTask(taskId, { x_pos: x, y_pos: y });

/** Убрать метку задачи со схемы (очистить координаты). */
export const clearTaskPosition = (taskId) =>
  patchTask(taskId, { x_pos: null, y_pos: null });

/** Просрочена ли задача (дедлайн в прошлом). */
export const isOverdue = (task) =>
  !!task.deadline && new Date(task.deadline).getTime() < Date.now();
