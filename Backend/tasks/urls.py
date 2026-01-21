from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskDependencyViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'dependencies', TaskDependencyViewSet, basename='dependency')

urlpatterns = [
    path('', include(router.urls)),
]