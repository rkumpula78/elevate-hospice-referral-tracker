
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EnhancedAddOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedAddOrganizationDialog = ({ open, onOpenChange }: EnhancedAddOrganizationDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    dba_name: '',
    type: '',
    sub_type: '',
    license_numbers: [] as string[],
    medicare_id: '',
    bed_count: '',
    ownership_type: '',
    
    // Location & Contact
    address: '',
    phone: '',
    website: '',
    after_hours_contact: '',
    service_radius: '',
    contact_person: '',
    contact_email: '',
    
    // Strategic Classification
    account_rating: 'C',
    partnership_stage: 'prospect',
    referral_potential: '5',
    assigned_marketer: '',
    
    // Intelligence
    competitive_landscape: '',
    current_hospice_providers: [] as string[],
    contract_status: 'open',
    financial_health_notes: '',
    expansion_plans: '',
    regulatory_notes: '',
    partnership_notes: ''
  });

  const [licenseInput, setLicenseInput] = useState('');
  const [hospiceInput, setHospiceInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      ...formData,
      bed_count: formData.bed_count ? parseInt(formData.bed_count) : null,
      service_radius: formData.service_radius ? parseInt(formData.service_radius) : null,
      referral_potential: parseInt(formData.referral_potential)
    };

    const { error } = await supabase
      .from('organizations')
      .insert([dataToSubmit]);

    if (error) {
      toast.error('Failed to create organization');
      console.error('Error creating organization:', error);
    } else {
      toast.success('Organization created successfully');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onOpenChange(false);
      setFormData({
        name: '', dba_name: '', type: '', sub_type: '', license_numbers: [], medicare_id: '', 
        bed_count: '', ownership_type: '', address: '', phone: '', website: '', after_hours_contact: '', 
        service_radius: '', contact_person: '', contact_email: '', account_rating: 'C', 
        partnership_stage: 'prospect', referral_potential: '5', assigned_marketer: '', 
        competitive_landscape: '', current_hospice_providers: [], contract_status: 'open', 
        financial_health_notes: '', expansion_plans: '', regulatory_notes: '', partnership_notes: ''
      });
    }
  };

  const addLicenseNumber = () => {
    if (licenseInput.trim()) {
      setFormData(prev => ({
        ...prev,
        license_numbers: [...prev.license_numbers, licenseInput.trim()]
      }));
      setLicenseInput('');
    }
  };

  const removeLicenseNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      license_numbers: prev.license_numbers.filter((_, i) => i !== index)
    }));
  };

  const addHospiceProvider = () => {
    if (hospiceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        current_hospice_providers: [...prev.current_hospice_providers, hospiceInput.trim()]
      }));
      setHospiceInput('');
    }
  };

  const removeHospiceProvider = (index: number) => {
    setFormData(prev => ({
      ...prev,
      current_hospice_providers: prev.current_hospice_providers.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Organization</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dba_name">DBA Name</Label>
                  <Input
                    id="dba_name"
                    value={formData.dba_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, dba_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Primary Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assisted_living">Assisted Living</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Cancer Center/Clinic</SelectItem>
                      <SelectItem value="physician_office">Physician Office</SelectItem>
                      <SelectItem value="nursing_home">Skilled Nursing</SelectItem>
                      <SelectItem value="home_health">Home Health</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sub_type">Sub-Type</Label>
                  <Input
                    id="sub_type"
                    value={formData.sub_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, sub_type: e.target.value }))}
                    placeholder="e.g., Memory Care, Rehabilitation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicare_id">Medicare ID</Label>
                  <Input
                    id="medicare_id"
                    value={formData.medicare_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicare_id: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bed_count">Bed Count</Label>
                  <Input
                    id="bed_count"
                    type="number"
                    value={formData.bed_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, bed_count: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ownership_type">Ownership Type</Label>
                <Select value={formData.ownership_type} onValueChange={(value) => setFormData(prev => ({ ...prev, ownership_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ownership type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="for_profit">For-Profit</SelectItem>
                    <SelectItem value="non_profit">Non-Profit</SelectItem>
                    <SelectItem value="chain">Chain</SelectItem>
                    <SelectItem value="independent">Independent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>License Numbers</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    placeholder="Enter license number"
                  />
                  <Button type="button" onClick={addLicenseNumber}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.license_numbers.map((license, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {license}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeLicenseNumber(index)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Main Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="after_hours_contact">After Hours Contact</Label>
                  <Input
                    id="after_hours_contact"
                    value={formData.after_hours_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, after_hours_contact: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <Label htmlFor="service_radius">Service Radius (miles)</Label>
                  <Input
                    id="service_radius"
                    type="number"
                    value={formData.service_radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_radius: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person">Primary Contact</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="account_rating">Account Rating</Label>
                  <Select value={formData.account_rating} onValueChange={(value) => setFormData(prev => ({ ...prev, account_rating: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A - High Priority</SelectItem>
                      <SelectItem value="B">B - Medium-High</SelectItem>
                      <SelectItem value="C">C - Medium</SelectItem>
                      <SelectItem value="P">P - Prospect</SelectItem>
                      <SelectItem value="D">D - Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="partnership_stage">Partnership Stage</Label>
                  <Select value={formData.partnership_stage} onValueChange={(value) => setFormData(prev => ({ ...prev, partnership_stage: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="developing">Developing</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="strategic">Strategic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="referral_potential">Referral Potential (1-10)</Label>
                  <Select value={formData.referral_potential} onValueChange={(value) => setFormData(prev => ({ ...prev, referral_potential: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assigned_marketer">Assigned Marketer</Label>
                  <Input
                    id="assigned_marketer"
                    value={formData.assigned_marketer}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigned_marketer: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contract_status">Contract Status</Label>
                  <Select value={formData.contract_status} onValueChange={(value) => setFormData(prev => ({ ...prev, contract_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="competitive">Competitive</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="partnership_notes">Partnership Notes</Label>
                <Textarea
                  id="partnership_notes"
                  value={formData.partnership_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, partnership_notes: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="intelligence" className="space-y-4">
              <div>
                <Label>Current Hospice Providers</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={hospiceInput}
                    onChange={(e) => setHospiceInput(e.target.value)}
                    placeholder="Enter hospice provider"
                  />
                  <Button type="button" onClick={addHospiceProvider}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.current_hospice_providers.map((hospice, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {hospice}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeHospiceProvider(index)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="competitive_landscape">Competitive Landscape</Label>
                <Textarea
                  id="competitive_landscape"
                  value={formData.competitive_landscape}
                  onChange={(e) => setFormData(prev => ({ ...prev, competitive_landscape: e.target.value }))}
                  placeholder="Overview of competitive situation..."
                />
              </div>

              <div>
                <Label htmlFor="financial_health_notes">Financial Health Notes</Label>
                <Textarea
                  id="financial_health_notes"
                  value={formData.financial_health_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, financial_health_notes: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="expansion_plans">Expansion Plans</Label>
                <Textarea
                  id="expansion_plans"
                  value={formData.expansion_plans}
                  onChange={(e) => setFormData(prev => ({ ...prev, expansion_plans: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="regulatory_notes">Regulatory Notes</Label>
                <Textarea
                  id="regulatory_notes"
                  value={formData.regulatory_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, regulatory_notes: e.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Organization</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddOrganizationDialog;
