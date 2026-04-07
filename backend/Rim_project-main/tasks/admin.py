from django.contrib import admin
from .models import Project, Column, Task

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at') 

@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'order')

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'column', 'deadline')