from rest_framework import viewsets, generics, permissions, status 
from rest_framework.views import APIView
from rest_framework.response import Response 
from django.contrib.auth.models import User
from .models import Project, Column, Task
from .serializers import ProjectSerializer, ColumnSerializer, TaskSerializer, RegisterSerializer 

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Project.objects.all()
    
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
    permission_classes = [permissions.AllowAny]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        return Task.objects.all()
    

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Пользователь успешно создан!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)