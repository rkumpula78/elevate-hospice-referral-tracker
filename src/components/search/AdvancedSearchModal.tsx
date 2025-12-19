import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (criteria: SearchCriteria) => void;
}

export interface SearchCriteria {
  patientName?: string;
  medicalRecordNumber?: string;
  facility?: string;
  physician?: string;
  diagnosis?: string;
  insurance?: string;
  status?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const AdvancedSearchModal = ({ open, onOpenChange, onSearch }: AdvancedSearchModalProps) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveSearch, setShowSaveSearch] = useState(false);

  const handleCriteriaChange = (field: keyof SearchCriteria, value: any) => {
    setCriteria(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    onSearch(criteria);
    onOpenChange(false);
  };

  const handleClear = () => {
    setCriteria({});
  };

  const handleSaveSearch = () => {
    if (saveSearchName.trim()) {
      const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      savedSearches.push({
        name: saveSearchName,
        criteria,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
      setSaveSearchName('');
      setShowSaveSearch(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={criteria.patientName || ''}
                  onChange={(e) => handleCriteriaChange('patientName', e.target.value)}
                  placeholder="Search by patient name..."
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="mrn">Medical Record Number</Label>
                <Input
                  id="mrn"
                  value={criteria.medicalRecordNumber || ''}
                  onChange={(e) => handleCriteriaChange('medicalRecordNumber', e.target.value)}
                  placeholder="MRN..."
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input
                  id="diagnosis"
                  value={criteria.diagnosis || ''}
                  onChange={(e) => handleCriteriaChange('diagnosis', e.target.value)}
                  placeholder="Search by diagnosis..."
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="insurance">Insurance Provider</Label>
                <Input
                  id="insurance"
                  value={criteria.insurance || ''}
                  onChange={(e) => handleCriteriaChange('insurance', e.target.value)}
                  placeholder="Insurance provider..."
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Referral Source */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Referral Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="facility">Referring Facility</Label>
                <Input
                  id="facility"
                  value={criteria.facility || ''}
                  onChange={(e) => handleCriteriaChange('facility', e.target.value)}
                  placeholder="Facility name..."
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="physician">Referring Physician</Label>
                <Input
                  id="physician"
                  value={criteria.physician || ''}
                  onChange={(e) => handleCriteriaChange('physician', e.target.value)}
                  placeholder="Physician name..."
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Status & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Referral Status</Label>
                <Select value={criteria.status || ''} onValueChange={(value) => handleCriteriaChange('status', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Any status</SelectItem>
                    <SelectItem value="new_referral">New Referral</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="not_admitted_patient_choice">Not Admitted - Patient Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={criteria.priority || ''} onValueChange={(value) => handleCriteriaChange('priority', value)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Any priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Any priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !criteria.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.dateFrom ? format(criteria.dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50">
                    <Calendar
                      mode="single"
                      selected={criteria.dateFrom}
                      onSelect={(date) => handleCriteriaChange('dateFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !criteria.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {criteria.dateTo ? format(criteria.dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50">
                    <Calendar
                      mode="single"
                      selected={criteria.dateTo}
                      onSelect={(date) => handleCriteriaChange('dateTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Save Search */}
          {showSaveSearch && (
            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="saveSearchName">Save Search As</Label>
              <div className="flex gap-2">
                <Input
                  id="saveSearchName"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="Enter search name..."
                  className="bg-background"
                />
                <Button onClick={handleSaveSearch} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button onClick={() => setShowSaveSearch(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClear}>
            Clear All
          </Button>
          {!showSaveSearch && (
            <Button variant="outline" onClick={() => setShowSaveSearch(true)}>
              <Save className="w-4 h-4 mr-2" />
              Save Search
            </Button>
          )}
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
