import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TaskCard } from './components/TaskCard';

const TASKS_API = 'http://127.0.0.1:8000/api/v1/api/v1/tasks/';
const COLUMNS_API = 'http://127.0.0.1:8000/api/v1/api/v1/columns/';

function App() {
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Загрузка данных
  useEffect(() => {
    async function loadData() {
      try {
        const [colRes, taskRes] = await Promise.all([
          axios.get(COLUMNS_API),
          axios.get(TASKS_API)
        ]);
        // Сортируем колонки по полю position (из админки)
        const sortedCols = colRes.data.sort((a, b) => (a.position || a.id) - (b.position || b.id));
        setColumns(sortedCols);
        setTasks(taskRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Перемещение задачи
  const moveTask = async (taskId, currentColumnId) => {
    const currentIndex = columns.findIndex(c => c.id === currentColumnId);
    const nextColumn = columns[currentIndex + 1];
    if (!nextColumn) return;

    try {
      await axios.patch(`${TASKS_API}${taskId}/`, { column: nextColumn.id });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, column: nextColumn.id } : t));
    } catch (e) {
      console.error("Ошибка при перемещении:", e);
    }
  };

  // Удаление задачи
  const deleteTask = async (taskId) => {
    if (!window.confirm("Удалить эту задачу?")) return;
    try {
      await axios.delete(`${TASKS_API}${taskId}/`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (e) {
      console.error("Ошибка при удалении:", e);
    }
  };

  // Создание задачи
  const addTask = async () => {
    if (!newTaskTitle.trim() || columns.length === 0) return;
    try {
      const res = await axios.post(TASKS_API, {
        title: newTaskTitle,
        description: "Новая задача",
        column: columns[0].id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Дедлайн через неделю
      });
      setTasks(prev => [...prev, res.data]);
      setNewTaskTitle('');
    } catch (e) {
      console.error("Ошибка при создании:", e);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h2>Синхронизация Project 17...</h2>
    </div>
  );

  return (
    <div className="app-container">
      <style>{`
        body { margin: 0; padding: 0; background-color: #f0f2f5; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        #root { display: block !important; max-width: 100% !important; margin: 0 !important; }
        
        .app-container { min-height: 100vh; padding: 40px 20px; box-sizing: border-box; }
        
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #1c1e21; font-size: 2.5rem; margin-bottom: 20px; font-weight: 800; }
        
        .input-group { display: flex; justify-content: center; gap: 12px; max-width: 500px; margin: 0 auto; }
        .input-group input { 
          flex: 1; padding: 12px 16px; border-radius: 8px; border: 2px solid #ddd; 
          font-size: 16px; transition: border-color 0.3s; outline: none;
        }
        .input-group input:focus { border-color: #007bff; }
        .input-group button { 
          padding: 12px 24px; background-color: #007bff; color: white; border: none; 
          border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.3s;
        }
        .input-group button:hover { background-color: #0056b3; }

        .board { 
          display: flex; flex-direction: row; gap: 24px; align-items: flex-start; 
          justify-content: center; overflow-x: auto; padding: 20px 10px;
        }
        
        .column { 
          background-color: #ebecf0; width: 320px; min-width: 320px; border-radius: 12px; 
          padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex-shrink: 0;
        }
        .column h3 { 
          margin: 0 0 16px 0; color: #444; text-transform: uppercase; 
          font-size: 0.9rem; letter-spacing: 1px; display: flex; justify-content: space-between;
        }
        .task-list { display: flex; flexDirection: column; gap: 12px; }
      `}</style>

      <div className="header">
        <h1>Project 17 Kanban</h1>
        <div className="input-group">
          <input 
            value={newTaskTitle} 
            onChange={e => setNewTaskTitle(e.target.value)} 
            placeholder="Что нужно сделать?"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask}>Создать</button>
        </div>
      </div>

      <div className="board">
        {columns.map((col, idx) => (
          <div key={col.id} className="column">
            <h3>
              {col.title || col.name} 
              <span style={{ color: '#888' }}>({tasks.filter(t => t.column === col.id).length})</span>
            </h3>
            
            <div className="task-list">
              {tasks
                .filter(task => task.column === col.id)
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onMove={() => moveTask(task.id, col.id)} 
                    onDelete={() => deleteTask(task.id)}
                    nextText={columns[idx + 1] ? `👉 В ${columns[idx + 1].title || columns[idx + 1].name}` : null}
                  />
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;