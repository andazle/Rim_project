import axios from 'axios';

export const BASE_URL = 'https://rim-project-2.onrender.com/api/v1';
export const LOGIN_API = `${BASE_URL}/token/`;
export const REGISTER_API = `${BASE_URL}/register/`;
export const TASKS_API = `${BASE_URL}/tasks/`;
export const COLUMNS_API = `${BASE_URL}/columns/`;
export const PROJECTS_API = `${BASE_URL}/projects/`;

export const DEFAULT_COLUMNS = ['Нужно сделать', 'В работе', 'Готово'];

export const applyAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return token;
};

export const getCurrentUser = () => localStorage.getItem('username') || 'guest';

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

export const fetchColumns = async () => {
  const { data } = await axios.get(COLUMNS_API);
  return Array.isArray(data) ? data : [];
};

export const ensureColumns = async () => {
  let columns = await fetchColumns();

  if (columns.length === 0) {
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

    await Promise.all(
      DEFAULT_COLUMNS.map((title, order) =>
        axios.post(COLUMNS_API, { title, order, project: projectId })
      )
    );

    columns = await fetchColumns();
  }

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
  columns.forEach((c) => {
    const t = titleOf(c);
    if (!seenTitles.includes(t)) pushColumn(t);
  });

  return result;
};

export const fetchTasks = async () => {
  const { data } = await axios.get(TASKS_API);
  return Array.isArray(data) ? data : [];
};

export const fetchUserTasks = async () => {
  const user = getCurrentUser();
  const tasks = await fetchTasks();
  return tasks.filter((t) => t.description === user);
};

export const patchTask = async (taskId, payload) => {
  const { data } = await axios.patch(`${TASKS_API}${taskId}/`, payload);
  return data;
};

export const saveTaskPosition = (taskId, x, y) =>
  patchTask(taskId, { x_pos: x, y_pos: y });

export const clearTaskPosition = (taskId) =>
  patchTask(taskId, { x_pos: null, y_pos: null });

export const isOverdue = (task) =>
  !!task.deadline && new Date(task.deadline).getTime() < Date.now();
