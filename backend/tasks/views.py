from rest_framework import viewsets, generics, permissions
from django.contrib.auth.models import User
from .models import Project, Column, Task
from .serializers import ProjectSerializer, ColumnSerializer, TaskSerializer, RegisterSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            owner=self.request.user
        ).prefetch_related('columns', 'columns__tasks')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ColumnViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Column.objects.prefetch_related('tasks').all()
    serializer_class = ColumnSerializer

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer