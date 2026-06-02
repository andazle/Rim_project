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
    const user = (t.description && t.description.trim()) || 'без автора';
    userCounts[user] = (userCounts[user] || 0) + 1;
  });
  const byUser = Object.entries(userCounts).map(([user, count]) => ({ user, count }));

  return {
    total: tasks.length,
    done: done.length,
    inProgress: inProgress.length,
    overdue: overdue.length,
    rate: tasks.length ? Math.round((done.length / tasks.length) * 1000) / 10 : 0,
    byStatus,
    byUser,
  };
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  // '' — реальные данные, 'empty' — нет задач, 'offline' — нет сервера
  const [demoReason, setDemoReason] = useState('');
  // Область просмотра: 'all' — все участники, 'mine' — только мои задачи
  const [scope, setScope] = useState('all');

  useEffect(() => {
    const token = applyAuthHeader();
    if (!token) {
      navigate('/login');
      return;
    }

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
      ? allTasks.filter((t) => t.description === currentUser)
      : allTasks;
    if (tasks.length === 0) return computeStats(columns, []);
    return computeStats(columns, tasks);
  }, [allTasks, columns, scope, currentUser]);

  const view = stats || (demoReason ? DEMO : null);

  const tabBtn = (active) => ({
    padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 500, background: active ? '#007bff' : '#e9ecef', color: active ? 'white' : '#333',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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
            Создайте задачи на доске, чтобы увидеть реальную статистику.
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

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
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
                <h3 style={{ marginTop: 0 }}>Распределение задач по участникам</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={view.byUser}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1976d2" name="Задачи" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
