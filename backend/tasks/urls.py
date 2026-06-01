from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ColumnViewSet, TaskViewSet, RegisterView 

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'columns', ColumnViewSet)
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('', include(router.urls)), 
    path('register/', RegisterView.as_view(), name='register'),
]