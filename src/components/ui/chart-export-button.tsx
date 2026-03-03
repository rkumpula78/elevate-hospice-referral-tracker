import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download } from "lucide-react";

interface ChartExportButtonProps {
  onClick: () => void;
}

const ChartExportButton = ({ onClick }: ChartExportButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 print:hidden"
          onClick={onClick}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export chart data</TooltipContent>
    </Tooltip>
  );
};

export default ChartExportButton;
