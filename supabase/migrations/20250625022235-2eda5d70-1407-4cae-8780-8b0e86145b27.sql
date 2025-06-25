
-- Hospital Training Content Migration
-- This migration adds comprehensive training content for hospital partnerships

-- First, delete any existing placeholder content for hospitals
DELETE FROM public.organization_training_modules 
WHERE organization_type = 'hospital';

DELETE FROM public.organization_checklists 
WHERE organization_type = 'hospital';

-- Insert comprehensive hospital training modules
INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

-- Core Value Proposition
('hospital', 'Core Value Proposition', 'value_proposition',
'{
  "title": "Hospital Partnership Excellence",
  "description": "Elevate Hospice provides seamless continuity of care for hospital patients requiring end-of-life services, reducing readmissions and improving patient satisfaction.",
  "points": [
    "24/7 admissions capability with rapid response times (2-4 hours)",
    "Dedicated hospital liaison team for smooth transitions",
    "Reduce 30-day readmissions through appropriate hospice referrals",
    "Improve HCAHPS scores through better end-of-life care coordination",
    "Free up acute care beds for higher acuity patients",
    "Comprehensive family support reducing emergency department returns",
    "Expert symptom management preventing crisis admissions",
    "Joint care planning with hospital teams"
  ],
  "talking_points": [
    "We understand the pressure hospitals face with length of stay and readmission metrics",
    "Our rapid response team can assess patients within hours, not days",
    "We help identify patients who would benefit from hospice earlier in their hospital stay",
    "Our services directly impact your quality metrics and patient satisfaction scores"
  ]
}'::jsonb, 1),

-- Value Props - Hospital Administrators/C-Suite
('hospital', 'Value Props - Hospital Administrators', 'value_proposition',
'{
  "title": "Executive Leadership Value Drivers",
  "description": "Strategic benefits for hospital executives focused on quality metrics and financial performance",
  "points": [
    "Reduce average length of stay by transitioning appropriate patients",
    "Decrease 30-day readmission rates for terminal diagnoses",
    "Improve CMS quality ratings and avoid readmission penalties",
    "Optimize bed utilization and patient flow",
    "Enhance HCAHPS scores in communication and care transitions",
    "Reduce costs associated with futile care in terminal patients",
    "Strengthen community reputation for compassionate care",
    "Meet ACO quality metrics for end-of-life care"
  ],
  "concerns": [
    "Impact on census and revenue",
    "Regulatory compliance and quality metrics",
    "Community perception of end-of-life care",
    "Integration with existing care management"
  ],
  "solutions": [
    "Data sharing on readmission prevention and cost savings",
    "Joint quality improvement initiatives",
    "Community education programs on appropriate hospice use",
    "Embedded liaison model for seamless integration"
  ]
}'::jsonb, 2),

-- Value Props - Hospitalists/Attending Physicians
('hospital', 'Value Props - Hospitalists', 'value_proposition',
'{
  "title": "Hospitalist Partnership Benefits",
  "description": "Clinical advantages for hospitalists managing complex, terminal patients",
  "points": [
    "Expert consultation on prognosis and goals of care discussions",
    "Rapid patient assessment and admission capability",
    "Reduce moral distress from futile care situations",
    "24/7 medical director availability for complex cases",
    "Seamless transition planning reducing discharge delays",
    "Continued involvement through hospice medical director",
    "Education on prognostication and hospice eligibility",
    "Support for difficult family conversations"
  ],
  "concerns": [
    "Timing of hospice referrals",
    "Maintaining continuity with primary physicians",
    "Clear eligibility criteria",
    "Family readiness for transition"
  ],
  "solutions": [
    "Joint rounds on potential hospice patients",
    "Clear referral criteria and prognostic tools",
    "Co-management options for complex cases",
    "Family meeting support from hospice team"
  ]
}'::jsonb, 3),

-- Value Props - Case Managers/Discharge Planners
('hospital', 'Value Props - Case Management', 'value_proposition',
'{
  "title": "Case Management Partnership Excellence",
  "description": "Operational benefits for case managers coordinating complex discharges",
  "points": [
    "Single point of contact for all hospice referrals",
    "Real-time bed availability and admission status",
    "Assistance with insurance verification and authorization",
    "Rapid response for urgent discharge needs",
    "Comprehensive discharge planning support",
    "Education on hospice eligibility and benefits",
    "Reduced discharge delays for hospice-appropriate patients",
    "24/7 intake availability including weekends"
  ],
  "concerns": [
    "Discharge timing and bed availability",
    "Insurance authorization delays",
    "Family decision-making time",
    "Equipment and medication needs"
  ],
  "solutions": [
    "Dedicated hospital liaison for immediate response",
    "Pre-authorization assistance and insurance navigation",
    "Family education materials and support",
    "Same-day equipment delivery and medication access"
  ]
}'::jsonb, 4),

-- Value Props - Palliative Care Teams
('hospital', 'Value Props - Palliative Care', 'value_proposition',
'{
  "title": "Palliative Care Collaboration",
  "description": "Seamless integration with hospital palliative care programs",
  "points": [
    "Natural continuum from palliative to hospice care",
    "Shared philosophy of patient-centered care",
    "Joint assessments for dual-eligible patients",
    "Consistent messaging to patients and families",
    "Collaborative symptom management protocols",
    "Smooth transitions maintaining care continuity",
    "Co-management of complex symptoms",
    "Unified approach to family support"
  ],
  "concerns": [
    "Role clarity between palliative and hospice",
    "Timing of transition to hospice",
    "Maintaining palliative care relationships",
    "Consistent care philosophy"
  ],
  "solutions": [
    "Clear delineation of roles and responsibilities",
    "Joint patient assessments and care planning",
    "Palliative care provider can remain involved",
    "Regular collaboration meetings and case reviews"
  ]
}'::jsonb, 5),

-- Value Props - Emergency Department
('hospital', 'Value Props - Emergency Department', 'value_proposition',
'{
  "title": "Emergency Department Partnership",
  "description": "Reducing ED utilization through proactive hospice care",
  "points": [
    "Prevent crisis admissions through 24/7 hospice support",
    "Rapid response to ED for hospice-eligible patients",
    "Reduce ED boarding time for terminal patients",
    "Alternative to admission for end-of-life care",
    "Family support preventing panic-driven ED visits",
    "Direct admission from ED to hospice care",
    "Education on hospice as alternative to hospitalization",
    "Reduce repeat ED visits for terminal patients"
  ],
  "concerns": [
    "Quick decision-making in ED setting",
    "Family crisis and emotional needs",
    "Rapid assessment requirements",
    "Liability and care standards"
  ],
  "solutions": [
    "Embedded hospice liaison in ED during peak hours",
    "Rapid response team for urgent assessments",
    "Family support specialists available 24/7",
    "Clear protocols for ED to hospice transitions"
  ]
}'::jsonb, 6),

-- 90-Day Implementation Roadmap
('hospital', '90-Day Hospital Partnership Roadmap', 'action_plan',
'{
  "title": "Strategic Hospital Partnership Development",
  "description": "Systematic approach to building comprehensive hospital partnerships",
  "phases": [
    {
      "name": "Days 1-30: Assessment & Relationship Building",
      "days": "1-30",
      "actions": [
        "Meet with C-suite to understand strategic priorities and quality goals",
        "Shadow case management team to understand discharge processes",
        "Analyze hospital readmission data and identify opportunities",
        "Meet with hospitalist group leadership and key physicians",
        "Assess current hospice referral patterns and barriers",
        "Tour all units and meet nurse managers",
        "Review hospital quality metrics and improvement initiatives",
        "Identify physician champions in key departments"
      ]
    },
    {
      "name": "Days 31-60: Integration & Process Development",
      "days": "31-60",
      "actions": [
        "Develop streamlined referral process with case management input",
        "Create hospital-specific admission protocols and criteria",
        "Implement daily rounding schedule on key units",
        "Launch physician education series on prognostication",
        "Establish regular presence in case management offices",
        "Create ED protocol for hospice-appropriate patients",
        "Develop family education materials with hospital branding",
        "Set up data sharing for quality metrics tracking"
      ]
    },
    {
      "name": "Days 61-90: Full Implementation & Optimization",
      "days": "61-90",
      "actions": [
        "Launch embedded liaison model with dedicated coverage",
        "Implement joint quality improvement project",
        "Begin monthly data review with hospital leadership",
        "Expand education to all hospital departments",
        "Establish 24/7 rapid response protocol",
        "Create sustainability plan with hospital administration",
        "Celebrate early wins and share success stories",
        "Plan for expansion to additional service lines"
      ]
    }
  ],
  "key_milestones": [
    "Executive sponsorship secured",
    "Referral process streamlined",
    "Daily rounding established",
    "Quality metrics improving",
    "Physician champions engaged"
  ]
}'::jsonb, 7),

-- Key Performance Indicators
('hospital', 'Hospital Partnership KPIs', 'kpi',
'{
  "title": "Hospital Partnership Success Metrics",
  "description": "Key indicators of successful hospital collaboration",
  "metrics": [
    {
      "name": "Referral Response Time",
      "description": "Average time from referral to patient assessment",
      "target": "< 4 hours for urgent referrals",
      "measurement": "Track from referral receipt to bedside assessment"
    },
    {
      "name": "Admission Conversion Rate",
      "description": "Percentage of referrals resulting in admission",
      "target": "> 85% conversion rate",
      "measurement": "Monthly tracking of referrals to admissions"
    },
    {
      "name": "Average Length of Stay Impact",
      "description": "Reduction in hospital ALOS for hospice-referred patients",
      "target": "1-2 day reduction in ALOS",
      "measurement": "Compare pre/post referral ALOS data"
    },
    {
      "name": "30-Day Readmission Rate",
      "description": "Hospital readmissions for hospice patients",
      "target": "< 5% readmission rate",
      "measurement": "Track all hospice patients for 30-day readmissions"
    },
    {
      "name": "Physician Satisfaction",
      "description": "Hospitalist satisfaction with hospice partnership",
      "target": "> 90% satisfaction score",
      "measurement": "Quarterly physician satisfaction surveys"
    },
    {
      "name": "Case Management Efficiency",
      "description": "Time to discharge for hospice patients",
      "target": "< 24 hours from referral to discharge",
      "measurement": "Track discharge timing for all hospice referrals"
    }
  ]
}'::jsonb, 8),

-- Best Practices
('hospital', 'Hospital Partnership Best Practices', 'best_practice',
'{
  "title": "Excellence in Hospital Collaboration",
  "description": "Proven strategies for successful hospital partnerships",
  "practices": [
    {
      "category": "Embedded Liaison Model",
      "description": "On-site presence for immediate response and relationship building",
      "implementation": [
        "Dedicated liaison with hospital badge and access",
        "Regular hours in case management department",
        "Participation in discharge planning rounds",
        "Direct physician communication capability"
      ]
    },
    {
      "category": "Rapid Response Protocol",
      "description": "Meeting urgent hospital discharge needs",
      "implementation": [
        "2-hour response time for urgent referrals",
        "Weekend and evening admission capability",
        "Streamlined admission paperwork",
        "Pre-authorized insurance processes"
      ]
    },
    {
      "category": "Quality Improvement Partnership",
      "description": "Joint initiatives to improve outcomes",
      "implementation": [
        "Monthly data sharing on key metrics",
        "Collaborative PDSA cycles",
        "Joint education programs",
        "Shared success celebrations"
      ]
    },
    {
      "category": "Physician Engagement Strategy",
      "description": "Building trust with hospital medical staff",
      "implementation": [
        "Regular education on prognostication",
        "Case consultation availability",
        "Feedback on patient outcomes",
        "Physician champion program"
      ]
    }
  ]
}'::jsonb, 9);

-- Insert hospital checklists (6 total, covering 90 days)
INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

-- Days 1-15: Initial Assessment & Stakeholder Mapping
('hospital', 'Hospital System Assessment & Leadership Engagement', 'foundation',
'[
  {"id": "h1", "task": "Schedule meeting with hospital CEO/COO to discuss partnership vision", "priority": "high"},
  {"id": "h2", "task": "Meet with CMO to understand quality priorities and medical staff structure", "priority": "high"},
  {"id": "h3", "task": "Analyze hospital readmission data and identify improvement opportunities", "priority": "high"},
  {"id": "h4", "task": "Tour all hospital units and meet department managers", "priority": "medium"},
  {"id": "h5", "task": "Shadow case management team for full day to understand workflow", "priority": "high"},
  {"id": "h6", "task": "Meet with hospitalist group leadership", "priority": "high"},
  {"id": "h7", "task": "Assess current hospice utilization and referral patterns", "priority": "medium"},
  {"id": "h8", "task": "Review hospital strategic plan and quality goals", "priority": "medium"},
  {"id": "h9", "task": "Identify potential physician champions in key departments", "priority": "high"},
  {"id": "h10", "task": "Map current discharge planning process and identify gaps", "priority": "medium"}
]'::jsonb, 1, 'Days 1-15'),

-- Days 16-30: Process Development & Integration Planning
('hospital', 'Referral Process Design & Team Integration', 'foundation',
'[
  {"id": "h11", "task": "Design streamlined referral process with case management input", "priority": "high"},
  {"id": "h12", "task": "Create hospital-specific admission criteria and protocols", "priority": "high"},
  {"id": "h13", "task": "Develop rapid response protocol for urgent referrals", "priority": "high"},
  {"id": "h14", "task": "Meet with ED leadership to discuss hospice alternatives", "priority": "medium"},
  {"id": "h15", "task": "Create communication plan for medical staff", "priority": "medium"},
  {"id": "h16", "task": "Develop family education materials with hospital branding", "priority": "medium"},
  {"id": "h17", "task": "Establish data sharing agreements for quality metrics", "priority": "high"},
  {"id": "h18", "task": "Plan embedded liaison schedule and coverage model", "priority": "high"},
  {"id": "h19", "task": "Create physician education curriculum on prognostication", "priority": "medium"},
  {"id": "h20", "task": "Design joint quality improvement project", "priority": "medium"}
]'::jsonb, 2, 'Days 16-30'),

-- Days 31-45: Education Launch & Early Implementation
('hospital', 'Staff Education & Process Launch', 'engagement',
'[
  {"id": "h21", "task": "Launch physician education series with CME credits", "priority": "high"},
  {"id": "h22", "task": "Conduct case management team training on new referral process", "priority": "high"},
  {"id": "h23", "task": "Begin daily rounding on key hospital units", "priority": "high"},
  {"id": "h24", "task": "Implement embedded liaison presence in case management", "priority": "high"},
  {"id": "h25", "task": "Host grand rounds presentation on hospice benefits", "priority": "medium"},
  {"id": "h26", "task": "Launch rapid response protocol with on-call team", "priority": "high"},
  {"id": "h27", "task": "Create feedback mechanism for referral process improvement", "priority": "medium"},
  {"id": "h28", "task": "Begin tracking response time and conversion metrics", "priority": "high"},
  {"id": "h29", "task": "Establish regular touchpoints with physician champions", "priority": "medium"},
  {"id": "h30", "task": "Develop success stories for internal marketing", "priority": "low"}
]'::jsonb, 3, 'Days 31-45'),

-- Days 46-60: Full Integration & Optimization
('hospital', 'System Integration & Performance Tracking', 'engagement',
'[
  {"id": "h31", "task": "Achieve 24/7 admission capability for hospital referrals", "priority": "high"},
  {"id": "h32", "task": "Launch ED protocol for appropriate hospice referrals", "priority": "high"},
  {"id": "h33", "task": "Implement joint quality improvement project", "priority": "high"},
  {"id": "h34", "task": "Begin monthly data review with hospital leadership", "priority": "high"},
  {"id": "h35", "task": "Expand education to nursing staff on all shifts", "priority": "medium"},
  {"id": "h36", "task": "Create dashboard for real-time metrics tracking", "priority": "medium"},
  {"id": "h37", "task": "Develop case studies showing impact on ALOS and readmissions", "priority": "high"},
  {"id": "h38", "task": "Establish regular presence at medical staff meetings", "priority": "medium"},
  {"id": "h39", "task": "Launch family satisfaction survey process", "priority": "medium"},
  {"id": "h40", "task": "Create sustainability plan with hospital administration", "priority": "high"}
]'::jsonb, 4, 'Days 46-60'),

-- Days 61-75: Performance Optimization & Expansion
('hospital', 'Quality Improvement & Service Expansion', 'optimization',
'[
  {"id": "h41", "task": "Analyze first 60 days of data and identify improvement areas", "priority": "high"},
  {"id": "h42", "task": "Present outcomes data to hospital board", "priority": "high"},
  {"id": "h43", "task": "Expand services to additional hospital units", "priority": "medium"},
  {"id": "h44", "task": "Launch physician satisfaction survey", "priority": "medium"},
  {"id": "h45", "task": "Implement process improvements based on feedback", "priority": "high"},
  {"id": "h46", "task": "Develop specialized protocols for high-volume diagnoses", "priority": "medium"},
  {"id": "h47", "task": "Create joint marketing materials highlighting partnership", "priority": "low"},
  {"id": "h48", "task": "Plan expansion to affiliated hospitals or clinics", "priority": "medium"},
  {"id": "h49", "task": "Establish quarterly business review process", "priority": "high"},
  {"id": "h50", "task": "Celebrate early wins with hospital teams", "priority": "medium"}
]'::jsonb, 5, 'Days 61-75'),

-- Days 76-90: Sustainability & Strategic Planning
('hospital', 'Partnership Sustainability & Growth Strategy', 'optimization',
'[
  {"id": "h51", "task": "Conduct comprehensive 90-day partnership review", "priority": "high"},
  {"id": "h52", "task": "Develop annual partnership agreement with clear goals", "priority": "high"},
  {"id": "h53", "task": "Create long-term strategic plan with hospital leadership", "priority": "high"},
  {"id": "h54", "task": "Establish permanent quality improvement committee", "priority": "medium"},
  {"id": "h55", "task": "Plan for integration with hospital EMR system", "priority": "medium"},
  {"id": "h56", "task": "Develop succession plan for key relationship roles", "priority": "medium"},
  {"id": "h57", "task": "Create annual education calendar for medical staff", "priority": "medium"},
  {"id": "h58", "task": "Document best practices and lessons learned", "priority": "low"},
  {"id": "h59", "task": "Plan expansion to additional service lines", "priority": "medium"},
  {"id": "h60", "task": "Schedule annual partnership summit with all stakeholders", "priority": "high"}
]'::jsonb, 6, 'Days 76-90');
