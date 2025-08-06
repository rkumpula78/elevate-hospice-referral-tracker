import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Users, Phone, Mail, Star, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReferringContactSelectorProps {
  organizationId: string | null;
  selectedContactId?: string | null;
  selectedMethod?: 'general' | 'specific_contact';
  onContactChange: (contactId: string | null, method: 'general' | 'specific_contact') => void;
  onAddContact?: () => void;
  disabled?: boolean;
}

interface OrganizationContact {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  direct_phone: string | null;
  email: string | null;
  is_referring_contact: boolean;
  is_primary_referrer: boolean;
  specialization: string | null;
  referral_volume_monthly: number;
  last_referral_date: string | null;
}

const ReferringContactSelector: React.FC<ReferringContactSelectorProps> = ({
  organizationId,
  selectedContactId,
  selectedMethod = 'general',
  onContactChange,
  onAddContact,
  disabled = false
}) => {
  const [referralMethod, setReferralMethod] = useState<'general' | 'specific_contact'>(selectedMethod);

  // Fetch contacts for the selected organization
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['organization-contacts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_primary_referrer', { ascending: false })
        .order('is_referring_contact', { ascending: false })
        .order('last_name');
      
      if (error) throw error;
      return data as OrganizationContact[];
    },
    enabled: !!organizationId
  });

  // Get referring contacts only
  const referringContacts = contacts?.filter(c => c.is_referring_contact) || [];
  const primaryReferrer = contacts?.find(c => c.is_primary_referrer);
  const otherContacts = contacts?.filter(c => !c.is_referring_contact) || [];

  const handleMethodChange = (method: 'general' | 'specific_contact') => {
    setReferralMethod(method);
    
    if (method === 'general') {
      onContactChange(null, method);
    } else if (method === 'specific_contact' && primaryReferrer) {
      // Auto-select primary referrer if available
      onContactChange(primaryReferrer.id, method);
    }
  };

  const handleContactSelect = (contactId: string) => {
    onContactChange(contactId, 'specific_contact');
  };

  const formatContactName = (contact: OrganizationContact) => {
    return `${contact.first_name} ${contact.last_name}`;
  };

  const formatContactDetails = (contact: OrganizationContact) => {
    const details = [];
    if (contact.title) details.push(contact.title);
    if (contact.specialization) details.push(contact.specialization);
    return details.join(' • ');
  };

  const ContactCard: React.FC<{ contact: OrganizationContact; isSelected: boolean; onClick: () => void }> = ({
    contact,
    isSelected,
    onClick
  }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{formatContactName(contact)}</h4>
              {contact.is_primary_referrer && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  <Star className="h-3 w-3 mr-1" />
                  Primary
                </Badge>
              )}
            </div>
            
            {formatContactDetails(contact) && (
              <p className="text-xs text-gray-600 mt-1">
                {formatContactDetails(contact)}
              </p>
            )}
            
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {contact.direct_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{contact.direct_phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{contact.email}</span>
                </div>
              )}
            </div>
            
            {contact.referral_volume_monthly > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                {contact.referral_volume_monthly} referrals this month
              </div>
            )}
          </div>
          
          {isSelected && (
            <div className="ml-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!organizationId) {
    return (
      <div className="space-y-2">
        <Label>Referring Contact</Label>
        <div className="text-sm text-gray-500 p-4 border border-dashed rounded-lg">
          Please select an organization first to choose a referring contact.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Referral Source</Label>
        <p className="text-sm text-gray-600 mt-1">
          How was this referral received?
        </p>
      </div>

      <RadioGroup 
        value={referralMethod} 
        onValueChange={handleMethodChange}
        disabled={disabled}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="general" id="general" />
          <Label htmlFor="general" className="flex items-center gap-2 cursor-pointer">
            <Users className="h-4 w-4" />
            General Organization Referral
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="specific_contact" id="specific_contact" />
          <Label htmlFor="specific_contact" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            Specific Contact/Referrer
          </Label>
        </div>
      </RadioGroup>

      {referralMethod === 'specific_contact' && (
        <div className="space-y-4 pl-6 border-l-2 border-blue-100">
          {contactsLoading ? (
            <div className="text-sm text-gray-500">Loading contacts...</div>
          ) : (
            <>
              {/* Primary Referrer */}
              {primaryReferrer && (
                <div>
                  <Label className="text-sm font-medium text-blue-700">Primary Referrer</Label>
                  <div className="mt-2">
                    <ContactCard
                      contact={primaryReferrer}
                      isSelected={selectedContactId === primaryReferrer.id}
                      onClick={() => handleContactSelect(primaryReferrer.id)}
                    />
                  </div>
                </div>
              )}

              {/* Other Referring Contacts */}
              {referringContacts.filter(c => !c.is_primary_referrer).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Other Referring Contacts</Label>
                  <div className="mt-2 space-y-2">
                    {referringContacts
                      .filter(c => !c.is_primary_referrer)
                      .map(contact => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          isSelected={selectedContactId === contact.id}
                          onClick={() => handleContactSelect(contact.id)}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Non-referring contacts (if no referring contacts exist) */}
              {referringContacts.length === 0 && otherContacts.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Available Contacts</Label>
                  <p className="text-xs text-gray-600 mb-2">
                    No referring contacts set up. Select from available contacts:
                  </p>
                  <div className="space-y-2">
                    {otherContacts.map(contact => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContactId === contact.id}
                        onClick={() => handleContactSelect(contact.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No contacts available */}
              {contacts && contacts.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-lg">
                  <User className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    No contacts found for this organization
                  </p>
                  {onAddContact && (
                    <Button variant="outline" size="sm" onClick={onAddContact}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                </div>
              )}

              {/* Add contact button */}
              {contacts && contacts.length > 0 && onAddContact && (
                <>
                  <Separator />
                  <Button variant="outline" size="sm" onClick={onAddContact} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Contact
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferringContactSelector;