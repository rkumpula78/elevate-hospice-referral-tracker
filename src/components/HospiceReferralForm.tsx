
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface FormData {
  physicianName: string;
  primaryDiagnosis: string;
  referringFacility: string;
  patientName: string;
  email: string;
  phone: string;
  medicareNumber: string;
  dateOfBirth: Date | undefined;
  patientAddress: string;
  primaryCarePhysician: string;
  insuranceProvider: string;
  advanceDirectives: string;
  primaryCaregiver: string;
  additionalComments: string;
}

const HospiceReferralForm = () => {
  const [formData, setFormData] = useState<FormData>({
    physicianName: '',
    primaryDiagnosis: '',
    referringFacility: '',
    patientName: '',
    email: '',
    phone: '',
    medicareNumber: '',
    dateOfBirth: undefined,
    patientAddress: '',
    primaryCarePhysician: '',
    insuranceProvider: '',
    advanceDirectives: '',
    primaryCaregiver: '',
    additionalComments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateMedicareNumber = (medicare: string) => {
    // Basic Medicare number validation (11 characters, alphanumeric)
    const medicareRegex = /^[A-Za-z0-9]{11}$/;
    return medicareRegex.test(medicare.replace(/[\s\-]/g, ''));
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.physicianName.trim()) {
      newErrors.physicianName = 'Referring physician name is required';
    }

    if (!formData.primaryDiagnosis.trim()) {
      newErrors.primaryDiagnosis = 'Primary diagnosis is required';
    }

    if (!formData.referringFacility.trim()) {
      newErrors.referringFacility = 'Referring facility is required';
    }

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.medicareNumber && !validateMedicareNumber(formData.medicareNumber)) {
      newErrors.medicareNumber = 'Please enter a valid Medicare number (11 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const createConfetti = () => {
    const colors = ['#60A5FA', '#A78BFA', '#F472B6', '#34D399', '#FBBF24'];
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '9999';

    for (let i = 0; i < 100; i++) {
      const confettiPiece = document.createElement('div');
      confettiPiece.style.position = 'absolute';
      confettiPiece.style.width = '8px';
      confettiPiece.style.height = '8px';
      confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confettiPiece.style.left = Math.random() * 100 + '%';
      confettiPiece.style.top = '-10px';
      confettiPiece.style.animation = `confetti ${3 + Math.random() * 2}s ease-out forwards`;
      confettiPiece.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      confettiContainer.appendChild(confettiPiece);
    }

    document.body.appendChild(confettiContainer);

    setTimeout(() => {
      document.body.removeChild(confettiContainer);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please correct the errors",
        description: "All required fields must be filled correctly.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate webhook call - replace with actual endpoint
      const webhookUrl = 'https://your-hospital-webhook-endpoint.com/hospice-referrals';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: formData.dateOfBirth?.toISOString(),
          timestamp: new Date().toISOString(),
        }),
      });

      // For demo purposes, we'll simulate a successful response
      await new Promise(resolve => setTimeout(resolve, 1500));

      createConfetti();
      setShowSuccess(true);

      toast({
        title: "Referral Successfully Submitted",
        description: "Thank you for your support. We'll be in touch soon.",
      });

      // Reset form after success
      setTimeout(() => {
        setFormData({
          physicianName: '',
          primaryDiagnosis: '',
          referringFacility: '',
          patientName: '',
          email: '',
          phone: '',
          medicareNumber: '',
          dateOfBirth: undefined,
          patientAddress: '',
          primaryCarePhysician: '',
          insuranceProvider: '',
          advanceDirectives: '',
          primaryCaregiver: '',
          additionalComments: ''
        });
        setShowSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an issue submitting your referral. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 font-poppins px-4">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-gray-800 mb-4">Referral Successfully Submitted</h2>
          <p className="text-lg text-gray-600">Thank you for your support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 font-poppins px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded mr-3"></div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
              Request Hospice Care Support
            </h1>
          </div>
          <p className="text-gray-600 text-sm md:text-base">Supporting Families Through Every Step</p>
        </div>

        {/* Form */}
        <Card className="backdrop-blur-sm bg-white/70 border-0 shadow-xl animate-slide-up">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Referring Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Referring Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="physicianName" className="text-sm font-medium text-gray-700">
                      Referring Physician Name *
                    </Label>
                    <Input
                      id="physicianName"
                      type="text"
                      placeholder="Dr. John Smith"
                      value={formData.physicianName}
                      onChange={(e) => handleInputChange('physicianName', e.target.value)}
                      className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                        errors.physicianName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.physicianName && <p className="text-red-500 text-xs">{errors.physicianName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referringFacility" className="text-sm font-medium text-gray-700">
                      Referring Facility/Organization *
                    </Label>
                    <Input
                      id="referringFacility"
                      type="text"
                      placeholder="ABC Hospital"
                      value={formData.referringFacility}
                      onChange={(e) => handleInputChange('referringFacility', e.target.value)}
                      className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                        errors.referringFacility ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.referringFacility && <p className="text-red-500 text-xs">{errors.referringFacility}</p>}
                  </div>
                </div>
              </div>

              {/* Patient Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Patient Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="patientName" className="text-sm font-medium text-gray-700">
                      Patient's Name *
                    </Label>
                    <Input
                      id="patientName"
                      type="text"
                      placeholder="Jane Doe"
                      value={formData.patientName}
                      onChange={(e) => handleInputChange('patientName', e.target.value)}
                      className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                        errors.patientName ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.patientName && <p className="text-red-500 text-xs">{errors.patientName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Date of Birth *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200",
                            !formData.dateOfBirth && "text-muted-foreground",
                            errors.dateOfBirth && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Select date of birth</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dateOfBirth}
                          onSelect={(date) => handleInputChange('dateOfBirth', date)}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryDiagnosis" className="text-sm font-medium text-gray-700">
                    Patient's Primary Diagnosis *
                  </Label>
                  <Input
                    id="primaryDiagnosis"
                    type="text"
                    placeholder="Stage IV Lung Cancer"
                    value={formData.primaryDiagnosis}
                    onChange={(e) => handleInputChange('primaryDiagnosis', e.target.value)}
                    className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                      errors.primaryDiagnosis ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.primaryDiagnosis && <p className="text-red-500 text-xs">{errors.primaryDiagnosis}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="medicareNumber" className="text-sm font-medium text-gray-700">
                      Medicare Number (Optional)
                    </Label>
                    <Input
                      id="medicareNumber"
                      type="text"
                      placeholder="1EG4-TE5-MK73"
                      value={formData.medicareNumber}
                      onChange={(e) => handleInputChange('medicareNumber', e.target.value)}
                      className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                        errors.medicareNumber ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.medicareNumber && <p className="text-red-500 text-xs">{errors.medicareNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insuranceProvider" className="text-sm font-medium text-gray-700">
                      Insurance Provider (Optional)
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('insuranceProvider', value)}>
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200">
                        <SelectValue placeholder="Select insurance provider" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                        <SelectItem value="medicare">Medicare</SelectItem>
                        <SelectItem value="aetna">Aetna</SelectItem>
                        <SelectItem value="cigna">Cigna</SelectItem>
                        <SelectItem value="humana">Humana</SelectItem>
                        <SelectItem value="anthem">Anthem</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientAddress" className="text-sm font-medium text-gray-700">
                    Patient's Address (Optional)
                  </Label>
                  <Input
                    id="patientAddress"
                    type="text"
                    placeholder="123 Main St, City, State, ZIP"
                    value={formData.patientAddress}
                    onChange={(e) => handleInputChange('patientAddress', e.target.value)}
                    className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200"
                  />
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Medical Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="advanceDirectives" className="text-sm font-medium text-gray-700">
                    Advance Directives or DNR Status (Optional)
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('advanceDirectives', value)}>
                    <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200">
                      <SelectValue placeholder="Does the patient have an Advance Directive or DNR order?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="yes-both">Yes - Both Advance Directive and DNR</SelectItem>
                      <SelectItem value="yes-directive">Yes - Advance Directive only</SelectItem>
                      <SelectItem value="yes-dnr">Yes - DNR only</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryCarePhysician" className="text-sm font-medium text-gray-700">
                    Primary Care Physician Contact (Optional)
                  </Label>
                  <Input
                    id="primaryCarePhysician"
                    type="text"
                    placeholder="Dr. Smith, (555) 123-4567, email@example.com"
                    value={formData.primaryCarePhysician}
                    onChange={(e) => handleInputChange('primaryCarePhysician', e.target.value)}
                    className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Where can we reach you?
                  </Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 ${
                          errors.phone ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryCaregiver" className="text-sm font-medium text-gray-700">
                    Primary Caregiver Contact (Optional)
                  </Label>
                  <Input
                    id="primaryCaregiver"
                    type="text"
                    placeholder="Name, Relationship, Phone Number"
                    value={formData.primaryCaregiver}
                    onChange={(e) => handleInputChange('primaryCaregiver', e.target.value)}
                    className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200"
                  />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Additional Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalComments" className="text-sm font-medium text-gray-700">
                    Additional Comments/Information (Optional)
                  </Label>
                  <Textarea
                    id="additionalComments"
                    placeholder="Please provide any additional details or concerns"
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                    className="transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Referral'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HospiceReferralForm;
