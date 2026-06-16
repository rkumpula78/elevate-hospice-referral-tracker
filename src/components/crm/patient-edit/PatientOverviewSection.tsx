
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Home, Building2, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ORG_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'physician_office', label: 'Physician Office' },
  { value: 'snf', label: 'Skilled Nursing Facility' },
  { value: 'home_health', label: 'Home Health' },
  { value: 'assisted_living', label: 'Assisted Living' },
  { value: 'group_home', label: 'Group Home' },
  { value: 'other', label: 'Other' },
] as const;

interface PatientOverviewSectionProps {
  patient: any;
  isOpen: boolean;
  onToggle: () => void;
}

const PatientOverviewSection = ({ patient, isOpen, onToggle }: PatientOverviewSectionProps) => {
  // Referring org state
  const [orgId, setOrgId] = useState<string>(patient?.organization_id || 'none');
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<string>('other');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Patient residence state
  const [residenceType, setResidenceType] = useState<'home' | 'facility'>(
    patient?.facility_organization_id ? 'facility' : 'home'
  );
  const [facilityOrgId, setFacilityOrgId] = useState<string>(patient?.facility_organization_id || 'none');
  const [showNewFacility, setShowNewFacility] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [newFacilityType, setNewFacilityType] = useState<string>('group_home');
  const [creatingFacility, setCreatingFacility] = useState(false);

  const { data: organizations = [], refetch: refetchOrgs } = useQuery({
    queryKey: ['organizations-for-patient-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string; type: string }[];
    },
  });

  const createOrg = async (name: string, type: string, onSuccess: (id: string) => void, setCreating: (v: boolean) => void) => {
    if (!name.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: name.trim(), type, is_active: true })
      .select('id')
      .single();
    setCreating(false);
    if (!error && data) {
      await refetchOrgs();
      onSuccess(data.id);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
        <h3 className="text-lg font-medium">1. Patient Overview</h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg space-y-6">

        {/* Hidden inputs submit controlled values */}
        <input type="hidden" name="organization_id" value={orgId === 'none' ? '' : orgId} />
        <input type="hidden" name="facility_organization_id" value={residenceType === 'facility' && facilityOrgId !== 'none' ? facilityOrgId : ''} />

        {/* Patient name + demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" name="first_name" defaultValue={patient?.first_name || patient?.patient_name?.split(' ')[0] || ''} />
          </div>
          <div>
            <Label htmlFor="middle_name">Middle Name (Optional)</Label>
            <Input id="middle_name" name="middle_name" defaultValue={patient?.middle_name || ''} />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" name="last_name" defaultValue={patient?.last_name || patient?.patient_name?.split(' ').slice(1).join(' ') || ''} />
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth <span className="text-red-500">*</span></Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={patient?.date_of_birth || ''} />
          </div>
          <div>
            <Label htmlFor="ssn">Social Security Number</Label>
            <Input id="ssn" name="ssn" defaultValue={patient?.ssn || ''} placeholder="XXX-XX-XXXX" />
          </div>
          <div>
            <Label htmlFor="primary_insurance">Primary Insurance Provider</Label>
            <Select name="primary_insurance" defaultValue={patient?.primary_insurance || 'none'}>
              <SelectTrigger><SelectValue placeholder="Select insurance provider" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select insurance provider</SelectItem>
                <SelectItem value="medicare">Medicare</SelectItem>
                <SelectItem value="medicaid">Medicaid</SelectItem>
                <SelectItem value="private">Private Insurance</SelectItem>
                <SelectItem value="tricare">Tricare</SelectItem>
                <SelectItem value="va">VA Benefits</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="medicare_number">Policy Number</Label>
            <Input id="medicare_number" name="medicare_number" defaultValue={patient?.medicare_number || ''} placeholder="Policy/Medicare number" />
          </div>
          <div>
            <Label htmlFor="referral_contact_person">Referral Contact Person</Label>
            <Input id="referral_contact_person" name="referral_contact_person" defaultValue={patient?.referral_contact_person || ''} placeholder="Contact person at referral source" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Patient Address <span className="text-red-500">*</span></Label>
            <Input id="address" name="address" defaultValue={patient?.address || ''} placeholder="Full address including city, state, zip" />
          </div>
          <div>
            <Label htmlFor="phone">Patient Phone</Label>
            <Input id="phone" name="phone" defaultValue={patient?.phone || patient?.patient_phone || ''} placeholder="XXX-XXX-XXXX" />
          </div>
        </div>

        {/* Referring Organization */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Referring Organization</Label>
          <p className="text-xs text-muted-foreground">The facility or person who referred this patient to us.</p>
          {!showNewOrg ? (
            <Select value={orgId} onValueChange={(v) => {
              if (v === '__new__') { setShowNewOrg(true); return; }
              setOrgId(v);
            }}>
              <SelectTrigger><SelectValue placeholder="Select organization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No organization</SelectItem>
                {organizations.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
                <SelectItem value="__new__">
                  <span className="flex items-center gap-1.5 text-primary"><Plus className="w-3.5 h-3.5" />Add new organization</span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <p className="text-sm font-medium">New Organization</p>
              <Input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="Organization name" />
              <Select value={newOrgType} onValueChange={setNewOrgType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" disabled={!newOrgName.trim() || creatingOrg} onClick={() =>
                  createOrg(newOrgName, newOrgType, (id) => { setOrgId(id); setShowNewOrg(false); setNewOrgName(''); }, setCreatingOrg)
                }>{creatingOrg ? 'Adding…' : 'Add & Select'}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewOrg(false); setNewOrgName(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Patient Residence */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Patient Residence</Label>
            <p className="text-xs text-muted-foreground">Where does the patient currently live?</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setResidenceType('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                residenceType === 'home'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              <Home className="w-4 h-4" />
              Private Home
            </button>
            <button
              type="button"
              onClick={() => setResidenceType('facility')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                residenceType === 'facility'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Facility / Group Home / SNF
            </button>
          </div>

          {residenceType === 'facility' && (
            <div className="space-y-2 pl-1">
              <Label className="text-sm">Facility Name</Label>
              {!showNewFacility ? (
                <Select value={facilityOrgId} onValueChange={(v) => {
                  if (v === '__new__') { setShowNewFacility(true); return; }
                  setFacilityOrgId(v);
                }}>
                  <SelectTrigger><SelectValue placeholder="Select facility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select facility</SelectItem>
                    {organizations.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-1.5 text-primary"><Plus className="w-3.5 h-3.5" />Add new facility</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">New Facility</p>
                  <Input value={newFacilityName} onChange={e => setNewFacilityName(e.target.value)} placeholder="Facility name" />
                  <Select value={newFacilityType} onValueChange={setNewFacilityType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!newFacilityName.trim() || creatingFacility} onClick={() =>
                      createOrg(newFacilityName, newFacilityType, (id) => { setFacilityOrgId(id); setShowNewFacility(false); setNewFacilityName(''); }, setCreatingFacility)
                    }>{creatingFacility ? 'Adding…' : 'Add & Select'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowNewFacility(false); setNewFacilityName(''); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </CollapsibleContent>
    </Collapsible>
  );
};

export default PatientOverviewSection;
