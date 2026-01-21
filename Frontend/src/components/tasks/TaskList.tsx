import { useState, useMemo } from 'react';
import type { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { TaskFilters } from './TaskFilters';
import { BulkActions } from './BulkActions';
import { DependencyManager } from './DependencyManager';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export function TaskList() {
  const [searchTitle, setSearchTitle] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dependencyTask, setDependencyTask] = useState<Task | null>(null);

  const debouncedSearch = useDebounce(searchTitle, 300);

  const { data: tasks, isLoading, error } = useTasks({
    status: statusFilter,
    title: debouncedSearch,
  });

  const handleSelectTask = (id: number, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleSelectAll = () => {
    if (tasks) {
      setSelectedIds(tasks.map((t) => t.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleClearFilters = () => {
    setSearchTitle('');
    setStatusFilter('all');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading tasks: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TaskFilters
          searchTitle={searchTitle}
          statusFilter={statusFilter}
          onSearchChange={setSearchTitle}
          onStatusChange={setStatusFilter}
          onClear={handleClearFilters}
        />
        <TaskForm />
      </div>

      {tasks && tasks.length > 0 && (
        <BulkActions
          selectedIds={selectedIds}
          totalCount={tasks.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first task
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks?.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedIds.includes(task.id)}
              onSelect={handleSelectTask}
              onViewDependencies={setDependencyTask}
            />
          ))}
        </div>
      )}

      <DependencyManager
        task={dependencyTask}
        allTasks={tasks || []}
        open={dependencyTask !== null}
        onOpenChange={(open) => !open && setDependencyTask(null)}
      />
    </div>
  );
}
