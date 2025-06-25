
-- Complete Training Content for All Organization Types
-- This migration adds comprehensive training content for all remaining organization types

-- Clear any existing placeholder content
DELETE FROM public.organization_training_modules 
WHERE organization_type IN ('physician_office', 'nursing_home', 'home_health', 'clinic', 'assisted_living');

DELETE FROM public.organization_checklists 
WHERE organization_type IN ('physician_office', 'nursing_home', 'home_health', 'clinic', 'assisted_living');

-- =====================================================
-- PHYSICIAN OFFICE TRAINING CONTENT
-- =====================================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

-- Physician Office Core Value Proposition
('physician_office', 'Core Value Proposition', 'value_proposition',
'{
  "title": "Physician Office Partnership Excellence",
  "main_message": "Maintain patient relationships while providing specialized end-of-life expertise",
  "positioning": "Position Elevate Hospice as a collaborative partner that enhances your practice ability to provide comprehensive care throughout the patient journey.",
  "key_benefits": [
    {
      "icon": "stethoscope",
      "title": "Continued Involvement",
      "description": "Physicians maintain relationships and remain involved in care decisions"
    },
    {
      "icon": "phone",
      "title": "Reduced Call Burden",
      "description": "24/7 coverage for after-hours symptom management and crises"
    },
    {
      "icon": "star",
      "title": "Enhanced Satisfaction",
      "description": "Improved patient and family satisfaction scores"
    }
  ],
  "talking_points": [
    "We support your existing physician-patient relationships",
    "Our 24/7 medical coverage reduces after-hours calls",
    "Families appreciate seamless transitions and continued care coordination",
    "We provide specialized expertise while you remain the primary physician"
  ]
}'::jsonb, 1),

-- Physician Office Stakeholder Value Props
('physician_office', 'Value Props - Primary Care Physicians', 'value_proposition',
'{
  "title": "Primary Care Physician Benefits",
  "description": "How hospice partnership enhances primary care practice",
  "key_benefits": [
    {
      "title": "Maintained Relationships",
      "description": "Continue seeing patients and families throughout hospice care",
      "color": "blue"
    },
    {
      "title": "24/7 Medical Support",
      "description": "Hospice medical director available for complex symptom management",
      "color": "green"
    },
    {
      "title": "Reduced Liability",
      "description": "Hospice assumes primary responsibility for end-of-life care decisions",
      "color": "purple"
    }
  ]
}'::jsonb, 2),

('physician_office', 'Value Props - Practice Administrators', 'value_proposition',
'{
  "title": "Practice Administrator Benefits",
  "description": "Operational advantages of hospice partnerships",
  "key_benefits": [
    {
      "title": "Reduced Emergency Calls",
      "description": "24/7 hospice coverage decreases after-hours practice calls",
      "color": "orange"
    },
    {
      "title": "Improved Efficiency",
      "description": "Hospice manages complex end-of-life care coordination",
      "color": "red"
    },
    {
      "title": "Enhanced Reputation",
      "description": "Known for comprehensive, compassionate care throughout patient journey",
      "color": "teal"
    }
  ]
}'::jsonb, 3);

-- Insert Physician Office Checklists
INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

('physician_office', 'Practice Assessment & Initial Outreach', 'foundation',
'[
  {"id": "po1", "task": "Research practice size, specialties, and patient volume", "priority": "high"},
  {"id": "po2", "task": "Identify key physicians and decision makers", "priority": "high"},
  {"id": "po3", "task": "Map current referral patterns and hospice relationships", "priority": "high"},
  {"id": "po4", "task": "Schedule meet-and-greet with practice administrator", "priority": "high"},
  {"id": "po5", "task": "Understand practice workflow and culture", "priority": "medium"},
  {"id": "po6", "task": "Identify pain points in end-of-life care management", "priority": "high"},
  {"id": "po7", "task": "Review patient satisfaction scores if available", "priority": "medium"},
  {"id": "po8", "task": "Prepare customized value propositions", "priority": "high"}
]'::jsonb, 1, 'Days 1-15'),

('physician_office', 'Physician Engagement & Education', 'engagement',
'[
  {"id": "po9", "task": "Schedule individual meetings with key physicians", "priority": "high"},
  {"id": "po10", "task": "Present hospice eligibility criteria and referral process", "priority": "high"},
  {"id": "po11", "task": "Discuss collaborative care model and physician involvement", "priority": "high"},
  {"id": "po12", "task": "Address concerns about patient relationship continuity", "priority": "high"},
  {"id": "po13", "task": "Provide education on prognostication tools", "priority": "medium"},
  {"id": "po14", "task": "Share success stories from similar practices", "priority": "medium"},
  {"id": "po15", "task": "Establish regular communication schedule", "priority": "high"},
  {"id": "po16", "task": "Create referral pathway documentation", "priority": "medium"}
]'::jsonb, 2, 'Days 16-30');

-- =====================================================
-- SKILLED NURSING FACILITY TRAINING CONTENT
-- =====================================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

('nursing_home', 'Core Value Proposition', 'value_proposition',
'{
  "title": "Skilled Nursing Facility Partnership Excellence",
  "main_message": "Optimize census management while providing specialized end-of-life expertise",
  "positioning": "Position Elevate Hospice as a strategic partner that enhances facility operations while providing superior end-of-life care.",
  "key_benefits": [
    {
      "icon": "users",
      "title": "Census Optimization",
      "description": "Keep patients in facility longer with appropriate hospice care"
    },
    {
      "icon": "shield",
      "title": "Reduced Liability",
      "description": "Hospice assumes medical responsibility for terminal diagnoses"
    },
    {
      "icon": "star",
      "title": "Improved Ratings",
      "description": "Better family satisfaction and quality metrics"
    }
  ]
}'::jsonb, 1),

('nursing_home', 'Value Props - Facility Administrators', 'value_proposition',
'{
  "title": "Administrator Strategic Benefits",
  "description": "Financial and operational advantages for facility leadership",
  "key_benefits": [
    {
      "title": "Revenue Optimization",
      "description": "Maintain census with dual Medicare/facility billing",
      "color": "green"
    },
    {
      "title": "Quality Metrics",
      "description": "Improved star ratings through better end-of-life care",
      "color": "blue"
    },
    {
      "title": "Liability Reduction",
      "description": "Hospice medical team assumes primary care responsibility",
      "color": "purple"
    }
  ]
}'::jsonb, 2);

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

('nursing_home', 'Facility Assessment & Leadership Engagement', 'foundation',
'[
  {"id": "snf1", "task": "Meet with facility administrator to discuss partnership goals", "priority": "high"},
  {"id": "snf2", "task": "Assess current census and occupancy patterns", "priority": "high"},
  {"id": "snf3", "task": "Review facility quality ratings and improvement goals", "priority": "medium"},
  {"id": "snf4", "task": "Meet with Director of Nursing and clinical team", "priority": "high"},
  {"id": "snf5", "task": "Understand current hospice relationships and utilization", "priority": "high"},
  {"id": "snf6", "task": "Identify residents who could benefit from hospice care", "priority": "medium"},
  {"id": "snf7", "task": "Review facility policies on end-of-life care", "priority": "medium"},
  {"id": "snf8", "task": "Assess family communication and satisfaction processes", "priority": "medium"}
]'::jsonb, 1, 'Days 1-15');

-- =====================================================
-- HOME HEALTH AGENCY TRAINING CONTENT
-- =====================================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

('home_health', 'Core Value Proposition', 'value_proposition',
'{
  "title": "Home Health Agency Partnership Excellence",
  "main_message": "Natural continuum of care partnerships for seamless patient transitions",
  "positioning": "Position Elevate Hospice as the ideal partner for seamless care transitions and mutual referrals.",
  "key_benefits": [
    {
      "icon": "arrow-right",
      "title": "Seamless Transitions",
      "description": "Natural progression from home health to hospice care"
    },
    {
      "icon": "repeat",
      "title": "Bidirectional Referrals",
      "description": "Mutual referral opportunities expand both services"
    },
    {
      "icon": "handshake",
      "title": "Collaborative Care",
      "description": "Joint care planning and family support"
    }
  ]
}'::jsonb, 1),

('home_health', 'Value Props - Agency Administrators', 'value_proposition',
'{
  "title": "Home Health Administrator Benefits",
  "description": "Strategic advantages for home health leadership",
  "key_benefits": [
    {
      "title": "Extended Care Continuum",
      "description": "Provide complete home-based care from skilled nursing through end-of-life",
      "color": "blue"
    },
    {
      "title": "Referral Growth",
      "description": "Receive referrals for patients transitioning off hospice to skilled care",
      "color": "green"
    },
    {
      "title": "Market Differentiation",
      "description": "Offer comprehensive home care solutions with trusted hospice partner",
      "color": "purple"
    }
  ]
}'::jsonb, 2);

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

('home_health', 'Agency Assessment & Partnership Planning', 'foundation',
'[
  {"id": "hh1", "task": "Meet with agency owner/administrator to discuss partnership vision", "priority": "high"},
  {"id": "hh2", "task": "Understand current patient census and diagnoses served", "priority": "high"},
  {"id": "hh3", "task": "Assess referral sources and discharge patterns", "priority": "medium"},
  {"id": "hh4", "task": "Meet with clinical director and case managers", "priority": "high"},
  {"id": "hh5", "task": "Review current hospice referral relationships", "priority": "medium"},
  {"id": "hh6", "task": "Identify opportunities for bidirectional referrals", "priority": "high"},
  {"id": "hh7", "task": "Discuss joint marketing and education opportunities", "priority": "medium"},
  {"id": "hh8", "task": "Plan integrated care coordination processes", "priority": "high"}
]'::jsonb, 1, 'Days 1-15');

-- =====================================================
-- CANCER CENTER/CLINIC TRAINING CONTENT
-- =====================================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

('clinic', 'Core Value Proposition', 'value_proposition',
'{
  "title": "Cancer Center Partnership Excellence",
  "main_message": "Specialized oncology expertise meets comprehensive hospice care",
  "positioning": "Position Elevate Hospice as the specialized partner that understands oncology and provides seamless end-of-life transitions.",
  "key_benefits": [
    {
      "icon": "heart",
      "title": "Oncology Expertise",
      "description": "Specialized understanding of cancer patient needs and family dynamics"
    },
    {
      "icon": "clock",
      "title": "Timely Transitions",
      "description": "Smooth transitions from curative to comfort care when appropriate"
    },
    {
      "icon": "users",
      "title": "Continued Relationships",
      "description": "Oncologists remain involved in patient care and family support"
    }
  ]
}'::jsonb, 1),

('clinic', 'Value Props - Oncologists', 'value_proposition',
'{
  "title": "Oncologist Partnership Benefits",
  "description": "Clinical advantages for cancer specialists",
  "key_benefits": [
    {
      "title": "Specialized Support",
      "description": "Hospice team with oncology experience and understanding",
      "color": "purple"
    },
    {
      "title": "Continued Involvement",
      "description": "Remain connected with patients and families during hospice care",
      "color": "blue"
    },
    {
      "title": "Difficult Conversations",
      "description": "Expert support for goals of care and prognosis discussions",
      "color": "green"
    }
  ]
}'::jsonb, 2);

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

('clinic', 'Cancer Center Assessment & Oncologist Engagement', 'foundation',
'[
  {"id": "cc1", "task": "Meet with medical director and lead oncologists", "priority": "high"},
  {"id": "cc2", "task": "Understand center specialties and patient demographics", "priority": "high"},
  {"id": "cc3", "task": "Assess current hospice referral patterns and timing", "priority": "high"},
  {"id": "cc4", "task": "Review center policies on end-of-life care transitions", "priority": "medium"},
  {"id": "cc5", "task": "Meet with social work and patient navigation teams", "priority": "high"},
  {"id": "cc6", "task": "Understand family support services currently offered", "priority": "medium"},
  {"id": "cc7", "task": "Identify opportunities for early palliative/hospice consultation", "priority": "high"},
  {"id": "cc8", "task": "Plan education on hospice eligibility for oncology patients", "priority": "medium"}
]'::jsonb, 1, 'Days 1-15');

-- =====================================================
-- ASSISTED LIVING FACILITY TRAINING CONTENT
-- =====================================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

('assisted_living', 'Core Value Proposition', 'value_proposition',
'{
  "title": "Assisted Living Facility Partnership Excellence",
  "main_message": "Enable aging in place with comprehensive hospice support",
  "positioning": "Position Elevate Hospice as the partner that helps residents remain in their chosen home environment through end-of-life.",
  "key_benefits": [
    {
      "icon": "home",
      "title": "Aging in Place",
      "description": "Residents can remain in familiar environment with family nearby"
    },
    {
      "icon": "heart-handshake",
      "title": "Family Satisfaction",
      "description": "Families appreciate continuity of care and familiar surroundings"
    },
    {
      "icon": "shield-check",
      "title": "Enhanced Care",
      "description": "24/7 medical support supplements facility care capabilities"
    }
  ]
}'::jsonb, 1),

('assisted_living', 'Value Props - Facility Administrators', 'value_proposition',
'{
  "title": "Assisted Living Administrator Benefits",
  "description": "Operational advantages for facility leadership",
  "key_benefits": [
    {
      "title": "Resident Retention",
      "description": "Residents can remain in facility longer with hospice support",
      "color": "green"
    },
    {
      "title": "Family Satisfaction",
      "description": "Families appreciate ability to keep loved ones in chosen home",
      "color": "blue"
    },
    {
      "title": "Care Enhancement",
      "description": "Professional medical team supplements facility care capabilities",
      "color": "purple"
    }
  ]
}'::jsonb, 2);

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

('assisted_living', 'Facility Assessment & Staff Education', 'foundation',
'[
  {"id": "alf1", "task": "Meet with facility administrator and care coordinators", "priority": "high"},
  {"id": "alf2", "task": "Assess current resident census and care levels", "priority": "high"},
  {"id": "alf3", "task": "Review facility policies on end-of-life care", "priority": "medium"},
  {"id": "alf4", "task": "Meet with nursing staff and care managers", "priority": "high"},
  {"id": "alf5", "task": "Understand current healthcare provider relationships", "priority": "medium"},
  {"id": "alf6", "task": "Identify residents who could benefit from hospice evaluation", "priority": "high"},
  {"id": "alf7", "task": "Plan staff education on hospice services and eligibility", "priority": "high"},
  {"id": "alf8", "task": "Develop communication plan for families and residents", "priority": "medium"}
]'::jsonb, 1, 'Days 1-15'),

('assisted_living', 'Implementation & Care Coordination', 'engagement',
'[
  {"id": "alf9", "task": "Establish regular rounds schedule with facility nurses", "priority": "high"},
  {"id": "alf10", "task": "Create communication protocols for care coordination", "priority": "high"},
  {"id": "alf11", "task": "Implement family meeting processes for care planning", "priority": "high"},
  {"id": "alf12", "task": "Train facility staff on hospice care plan integration", "priority": "medium"},
  {"id": "alf13", "task": "Establish emergency response protocols", "priority": "high"},
  {"id": "alf14", "task": "Create resident and family education materials", "priority": "medium"},
  {"id": "alf15", "task": "Begin tracking quality metrics and satisfaction", "priority": "medium"},
  {"id": "alf16", "task": "Plan regular case review meetings with facility staff", "priority": "high"}
]'::jsonb, 2, 'Days 16-30');
