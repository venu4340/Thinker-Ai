import React from 'react';
import { 
  Plus, ZoomIn, ZoomOut, Maximize2, LayoutTemplate
} from 'lucide-react';
import { Button } from '../ui/Button';

interface CanvasToolbarProps {
  onAutoLayout: () => void;
  onOpenAddNodeModal: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onAutoLayout,
  onOpenAddNodeModal,
  onFitView,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-[#0C1220]/90 backdrop-blur-2xl border border-slate-800/80 p-1.5 rounded-2xl shadow-2xl">
      <Button
        variant="primary"
        size="sm"
        onClick={onOpenAddNodeModal}
        className="text-xs"
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add Node
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onAutoLayout}
        className="text-xs border-slate-700/60"
      >
        <LayoutTemplate className="w-3.5 h-3.5 mr-1 text-[#27E6B5]" />
        Auto Arrange
      </Button>

      <div className="h-4 w-px bg-slate-800 mx-1" />

      <button
        onClick={onZoomIn}
        title="Zoom In"
        className="p-1.5 text-slate-400 hover:text-[#27E6B5] hover:bg-[#101827] rounded-lg transition-colors cursor-pointer"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={onZoomOut}
        title="Zoom Out"
        className="p-1.5 text-slate-400 hover:text-[#27E6B5] hover:bg-[#101827] rounded-lg transition-colors cursor-pointer"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={onFitView}
        title="Fit View"
        className="p-1.5 text-slate-400 hover:text-[#27E6B5] hover:bg-[#101827] rounded-lg transition-colors cursor-pointer"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
};
