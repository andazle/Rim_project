from rest_framework import permissions
from rest_framework import viewsets, permissions
from .models import Project, Column, Task
from .serializers import ProjectSerializer, ColumnSerializer, TaskSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ColumnViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer
    def get_queryset(self):
        return Column.objects.all()

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes =[permissions.AllowAny]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    def get_queryset(self):
        return Task.objects.all()