import React, { useState, useEffect } from 'react';

export const TaskCard = ({ task, onMove, onDelete, nextText, isDone }) => {
  const colors = [
    { name: 'По умолчанию', value: '#ffffff' },
    { name: 'Важно', value: '#ffcccb' },
    { name: 'В процессе', value: '#fff3cd' },
    { name: 'Обучение', value: '#d1e7dd' },
    { name: 'Идеи', value: '#cff4fc' }
  ];

  const [cardColor, setCardColor] = useState(() => {
    const savedColors = JSON.parse(localStorage.getItem('task_colors') || '{}');
    return savedColors[task.id] || '#ffffff';
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!task.deadline || isDone) return;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [task.deadline, isDone]);

  const handleColorChange = (colorValue) => {
    setCardColor(colorValue);
    const savedColors = JSON.parse(localStorage.getItem('task_colors') || '{}');
    savedColors[task.id] = colorValue;
    localStorage.setItem('task_colors', JSON.stringify(savedColors));
  };

  const hasDeadline = !!task.deadline;
  const isOverdue = hasDeadline && new Date(task.deadline).getTime() < currentTime;

  const deadlineColor = isDone ? '#198754' : (isOverdue ? '#dc3545' : '#198754');
  const deadlineText = isDone ? 'Выполнено' : (isOverdue ? 'Просрочено' : 'В процессе');

  const displayDeadline = hasDeadline
    ? `${new Date(task.deadline).toLocaleDateString()} в ${new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : null;

  return (
    <div style={{
      background: cardColor,
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      border: '1px solid #e3e6f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'background 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>{task.title}</h4>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '14px' }}
          title="Удалить задачу"
        >
          Удалить
        </button>
      </div>

      {displayDeadline && (
        <div style={{
          fontSize: '12px',
          color: deadlineColor,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: deadlineColor,
            display: 'inline-block',
            transition: 'background-color 0.5s ease'
          }} />
          Дедлайн: {displayDeadline} ({deadlineText})
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginTop: '5px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#888' }}>Цвет:</span>
        {colors.map((c) => (
          <button
            key={c.value}
            onClick={() => handleColorChange(c.value)}
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: c.value,
              border: cardColor === c.value ? '2px solid #4e73df' : '1px solid #ccc',
              cursor: 'pointer',
              padding: 0
            }}
            title={c.name}
          />
        ))}
      </div>

      {nextText && (
        <button
          onClick={onMove}
          style={{
            marginTop: '5px',
            padding: '6px 12px',
            background: '#4e73df',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            alignSelf: 'flex-end'
          }}
        >
          {nextText}
        </button>
      )}
    </div>
  );
};