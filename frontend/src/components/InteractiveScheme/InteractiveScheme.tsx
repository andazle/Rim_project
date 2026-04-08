import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface TaskMarker {
  id: string;
  x: number;
  y: number;
  title: string;
  taskId?: number;
  description?: string;
}

interface InteractiveSchemeProps {
  projectId: number;
  tasks: Array<{ id: number; title: string; description?: string }>;
  onSaveMarkers: (markers: TaskMarker[]) => void;
  initialMarkers?: TaskMarker[];
}

export const InteractiveScheme: React.FC<InteractiveSchemeProps> = ({
  projectId,
  tasks,
  onSaveMarkers,
  initialMarkers = [],
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<TaskMarker[]>(initialMarkers);
  const [selectedMarker, setSelectedMarker] = useState<TaskMarker | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const imageRef = useRef<HTMLImageElement>(null);

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      showNotification('Изображение загружено', 'success');
    };
    reader.onerror = () => {
      showNotification('Ошибка загрузки изображения', 'error');
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] },
    maxFiles: 1,
  });

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setNewMarkerPos({ x, y });
    setSelectedTaskId(null);
    setCustomTitle('');
    setCustomDescription('');
    setDialogOpen(true);
  };

  const addMarker = () => {
    if (!newMarkerPos) return;

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const newMarker: TaskMarker = {
      id: Date.now().toString(),
      x: newMarkerPos.x,
      y: newMarkerPos.y,
      title: selectedTask?.title || customTitle || 'Новая задача',
      description: selectedTask?.description || customDescription,
      taskId: selectedTaskId || undefined,
    };

    if (selectedMarker) {
      setMarkers(markers.map(m => m.id === selectedMarker.id ? newMarker : m));
      showNotification('Метка обновлена', 'success');
    } else {
      setMarkers([...markers, newMarker]);
      showNotification('Метка добавлена', 'success');
    }
    setDialogOpen(false);
    setNewMarkerPos(null);
    setSelectedMarker(null);
  };

  const editMarker = (marker: TaskMarker) => {
    setSelectedMarker(marker);
    setNewMarkerPos({ x: marker.x, y: marker.y });
    setSelectedTaskId(marker.taskId || null);
    setCustomTitle(marker.title);
    setCustomDescription(marker.description || '');
    setDialogOpen(true);
  };

  const deleteMarker = (markerId: string) => {
    const markerToDelete = markers.find(m => m.id === markerId);
    setMarkers(markers.filter(m => m.id !== markerId));
    showNotification(`Метка "${markerToDelete?.title}" удалена`, 'info');
  };

  const saveMarkers = () => {
    try {
      onSaveMarkers(markers);
      showNotification(`Схема сохранена! Сохранено ${markers.length} меток`, 'success');
    } catch (error) {
      showNotification('Ошибка при сохранении схемы', 'error');
    }
  };

  const clearImage = () => {
    setImage(null);
    setMarkers([]);
    showNotification('Изображение удалено', 'info');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Интерактивная схема проекта
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Загрузите изображение схемы и расставьте метки задач
      </Typography>

      {!image ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : '#ccc',
            borderRadius: 2,
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Отпустите файл для загрузки' : 'Перетащите изображение сюда'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            или нажмите для выбора файла
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={saveMarkers} startIcon={<SaveIcon />}>
              Сохранить схему
            </Button>
            <Button variant="outlined" onClick={clearImage} startIcon={<UploadIcon />}>
              Заменить схему
            </Button>
            <Typography variant="body2" sx={{ ml: 'auto', alignSelf: 'center' }}>
              Всего меток: {markers.length}
            </Typography>
          </Paper>

          <Box sx={{ position: 'relative', display: 'inline-block', width: '100%', overflowX: 'auto' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                ref={imageRef}
                src={image}
                alt="Project scheme"
                onClick={handleImageClick}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  cursor: 'crosshair',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                }}
              />
              {markers.map((marker) => (
                <Box
                  key={marker.id}
                  sx={{
                    position: 'absolute',
                    left: `${(marker.x / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    top: `${(marker.y / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 10,
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: 2,
                      '&:hover': { transform: 'scale(1.2)', bgcolor: 'primary.dark' },
                    }}
                    onClick={() => editMarker(marker)}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: 28,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      p: 0.5,
                      px: 1,
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                      fontSize: '11px',
                    }}
                  >
                    {marker.title.length > 20 ? marker.title.slice(0, 20) + '...' : marker.title}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMarker(marker.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                      width: 20,
                      height: 20,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
            </div>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`${markers.length} меток задач`} color="primary" variant="outlined" />
              <Chip label="Кликните на изображение для добавления метки" size="small" />
              <Chip label="Кликните на метку для редактирования" size="small" />
            </Stack>
          </Box>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMarker ? 'Редактировать метку' : 'Добавить метку задачи'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Выберите существующую задачу"
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(Number(e.target.value) || null)}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">-- Создать новую задачу --</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </TextField>
            
            <Typography variant="body2" align="center" sx={{ my: 1 }}>
              — или —
            </Typography>
            
            <TextField
              fullWidth
              label="Название задачи"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              margin="normal"
              placeholder="Введите название новой задачи"
            />
            
            <TextField
              fullWidth
              label="Описание"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={addMarker} 
            variant="contained" 
            disabled={!customTitle && !selectedTaskId}
          >
            {selectedMarker ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Уведомления Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InteractiveScheme;
