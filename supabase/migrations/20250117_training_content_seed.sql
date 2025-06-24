-- Clear existing data to avoid duplicates
TRUNCATE public.organization_training_modules CASCADE;
TRUNCATE public.organization_checklists CASCADE;

-- ASSISTED LIVING FACILITIES COMPREHENSIVE CONTENT
-- ================================================

-- Core Value Proposition
INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES
('assisted_living', 'Core Value Proposition', 'value_proposition', 
  '{"title": "Core Value Proposition for Assisted Living",
    "main_message": "Enable aging in place with dignity while reducing family anxiety and liability exposure",
    "positioning": "Position Elevate Hospice as the essential partner that helps facilities fulfill their core mission of allowing residents to remain in their chosen home environment during their final chapter.",
    "key_benefits": [
      {
        "icon": "shield",
        "title": "Reduce Liability",
        "description": "Minimize family complaints and legal exposure through expert end-of-life care"
      },
      {
        "icon": "heart",
        "title": "Family Peace",
        "description": "Provide families confidence their loved one receives specialized care"
      },
      {
        "icon": "trophy",
        "title": "Differentiation",
        "description": "Stand out from competitors with comprehensive end-of-life partnership"
      }
    ]
  }'::jsonb, 1),

-- Stakeholder-specific value propositions
('assisted_living', 'Value Props - Executive Directors', 'value_proposition',
  '{"title": "Value Propositions for Executive Directors",
    "stakeholder": "Executive Director",
    "color": "blue",
    "primary_concerns": [
      "Liability and family complaints",
      "Occupancy rates and reputation",
      "Regulatory compliance",
      "Competitive differentiation"
    ],
    "value_propositions": [
      "Reduce liability exposure and family complaints",
      "Enhance satisfaction scores and reviews",
      "Differentiate from competitors",
      "Support aging-in-place mission"
    ],
    "talking_points": [
      "Our hospice partnership dramatically reduces your liability exposure by providing expert end-of-life care that families trust",
      "We help you maintain higher occupancy rates by enabling residents to stay in your facility through their final days",
      "Partnership with us becomes a powerful marketing tool that differentiates your facility from competitors",
      "We provide 24/7 support that reduces emergency transfers and improves your quality metrics"
    ]
  }'::jsonb, 2),

('assisted_living', 'Value Props - Directors of Nursing', 'value_proposition',
  '{"title": "Value Propositions for Directors of Nursing",
    "stakeholder": "Director of Nursing",
    "color": "green",
    "primary_concerns": [
      "Staff burden with complex residents",
      "Clinical expertise gaps",
      "Family emotional needs",
      "Proper medication management"
    ],
    "value_propositions": [
      "Clinical support for complex cases",
      "Staff education and backup",
      "24/7 on-call nursing support",
      "Pain and symptom management expertise"
    ],
    "talking_points": [
      "Our specialized nurses provide the expertise your staff needs for complex end-of-life situations",
      "We offer regular education sessions to enhance your team''s comfort care skills",
      "24/7 on-call support means your staff never faces difficult situations alone",
      "Our pain management protocols ensure residents receive optimal comfort care"
    ]
  }'::jsonb, 3),

('assisted_living', 'Value Props - Marketing Directors', 'value_proposition',
  '{"title": "Value Propositions for Marketing Directors",
    "stakeholder": "Marketing Director",
    "color": "purple",
    "primary_concerns": [
      "Occupancy and census growth",
      "Family satisfaction and referrals",
      "Competitive positioning",
      "Online reputation management"
    ],
    "value_propositions": [
      "Enhance marketing messages with comprehensive care",
      "Improve family testimonials and reviews",
      "Joint marketing opportunities",
      "Peace of mind positioning"
    ],
    "talking_points": [
      "Hospice partnership becomes a powerful differentiator in your marketing materials",
      "Families write glowing reviews when they see comprehensive end-of-life support",
      "We can co-create marketing materials highlighting your complete care continuum",
      "Position your facility as the place where residents can truly age in place"
    ]
  }'::jsonb, 4),

('assisted_living', 'Value Props - Social Services', 'value_proposition',
  '{"title": "Value Propositions for Social Services Coordinators",
    "stakeholder": "Social Services Coordinator",
    "color": "orange",
    "primary_concerns": [
      "Family emotional support needs",
      "Resident quality of life",
      "Difficult conversations",
      "Resource coordination"
    ],
    "value_propositions": [
      "Professional family counseling support",
      "Smooth transitions and planning",
      "Bereavement services",
      "Specialized social work expertise"
    ],
    "talking_points": [
      "Our social workers provide expert support for difficult family conversations",
      "We offer comprehensive bereavement services that extend beyond the resident''s passing",
      "Our team coordinates all aspects of end-of-life planning, reducing your workload",
      "Families receive emotional support from professionals trained in grief counseling"
    ]
  }'::jsonb, 5),

-- 90-Day Implementation Roadmap
('assisted_living', '90-Day Implementation Roadmap', 'action_plan',
  '{"title": "90-Day Strategic Implementation Plan",
    "overview": "Transform your facility relationships from vendor to strategic partner",
    "phases": [
      {
        "name": "Foundation & Assessment",
        "days": "Days 1-30",
        "color": "blue",
        "focus": "Relationship mapping and facility assessment",
        "key_activities": {
          "relationship_mapping": [
            "Identify all key decision makers",
            "Map existing relationships",
            "Schedule initial meetings",
            "Assess current hospice relationships"
          ],
          "facility_assessment": [
            "Review annual resident losses",
            "Understand current hospice usage",
            "Identify pain points and challenges",
            "Document facility philosophy"
          ]
        }
      },
      {
        "name": "Value Demonstration",
        "days": "Days 31-60",
        "color": "green",
        "focus": "Educational initiatives and partnership development",
        "key_activities": {
          "educational_initiatives": [
            "Deliver targeted case studies",
            "Provide staff in-services",
            "Share best practice resources",
            "Offer family education materials"
          ],
          "partnership_development": [
            "Establish care planning meetings",
            "Create communication protocols",
            "Develop referral processes",
            "Design quality metrics"
          ]
        }
      },
      {
        "name": "Partnership Formalization",
        "days": "Days 61-90",
        "color": "purple",
        "focus": "Program installation and results measurement",
        "key_activities": {
          "program_installation": [
            "Implement differentiating programs",
            "Launch family support initiatives",
            "Establish regular meeting schedule",
            "Create feedback mechanisms"
          ],
          "results_measurement": [
            "Track referral volume and conversion",
            "Monitor family satisfaction",
            "Document staff feedback",
            "Plan quarterly business reviews"
          ]
        }
      }
    ]
  }'::jsonb, 6),

-- Key Performance Indicators
('assisted_living', 'Key Performance Indicators', 'kpi',
  '{"title": "Assisted Living Partnership KPIs",
    "metrics": [
      {
        "category": "Referral Volume",
        "metrics": [
          {"name": "Monthly referrals per facility", "target": "2-3 minimum"},
          {"name": "Percentage of facility deaths served", "target": "60%+"},
          {"name": "Referral conversion rate", "target": "85%+"},
          {"name": "Time from referral to admission", "target": "<24 hours"}
        ]
      },
      {
        "category": "Quality Indicators",
        "metrics": [
          {"name": "Family satisfaction scores", "target": "4.5+ out of 5"},
          {"name": "Staff satisfaction with partnership", "target": "90%+"},
          {"name": "Average length of stay", "target": "Track and optimize"},
          {"name": "Live discharge rates", "target": "<5%"}
        ]
      },
      {
        "category": "Partnership Health",
        "metrics": [
          {"name": "Meeting attendance rates", "target": "90%+"},
          {"name": "Program participation levels", "target": "High engagement"},
          {"name": "Feedback response rates", "target": "80%+"},
          {"name": "Relationship strength assessment", "target": "Quarterly review"}
        ]
      }
    ]
  }'::jsonb, 7),

-- Qualifying Questions
('assisted_living', 'Key Qualifying Questions', 'best_practice',
  '{"title": "Essential Qualifying Questions for Assisted Living",
    "categories": [
      {
        "name": "Discovery Questions",
        "questions": [
          "How many residents did you lose last year?",
          "What percentage received hospice care?",
          "What''s your philosophy on aging in place?",
          "What are your biggest challenges with end-of-life care?",
          "How do families typically respond to terminal diagnoses?",
          "What would ideal hospice partnership look like?"
        ]
      },
      {
        "name": "Opportunity Assessment",
        "questions": [
          "Who makes hospice referral decisions?",
          "How do you handle difficult family situations?",
          "What training does your staff receive?",
          "How do you differentiate from competitors?",
          "What are your occupancy and satisfaction goals?",
          "Would you be open to a partnership demonstration?"
        ]
      }
    ]
  }'::jsonb, 8);

-- CANCER CENTERS COMPREHENSIVE CONTENT
-- =====================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES
-- Core Value Proposition
('clinic', 'Core Value Proposition', 'value_proposition',
  '{"title": "Core Value Proposition for Cancer Centers",
    "main_message": "Seamless continuum of care that enhances patient choice while preserving physician relationships",
    "positioning": "Position Elevate Hospice as the natural extension of oncology care that allows physicians to maintain relationships while providing specialized end-of-life expertise.",
    "key_benefits": [
      {
        "icon": "handshake",
        "title": "Preserve Relationships",
        "description": "Enable physicians to remain involved while providing specialized comfort care"
      },
      {
        "icon": "clock",
        "title": "Reduce Burden",
        "description": "Minimize after-hours calls and crisis management for practice staff"
      },
      {
        "icon": "chart-line",
        "title": "Enhanced Outcomes",
        "description": "Improve patient satisfaction and quality of life measures"
      }
    ]
  }'::jsonb, 1),

-- Stakeholder-specific value propositions
('clinic', 'Value Props - Oncologists', 'value_proposition',
  '{"title": "Value Propositions for Oncologists",
    "stakeholder": "Oncologists",
    "color": "green",
    "primary_concerns": [
      "Maintaining patient relationships",
      "After-hours calls and crises",
      "Patient/family satisfaction",
      "Appropriate timing of referrals"
    ],
    "value_propositions": [
      "Maintain relationships while providing expert comfort care",
      "Reduce after-hours burden with 24/7 support",
      "Enhance outcomes and patient satisfaction",
      "Collaborative rather than handoff approach"
    ],
    "talking_points": [
      "We believe in collaborative care - you remain the attending physician while we provide specialized support",
      "Our 24/7 team handles after-hours symptom management, reducing your call burden",
      "Studies show concurrent hospice care improves patient satisfaction and quality of life",
      "We work with you to determine optimal timing for hospice conversations"
    ]
  }'::jsonb, 2),

('clinic', 'Value Props - Nurse Navigators', 'value_proposition',
  '{"title": "Value Propositions for Nurse Navigators",
    "stakeholder": "Nurse Navigators",
    "color": "blue",
    "primary_concerns": [
      "Seamless care transitions",
      "Patient/family education needs",
      "Resource coordination",
      "Communication management"
    ],
    "value_propositions": [
      "Streamlined transitions and care coordination",
      "Comprehensive family support and education",
      "Clear communication protocols",
      "Expert navigation of end-of-life decisions"
    ],
    "talking_points": [
      "We become an extension of your navigation team for end-of-life care",
      "Our educators provide comprehensive family support, reducing your workload",
      "We establish clear communication protocols to keep everyone informed",
      "Our expertise helps families navigate complex end-of-life decisions"
    ]
  }'::jsonb, 3),

('clinic', 'Value Props - Social Workers', 'value_proposition',
  '{"title": "Value Propositions for Social Workers",
    "stakeholder": "Social Workers",
    "color": "purple",
    "primary_concerns": [
      "Family emotional support",
      "Resource limitations",
      "Complex psychosocial needs",
      "Discharge planning challenges"
    ],
    "value_propositions": [
      "Expand available resources and support",
      "Specialized counseling expertise",
      "Bereavement and grief support",
      "Collaborative care planning"
    ],
    "talking_points": [
      "Our social workers expand your team''s capacity for complex cases",
      "We provide specialized grief and bereavement counseling",
      "Our resources complement yours to meet all family needs",
      "Together we create comprehensive discharge and care plans"
    ]
  }'::jsonb, 4),

('clinic', 'Value Props - Practice Administrators', 'value_proposition',
  '{"title": "Value Propositions for Practice Administrators",
    "stakeholder": "Practice Administrators",
    "color": "orange",
    "primary_concerns": [
      "Practice efficiency and flow",
      "Staff workload management",
      "Patient satisfaction scores",
      "Regulatory compliance"
    ],
    "value_propositions": [
      "Reduce administrative burden on practice",
      "Improve patient satisfaction metrics",
      "Streamline care coordination",
      "Support quality and compliance goals"
    ],
    "talking_points": [
      "We handle the complex administrative aspects of end-of-life care",
      "Hospice involvement consistently improves patient satisfaction scores",
      "Our care coordination reduces staff workload and improves efficiency",
      "We help you meet quality metrics and regulatory requirements"
    ]
  }'::jsonb, 5),

-- 90-Day Implementation for Cancer Centers
('clinic', '90-Day Implementation Roadmap', 'action_plan',
  '{"title": "90-Day Cancer Center Partnership Plan",
    "overview": "Build collaborative relationships that enhance patient care while preserving physician involvement",
    "phases": [
      {
        "name": "Assessment & Relationship Building",
        "days": "Days 1-30",
        "color": "green",
        "focus": "Practice analysis and relationship development",
        "key_activities": {
          "practice_analysis": [
            "Review patient volume and demographics",
            "Understand current hospice referral patterns",
            "Identify key decision makers",
            "Assess practice philosophy and values"
          ],
          "relationship_development": [
            "Meet with oncologists individually",
            "Connect with nurse navigators",
            "Introduce to practice administrator",
            "Engage social work team"
          ]
        }
      },
      {
        "name": "Collaboration Development",
        "days": "Days 31-60",
        "color": "blue",
        "focus": "Process integration and education",
        "key_activities": {
          "process_integration": [
            "Develop referral protocols",
            "Create communication templates",
            "Establish consultation processes",
            "Design patient education materials"
          ],
          "education_training": [
            "Provide hospice education sessions",
            "Share relevant case studies",
            "Offer continuing education opportunities",
            "Create resource libraries"
          ]
        }
      },
      {
        "name": "Partnership Optimization",
        "days": "Days 61-90",
        "color": "purple",
        "focus": "Service enhancement and performance measurement",
        "key_activities": {
          "service_enhancement": [
            "Launch specialized programs",
            "Implement physician collaboration model",
            "Establish regular consultation schedule",
            "Create family support initiatives"
          ],
          "performance_measurement": [
            "Track referral patterns and outcomes",
            "Monitor patient/family satisfaction",
            "Measure physician engagement",
            "Plan quarterly partnership reviews"
          ]
        }
      }
    ]
  }'::jsonb, 6),

-- Specialized Programs for Cancer Centers
('clinic', 'Specialized Cancer Center Programs', 'best_practice',
  '{"title": "Cancer Center Specialized Programs",
    "programs": [
      {
        "name": "Oncologist Collaboration Model",
        "icon": "user-md",
        "components": [
          "Regular physician-to-physician consultations",
          "Continued involvement in care planning",
          "Shared decision-making protocols",
          "Joint family conferences",
          "Concurrent care arrangements when appropriate"
        ]
      },
      {
        "name": "Education & Support Programs",
        "icon": "graduation-cap",
        "components": [
          "Continuing education offerings",
          "Case study presentations",
          "Best practice sharing sessions",
          "Family education workshops",
          "Staff support and debriefing"
        ]
      },
      {
        "name": "Family-Centered Initiatives",
        "icon": "heart",
        "components": [
          "Specialized cancer family support groups",
          "Advanced directive assistance",
          "Caregiver education and training",
          "Bereavement support programs",
          "Memorial and celebration services"
        ]
      },
      {
        "name": "Quality & Outcomes Tracking",
        "icon": "chart-bar",
        "components": [
          "Patient satisfaction metrics",
          "Pain and symptom management outcomes",
          "Family satisfaction surveys",
          "Physician satisfaction feedback",
          "Quality of life measurements"
        ]
      }
    ]
  }'::jsonb, 7),

-- Cancer Center KPIs
('clinic', 'Key Performance Indicators', 'kpi',
  '{"title": "Cancer Center Partnership KPIs",
    "metrics": [
      {
        "category": "Referral Patterns",
        "metrics": [
          {"name": "Referrals per oncologist", "target": "Track monthly"},
          {"name": "Timing of referrals", "target": "Earlier is better"},
          {"name": "Referral source diversity", "target": "Multiple providers"},
          {"name": "Conversion rates", "target": "80%+"}
        ]
      },
      {
        "category": "Clinical Outcomes",
        "metrics": [
          {"name": "Pain management effectiveness", "target": "90%+ controlled"},
          {"name": "Symptom control measures", "target": "High satisfaction"},
          {"name": "Patient satisfaction scores", "target": "4.5+ out of 5"},
          {"name": "Family satisfaction ratings", "target": "4.5+ out of 5"}
        ]
      },
      {
        "category": "Physician Engagement",
        "metrics": [
          {"name": "Consultation participation", "target": "High engagement"},
          {"name": "Education session attendance", "target": "75%+"},
          {"name": "Collaborative care instances", "target": "Track growth"},
          {"name": "Physician satisfaction", "target": "Regular feedback"}
        ]
      }
    ]
  }'::jsonb, 8);

-- CHECKLISTS FOR ASSISTED LIVING FACILITIES
-- ==========================================

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES
-- Days 1-15: Foundation Phase
('assisted_living', 'Relationship Mapping & Initial Assessment', 'foundation',
  '[
    {"id": "1", "task": "Identify and document all key stakeholders (ED, DON, Marketing, Social Services)", "priority": "high"},
    {"id": "2", "task": "Map existing hospice relationships and competitive landscape", "priority": "high"},
    {"id": "3", "task": "Schedule initial meet-and-greet with Executive Director", "priority": "high"},
    {"id": "4", "task": "Review facility''s annual resident mortality data", "priority": "high"},
    {"id": "5", "task": "Assess current hospice utilization percentage", "priority": "high"},
    {"id": "6", "task": "Document facility''s aging-in-place philosophy", "priority": "medium"},
    {"id": "7", "task": "Identify top 3 pain points in end-of-life care", "priority": "high"},
    {"id": "8", "task": "Create customized value proposition for each stakeholder", "priority": "medium"}
  ]'::jsonb, 1, '1-15'),

-- Days 16-30: Foundation Completion
('assisted_living', 'Stakeholder Engagement & Needs Analysis', 'foundation',
  '[
    {"id": "1", "task": "Conduct individual meetings with Director of Nursing", "priority": "high"},
    {"id": "2", "task": "Meet with Marketing Director to understand positioning goals", "priority": "medium"},
    {"id": "3", "task": "Connect with Social Services for family support insights", "priority": "medium"},
    {"id": "4", "task": "Tour facility to understand layout and resident needs", "priority": "medium"},
    {"id": "5", "task": "Review recent family satisfaction scores and complaints", "priority": "high"},
    {"id": "6", "task": "Analyze competitive facilities and their hospice partnerships", "priority": "low"},
    {"id": "7", "task": "Prepare customized case studies relevant to facility", "priority": "high"},
    {"id": "8", "task": "Schedule first educational in-service for staff", "priority": "high"}
  ]'::jsonb, 2, '16-30'),

-- Days 31-45: Value Demonstration
('assisted_living', 'Education & Value Demonstration', 'engagement',
  '[
    {"id": "1", "task": "Deliver first staff in-service on hospice benefits", "priority": "high"},
    {"id": "2", "task": "Provide facility-specific case studies to leadership", "priority": "high"},
    {"id": "3", "task": "Share best practice resources for end-of-life care", "priority": "medium"},
    {"id": "4", "task": "Offer family education materials for facility use", "priority": "medium"},
    {"id": "5", "task": "Demonstrate 24/7 on-call support capabilities", "priority": "high"},
    {"id": "6", "task": "Present liability reduction strategies to Executive Director", "priority": "high"},
    {"id": "7", "task": "Show marketing differentiation opportunities", "priority": "medium"},
    {"id": "8", "task": "Introduce specialized programs (pet therapy, music therapy)", "priority": "low"}
  ]'::jsonb, 3, '31-45'),

-- Days 46-60: Partnership Development
('assisted_living', 'Process Development & Integration', 'engagement',
  '[
    {"id": "1", "task": "Establish regular care planning meeting schedule", "priority": "high"},
    {"id": "2", "task": "Create facility-specific communication protocols", "priority": "high"},
    {"id": "3", "task": "Develop streamlined referral process", "priority": "high"},
    {"id": "4", "task": "Design quality metrics tracking system", "priority": "medium"},
    {"id": "5", "task": "Implement rapid response protocol for urgent referrals", "priority": "high"},
    {"id": "6", "task": "Create family meeting space and protocols", "priority": "medium"},
    {"id": "7", "task": "Begin pilot program with 2-3 residents", "priority": "high"},
    {"id": "8", "task": "Collect initial staff and family feedback", "priority": "medium"}
  ]'::jsonb, 4, '46-60'),

-- Days 61-75: Program Installation
('assisted_living', 'Program Launch & Optimization', 'optimization',
  '[
    {"id": "1", "task": "Launch differentiating programs (pet therapy, music therapy)", "priority": "medium"},
    {"id": "2", "task": "Implement family support group initiatives", "priority": "medium"},
    {"id": "3", "task": "Establish regular nursing rounds schedule", "priority": "high"},
    {"id": "4", "task": "Create feedback collection mechanisms", "priority": "high"},
    {"id": "5", "task": "Begin tracking all KPI metrics", "priority": "high"},
    {"id": "6", "task": "Document first success story for marketing use", "priority": "medium"},
    {"id": "7", "task": "Plan joint marketing initiatives with facility", "priority": "low"},
    {"id": "8", "task": "Schedule monthly business review meetings", "priority": "high"}
  ]'::jsonb, 5, '61-75'),

-- Days 76-90: Partnership Formalization
('assisted_living', 'Partnership Formalization & Measurement', 'optimization',
  '[
    {"id": "1", "task": "Draft formal partnership agreement or MOU", "priority": "high"},
    {"id": "2", "task": "Define success metrics and reporting schedule", "priority": "high"},
    {"id": "3", "task": "Conduct first monthly business review", "priority": "high"},
    {"id": "4", "task": "Create co-branded family education materials", "priority": "medium"},
    {"id": "5", "task": "Document and share initial outcomes data", "priority": "high"},
    {"id": "6", "task": "Plan quarterly partnership review schedule", "priority": "high"},
    {"id": "7", "task": "Celebrate early wins with facility staff", "priority": "medium"},
    {"id": "8", "task": "Develop plan for continued growth and expansion", "priority": "medium"}
  ]'::jsonb, 6, '76-90');

-- CHECKLISTS FOR CANCER CENTERS
-- =============================

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES
-- Days 1-15: Assessment Phase
('clinic', 'Practice Assessment & Stakeholder Mapping', 'foundation',
  '[
    {"id": "1", "task": "Review patient volume, demographics, and mortality data", "priority": "high"},
    {"id": "2", "task": "Map all oncologists and their referral patterns", "priority": "high"},
    {"id": "3", "task": "Identify nurse navigators and their roles", "priority": "high"},
    {"id": "4", "task": "Connect with social work team leadership", "priority": "medium"},
    {"id": "5", "task": "Meet with practice administrator", "priority": "high"},
    {"id": "6", "task": "Understand current hospice referral process", "priority": "high"},
    {"id": "7", "task": "Assess practice philosophy on end-of-life care", "priority": "medium"},
    {"id": "8", "task": "Review patient satisfaction scores and pain points", "priority": "medium"}
  ]'::jsonb, 1, '1-15'),

-- Days 16-30: Relationship Building
('clinic', 'Physician Engagement & Relationship Development', 'foundation',
  '[
    {"id": "1", "task": "Schedule individual meetings with key oncologists", "priority": "high"},
    {"id": "2", "task": "Present collaborative care model to physicians", "priority": "high"},
    {"id": "3", "task": "Address concerns about maintaining patient relationships", "priority": "high"},
    {"id": "4", "task": "Discuss after-hours support and burden reduction", "priority": "high"},
    {"id": "5", "task": "Connect with nurse navigator team", "priority": "medium"},
    {"id": "6", "task": "Meet with tumor board coordinator", "priority": "low"},
    {"id": "7", "task": "Engage social work and counseling teams", "priority": "medium"},
    {"id": "8", "task": "Present to practice leadership team", "priority": "high"}
  ]'::jsonb, 2, '16-30'),

-- Days 31-45: Process Integration
('clinic', 'Care Process Integration & Protocol Development', 'engagement',
  '[
    {"id": "1", "task": "Develop physician-friendly referral protocols", "priority": "high"},
    {"id": "2", "task": "Create communication templates for care updates", "priority": "high"},
    {"id": "3", "task": "Establish consultation request process", "priority": "high"},
    {"id": "4", "task": "Design concurrent care pathways", "priority": "medium"},
    {"id": "5", "task": "Create patient/family education materials", "priority": "medium"},
    {"id": "6", "task": "Develop joint family conference protocols", "priority": "medium"},
    {"id": "7", "task": "Set up physician-to-physician consultation schedule", "priority": "high"},
    {"id": "8", "task": "Integrate with EMR systems if possible", "priority": "low"}
  ]'::jsonb, 3, '31-45'),

-- Days 46-60: Education & Training
('clinic', 'Education Programs & Clinical Integration', 'engagement',
  '[
    {"id": "1", "task": "Deliver CME-accredited hospice education session", "priority": "high"},
    {"id": "2", "task": "Share oncology-specific case studies", "priority": "high"},
    {"id": "3", "task": "Provide symptom management best practices", "priority": "high"},
    {"id": "4", "task": "Offer continuing education opportunities", "priority": "medium"},
    {"id": "5", "task": "Create resource library for practice", "priority": "medium"},
    {"id": "6", "task": "Train staff on referral processes", "priority": "high"},
    {"id": "7", "task": "Establish regular education schedule", "priority": "medium"},
    {"id": "8", "task": "Begin pilot collaboration with 1-2 physicians", "priority": "high"}
  ]'::jsonb, 4, '46-60'),

-- Days 61-75: Service Enhancement
('clinic', 'Specialized Program Launch', 'optimization',
  '[
    {"id": "1", "task": "Launch oncologist collaboration model", "priority": "high"},
    {"id": "2", "task": "Implement 24/7 physician consultation line", "priority": "high"},
    {"id": "3", "task": "Start cancer-specific family support groups", "priority": "medium"},
    {"id": "4", "task": "Begin regular tumor board participation", "priority": "low"},
    {"id": "5", "task": "Establish joint care planning meetings", "priority": "high"},
    {"id": "6", "task": "Create family education workshop series", "priority": "medium"},
    {"id": "7", "task": "Implement quality tracking metrics", "priority": "high"},
    {"id": "8", "task": "Document early success stories", "priority": "medium"}
  ]'::jsonb, 5, '61-75'),

-- Days 76-90: Partnership Optimization
('clinic', 'Performance Measurement & Growth Planning', 'optimization',
  '[
    {"id": "1", "task": "Analyze referral patterns and timing data", "priority": "high"},
    {"id": "2", "task": "Measure patient/family satisfaction scores", "priority": "high"},
    {"id": "3", "task": "Collect physician engagement feedback", "priority": "high"},
    {"id": "4", "task": "Track clinical outcome metrics", "priority": "high"},
    {"id": "5", "task": "Conduct first quarterly partnership review", "priority": "high"},
    {"id": "6", "task": "Share outcomes data with practice leadership", "priority": "high"},
    {"id": "7", "task": "Plan expansion to additional physicians", "priority": "medium"},
    {"id": "8", "task": "Develop case studies for future marketing", "priority": "medium"}
  ]'::jsonb, 6, '76-90');

-- Add placeholder content for other organization types
INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES
('hospital', 'Hospital Partnership Strategy', 'value_proposition',
  '{"title": "Hospital Partnership Value Propositions",
    "description": "Comprehensive approach to hospital partnerships focusing on reducing readmissions and improving discharge planning",
    "key_benefits": [
      {"title": "Reduce Readmissions", "description": "Lower 30-day readmission rates through expert care transitions"},
      {"title": "Improve HCAHPS", "description": "Enhance patient satisfaction scores with comprehensive end-of-life care"},
      {"title": "Streamline Discharge", "description": "Faster, more efficient discharge planning for complex patients"}
    ]
  }'::jsonb, 1),

('physician_office', 'Primary Care Partnership Excellence', 'value_proposition', 
  '{"title": "Physician Office Partnership Guide",
    "description": "Building strong relationships with primary care physicians through collaborative care models",
    "key_benefits": [
      {"title": "Maintain Relationships", "description": "Physicians remain involved while hospice provides specialized support"},
      {"title": "24/7 Clinical Support", "description": "Reduce after-hours calls with round-the-clock nursing coverage"},
      {"title": "Reduce Call Burden", "description": "Handle symptom management and crisis situations"}
    ]
  }'::jsonb, 1),

('nursing_home', 'Skilled Nursing Facility Excellence', 'value_proposition',
  '{"title": "SNF Partnership Strategy", 
    "description": "Comprehensive approach to SNF partnerships focusing on quality metrics and survey readiness",
    "key_benefits": [
      {"title": "Improve Quality Metrics", "description": "Enhance Five-Star ratings with better end-of-life care"},
      {"title": "Reduce Hospitalizations", "description": "Lower transfer rates through proactive symptom management"},
      {"title": "Survey Support", "description": "Documentation and care planning that supports positive surveys"}
    ]
  }'::jsonb, 1),

('home_health', 'Home Health Collaboration Excellence', 'value_proposition',
  '{"title": "Home Health Agency Partnerships",
    "description": "Collaborative care model that complements home health services", 
    "key_benefits": [
      {"title": "Seamless Transitions", "description": "Smooth handoffs that maintain continuity of care"},
      {"title": "Shared Planning", "description": "Collaborative care planning that leverages both teams"},
      {"title": "Complementary Services", "description": "Fill gaps in service offerings for complex patients"}
    ]
  }'::jsonb, 1); 