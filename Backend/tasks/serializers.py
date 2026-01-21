from rest_framework import serializers
from .models import Task, TaskDependency


class TaskSerializer(serializers.ModelSerializer):
    dependencies = serializers.SerializerMethodField()
    dependents = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'status', 'created_at', 'updated_at', 'dependencies', 'dependents']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_dependencies(self, obj):
        """Get list of task IDs that this task depends on"""
        return list(obj.get_dependencies().values_list('id', flat=True))
    
    def get_dependents(self, obj):
        """Get list of task IDs that depend on this task"""
        return list(obj.get_dependents().values_list('id', flat=True))


class TaskDependencySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    depends_on_title = serializers.CharField(source='depends_on.title', read_only=True)
    
    class Meta:
        model = TaskDependency
        fields = ['id', 'task', 'task_title', 'depends_on', 'depends_on_title', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        task = data.get('task')
        depends_on = data.get('depends_on')
        
        # Check self-dependency
        if task == depends_on:
            raise serializers.ValidationError({
                "depends_on": "A task cannot depend on itself"
            })
        
        # Check if dependency already exists
        if TaskDependency.objects.filter(task=task, depends_on=depends_on).exists():
            raise serializers.ValidationError({
                "depends_on": "This dependency already exists"
            })
        
        # Create temporary object to check circular dependency
        temp_dep = TaskDependency(task=task, depends_on=depends_on)
        if temp_dep._creates_circular_dependency():
            path = temp_dep.get_circular_path()
            if path:
                task_titles = [Task.objects.get(id=tid).title for tid in path]
                raise serializers.ValidationError({
                    "error": "Circular dependency detected",
                    "path": path,
                    "path_titles": task_titles
                })
            raise serializers.ValidationError({
                "depends_on": "This dependency creates a circular relationship"
            })
        
        return data


class TaskGraphSerializer(serializers.Serializer):
    """Serializer for graph visualization data"""
    nodes = serializers.ListField(child=serializers.DictField())
    edges = serializers.ListField(child=serializers.DictField())