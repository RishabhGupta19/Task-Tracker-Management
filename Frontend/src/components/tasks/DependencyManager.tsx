import { useState } from 'react';
import type { Task, TaskStatus } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  useBlockingTasks,
  useBlockedByTasks,
  useCheckCircular,
  useCreateDependency,
  useBatchCreateDependencies,
} from '@/hooks/useTasks';

interface DependencyManagerProps {
  task: Task | null;
  allTasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  blocked: 'bg-red-500',
};

export function DependencyManager({
  task,
  allTasks,
  open,
  onOpenChange,
}: DependencyManagerProps) {
  const [selectedDependency, setSelectedDependency] = useState<string>('');
  const [batchSelected, setBatchSelected] = useState<number[]>([]);
  const [circularError, setCircularError] = useState<string | null>(null);
  const [circularSuccess, setCircularSuccess] = useState(false);

  const { data: blockingTasks, isLoading: loadingBlocking } = useBlockingTasks(
    task?.id ?? null
  );
  const { data: blockedByTasks, isLoading: loadingBlockedBy } = useBlockedByTasks(
    task?.id ?? null
  );
  const checkCircular = useCheckCircular();
  const createDependency = useCreateDependency();
  const batchCreate = useBatchCreateDependencies();

  const availableTasks = allTasks.filter(
    (t) =>
      t.id !== task?.id &&
      !blockingTasks?.some((bt) => bt.id === t.id)
  );

  const handleCheckAndAdd = async () => {
    if (!task || !selectedDependency) return;

    setCircularError(null);
    setCircularSuccess(false);

    const dependsOnId = parseInt(selectedDependency);
    
    try {
      const result = await checkCircular.mutateAsync({
        task: task.id,
        depends_on: dependsOnId,
      });

      if (result.is_circular) {
        setCircularError(result.message || 'This would create a circular dependency');
        return;
      }

      setCircularSuccess(true);
      await createDependency.mutateAsync({
        task: task.id,
        depends_on: dependsOnId,
      });

      setSelectedDependency('');
      setCircularSuccess(false);
    } catch (error) {
      setCircularError((error as Error).message);
    }
  };

  const handleBatchToggle = (id: number) => {
    setBatchSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setCircularError(null);
  };

  const handleBatchAdd = async () => {
    if (!task || batchSelected.length === 0) return;

    setCircularError(null);

    // Check each for circular
    for (const dependsOnId of batchSelected) {
      try {
        const result = await checkCircular.mutateAsync({
          task: task.id,
          depends_on: dependsOnId,
        });

        if (result.is_circular) {
          const depTask = allTasks.find((t) => t.id === dependsOnId);
          setCircularError(
            `Cannot add "${depTask?.title}": ${result.message || 'Circular dependency detected'}`
          );
          return;
        }
      } catch (error) {
        setCircularError((error as Error).message);
        return;
      }
    }

    await batchCreate.mutateAsync({
      task: task.id,
      depends_on_ids: batchSelected,
    });

    setBatchSelected([]);
  };

  const isChecking = checkCircular.isPending;
  const isAdding = createDependency.isPending || batchCreate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dependencies for "{task?.title}"</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="add">Add Single</TabsTrigger>
            <TabsTrigger value="batch">Batch Add</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <ArrowLeft className="h-4 w-4" />
                Tasks blocking this one
              </h4>
              {loadingBlocking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : blockingTasks?.length ? (
                <div className="space-y-2">
                  {blockingTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{t.title}</span>
                      <Badge className={`${statusColors[t.status]} text-white border-0`}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No blocking tasks</p>
              )}
            </div>

            <div>
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4" />
                Tasks blocked by this one
              </h4>
              {loadingBlockedBy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : blockedByTasks?.length ? (
                <div className="space-y-2">
                  {blockedByTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{t.title}</span>
                      <Badge className={`${statusColors[t.status]} text-white border-0`}>
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No dependent tasks</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select a task this depends on</Label>
              <Select
                value={selectedDependency}
                onValueChange={(v) => {
                  setSelectedDependency(v);
                  setCircularError(null);
                  setCircularSuccess(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {circularError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {circularError}
              </div>
            )}

            {circularSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Valid dependency - adding...
              </div>
            )}

            <Button
              onClick={handleCheckAndAdd}
              disabled={!selectedDependency || isChecking || isAdding}
              className="w-full"
            >
              {isChecking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Dependency'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4 mt-4">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <Label>Select multiple dependencies</Label>
              {availableTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available tasks</p>
              ) : (
                availableTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded"
                  >
                    <Checkbox
                      checked={batchSelected.includes(t.id)}
                      onCheckedChange={() => handleBatchToggle(t.id)}
                    />
                    <span className="text-sm flex-1">{t.title}</span>
                    <Badge className={`${statusColors[t.status]} text-white border-0 text-xs`}>
                      {t.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {circularError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {circularError}
              </div>
            )}

            <Button
              onClick={handleBatchAdd}
              disabled={batchSelected.length === 0 || isChecking || isAdding}
              className="w-full"
            >
              {isChecking || isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Add ${batchSelected.length} Dependencies`
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
