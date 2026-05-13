from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ColumnViewSet, TaskViewSet, RegisterView   # ← импорт RegisterView

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'columns', ColumnViewSet)
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api/v1/register/', RegisterView.as_view(), name='register'),   # ← эндпоинт здесь
]