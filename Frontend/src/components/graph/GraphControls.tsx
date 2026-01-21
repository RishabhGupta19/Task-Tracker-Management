import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function GraphControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      <Button variant="outline" size="sm" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onReset}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Reset
      </Button>
    </div>
  );
}
