import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import {
  applyAuthHeader, fetchUserTasks, saveTaskPosition, clearTaskPosition,
} from '../api';

/**
 * Интерактивная схема проекта.
 * Пользователь загружает изображение схемы и расставляет на нём метки задач.
 * Координаты меток хранятся в долях размера изображения (0..1) в полях
 * x_pos / y_pos задачи, поэтому метки корректно отображаются на любом экране.
 */
export default function SchemePage() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [markers, setMarkers] = useState([]); // { taskId, x, y, title }
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Диалог привязки задачи к выбранной точке
  const [pendingPos, setPendingPos] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const fileInputRef = useRef(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    const token = applyAuthHeader();
    if (!token) {
      navigate('/login');
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await fetchUserTasks();
        if (!active) return;
        setTasks(data);
        // Восстанавливаем ранее сохранённые метки из координат задач
        setMarkers(
          data
            .filter((t) => t.x_pos != null && t.y_pos != null)
            .map((t) => ({ taskId: t.id, x: t.x_pos, y: t.y_pos, title: t.title }))
        );
      } catch {
        notify('Не удалось загрузить задачи');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImage(ev.target.result); notify('Изображение загружено'); };
    reader.readAsDataURL(file);
  };

  // Клик по изображению -> относительные координаты (0..1)
  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPendingPos({ x, y });
    setSelectedTaskId('');
  };

  const availableTasks = tasks.filter(
    (t) => !markers.some((m) => m.taskId === t.id)
  );

  const confirmMarker = async () => {
    if (!pendingPos || selectedTaskId === '') return;
    const task = tasks.find((t) => t.id === Number(selectedTaskId));
    if (!task) return;
    try {
      await saveTaskPosition(task.id, pendingPos.x, pendingPos.y);
      setMarkers((prev) => [
        ...prev.filter((m) => m.taskId !== task.id),
        { taskId: task.id, x: pendingPos.x, y: pendingPos.y, title: task.title },
      ]);
      notify('Метка сохранена');
      setPendingPos(null);
      setSelectedTaskId('');
    } catch {
      notify('Ошибка сохранения метки');
    }
  };

  const removeMarker = async (taskId) => {
    try {
      await clearTaskPosition(taskId);
      setMarkers((prev) => prev.filter((m) => m.taskId !== taskId));
      notify('Метка удалена');
    } catch {
      notify('Ошибка удаления метки');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <NavBar />
      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1>Интерактивная схема проекта</h1>
        <p style={{ color: '#666' }}>
          Загрузите изображение схемы и расставьте метки задач кликом по нему.
        </p>

        {loading && <p>Загрузка…</p>}

        {!loading && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: 'none' }}
            />

            {!image ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #b0b0b0', borderRadius: '12px', padding: '60px',
                  textAlign: 'center', cursor: 'pointer', background: 'white', color: '#666',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
                <div style={{ fontSize: '18px', fontWeight: 500 }}>Нажмите, чтобы загрузить изображение схемы</div>
                <div style={{ fontSize: '14px', marginTop: '6px' }}>PNG, JPG, SVG</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                  <button
                    onClick={() => { setImage(null); fileInputRef.current.value = ''; }}
                    style={{ padding: '8px 16px', background: '#f0f2f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Заменить схему
                  </button>
                  <span style={{ color: '#666' }}>Меток: {markers.length}</span>
                </div>

                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={image}
                    alt="Схема проекта"
                    onClick={handleImageClick}
                    style={{ maxWidth: '100%', display: 'block', borderRadius: '8px', border: '1px solid #ddd', cursor: 'crosshair' }}
                  />
                  {markers.map((m) => (
                    <div
                      key={m.taskId}
                      style={{
                        position: 'absolute', left: `${m.x * 100}%`, top: `${m.y * 100}%`,
                        transform: 'translate(-50%, -50%)', zIndex: 5,
                      }}
                    >
                      <div
                        title={m.title}
                        style={{
                          width: '22px', height: '22px', background: '#007bff',
                          border: '2px solid white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        }}
                      />
                      <div style={{
                        position: 'absolute', top: '26px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: '11px',
                        padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap',
                      }}>
                        {m.title.length > 20 ? m.title.slice(0, 20) + '…' : m.title}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeMarker(m.taskId); }}
                        style={{
                          position: 'absolute', top: '-10px', right: '-10px', width: '18px', height: '18px',
                          background: '#dc3545', color: 'white', border: 'none', borderRadius: '50%',
                          cursor: 'pointer', fontSize: '11px', lineHeight: '16px', padding: 0,
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Диалог выбора задачи для новой метки */}
            {pendingPos && (
              <div
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}
                onClick={() => setPendingPos(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '360px' }}
                >
                  <h3 style={{ marginTop: 0 }}>Привязать задачу к точке</h3>
                  {availableTasks.length === 0 ? (
                    <p style={{ color: '#888' }}>Нет свободных задач. Создайте задачи на доске.</p>
                  ) : (
                    <select
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '16px' }}
                    >
                      <option value="">— выберите задачу —</option>
                      {availableTasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setPendingPos(null)}
                      style={{ padding: '8px 16px', background: '#f0f2f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}
                    >Отмена</button>
                    <button
                      onClick={confirmMarker}
                      disabled={selectedTaskId === ''}
                      style={{
                        padding: '8px 16px', background: selectedTaskId === '' ? '#9bbce0' : '#007bff',
                        color: 'white', border: 'none', borderRadius: '8px',
                        cursor: selectedTaskId === '' ? 'not-allowed' : 'pointer',
                      }}
                    >Добавить</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {toast && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', background: '#323232', color: 'white',
            padding: '12px 20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', zIndex: 2000,
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
