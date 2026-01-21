from django.contrib import admin
from .models import Task, TaskDependency


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'created_at', 'updated_at']
    list_editable = ['status']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Task Information', {
            'fields': ('title', 'description', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'depends_on', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'depends_on__title']
    readonly_fields = ['created_at']
    
    autocomplete_fields = ['task', 'depends_on']