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
export const PROJECTS_API = `${BASE_URL}/projects/`;

/** Стандартные колонки канбан-доски (в нужном порядке). */
export const DEFAULT_COLUMNS = ['Нужно сделать', 'В работе', 'Готово'];

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

/**
 * Извлекает id пользователя из JWT-токена (SimpleJWT кладёт его в поле user_id).
 * Возвращает число или null, если токена нет / он некорректен.
 */
export const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.user_id ? Number(json.user_id) : null;
  } catch {
    return null;
  }
};

/** Получить список колонок доски. */
export const fetchColumns = async () => {
  const { data } = await axios.get(COLUMNS_API);
  return Array.isArray(data) ? data : [];
};

/**
 * Гарантирует наличие колонок в БД. Если их нет — создаёт проект и три
 * стандартные колонки через API. Возвращает по одной колонке на каждый
 * статус (дедупликация по названию). В поле aliasIds — id всех колонок
 * с этим названием, чтобы задачи из дублей-колонок тоже отображались.
 */
export const ensureColumns = async () => {
  let columns = await fetchColumns();

  if (columns.length === 0) {
    // 1. Нужен проект, к которому будут привязаны колонки.
    let projectId;
    try {
      const { data: projects } = await axios.get(PROJECTS_API);
      projectId = projects[0]?.id;
    } catch {
      projectId = undefined;
    }
    if (!projectId) {
      const { data: project } = await axios.post(PROJECTS_API, {
        name: 'Project 17',
        description: 'Доска задач',
        owner: getCurrentUserId(),
      });
      projectId = project.id;
    }

    // 2. Создаём стандартные колонки.
    await Promise.all(
      DEFAULT_COLUMNS.map((title, order) =>
        axios.post(COLUMNS_API, { title, order, project: projectId })
      )
    );

    columns = await fetchColumns();
  }

  // Дедупликация по названию: одна колонка на каждый статус.
  const titleOf = (c) => c.title || c.name;
  const seenTitles = [];
  const result = [];

  const pushColumn = (title) => {
    const sameTitle = columns.filter((c) => titleOf(c) === title);
    if (sameTitle.length === 0) return;
    result.push({ ...sameTitle[0], aliasIds: sameTitle.map((c) => c.id) });
    seenTitles.push(title);
  };

  DEFAULT_COLUMNS.forEach(pushColumn);
  // Нестандартные названия (если есть) — в конец, тоже без дублей.
  columns.forEach((c) => {
    const t = titleOf(c);
    if (!seenTitles.includes(t)) pushColumn(t);
  });

  return result;
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
