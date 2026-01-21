import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  bulkUpdateStatus,
  getBlockingTasks,
  getBlockedByTasks,
  createDependency,
  batchCreateDependencies,
  checkCircularDependency,
  fetchGraphData,
} from '@/api/taskApi';
import type {
  CreateTaskPayload,
  UpdateStatusPayload,
  BulkUpdatePayload,
  DependencyPayload,
  BatchDependencyPayload,
  CircularCheckPayload,
} from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function useTasks(filters?: { status?: string; title?: string }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      toast({ title: 'Success', description: 'Task created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: UpdateStatusPayload }) =>
      updateTaskStatus(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      toast({ title: 'Success', description: 'Status updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      toast({ title: 'Success', description: 'Task deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: BulkUpdatePayload) => bulkUpdateStatus(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      toast({
        title: 'Success',
        description: `Updated ${variables.task_ids.length} tasks successfully`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBlockingTasks(taskId: number | null) {
  return useQuery({
    queryKey: ['blocking', taskId],
    queryFn: () => getBlockingTasks(taskId!),
    enabled: taskId !== null,
  });
}

export function useBlockedByTasks(taskId: number | null) {
  return useQuery({
    queryKey: ['blockedBy', taskId],
    queryFn: () => getBlockedByTasks(taskId!),
    enabled: taskId !== null,
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: DependencyPayload) => createDependency(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['blocking'] });
      queryClient.invalidateQueries({ queryKey: ['blockedBy'] });
      toast({ title: 'Success', description: 'Dependency added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBatchCreateDependencies() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: BatchDependencyPayload) => batchCreateDependencies(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['blocking'] });
      queryClient.invalidateQueries({ queryKey: ['blockedBy'] });
      toast({
        title: 'Success',
        description: `Added ${variables.depends_on_ids.length} dependencies successfully`,
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCheckCircular() {
  return useMutation({
    mutationFn: (payload: CircularCheckPayload) => checkCircularDependency(payload),
  });
}

export function useGraphData() {
  return useQuery({
    queryKey: ['graph'],
    queryFn: fetchGraphData,
  });
}
