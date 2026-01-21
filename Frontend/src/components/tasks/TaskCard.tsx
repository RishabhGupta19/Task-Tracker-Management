import { useState } from 'react';
import type { Task, TaskStatus } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Link2, Loader2 } from 'lucide-react';
import { useUpdateTaskStatus, useDeleteTask, useBlockedByTasks } from '@/hooks/useTasks';

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
  onViewDependencies: (task: Task) => void;
}

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-500 hover:bg-gray-600',
  in_progress: 'bg-blue-500 hover:bg-blue-600',
  completed: 'bg-green-500 hover:bg-green-600',
  blocked: 'bg-red-500 hover:bg-red-600',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};

export function TaskCard({ task, isSelected, onSelect, onViewDependencies }: TaskCardProps) {
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const { data: blockedByTasks } = useBlockedByTasks(task.id);

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateStatus.mutate({ taskId: task.id, payload: { status: newStatus } });
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    setShowDeleteWarning(false);
  };

  const hasDependents = blockedByTasks && blockedByTasks.length > 0;

  return (
    <Card className="relative transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(task.id, checked as boolean)}
            />
            <CardTitle className="text-lg">{task.title}</CardTitle>
          </div>
          <Badge className={`${statusColors[task.status]} text-white border-0`}>
            {statusLabels[task.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={task.status}
            onValueChange={(value) => handleStatusChange(value as TaskStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDependencies(task)}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Dependencies
          </Button>

          <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                {deleteTask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  {hasDependents ? (
                    <>
                      <span className="text-destructive font-medium">Warning:</span> This task has{' '}
                      {blockedByTasks.length} dependent task(s) that will be affected:
                      <ul className="mt-2 list-disc list-inside">
                        {blockedByTasks.map((t) => (
                          <li key={t.id}>{t.title}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    'Are you sure you want to delete this task? This action cannot be undone.'
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
