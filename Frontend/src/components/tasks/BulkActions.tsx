import type { TaskStatus } from '@/types/task';
import { Button } from '@/components/ui/button';
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
import { CheckSquare, Square, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useBulkUpdateStatus } from '@/hooks/useTasks';

interface BulkActionsProps {
  selectedIds: number[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
}: BulkActionsProps) {
  const [bulkStatus, setBulkStatus] = useState<TaskStatus | ''>('');
  const bulkUpdate = useBulkUpdateStatus();
  const allSelected = selectedIds.length === totalCount && totalCount > 0;

  const handleBulkUpdate = () => {
    if (!bulkStatus || selectedIds.length === 0) return;
    bulkUpdate.mutate(
      { task_ids: selectedIds, status: bulkStatus },
      {
        onSuccess: () => {
          setBulkStatus('');
          onDeselectAll();
        },
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={allSelected ? onDeselectAll : onSelectAll}
      >
        {allSelected ? (
          <>
            <Square className="h-4 w-4 mr-1" />
            Deselect All
          </>
        ) : (
          <>
            <CheckSquare className="h-4 w-4 mr-1" />
            Select All
          </>
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        {selectedIds.length} of {totalCount} selected
      </span>

      {selectedIds.length > 0 && (
        <>
          <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as TaskStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={!bulkStatus || bulkUpdate.isPending}
              >
                {bulkUpdate.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Apply to {selectedIds.length} tasks
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to change the status of {selectedIds.length} task(s) to{' '}
                  <strong>{bulkStatus?.replace('_', ' ')}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkUpdate}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
