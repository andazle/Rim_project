from django.urls import path, include
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ColumnViewSet, TaskViewSet

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Заполните все поля!'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Пользователь с таким именем уже существует.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        User.objects.create_user(username=username, password=password)
        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'columns', ColumnViewSet)
router.register(r'tasks', TaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
]