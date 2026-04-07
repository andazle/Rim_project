import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // ДЕМО-ДАННЫЕ
  const tasksByStatus = [
    { status: 'To Do', count: 12 },
    { status: 'In Progress', count: 8 },
    { status: 'Done', count: 15 },
  ];

  const planVsActual = [
    { date: 'Пн', planned: 5, actual: 4 },
    { date: 'Вт', planned: 5, actual: 5 },
    { date: 'Ср', planned: 5, actual: 3 },
    { date: 'Чт', planned: 5, actual: 6 },
    { date: 'Пт', planned: 5, actual: 7 },
    { date: 'Сб', planned: 3, actual: 4 },
    { date: 'Вс', planned: 2, actual: 2 },
  ];

  const tasksByUser = [
    { user: 'Анна', tasks: 8 },
    { user: 'Макс', tasks: 12 },
    { user: 'Ольга', tasks: 6 },
    { user: 'Иван', tasks: 9 },
  ];

  const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02'];
  const totalTasks = 35;
  const completedTasks = 15;
  const completionRate = (completedTasks / totalTasks * 100).toFixed(1);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Дашборд проекта "Rim Project"</Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary">Всего задач</Typography>
              <Typography variant="h3">{totalTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary">Выполнено</Typography>
              <Typography variant="h3" color="success.main">{completedTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary">В работе</Typography>
              <Typography variant="h3" color="primary.main">8</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="textSecondary">Просрочено</Typography>
              <Typography variant="h3" color="error.main">4</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Общий прогресс: {completionRate}%
          </Typography>
          <Box sx={{ width: '100%', bgcolor: '#e0e0e0', borderRadius: 1, height: 10 }}>
            <Box sx={{ width: `${completionRate}%`, bgcolor: '#2e7d32', borderRadius: 1, height: 10 }} />
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Распределение задач по статусам</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={tasksByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Загрузка участников</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tasksByUser}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>План vs Факт выполнения задач</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={planVsActual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="planned" stroke="#1976d2" name="План" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="#2e7d32" name="Факт" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
