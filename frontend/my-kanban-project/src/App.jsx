import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { TaskCard } from './components/TaskCard';
import { NavBar } from './components/NavBar';
import { ensureColumns } from './api';
import DashboardPage from './pages/DashboardPage';
import SchemePage from './pages/SchemePage';

const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000'
  : 'https://rim-project-2.onrender.com';

const BASE_URL = `${BACKEND_URL}/api/v1`;
const LOGIN_API = `${BACKEND_URL}/api/token/`;
const REGISTER_API = `${BASE_URL}/register/`;
const TASKS_API = `${BASE_URL}/tasks/`;

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(LOGIN_API, formData);
      localStorage.setItem('token', res.data.access);
      localStorage.setItem('username', formData.username);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
      navigate('/kanban');
    } catch (err) {
      console.error("Ошибка входа:", err.response?.data);
      alert('Неверный логин или пароль!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Project 17: Вход</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="text" placeholder="Логин (латиница)" required
            onChange={e => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="password" placeholder="Пароль" required
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit" style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Войти
          </button>
          <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px' }}>
            Нет аккаунта? Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '', password_confirm: '' });
  const navigate = useNavigate();

  const isPasswordStrong = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      alert("Пароли не совпадают!");
      return;
    }

    if (!isPasswordStrong(formData.password)) {
      alert("Пароль слишком слабый! Он должен содержать минимум 8 символов, хотя бы одну латинскую букву и одну цифру.");
      return;
    }

    try {
      await axios.post(REGISTER_API, {
        username: formData.username,
        password: formData.password,
        password_confirm: formData.password_confirm
      });
      alert('Регистрация прошла успешно! Теперь вы можете войти в систему.');
      navigate('/login');
    } catch (err) {
      console.error("Детали ошибки:", err.response);
      const msg = err.response?.data?.detail || err.response?.data?.error || JSON.stringify(err.response?.data);
      alert("Ошибка при регистрации: " + msg);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Project 17: Регистрация</h2>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="text" placeholder="Придумайте логин (латиница)" required
            onChange={e => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="password" placeholder="Придумайте пароль" required
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <input
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="password" placeholder="Повторите пароль" required
            onChange={e => setFormData({ ...formData, password_confirm: e.target.value })}
          />
          <button type="submit" style={{ padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Создать аккаунт
          </button>
          <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', marginTop: '5px' }}>
            Уже зарегистрированы? Войти
          </button>
        </form>
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('username') || '';
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTags, setNewTaskTags] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        setLoading(true);

        const currentCols = await ensureColumns();
        setColumns(currentCols);

        const taskRes = await axios.get(TASKS_API);
        if (taskRes.data && Array.isArray(taskRes.data)) {
          const userTasks = taskRes.data
            .filter(t => t.description && t.description.startsWith(currentUser))
            .map(t => {
              let tags = [];
              if (t.description.includes('|')) {
                const parts = t.description.split('|');
                tags = parts[1].split(',').map(tag => tag.trim()).filter(Boolean);
              }
              return { ...t, tags };
            });
          setTasks(userTasks);
        }
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);

        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          alert("Сессия устарела. Пожалуйста, войдите в систему заново.");
          navigate('/login');
          return;
        }

        const errorDetail = err.response?.data
          ? JSON.stringify(err.response.data)
          : err.message;
        const status = err.response?.status ? `[Статус ${err.response.status}] ` : '';

        alert(`Ошибка загрузки доски! ${status}${errorDetail}`);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate, currentUser]);

  const addTask = async () => {
    if (!newTaskTitle.trim() || columns.length === 0) return;

    try {
      let formattedDeadline = null;
      if (deadlineDate) {
        const parsedDate = new Date(`${deadlineDate}T${deadlineTime || '00:00'}:00`);
        if (!isNaN(parsedDate.getTime())) {
          formattedDeadline = parsedDate.toISOString();
        } else {
          alert("Пожалуйста, введите корректную дату дедлайна.");
          return;
        }
      }

      // Убираем дублирование решёток и чистим пробелы
      const cleanTags = newTaskTags
        .split(',')
        .map(t => t.trim().replace(/^#+/, ''))
        .filter(Boolean);

      const descriptionWithTags = cleanTags.length > 0
        ? `${currentUser}|${cleanTags.join(',')}`
        : currentUser;

      const res = await axios.post(TASKS_API, {
        title: newTaskTitle,
        description: descriptionWithTags,
        column: columns[0].id,
        deadline: formattedDeadline
      });

      const newTaskObject = {
        ...res.data,
        tags: cleanTags
      };

      setTasks(prev => [...prev, newTaskObject]);
      setNewTaskTitle('');
      setNewTaskTags('');
      setDeadlineDate('');
      setDeadlineTime('23:59');
    } catch (e) {
      console.error("Ошибка при создании задачи:", e);
      alert(`Ошибка при создании: ${e.response?.data ? JSON.stringify(e.response.data) : e.message}`);
    }
  };

  const moveTask = async (taskId, currentColumnId) => {
    const currentIdx = columns.findIndex(col => col.id === currentColumnId);
    const currentColumn = columns[currentIdx];
    const nextColumn = columns[currentIdx + 1];

    if (!nextColumn) return;

    try {
      await axios.patch(`${TASKS_API}${taskId}/`, {
        column: nextColumn.id
      });

      const timestamp = new Date().toISOString();
      const logEntry = {
        taskId,
        taskTitle: tasks.find(t => t.id === taskId)?.title || 'Без названия',
        fromColumn: currentColumn.title || currentColumn.name,
        toColumn: nextColumn.title || nextColumn.name,
        movedAt: timestamp
      };
      const existingLogs = JSON.parse(localStorage.getItem('task_time_logs') || '[]');
      existingLogs.push(logEntry);
      localStorage.setItem('task_time_logs', JSON.stringify(existingLogs));
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === taskId ? { ...t, column: nextColumn.id } : t))
      );
    } catch (e) {
      console.error("Ошибка изменения колонки задачи:", e);
      alert("Не удалось переместить задачу!");
    }
  };

  const deleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const taskTitle = taskToDelete?.title || 'Без названия';

    if (!window.confirm(`Вы уверены, что хотите удалить задачу "${taskTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`${TASKS_API}${taskId}/`);

      const timestamp = new Date().toISOString();
      const logEntry = {
        taskId,
        taskTitle: taskTitle,
        fromColumn: 'Находилась на доске',
        toColumn: 'Удалена',
        movedAt: timestamp
      };

      const existingLogs = JSON.parse(localStorage.getItem('task_time_logs') || '[]');
      existingLogs.push(logEntry);
      localStorage.setItem('task_time_logs', JSON.stringify(existingLogs));

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (e) {
      console.error("Ошибка удаления задачи:", e);
      alert("Не удалось удалить задачу");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const matchesTitle = task.title?.toLowerCase().includes(query);
    const tagsArray = task.tags || [];
    const matchesTags = tagsArray.some(tag => tag.toLowerCase().includes(query));

    return matchesTitle || matchesTags;
  });

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Загрузка доски...</h2></div>;

  return (
    <div className="app-container">
      <style>{`
        body { margin: 0; background-color: #f0f2f5; font-family: sans-serif; }
        .header { text-align: center; padding: 30px; position: relative; display: flex; flex-direction: column; gap: 15px; }
        .input-group { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
        .input-group input { padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
        .board { display: flex; gap: 20px; justify-content: center; padding: 20px; overflow-x: auto; }
        .column { background: #ebecf0; width: 300px; padding: 15px; border-radius: 10px; min-height: 400px; }
        .task-list { display: flex; flex-direction: column; gap: 10px; }
      `}</style>

      <NavBar />

      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1240px', margin: '0 auto', width: '100%', flexWrap: 'wrap', gap: '15px' }}>
          <h1 style={{ margin: 0 }}>Project 17 Kanban</h1>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или тегам..."
            style={{ width: '300px', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
          />
        </div>

        <div className="input-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Название задачи..."
            style={{ width: '220px' }}
          />
          <input
            value={newTaskTags}
            onChange={e => setNewTaskTags(e.target.value)}
            placeholder="Теги (через запятую)..."
            style={{ width: '180px' }}
          />
          <input
            type="date"
            value={deadlineDate}
            onChange={e => setDeadlineDate(e.target.value)}
            style={{ width: '140px' }}
          />
          <input
            type="time"
            value={deadlineTime}
            onChange={e => setDeadlineTime(e.target.value)}
            style={{ width: '90px' }}
          />
          <button onClick={addTask} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Создать</button>
        </div>
      </div>

      <div className="board">
        {columns.map((col, idx) => (
          <div key={col.id} className="column">
            <h3 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>{col.title || col.name}</h3>
            <div className="task-list">
              {filteredTasks.filter(t => (col.aliasIds || [col.id]).includes(t.column)).map(task => {
                const isColumnDone = ['готов', 'done', 'выполн'].some(w =>
                  (col.title || col.name || '').toLowerCase().includes(w)
                );

                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={() => moveTask(task.id, col.id)}
                    onDelete={() => deleteTask(task.id)}
                    nextText={columns[idx + 1] ? "Далее" : null}
                    isDone={isColumnDone}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scheme" element={<SchemePage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;