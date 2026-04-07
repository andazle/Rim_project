import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { TaskCard } from './components/TaskCard';

const LOGIN_API = 'http://127.0.0.1:8000/api/token/';
const BASE_URL = 'http://127.0.0.1:8000/api/v1/api/v1';
const TASKS_API = `${BASE_URL}/tasks/`;
const COLUMNS_API = `${BASE_URL}/columns/`;

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(LOGIN_API, formData);
      localStorage.setItem('token', res.data.access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
      navigate('/kanban');
    } catch (err) {
      console.error("Ошибка входа:", err.response?.data);
      alert('Неверный логин или пароль. Сначала создайте суперпользователя в терминале!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Project 17: Вход</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="text" placeholder="Логин (Username)" required
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
          <input 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            type="password" placeholder="Пароль" required
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button type="submit" style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Войти в систему
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

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [colRes, taskRes] = await Promise.all([
          axios.get(COLUMNS_API),
          axios.get(TASKS_API)
        ]);
        const sortedCols = colRes.data.sort((a, b) => (a.position || a.id) - (b.position || b.id));
        setColumns(sortedCols);
        setTasks(taskRes.data);
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
      const res = await axios.post(TASKS_API, {
        title: newTaskTitle,
        description: "Новая задача",
        column: columns[0].id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      setTasks(prev => [...prev, res.data]);
      setNewTaskTitle('');
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}><h2>Загрузка доски...</h2></div>;

  return (
    <div className="app-container">
      <style>{`
        body { margin: 0; background-color: #f0f2f5; font-family: sans-serif; }
        .header { text-align: center; padding: 30px; }
        .input-group { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; }
        .input-group input { padding: 10px; width: 300px; border-radius: 8px; border: 1px solid #ddd; }
        .board { display: flex; gap: 20px; justify-content: center; padding: 20px; overflow-x: auto; }
        .column { background: #ebecf0; width: 300px; padding: 15px; border-radius: 10px; min-height: 400px; }
        .task-list { display: flex; flex-direction: column; gap: 10px; }
      `}</style>

      <div className="header">
        <h1>Project 17 Kanban</h1>
        <div className="input-group">
          <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Название новой задачи..." />
          <button onClick={addTask} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Создать</button>
        </div>
      </div>

      <div className="board">
        {columns.map((col, idx) => (
          <div key={col.id} className="column">
            <h3 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>{col.title || col.name}</h3>
            <div className="task-list">
              {tasks.filter(t => t.column === col.id).map(task => (
                <TaskCard 
                  key={task.id} task={task} 
                  onMove={() => moveTask(task.id, col.id)} 
                  onDelete={async () => {
                    await axios.delete(`${TASKS_API}${task.id}/`);
                    setTasks(tasks.filter(t => t.id !== task.id));
                  }}
                  nextText={columns[idx + 1] ? "👉 Далее" : null}
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
        <Route path="/kanban" element={<KanbanBoard />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;