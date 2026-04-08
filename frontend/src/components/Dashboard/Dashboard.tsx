import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardProps {
  projectId: number;
}

// Демо-данные с именами Максим, Мария, Андрей
const demoStats = {
  totalTasks: 35,
  completedTasks: 15,
  inProgressTasks: 8,
  overdueTasks: 4,
  completionRate: 42.9,
  tasksByStatus: [
    { status: 'To Do', count: 12 },
    { status: 'In Progress', count: 8 },
    { status: 'Done', count: 15 },
  ],
  tasksByUser: [
    { user: 'Максим', count: 12 },
    { user: 'Мария', count: 10 },
    { user: 'Андрей', count: 13 },
  ],
  planVsActual: [
    { date: 'Пн', planned: 5, actual: 4 },
    { date: 'Вт', planned: 5, actual: 5 },
    { date: 'Ср', planned: 5, actual: 3 },
    { date: 'Чт', planned: 5, actual: 6 },
    { date: 'Пт', planned: 5, actual: 7 },
    { date: 'Сб', planned: 3, actual: 4 },
    { date: 'Вс', planned: 2, actual: 2 },
  ],
};

export const Dashboard: React.FC<DashboardProps> = () => {
  const stats = demoStats;

  const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Дашборд проекта
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего задач
              </Typography>
              <Typography variant="h3">{stats.totalTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Выполнено
              </Typography>
              <Typography variant="h3" color="success.main">
                {stats.completedTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                В работе
              </Typography>
              <Typography variant="h3" color="primary.main">
                {stats.inProgressTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: '#ffebee' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Просрочено
              </Typography>
              <Typography variant="h3" color="error.main">
                {stats.overdueTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Общий прогресс: {stats.completionRate}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={stats.completionRate}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статус задач
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.tasksByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.tasksByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Участники
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.tasksByUser}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="user" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" name="Задачи" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                План/Факт выполнения задач
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.planVsActual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" fill="#1976d2" name="План" />
                  <Bar dataKey="actual" fill="#2e7d32" name="Факт" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
