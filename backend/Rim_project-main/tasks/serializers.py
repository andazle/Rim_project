from rest_framework import serializers
from .models import Project, Column, Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'  # Берем все поля из модели

class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True) # Вкладываем задачи внутрь колонок

    class Meta:
        model = Column
        fields = ['id', 'title', 'order', 'project', 'tasks']

class ProjectSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True) # Вкладываем колонки в проект

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'owner', 'created_at', 'columns']