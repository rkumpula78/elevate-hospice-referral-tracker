import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CensusManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CensusManager = ({ open, onOpenChange }: CensusManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [patientCount, setPatientCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  // Fetch existing census for selected date
  const { data: existingCensus } = useQuery({
    queryKey: ['census-entry', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('census_entries')
        .select('*')
        .eq('census_date', format(date, 'yyyy-MM-dd'))
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Update form when existing census is loaded
  React.useEffect(() => {
    if (existingCensus) {
      setPatientCount(existingCensus.patient_count.toString());
      setNotes(existingCensus.notes || '');
    } else {
      setPatientCount('');
      setNotes('');
    }
  }, [existingCensus]);

  const saveCensusMutation = useMutation({
    mutationFn: async () => {
      const censusDate = format(date, 'yyyy-MM-dd');
      const count = parseInt(patientCount);

      if (existingCensus) {
        const { error } = await supabase
          .from('census_entries')
          .update({
            patient_count: count,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCensus.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('census_entries')
          .insert({
            census_date: censusDate,
            patient_count: count,
            notes: notes || null
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['census-entry'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: "Census updated successfully" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({ 
        title: "Error updating census", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientCount || isNaN(parseInt(patientCount))) {
      toast({ 
        title: "Invalid patient count", 
        description: "Please enter a valid number",
        variant: "destructive" 
      });
      return;
    }

    saveCensusMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Census</DialogTitle>
          <DialogDescription>
            Manually enter the patient census for a specific date. This will be used for dashboard metrics.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Census Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="patientCount">Patient Count</Label>
              <Input
                id="patientCount"
                type="number"
                value={patientCount}
                onChange={(e) => setPatientCount(e.target.value)}
                placeholder="Enter current census"
                min="0"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about the census"
                rows={3}
              />
            </div>
            {existingCensus && (
              <p className="text-sm text-muted-foreground">
                Last updated: {format(new Date(existingCensus.updated_at), 'PPpp')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveCensusMutation.isPending}>
              {saveCensusMutation.isPending ? "Saving..." : "Save Census"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CensusManager; 