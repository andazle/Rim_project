import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { NavBar } from '../components/NavBar';
import {
  applyAuthHeader, fetchColumns, fetchUserTasks, isOverdue, getCurrentUser,
} from '../api';

const CHART_COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f'];

/** Демо-данные на случай, если сервер недоступен. */
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

/** Содержит ли название колонки одно из ключевых слов. */
const matches = (title, words) =>
  !!title && words.some((w) => title.toLowerCase().includes(w));

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  // '' — реальные данные, 'empty' — нет задач, 'offline' — нет сервера
  const [demoReason, setDemoReason] = useState('');

  useEffect(() => {
    const token = applyAuthHeader();
    if (!token) {
      navigate('/login');
      return;
    }

    let active = true;
    (async () => {
      try {
        const [columns, tasks] = await Promise.all([fetchColumns(), fetchUserTasks()]);
        if (!active) return;

        if (tasks.length === 0) {
          setStats(null);
          setDemoReason('empty');
          return;
        }

        const colById = new Map(columns.map((c) => [c.id, c]));
        const done = tasks.filter((t) => matches(colById.get(t.column)?.title, ['готов', 'done', 'выполн']));
        const inProgress = tasks.filter((t) => matches(colById.get(t.column)?.title, ['работ', 'progress']));
        const overdue = tasks.filter((t) => isOverdue(t) && !done.includes(t));

        const byStatus = columns.map((c) => ({
          status: c.title || c.name || '—',
          count: tasks.filter((t) => t.column === c.id).length,
        }));

        setStats({
          total: tasks.length,
          done: done.length,
          inProgress: inProgress.length,
          overdue: overdue.length,
          rate: tasks.length ? Math.round((done.length / tasks.length) * 1000) / 10 : 0,
          byStatus,
          byUser: [{ user: getCurrentUser(), count: tasks.length }],
        });
      } catch {
        if (active) { setStats(null); setDemoReason('offline'); }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [navigate]);

  const view = stats || (demoReason ? DEMO : null);

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <NavBar />
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1>Дэшборд проекта</h1>

        {loading && <p>Загрузка статистики…</p>}

        {!loading && demoReason === 'empty' && (
          <div style={{ background: '#e7f3ff', border: '1px solid #b6daff', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
            У вас пока нет задач — показаны демонстрационные данные.
            Создайте задачи на доске, чтобы увидеть реальную статистику.
          </div>
        )}
        {!loading && demoReason === 'offline' && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffe69c', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
            Сервер недоступен — показаны демонстрационные данные.
          </div>
        )}

        {!loading && view && (
          <>
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
                <h3 style={{ marginTop: 0 }}>Задачи по участникам</h3>
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
          </>
        )}
      </div>
    </div>
  );
}
