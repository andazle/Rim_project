import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { TaskCard } from './components/TaskCard';
import { NavBar } from './components/NavBar';
import { ensureColumns } from './api';
import DashboardPage from './pages/DashboardPage';
import SchemePage from './pages/SchemePage';

const BASE_URL = 'https://rim-project-2.onrender.com/api/v1';
const LOGIN_API = 'https://rim-project-2.onrender.com/api/token/';
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
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('username') || 'guest';

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        const [currentCols, taskRes] = await Promise.all([
          ensureColumns(),
          axios.get(TASKS_API)
        ]);

        setColumns(currentCols);

        if (taskRes.data && Array.isArray(taskRes.data)) {
          const userTasks = taskRes.data.filter(t => t.description === currentUser);
          setTasks(userTasks);
        }
      } catch (err) {
        console.error("Ошибка загрузки:", err);
        alert("Не удалось загрузить доску. Проверьте, что сервер запущен.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate, currentUser]);

  const moveTask = async (taskId, currentColumnId) => {
    const currentIndex = columns.findIndex(c => c.id === currentColumnId);
    const nextColumn = columns[currentIndex + 1];
    if (!nextColumn) return;
    try {
      await axios.patch(`${TASKS_API}${taskId}/`, { column: nextColumn.id });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, column: nextColumn.id } : t));
    } catch (e) { console.error(e); }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || columns.length === 0) return;

    try {
      console.log("ID первой колонки:", columns[0].id);

      let formattedDeadline = null;
      if (newTaskDeadline) {
        const parsedDate = new Date(newTaskDeadline);
        if (!isNaN(parsedDate.getTime())) {
          formattedDeadline = parsedDate.toISOString();
        } else {
          alert("Пожалуйста, введите корректную дату и время дедлайна.");
          return;
        }
      }

      const res = await axios.post(TASKS_API, {
        title: newTaskTitle,
        description: currentUser,
        column: columns[0].id,
        deadline: formattedDeadline
      });

      setTasks(prev => [...prev, res.data]);
      setNewTaskTitle('');
    } catch (e) {
      console.error("Полная ошибка при создании задачи:", e);

      const errorMsg = e.response?.data
        ? JSON.stringify(e.response.data)
        : e.message || "Локальная ошибка кода";

      alert(`Ошибка при создании: ${errorMsg}`);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${TASKS_API}${taskId}/`);
    } catch (e) {
      console.error(e);
    }
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Загрузка доски...</h2></div>;

  return (
    <div className="app-container">
      <style>{`
        body { margin: 0; background-color: #f0f2f5; font-family: sans-serif; }
        .header { text-align: center; padding: 30px; position: relative; }
        .input-group { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; }
        .input-group input { padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
        .board { display: flex; gap: 20px; justify-content: center; padding: 20px; overflow-x: auto; }
        .column { background: #ebecf0; width: 300px; padding: 15px; border-radius: 10px; min-height: 400px; }
        .task-list { display: flex; flex-direction: column; gap: 10px; }
      `}</style>

      <NavBar />

      <div className="header">
        <h1>Project 17 Kanban</h1>
        <div className="input-group">
          <input
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Название задачи..."
            style={{ width: '250px' }}
          />
          <input
            type="date"
            value={newTaskDeadline}
            onChange={e => setNewTaskDeadline(e.target.value)}
            style={{ width: '150px' }}
          />
          <button onClick={addTask} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Создать</button>
        </div>
      </div>

      <div className="board">
        {columns.map((col, idx) => (
          <div key={col.id} className="column">
            <h3 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>{col.title || col.name}</h3>
            <div className="task-list">
              {tasks.filter(t => (col.aliasIds || [col.id]).includes(t.column)).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={() => moveTask(task.id, col.id)}
                  onDelete={() => deleteTask(task.id)}
                  nextText={columns[idx + 1] ? "Далее" : null}
                />
              ))}
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
