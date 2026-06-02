import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { NavBar } from '../components/NavBar';
import {
  applyAuthHeader, fetchColumns, fetchTasks, isOverdue, getCurrentUser,
} from '../api';

const CHART_COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f'];
const CATEGORY_COLORS = {
  '#ffffff': 'По умолчанию',
  '#ffcccb': 'Важно',
  '#fff3cd': 'В процессе',
  '#d1e7dd': 'Обучение',
  '#cff4fc': 'Идеи'
};

const DEMO = {
  total: 35, done: 15, inProgress: 8, overdue: 4, rate: 42.9,
  byStatus: [
    { status: 'Нужно сделать', count: 12 },
    { status: 'В работе', count: 8 },
    { status: 'Готово', count: 15 },
  ],
  byUser: [
    { user: 'Максим', count: 12 },
    { user: 'Мария', count: 10 },
    { user: 'Андрей', count: 13 },
  ],
  byColor: [
    { name: 'По умолчанию', count: 20, fill: '#ffffff' },
    { name: 'Важно', count: 5, fill: '#ffcccb' },
    { name: 'В процессе', count: 4, fill: '#fff3cd' },
    { name: 'Обучение', count: 4, fill: '#d1e7dd' },
    { name: 'Идеи', count: 2, fill: '#cff4fc' },
  ]
};

const card = (bg) => ({
  background: bg, borderRadius: '12px', padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flex: '1 1 200px',
});

const matches = (title, words) =>
  !!title && words.some((w) => title.toLowerCase().includes(w));

const computeStats = (columns, tasks) => {
  const colById = new Map(columns.map((c) => [c.id, c]));
  const done = tasks.filter((t) => matches(colById.get(t.column)?.title, ['готов', 'done', 'выполн']));
  const inProgress = tasks.filter((t) => matches(colById.get(t.column)?.title, ['работ', 'progress']));
  const overdue = tasks.filter((t) => isOverdue(t) && !done.includes(t));

  const statusCounts = {};
  tasks.forEach((t) => {
    const status = colById.get(t.column)?.title || '—';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  const userCounts = {};
  tasks.forEach((t) => {
    let user = (t.description && t.description.trim()) || 'без автора';
    if (user.includes('|')) {
      user = user.split('|')[0].trim();
    }
    userCounts[user] = (userCounts[user] || 0) + 1;
  });
  const byUser = Object.entries(userCounts).map(([user, count]) => ({ user, count }));

  const savedColors = JSON.parse(localStorage.getItem('task_colors') || '{}');
  const colorCounts = { '#ffffff': 0, '#ffcccb': 0, '#fff3cd': 0, '#d1e7dd': 0, '#cff4fc': 0 };

  tasks.forEach((t) => {
    const color = savedColors[t.id] || '#ffffff';
    if (colorCounts[color] !== undefined) {
      colorCounts[color]++;
    } else {
      colorCounts['#ffffff']++;
    }
  });

  const byColor = Object.entries(colorCounts).map(([colorHex, count]) => ({
    name: CATEGORY_COLORS[colorHex],
    count,
    fill: colorHex
  })).filter(c => c.count > 0);

  return {
    total: tasks.length,
    done: done.length,
    inProgress: inProgress.length,
    overdue: overdue.length,
    rate: tasks.length ? Math.round((done.length / tasks.length) * 1000) / 10 : 0,
    byStatus,
    byUser,
    byColor,
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoReason, setDemoReason] = useState('');
  const [scope, setScope] = useState('all');
  const [timeLogs, setTimeLogs] = useState([]);

  useEffect(() => {
    const token = applyAuthHeader();
    if (!token) {
      navigate('/login');
      return;
    }

    const logs = JSON.parse(localStorage.getItem('task_time_logs') || '[]');
    setTimeLogs(logs);

    let active = true;
    (async () => {
      try {
        const [cols, tasks] = await Promise.all([fetchColumns(), fetchTasks()]);
        if (!active) return;
        setColumns(cols);
        setAllTasks(tasks);
        if (tasks.length === 0) setDemoReason('empty');
      } catch {
        if (active) setDemoReason('offline');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [navigate]);

  const currentUser = getCurrentUser();

  const stats = useMemo(() => {
    if (allTasks.length === 0) return null;
    const tasks = scope === 'mine'
      ? allTasks.filter((t) => t.description && t.description.startsWith(currentUser))
      : allTasks;
    if (tasks.length === 0) return computeStats(columns, []);
    return computeStats(columns, tasks);
  }, [allTasks, columns, scope, currentUser]);

  const view = stats || (demoReason ? DEMO : null);

  const tabBtn = (active) => ({
    padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 500, background: active ? '#007bff' : '#e9ecef', color: active ? 'white' : '#333',
  });

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} в ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  const handleClearLogs = () => {
    if (window.confirm("Очистить всю историю анализа времени?")) {
      localStorage.removeItem('task_time_logs');
      setTimeLogs([]);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>
      <NavBar />
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>Дэшборд проекта</h1>
          {!demoReason && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={tabBtn(scope === 'all')} onClick={() => setScope('all')}>Все участники</button>
              <button style={tabBtn(scope === 'mine')} onClick={() => setScope('mine')}>Только мои</button>
            </div>
          )}
        </div>

        {loading && <p>Загрузка статистики…</p>}

        {!loading && demoReason === 'empty' && (
          <div style={{ background: '#e7f3ff', border: '1px solid #b6daff', borderRadius: '8px', padding: '14px', margin: '16px 0' }}>
            В проекте пока нет задач — показаны демонстрационные данные.
            Создайте задачи на доске и подвигайте их, чтобы увидеть реальную статистику.
          </div>
        )}
        {!loading && demoReason === 'offline' && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffe69c', borderRadius: '8px', padding: '14px', margin: '16px 0' }}>
            Сервер недоступен — показаны демонстрационные данные.
          </div>
        )}

        {!loading && view && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={card('#e3f2fd')}>
                <div style={{ color: '#666' }}>Всего задач</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{view.total}</div>
              </div>
              <div style={card('#e8f5e9')}>
                <div style={{ color: '#666' }}>Выполнено</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2e7d32' }}>{view.done}</div>
              </div>
              <div style={card('#fff3e0')}>
                <div style={{ color: '#666' }}>В работе</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1976d2' }}>{view.inProgress}</div>
              </div>
              <div style={card('#ffebee')}>
                <div style={{ color: '#666' }}>Просрочено</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#d32f2f' }}>{view.overdue}</div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginTop: 0 }}>Общий прогресс: {view.rate}%</h3>
              <div style={{ background: '#e0e0e0', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${view.rate}%`, background: '#2e7d32', height: '100%' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', flex: '1 1 400px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ marginTop: 0 }}>Распределение задач по статусам</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={view.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                      {view.byStatus.map((e, i) => (
                        <Cell key={e.status} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', flex: '1 1 400px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ marginTop: 0 }}>Распределение по категориям (Цветам)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={view.byColor || DEMO.byColor}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" name="Количество задач">
                      {(view.byColor || DEMO.byColor).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill === '#ffffff' ? '#b0bec5' : entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginTop: 0 }}>Нагрузка на участников проекта</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={view.byUser}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#9c27b0" name="Задачи" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Аналитика времени и Аудит перемещений</h3>
                {timeLogs.length > 0 && (
                  <button onClick={handleClearLogs} style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    Очистить историю
                  </button>
                )}
              </div>

              {timeLogs.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>Логи перемещения пусты. Подвигайте карточки кнопкой «Далее» на доске, чтобы запустить отслеживание времени.</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <th style={{ padding: '10px' }}>Задача</th>
                        <th style={{ padding: '10px' }}>Откуда</th>
                        <th style={{ padding: '10px' }}>Куда</th>
                        <th style={{ padding: '10px' }}>Когда перемещена</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeLogs.map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{log.taskTitle}</td>
                          <td style={{ padding: '10px' }}><span style={{ background: '#f1f3f5', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{log.fromColumn}</span></td>
                          <td style={{ padding: '10px' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{log.toColumn}</span></td>
                          <td style={{ padding: '10px', color: '#666' }}>{formatDate(log.movedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}