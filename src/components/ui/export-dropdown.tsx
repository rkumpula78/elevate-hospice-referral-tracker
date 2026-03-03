import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, FileSpreadsheet, FileText, Mail } from "lucide-react";

interface ExportDropdownProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
}

const ExportDropdown = ({ onExportCSV, onExportPDF, disabled }: ExportDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuItem disabled className="opacity-50">
              <Mail className="h-4 w-4 mr-2" />
              Email Report
            </DropdownMenuItem>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
