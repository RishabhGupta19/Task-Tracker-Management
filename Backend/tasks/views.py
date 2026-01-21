# from rest_framework import viewsets, status, serializers
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from django.db.models import Q
# from .models import Task, TaskDependency
# from .serializers import TaskSerializer, TaskDependencySerializer, TaskGraphSerializer


# class TaskViewSet(viewsets.ModelViewSet):
#     queryset = Task.objects.all()
#     serializer_class = TaskSerializer

#     def get_queryset(self):
#         queryset = Task.objects.all()
#         status_filter = self.request.query_params.get('status')
#         title_filter = self.request.query_params.get('title')

#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
#         if title_filter:
#             queryset = queryset.filter(title__icontains=title_filter)

#         return queryset

#     @action(detail=False, methods=['patch'])
#     def bulk_update_status(self, request):
#         updates = request.data.get('updates', [])
#         updated = []

#         for item in updates:
#             task_id = item.get('id')
#             new_status = item.get('status')
#             try:
#                 task = Task.objects.get(id=task_id)
#                 if new_status in dict(Task.STATUS_CHOICES):
#                     task.status = new_status
#                     task.save(update_fields=['status'])
#                     task.update_dependent_tasks()
#                     updated.append(task_id)
#             except Task.DoesNotExist:
#                 continue

#         return Response({'updated_tasks': updated})

#     @action(detail=False, methods=['post'])
#     def batch_create(self, request):
#         dependencies = request.data.get('dependencies', [])
#         created = []
#         errors = []

#         for dep in dependencies:
#             task_id = dep.get('task')
#             depends_on_id = dep.get('depends_on')
#             if task_id == depends_on_id:
#                 errors.append({'task': task_id, 'error': 'Self-dependency'})
#                 continue

#             temp_dep = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
#             if temp_dep._creates_circular_dependency():
#                 path = temp_dep.get_circular_path()
#                 errors.append({'task': task_id, 'error': 'Circular dependency', 'path': path})
#                 continue

#             temp_dep.save()
#             created.append(temp_dep.id)

#         return Response({'created': created, 'errors': errors})

    
#     # @action(detail=True, methods=['patch'])
#     # def update_status(self, request, pk=None):
#     #     """Update task status and cascade changes"""
#     #     task = self.get_object()
#     #     new_status = request.data.get('status')
        
#     #     if new_status not in dict(Task.STATUS_CHOICES):
#     #         return Response(
#     #             {'error': 'Invalid status'},
#     #             status=status.HTTP_400_BAD_REQUEST
#     #         )
        
#     #     task.status = new_status
#     #     task.save()
        
#     #     # Update dependent tasks
#     #     if new_status == 'completed':
#     #         task.update_dependent_tasks()
        
#     #     serializer = self.get_serializer(task)
#     #     return Response(serializer.data)
#     @action(detail=True, methods=['patch'])
#     def update_status(self, request, pk=None):
#         task = self.get_object()
#         new_status = request.data.get('status')

#         if new_status not in dict(Task.STATUS_CHOICES):
#             return Response(
#                 {'error': 'Invalid status'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 1️⃣ Explicit status update
#         task.status = new_status
#         task.save(update_fields=['status'])

#         # 2️⃣ ALWAYS cascade (blocked, completed, pending)
#         task.update_dependent_tasks()

#         serializer = self.get_serializer(task)
#         return Response(serializer.data)

    
#     @action(detail=True, methods=['get'])
#     def blocking(self, request, pk=None):
#         """Get tasks that are blocking this task"""
#         task = self.get_object()
#         blocking_tasks = task.get_dependencies().exclude(status='completed')
#         serializer = self.get_serializer(blocking_tasks, many=True)
#         return Response(serializer.data)
    
#     @action(detail=True, methods=['get'])
#     def blocked_by(self, request, pk=None):
#         """Get tasks that are blocked by this task"""
#         task = self.get_object()
#         blocked_tasks = task.get_dependents().filter(
#             Q(status='pending') | Q(status='blocked')
#         )
#         serializer = self.get_serializer(blocked_tasks, many=True)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['get'])
#     def graph(self, request):
#         """Get graph data for visualization"""
#         tasks = Task.objects.all()
#         dependencies = TaskDependency.objects.all()
        
#         # Create nodes
#         nodes = []
#         for task in tasks:
#             nodes.append({
#                 'id': task.id,
#                 'title': task.title,
#                 'status': task.status,
#                 'description': task.description
#             })
        
#         # Create edges
#         edges = []
#         for dep in dependencies:
#             edges.append({
#                 'id': dep.id,
#                 'from': dep.depends_on_id,
#                 'to': dep.task_id
#             })
        
#         data = {
#             'nodes': nodes,
#             'edges': edges
#         }
        
#         serializer = TaskGraphSerializer(data)
#         return Response(serializer.data)
    
#     def destroy(self, request, *args, **kwargs):
#         """Delete task and warn about affected tasks"""
#         task = self.get_object()
        
#         # Get dependent tasks
#         dependents = list(task.get_dependents().values('id', 'title'))
        
#         # Delete the task (dependencies will be cascade deleted)
#         task.delete()
        
#         return Response({
#             'message': 'Task deleted successfully',
#             'affected_tasks': dependents
#         }, status=status.HTTP_200_OK)


# class TaskDependencyViewSet(viewsets.ModelViewSet):
#     queryset = TaskDependency.objects.all()
#     serializer_class = TaskDependencySerializer
    
#     def create(self, request, *args, **kwargs):
#         """Create dependency with circular detection"""
#         serializer = self.get_serializer(data=request.data)
        
#         try:
#             serializer.is_valid(raise_exception=True)
#             self.perform_create(serializer)
#             headers = self.get_success_headers(serializer.data)
#             return Response(
#                 serializer.data,
#                 status=status.HTTP_201_CREATED,
#                 headers=headers
#             )
#         except serializers.ValidationError as e:
#             # Check if it's a circular dependency error
#             if 'path' in e.detail:
#                 return Response({
#                     'error': 'Circular dependency detected',
#                     'path': e.detail['path'],
#                     'path_titles': e.detail.get('path_titles', [])
#                 }, status=status.HTTP_400_BAD_REQUEST)
#             return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    
#     @action(detail=False, methods=['post'])
#     def check_circular(self, request):
#         """Check if a dependency would create a circular relationship"""
#         task_id = request.data.get('task_id')
#         depends_on_id = request.data.get('depends_on_id')
        
#         if not task_id or not depends_on_id:
#             return Response(
#                 {'error': 'Both task_id and depends_on_id are required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             task = Task.objects.get(id=task_id)
#             depends_on = Task.objects.get(id=depends_on_id)
#         except Task.DoesNotExist:
#             return Response(
#                 {'error': 'Task not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
        
#         # Check self-dependency
#         if task == depends_on:
#             return Response({
#                 'circular': True,
#                 'error': 'A task cannot depend on itself',
#                 'path': [task_id]
#             })
        
#         # Check circular dependency
#         temp_dep = TaskDependency(task=task, depends_on=depends_on)
#         is_circular = temp_dep._creates_circular_dependency()
        
#         if is_circular:
#             path = temp_dep.get_circular_path()
#             task_titles = [Task.objects.get(id=tid).title for tid in path] if path else []
#             return Response({
#                 'circular': True,
#                 'path': path,
#                 'path_titles': task_titles
#             })
        
#         return Response({
#             'circular': False,
#             'message': 'No circular dependency detected'
#         })
    
#     def destroy(self, request, *args, **kwargs):
#         """Delete dependency and update task statuses"""
#         dependency = self.get_object()
#         task = dependency.task
        
#         # Delete dependency
#         dependency.delete()
        
#         # Update task status
#         task.save()
        
#         return Response({
#             'message': 'Dependency deleted successfully'
#         }, status=status.HTTP_200_OK)


from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Task, TaskDependency
from .serializers import TaskSerializer, TaskDependencySerializer, TaskGraphSerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        """Filter tasks by query parameters"""
        queryset = Task.objects.all()
        status_filter = self.request.query_params.get('status')
        title_filter = self.request.query_params.get('title')

        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        if title_filter:
            queryset = queryset.filter(title__icontains=title_filter)

        return queryset

    @action(detail=False, methods=['patch'])
    def bulk_update_status(self, request):
        """Bulk update status for multiple tasks"""
        task_ids = request.data.get('task_ids', [])
        new_status = request.data.get('status')
        
        if not task_ids or not new_status:
            return Response(
                {'error': 'task_ids and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tasks = Task.objects.filter(id__in=task_ids)
        updated_tasks = []
        
        for task in tasks:
            task.status = new_status
            task.save(manual=True)  # ADD manual=True HERE!
            task.update_dependent_tasks()  # ADD THIS TO CASCADE
            updated_tasks.append(task)
        
        serializer = self.get_serializer(updated_tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update task status and cascade changes"""
        print(f"=== UPDATE STATUS CALLED FOR TASK {pk} ===")  # ADD THIS
        task = self.get_object()
        new_status = request.data.get('status')
        
        print(f"Current status: {task.status}, New status: {new_status}")  # ADD THIS

        if new_status not in dict(Task.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status
        task.save(manual=True)
        
        print(f"After save: {task.status}")  # ADD THIS
        print(f"Checking dependents...")  # ADD THIS
        
        # Get fresh data
        task.refresh_from_db()
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
        
    @action(detail=True, methods=['get'])
    def blocking(self, request, pk=None):
        """Get tasks that are blocking this task"""
        task = self.get_object()
        blocking_tasks = task.get_dependencies().exclude(status='completed')
        serializer = self.get_serializer(blocking_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def blocked_by(self, request, pk=None):
        """Get tasks that are blocked by this task"""
        task = self.get_object()
        blocked_tasks = task.get_dependents().filter(
            Q(status='pending') | Q(status='blocked')
        )
        serializer = self.get_serializer(blocked_tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def graph(self, request):
        """Get graph data for visualization"""
        tasks = Task.objects.all()
        dependencies = TaskDependency.objects.all()
        
        # Create nodes with dependencies list
        nodes = []
        for task in tasks:
            task_deps = list(task.get_dependencies().values_list('id', flat=True))
            nodes.append({
                'id': task.id,
                'title': task.title,
                'status': task.status,
                'description': task.description,
                'dependencies': task_deps
            })
        
        # Create edges
        edges = []
        for dep in dependencies:
            edges.append({
                'from': dep.depends_on_id,
                'to': dep.task_id
            })
        
        return Response({
            'nodes': nodes,
            'edges': edges
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete task and warn about affected tasks"""
        task = self.get_object()
        
        # Get dependent tasks
        dependents = list(task.get_dependents().values('id', 'title'))
        
        # Delete the task (dependencies will be cascade deleted)
        task.delete()
        
        return Response({
            'message': 'Task deleted successfully',
            'affected_tasks': dependents
        }, status=status.HTTP_200_OK)


class TaskDependencyViewSet(viewsets.ModelViewSet):
    queryset = TaskDependency.objects.all()
    serializer_class = TaskDependencySerializer
    
    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        """Create multiple dependencies at once"""
        task_id = request.data.get('task')
        depends_on_ids = request.data.get('depends_on_ids', [])
        
        if not task_id or not depends_on_ids:
            return Response(
                {'error': 'task and depends_on_ids are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        created_dependencies = []
        errors = []
        
        for depends_on_id in depends_on_ids:
            try:
                depends_on = Task.objects.get(id=depends_on_id)
                
                # Check if already exists
                if TaskDependency.objects.filter(task=task, depends_on=depends_on).exists():
                    continue
                
                # Check circular
                temp_dep = TaskDependency(task=task, depends_on=depends_on)
                if temp_dep._creates_circular_dependency():
                    errors.append({
                        'depends_on_id': depends_on_id,
                        'error': 'Would create circular dependency'
                    })
                    continue
                
                # Create dependency
                dependency = TaskDependency.objects.create(
                    task=task,
                    depends_on=depends_on
                )
                created_dependencies.append(dependency)
                
            except Task.DoesNotExist:
                errors.append({
                    'depends_on_id': depends_on_id,
                    'error': 'Task not found'
                })
        
        serializer = self.get_serializer(created_dependencies, many=True)
        return Response({
            'created': serializer.data,
            'errors': errors
        }, status=status.HTTP_201_CREATED if created_dependencies else status.HTTP_400_BAD_REQUEST)
    
    def create(self, request, *args, **kwargs):
        """Create dependency with circular detection"""
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except serializers.ValidationError as e:
            # Check if it's a circular dependency error
            if 'path' in e.detail:
                return Response({
                    'error': 'Circular dependency detected',
                    'path': e.detail['path'],
                    'path_titles': e.detail.get('path_titles', [])
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def check_circular(self, request):
        """Check if a dependency would create a circular relationship"""
        # Accept both formats: task/depends_on AND task_id/depends_on_id
        task_id = request.data.get('task') or request.data.get('task_id')
        depends_on_id = request.data.get('depends_on') or request.data.get('depends_on_id')
        
        if not task_id or not depends_on_id:
            return Response(
                {'error': 'Both task and depends_on are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            task = Task.objects.get(id=task_id)
            depends_on = Task.objects.get(id=depends_on_id)
        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check self-dependency
        if task == depends_on:
            return Response({
                'is_circular': True,
                'error': 'A task cannot depend on itself',
                'path': [task_id]
            })
        
        # Check circular dependency
        temp_dep = TaskDependency(task=task, depends_on=depends_on)
        is_circular = temp_dep._creates_circular_dependency()
        
        if is_circular:
            path = temp_dep.get_circular_path()
            task_titles = [Task.objects.get(id=tid).title for tid in path] if path else []
            return Response({
                'is_circular': True,
                'path': path,
                'path_titles': task_titles
            })
        
        return Response({
            'is_circular': False,
            'message': 'No circular dependency detected'
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete dependency and update task statuses"""
        dependency = self.get_object()
        task = dependency.task
        
        # Delete dependency
        dependency.delete()
        
        # Update task status
        task.save()
        
        return Response({
            'message': 'Dependency deleted successfully'
        }, status=status.HTTP_200_OK)