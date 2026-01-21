from django.db import models
from django.core.exceptions import ValidationError


# class Task(models.Model):
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('in_progress', 'In Progress'),
#         ('completed', 'Completed'),
#         ('blocked', 'Blocked'),
#     ]
    
#     title = models.CharField(max_length=255)
#     description = models.TextField(blank=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return self.title
    
#     def get_dependencies(self):
#         """Get all tasks that this task depends on"""
#         return Task.objects.filter(
#             dependents__task=self
#         ).distinct()
    
#     def get_dependents(self):
#         """Get all tasks that depend on this task"""
#         return Task.objects.filter(
#             dependencies__depends_on=self
#         ).distinct()
    
#     # def update_status_based_on_dependencies(self):
#     #     """Auto-update task status based on dependencies"""
#     #     dependencies = self.get_dependencies()

#     #     if not dependencies.exists():
#     #         # No dependencies: if not completed, it's ready to start
#     #         return 'in_progress' if self.status != 'completed' else 'completed'

#     #     if dependencies.filter(status='blocked').exists():
#     #         return 'blocked'

#     #     if dependencies.filter(status='completed').count() == dependencies.count():
#     #         return 'in_progress' if self.status != 'completed' else 'completed'

#     #     return 'pending' if self.status != 'completed' else 'completed'
    
#     def update_status_based_on_dependencies(self):
#         dependencies = self.get_dependencies()

#         # If manually blocked or completed → DO NOT override
#         if self.status in ['blocked', 'completed']:
#             return self.status

#         if not dependencies.exists():
#             return 'in_progress'

#         if dependencies.filter(status='blocked').exists():
#             return 'blocked'

#         if dependencies.filter(status='completed').count() == dependencies.count():
#             return 'in_progress'

#         return 'pending'


    
#     def update_dependent_tasks(self):
#         """Update all tasks that depend on this task"""
#         dependents = self.get_dependents()
#         for dependent in dependents:
#             new_status = dependent.update_status_based_on_dependencies()
#             if dependent.status != new_status:
#                 dependent.status = new_status
#                 # Use manual=False to allow auto-calculation but still cascade
#                 dependent.save(manual=False)

#     def save(self, *args, **kwargs):
#         manual_update = kwargs.pop("manual", False)
        
#         # Store old status to detect changes
#         old_status = None
#         if self.pk:
#             try:
#                 old_status = Task.objects.get(pk=self.pk).status
#             except Task.DoesNotExist:
#                 pass

#         # Only auto-calc status when NOT a manual update
#         if self.pk and not manual_update:
#             new_status = self.update_status_based_on_dependencies()
#             self.status = new_status

#         super().save(*args, **kwargs)

#         # Cascade when status changes in ways that affect dependents:
#         # 1. Becoming 'completed' - dependents can now progress
#         # 2. Becoming 'blocked' - dependents should be blocked
#         # 3. Leaving 'blocked' - dependents need to recalculate
#         # 4. Leaving 'completed' - dependents need to recalculate (edge case)
#         status_changed = old_status != self.status
        
#         affects_dependents = (
#             status_changed and (
#                 self.status in ['completed', 'blocked'] or  # New blocking states
#                 old_status in ['completed', 'blocked']      # Leaving blocking states
#             )
#         )
        
#         if affects_dependents:
#             self.update_dependent_tasks()

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('blocked', 'Blocked'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_dependencies(self):
        """Get all tasks that this task depends on"""
        return Task.objects.filter(
            dependents__task=self
        ).distinct()
    
    def get_dependents(self):
        """Get all tasks that depend on this task"""
        return Task.objects.filter(
            dependencies__depends_on=self
        ).distinct()
    
    def update_status_based_on_dependencies(self):
        dependencies = self.get_dependencies()

        # Only protect completed tasks from auto-update
        if self.status == 'completed':
            return self.status

        if not dependencies.exists():
            return 'in_progress'

        if dependencies.filter(status='blocked').exists():
            return 'blocked'

        if dependencies.filter(status='completed').count() == dependencies.count():
            return 'in_progress'

        return 'pending'
    
    def update_dependent_tasks(self):
        """Update all tasks that depend on this task"""
        dependents = self.get_dependents()
        for dependent in dependents:
            new_status = dependent.update_status_based_on_dependencies()
            if dependent.status != new_status:
                dependent.status = new_status
                # Don't pass manual=True here, so it cascades further
                dependent.save()
    
    def save(self, *args, **kwargs):
        manual_update = kwargs.pop("manual", False)
        
        # Store old status BEFORE any changes
        old_status = None
        if self.pk:
            try:
                old_status = Task.objects.get(pk=self.pk).status
            except Task.DoesNotExist:
                pass

        # Only auto-calc status when NOT a manual update
        if self.pk and not manual_update:
            new_status = self.update_status_based_on_dependencies()
            self.status = new_status

        # Save the task
        super().save(*args, **kwargs)

        # Determine if we should cascade
        status_changed = old_status is not None and old_status != self.status
        
        # Cascade when:
        # 1. Status changed AND
        # 2. Either entering or leaving a blocking state (completed/blocked)
        should_cascade = status_changed and (
            self.status in ['completed', 'blocked'] or 
            old_status in ['completed', 'blocked']
        )
        
        if should_cascade:
            print(f"Cascading from {self.title}: {old_status} → {self.status}")  # Debug
            self.update_dependent_tasks()




class TaskDependency(models.Model):
    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='dependencies'
    )
    depends_on = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE, 
        related_name='dependents'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('task', 'depends_on')
        verbose_name_plural = 'Task Dependencies'
    
    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"
    
    def clean(self):
        # Prevent self-dependency
        if self.task == self.depends_on:
            raise ValidationError("A task cannot depend on itself")
        
        # Check for circular dependency
        if self._creates_circular_dependency():
            raise ValidationError("This dependency creates a circular relationship")
    
    # def _creates_circular_dependency(self):
    #     """Check if adding this dependency creates a cycle using DFS"""
    #     visited = set()
    #     path = set()
        
    #     def has_cycle(task_id):
    #         if task_id in path:
    #             return True
    #         if task_id in visited:
    #             return False
            
    #         visited.add(task_id)
    #         path.add(task_id)
            
    #         # Get all dependencies of this task
    #         dependencies = TaskDependency.objects.filter(task_id=task_id)
    #         for dep in dependencies:
    #             # Skip the dependency we're trying to add
    #             if dep.task_id == self.task_id and dep.depends_on_id == self.depends_on_id:
    #                 continue
    #             if has_cycle(dep.depends_on_id):
    #                 return True
            
    #         path.remove(task_id)
    #         return False
        
    #     # Start DFS from the depends_on task
    #     return has_cycle(self.depends_on_id)
    
    def _creates_circular_dependency(self):
        """
        Check if adding (task -> depends_on) creates a cycle.
        We must check if depends_on can already reach task
        following existing dependency edges.
        """
        # Preload dependencies into adjacency list for efficiency
        all_deps = {}
        for dep in TaskDependency.objects.all():
            all_deps.setdefault(dep.task_id, []).append(dep.depends_on_id)

        visited = set()

        def dfs(current_task_id):
            if current_task_id == self.task_id:
                return True
            if current_task_id in visited:
                return False
            visited.add(current_task_id)

            for dep_id in all_deps.get(current_task_id, []):
                if dfs(dep_id):
                    return True
            return False

        return dfs(self.depends_on_id)


    #  def get_circular_path(self):
    #     """Find and return the circular dependency path if exists"""
    #     visited = {}
    #     path = []
        
    #     def find_cycle(task_id, current_path):
    #         if task_id in current_path:
    #             # Found cycle, return path from cycle start
    #             cycle_start = current_path.index(task_id)
    #             return current_path[cycle_start:] + [task_id]
            
    #         if task_id in visited:
    #             return None
            
    #         visited[task_id] = True
    #         current_path.append(task_id)
            
    #         dependencies = TaskDependency.objects.filter(task_id=task_id)
    #         for dep in dependencies:
    #             if dep.task_id == self.task_id and dep.depends_on_id == self.depends_on_id:
    #                 continue
                
    #             result = find_cycle(dep.depends_on_id, current_path[:])
    #             if result:
    #                 return result
            
    #         return None
        
    #     return find_cycle(self.depends_on_id, [])
    def get_circular_path(self):
        """
        Return the circular dependency path if adding (task -> depends_on)
        creates a cycle. Otherwise return None.
        """
        # Preload dependencies into adjacency list
        all_deps = {}
        for dep in TaskDependency.objects.all():
            all_deps.setdefault(dep.task_id, []).append(dep.depends_on_id)

        path = []
        stack = set()  # tracks nodes in current recursion stack

        def dfs(current_task_id):
            path.append(current_task_id)
            stack.add(current_task_id)

            if current_task_id == self.task_id and len(path) > 1:
                return path.copy()

            for dep_id in all_deps.get(current_task_id, []):
                if dep_id not in stack:  # only avoid revisiting current recursion stack
                    result = dfs(dep_id)
                    if result:
                        return result

            # backtrack
            stack.remove(current_task_id)
            path.pop()
            return None

        return dfs(self.depends_on_id)


    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update task status after adding dependency
        self.task.save()