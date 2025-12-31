-- COMPREHENSIVE TRAINING CONTENT FOR PHYSICIAN OFFICES, SNFs, AND HOME HEALTH AGENCIES
-- ===================================================================================
-- This migration adds detailed training content for three additional organization types
-- to match the depth and quality of ALF and Cancer Center content

-- Clear existing placeholder content for these organization types
DELETE FROM public.organization_training_modules 
WHERE organization_type IN ('physician_office', 'nursing_home', 'home_health');

DELETE FROM public.organization_checklists 
WHERE organization_type IN ('physician_office', 'nursing_home', 'home_health');

-- ====================================
-- PHYSICIAN OFFICES COMPREHENSIVE CONTENT
-- ====================================

INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES

-- Core Value Proposition
('physician_office', 'Core Value Proposition', 'value_proposition',
  '{"title": "Core Value Proposition for Physician Offices",
    "main_message": "Maintain patient relationships while providing specialized end-of-life expertise",
    "positioning": "Position Elevate Hospice as a collaborative partner that enhances your practice''s ability to provide comprehensive care throughout the patient journey.",
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
    ]
  }'::jsonb, 1),

-- Stakeholder-specific value propositions
('physician_office', 'Value Props - Primary Care Physicians', 'value_proposition',
  '{"title": "Value Propositions for Primary Care Physicians",
    "stakeholder": "Primary Care Physicians",
    "color": "blue",
    "primary_concerns": [
      "Maintaining patient relationships",
      "After-hours call burden",
      "Complex symptom management",
      "Patient/family satisfaction"
    ],
    "value_propositions": [
      "Maintain involvement while gaining specialized support",
      "Reduce after-hours calls with 24/7 hospice coverage",
      "Expert pain and symptom management",
      "Enhanced practice reputation for compassionate care"
    ],
    "talking_points": [
      "You remain the attending physician while we provide specialized end-of-life support",
      "Our 24/7 team handles after-hours calls for terminal patients, reducing your burden",
      "We enhance your practice''s reputation for providing comprehensive, compassionate care",
      "Studies show hospice involvement improves both patient and family satisfaction scores"
    ]
  }'::jsonb, 2),

('physician_office', 'Value Props - Specialists', 'value_proposition',
  '{"title": "Value Propositions for Specialists",
    "stakeholder": "Specialists",
    "color": "green",
    "primary_concerns": [
      "Maintaining expertise in complex cases",
      "Liability for end-stage patients",
      "Time management and efficiency",
      "Professional collaboration"
    ],
    "value_propositions": [
      "Maintain specialist input in complex cases",
      "Reduce liability for end-stage patients",
      "Streamline end-of-life care processes",
      "Professional collaboration and recognition"
    ],
    "talking_points": [
      "We value your expertise and ensure you remain involved in complex case management",
      "Hospice partnership reduces liability exposure for end-stage patient care",
      "Our team handles time-intensive end-of-life coordination, improving your efficiency",
      "Collaboration with hospice demonstrates commitment to comprehensive patient care"
    ]
  }'::jsonb, 3),

('physician_office', 'Value Props - Practice Administrators', 'value_proposition',
  '{"title": "Value Propositions for Practice Administrators",
    "stakeholder": "Practice Administrators",
    "color": "purple",
    "primary_concerns": [
      "Practice efficiency and workflow",
      "Patient satisfaction metrics",
      "Staff workload management",
      "Revenue optimization"
    ],
    "value_propositions": [
      "Improve practice efficiency and workflow",
      "Enhance patient satisfaction scores",
      "Reduce administrative burden on staff",
      "Strengthen practice reputation and referrals"
    ],
    "talking_points": [
      "We streamline end-of-life care processes, reducing administrative burden on your staff",
      "Hospice partnership consistently improves patient satisfaction metrics",
      "Our team handles complex care coordination, freeing your staff for other priorities",
      "Enhanced reputation for comprehensive care can drive new patient referrals"
    ]
  }'::jsonb, 4),

('physician_office', 'Value Props - Nursing Staff', 'value_proposition',
  '{"title": "Value Propositions for Office Nursing Staff",
    "stakeholder": "Nursing Staff",
    "color": "orange",
    "primary_concerns": [
      "Complex patient management",
      "Family anxiety and questions",
      "Limited time per patient",
      "Emotional burden of end-of-life care"
    ],
    "value_propositions": [
      "24/7 clinical support and consultation",
      "Reduced family anxiety and calls",
      "Professional development opportunities",
      "Emotional support and expertise"
    ],
    "talking_points": [
      "Our 24/7 nursing team provides backup for complex symptom management questions",
      "We handle anxious family calls and provide comprehensive education",
      "Partnership includes training opportunities in end-of-life care best practices",
      "Our team provides emotional support and shares the burden of difficult cases"
    ]
  }'::jsonb, 5),

-- 90-Day Implementation Roadmap
('physician_office', '90-Day Implementation Roadmap', 'action_plan',
  '{"title": "90-Day Physician Office Partnership Plan",
    "overview": "Build collaborative relationships that enhance patient care while preserving physician autonomy",
    "phases": [
      {
        "name": "Foundation Building",
        "days": "Days 1-30",
        "color": "blue",
        "focus": "Practice assessment and stakeholder engagement",
        "key_activities": {
          "practice_assessment": [
            "Analyze patient demographics and volume",
            "Review current referral patterns",
            "Identify decision-making process",
            "Assess practice culture and values"
          ],
          "stakeholder_engagement": [
            "Meet with key physicians individually",
            "Connect with practice administrator",
            "Engage nursing leadership",
            "Understand workflow and processes"
          ]
        }
      },
      {
        "name": "Development Phase",
        "days": "Days 31-60",
        "color": "green",
        "focus": "Education and process integration",
        "key_activities": {
          "education_initiatives": [
            "Lunch and learn presentations",
            "Case study sharing sessions",
            "Clinical collaboration discussions",
            "Resource material distribution"
          ],
          "process_development": [
            "Create referral protocols",
            "Establish communication standards",
            "Design consultation processes",
            "Develop care coordination workflows"
          ]
        }
      },
      {
        "name": "Optimization Phase",
        "days": "Days 61-90",
        "color": "purple",
        "focus": "Partnership refinement and measurement",
        "key_activities": {
          "service_optimization": [
            "Process first referrals",
            "Refine communication protocols",
            "Adjust based on feedback",
            "Celebrate early successes"
          ],
          "performance_tracking": [
            "Monitor referral patterns",
            "Track satisfaction metrics",
            "Evaluate partnership health",
            "Plan quarterly reviews"
          ]
        }
      }
    ]
  }'::jsonb, 6),

-- Key Performance Indicators
('physician_office', 'Key Performance Indicators', 'kpi',
  '{"title": "Physician Office Partnership KPIs",
    "metrics": [
      {
        "category": "Referral Metrics",
        "metrics": [
          {"name": "Monthly referrals per physician", "target": "2-4 referrals"},
          {"name": "Referral to admission conversion", "target": "85%+"},
          {"name": "Time from referral to contact", "target": "<4 hours"},
          {"name": "Physician utilization rate", "target": "Track growth"}
        ]
      },
      {
        "category": "Quality Indicators",
        "metrics": [
          {"name": "Patient satisfaction scores", "target": "4.5+ out of 5"},
          {"name": "Family satisfaction ratings", "target": "4.5+ out of 5"},
          {"name": "Physician satisfaction feedback", "target": "Quarterly surveys"},
          {"name": "Care coordination effectiveness", "target": "90%+ positive"}
        ]
      },
      {
        "category": "Partnership Health",
        "metrics": [
          {"name": "Communication responsiveness", "target": "<2 hour response"},
          {"name": "Education session attendance", "target": "75%+ participation"},
          {"name": "Referral source retention", "target": "95%+ annual"},
          {"name": "Partnership growth rate", "target": "Quarterly increase"}
        ]
      }
    ]
  }'::jsonb, 7),

-- Best Practices and Tools
('physician_office', 'Partnership Best Practices', 'best_practice',
  '{"title": "Physician Office Partnership Excellence",
    "sections": [
      {
        "name": "Communication Excellence",
        "icon": "comments",
        "practices": [
          "Establish physician-preferred communication methods",
          "Provide concise, relevant clinical updates",
          "Respect physician time with efficient interactions",
          "Create standardized reporting templates"
        ]
      },
      {
        "name": "Clinical Collaboration",
        "icon": "user-md",
        "practices": [
          "Regular physician-to-physician consultations",
          "Joint family conferences when appropriate",
          "Shared care planning and goal setting",
          "Respect for physician treatment preferences"
        ]
      },
      {
        "name": "Practice Integration",
        "icon": "puzzle-piece",
        "practices": [
          "Seamless EMR integration when possible",
          "Minimal disruption to practice workflow",
          "Clear referral and admission processes",
          "Regular presence without being intrusive"
        ]
      }
    ]
  }'::jsonb, 8),

-- ====================================
-- SKILLED NURSING FACILITIES COMPREHENSIVE CONTENT
-- ====================================

('nursing_home', 'Core Value Proposition', 'value_proposition',
  '{"title": "Core Value Proposition for Skilled Nursing Facilities",
    "main_message": "Optimize census management while providing specialized end-of-life expertise",
    "positioning": "Position Elevate Hospice as the strategic partner that helps SNFs improve quality metrics, manage census effectively, and reduce liability.",
    "key_benefits": [
      {
        "icon": "building",
        "title": "Census Optimization",
        "description": "Improved bed turnover and occupancy management"
      },
      {
        "icon": "chart-line",
        "title": "Quality Metrics",
        "description": "Enhanced star ratings and survey readiness"
      },
      {
        "icon": "shield",
        "title": "Liability Reduction",
        "description": "Decreased risk exposure for end-stage residents"
      }
    ]
  }'::jsonb, 1),

-- SNF Stakeholder Value Props
('nursing_home', 'Value Props - Administrators', 'value_proposition',
  '{"title": "Value Propositions for SNF Administrators",
    "stakeholder": "Administrator",
    "color": "green",
    "primary_concerns": [
      "Census and occupancy management",
      "Quality metrics and star ratings",
      "Liability and risk management",
      "Family satisfaction scores"
    ],
    "value_propositions": [
      "Optimize bed turnover and census flow",
      "Improve quality metrics and star ratings",
      "Reduce liability for end-stage residents",
      "Enhance family satisfaction scores"
    ],
    "talking_points": [
      "We help optimize your census by providing appropriate care levels for end-stage residents",
      "Hospice partnership improves quality metrics and supports better survey outcomes",
      "Our expertise reduces liability exposure for complex end-of-life care situations",
      "Families consistently rate facilities higher when comprehensive hospice support is available"
    ]
  }'::jsonb, 2),

('nursing_home', 'Value Props - Directors of Nursing', 'value_proposition',
  '{"title": "Value Propositions for Directors of Nursing",
    "stakeholder": "Director of Nursing",
    "color": "blue",
    "primary_concerns": [
      "Staff expertise in end-of-life care",
      "Complex symptom management",
      "Regulatory compliance",
      "Emergency transfers"
    ],
    "value_propositions": [
      "24/7 clinical support and expertise",
      "Staff education and training programs",
      "Reduced emergency transfers",
      "Enhanced care documentation"
    ],
    "talking_points": [
      "Our 24/7 clinical team provides expert consultation for complex cases",
      "We offer regular training to enhance your staff''s comfort care skills",
      "Hospice involvement significantly reduces unnecessary hospital transfers",
      "Our documentation supports regulatory compliance and survey readiness"
    ]
  }'::jsonb, 3),

('nursing_home', 'Value Props - Social Services', 'value_proposition',
  '{"title": "Value Propositions for Social Services Directors",
    "stakeholder": "Social Services",
    "color": "purple",
    "primary_concerns": [
      "Family support and counseling",
      "Discharge planning complexity",
      "Emotional burden on families",
      "Care coordination challenges"
    ],
    "value_propositions": [
      "Comprehensive family support services",
      "Streamlined discharge planning",
      "Professional bereavement support",
      "Enhanced care coordination"
    ],
    "talking_points": [
      "Our social workers provide expert family counseling and support",
      "We simplify complex discharge planning for end-of-life transitions",
      "Comprehensive bereavement services support families before and after loss",
      "Our team coordinates all aspects of end-of-life care planning"
    ]
  }'::jsonb, 4),

('nursing_home', 'Value Props - Quality Assurance', 'value_proposition',
  '{"title": "Value Propositions for Quality Assurance Coordinators",
    "stakeholder": "Quality Assurance",
    "color": "orange",
    "primary_concerns": [
      "Quality measure performance",
      "Survey deficiency risks",
      "Documentation requirements",
      "Family satisfaction ratings"
    ],
    "value_propositions": [
      "Improved quality measure scores",
      "Reduced survey deficiency risk",
      "Enhanced documentation practices",
      "Better satisfaction ratings"
    ],
    "talking_points": [
      "Hospice partnership directly improves multiple quality measures",
      "Our documentation and care planning reduce survey deficiency risks",
      "We provide comprehensive documentation that exceeds regulatory requirements",
      "Family satisfaction scores consistently improve with hospice involvement"
    ]
  }'::jsonb, 5),

-- SNF 90-Day Implementation
('nursing_home', '90-Day Implementation Roadmap', 'action_plan',
  '{"title": "90-Day SNF Partnership Development Plan",
    "overview": "Build strategic partnerships that enhance quality outcomes while optimizing facility operations",
    "phases": [
      {
        "name": "Assessment & Analysis",
        "days": "Days 1-30",
        "color": "blue",
        "focus": "Facility assessment and relationship building",
        "key_activities": {
          "facility_analysis": [
            "Review census patterns and turnover",
            "Analyze quality metrics and star ratings",
            "Assess current hospice relationships",
            "Identify operational pain points"
          ],
          "stakeholder_mapping": [
            "Meet with administrator",
            "Connect with DON and nursing leadership",
            "Engage social services team",
            "Understand QA priorities"
          ]
        }
      },
      {
        "name": "Value Demonstration",
        "days": "Days 31-60",
        "color": "green",
        "focus": "Education and process development",
        "key_activities": {
          "education_programs": [
            "Staff in-service training sessions",
            "Quality metric improvement strategies",
            "Case study presentations",
            "Best practice sharing"
          ],
          "process_integration": [
            "Develop admission criteria",
            "Create communication protocols",
            "Design care conference schedule",
            "Establish quality tracking systems"
          ]
        }
      },
      {
        "name": "Partnership Launch",
        "days": "Days 61-90",
        "color": "purple",
        "focus": "Program implementation and optimization",
        "key_activities": {
          "program_launch": [
            "Implement rapid response protocols",
            "Begin regular care conferences",
            "Launch family support programs",
            "Start quality metric tracking"
          ],
          "optimization": [
            "Monitor census impact",
            "Track quality improvements",
            "Collect stakeholder feedback",
            "Plan expansion strategies"
          ]
        }
      }
    ]
  }'::jsonb, 6),

-- SNF Partnership Models
('nursing_home', 'Strategic Partnership Models', 'best_practice',
  '{"title": "SNF Partnership Excellence Models",
    "models": [
      {
        "name": "Census Optimization Program",
        "icon": "bed",
        "components": [
          "Early identification of appropriate hospice candidates",
          "Expedited admission processes for bed availability",
          "Concurrent care options when appropriate",
          "Collaborative discharge planning strategies",
          "Regular census review meetings"
        ]
      },
      {
        "name": "Clinical Education Partnership",
        "icon": "graduation-cap",
        "components": [
          "Monthly end-of-life care education",
          "Pain and symptom management training",
          "Family communication workshops",
          "Bereavement support training",
          "Regulatory compliance updates"
        ]
      },
      {
        "name": "Quality Enhancement Initiative",
        "icon": "star",
        "components": [
          "Quality measure improvement strategies",
          "Survey readiness preparation",
          "Documentation excellence training",
          "Family satisfaction programs",
          "Clinical outcome tracking"
        ]
      }
    ]
  }'::jsonb, 7),

-- SNF KPIs
('nursing_home', 'Key Performance Indicators', 'kpi',
  '{"title": "SNF Partnership Success Metrics",
    "metrics": [
      {
        "category": "Operational Metrics",
        "metrics": [
          {"name": "Monthly referral volume", "target": "6-10 per facility"},
          {"name": "Bed turnover improvement", "target": "Track monthly"},
          {"name": "Average length of stay", "target": "Optimize appropriately"},
          {"name": "Live discharge rate", "target": "<5%"}
        ]
      },
      {
        "category": "Quality Metrics",
        "metrics": [
          {"name": "Hospital transfer reduction", "target": "20%+ decrease"},
          {"name": "Family satisfaction scores", "target": "4.5+ out of 5"},
          {"name": "Pain management effectiveness", "target": "90%+ controlled"},
          {"name": "Survey deficiency reduction", "target": "Measurable decrease"}
        ]
      },
      {
        "category": "Financial Impact",
        "metrics": [
          {"name": "Revenue per patient day", "target": "Track improvement"},
          {"name": "Cost reduction from transfers", "target": "Calculate savings"},
          {"name": "Liability claim reduction", "target": "Monitor annually"},
          {"name": "Census optimization impact", "target": "Quarterly review"}
        ]
      }
    ]
  }'::jsonb, 8),

-- SNF Account Categorization
('nursing_home', 'Account Assessment Framework', 'best_practice',
  '{"title": "SNF Account Prioritization Framework",
    "categories": [
      {
        "level": "A-Level Facilities",
        "icon": "star",
        "color": "gold",
        "potential": "6+ referrals per month",
        "characteristics": [
          "100+ bed facilities",
          "High acuity resident population",
          "Progressive leadership team",
          "Quality-focused culture",
          "Multiple care levels offered"
        ],
        "approach": [
          "Executive-level engagement",
          "Comprehensive partnership proposal",
          "Dedicated account management",
          "Customized programs and metrics"
        ]
      },
      {
        "level": "B-Level Facilities",
        "icon": "star-half",
        "color": "silver",
        "potential": "3-5 referrals per month",
        "characteristics": [
          "50-100 bed facilities",
          "Mixed acuity levels",
          "Established market presence",
          "Some quality challenges",
          "Growth potential identified"
        ],
        "approach": [
          "DON and administrator focus",
          "Targeted value propositions",
          "Regular engagement schedule",
          "Quality improvement emphasis"
        ]
      },
      {
        "level": "C-Level Facilities",
        "icon": "seedling",
        "color": "bronze",
        "potential": "1-2 referrals per month",
        "characteristics": [
          "Smaller facilities (<50 beds)",
          "Limited hospice experience",
          "Relationship building needed",
          "Long-term growth potential",
          "May have specific barriers"
        ],
        "approach": [
          "Gradual relationship building",
          "Education-focused engagement",
          "Pilot program opportunities",
          "Patience and persistence"
        ]
      }
    ]
  }'::jsonb, 9),

-- ====================================
-- HOME HEALTH AGENCIES COMPREHENSIVE CONTENT
-- ====================================

('home_health', 'Core Value Proposition', 'value_proposition',
  '{"title": "Core Value Proposition for Home Health Agencies",
    "main_message": "Natural continuum of care partnerships for seamless patient transitions",
    "positioning": "Position Elevate Hospice as the ideal partner for home health agencies, providing complementary services that enhance patient care across the continuum.",
    "key_benefits": [
      {
        "icon": "exchange-alt",
        "title": "Seamless Transitions",
        "description": "Smooth handoffs between curative and comfort care"
      },
      {
        "icon": "handshake",
        "title": "Mutual Referrals",
        "description": "Bidirectional referral opportunities"
      },
      {
        "icon": "users",
        "title": "Expanded Services",
        "description": "Comprehensive care offerings for patients"
      }
    ]
  }'::jsonb, 1),

-- Home Health Stakeholder Value Props
('home_health', 'Value Props - Administrators/Owners', 'value_proposition',
  '{"title": "Value Propositions for HH Administrators/Owners",
    "stakeholder": "Administrator/Owner",
    "color": "blue",
    "primary_concerns": [
      "Revenue diversification",
      "Service line expansion",
      "Competitive differentiation",
      "Patient retention"
    ],
    "value_propositions": [
      "New revenue streams through partnerships",
      "Enhanced competitive positioning",
      "Improved patient retention and satisfaction",
      "Risk mitigation for complex patients"
    ],
    "talking_points": [
      "Partnership creates new referral streams and revenue opportunities",
      "Offering hospice collaboration differentiates your agency in the market",
      "Seamless transitions improve patient satisfaction and loyalty",
      "We assume risk for end-stage patients while maintaining continuity"
    ]
  }'::jsonb, 2),

('home_health', 'Value Props - Directors of Nursing', 'value_proposition',
  '{"title": "Value Propositions for HH Directors of Nursing",
    "stakeholder": "Director of Nursing",
    "color": "green",
    "primary_concerns": [
      "Clinical complexity management",
      "Staff expertise limitations",
      "Care coordination challenges",
      "Quality outcome metrics"
    ],
    "value_propositions": [
      "Specialized clinical expertise access",
      "Reduced burden for complex cases",
      "Enhanced care coordination",
      "Improved quality metrics"
    ],
    "talking_points": [
      "Access our specialized end-of-life care expertise for complex cases",
      "We handle the most challenging symptom management scenarios",
      "Collaborative care planning improves overall patient outcomes",
      "Partnership positively impacts your quality metrics and star ratings"
    ]
  }'::jsonb, 3),

('home_health', 'Value Props - Intake Coordinators', 'value_proposition',
  '{"title": "Value Propositions for Intake Coordinators",
    "stakeholder": "Intake Coordinator",
    "color": "purple",
    "primary_concerns": [
      "Appropriate patient placement",
      "Referral source satisfaction",
      "Quick decision making",
      "Clear admission criteria"
    ],
    "value_propositions": [
      "Clear transition criteria and protocols",
      "Streamlined referral processes",
      "Enhanced placement success rates",
      "Improved referral source relationships"
    ],
    "talking_points": [
      "We provide clear criteria for when to transition patients to hospice",
      "Our streamlined processes make transfers quick and efficient",
      "Partnership improves your ability to accept and place patients appropriately",
      "Referral sources appreciate comprehensive continuum options"
    ]
  }'::jsonb, 4),

('home_health', 'Value Props - Clinical Managers', 'value_proposition',
  '{"title": "Value Propositions for Clinical Managers",
    "stakeholder": "Clinical Managers",
    "color": "orange",
    "primary_concerns": [
      "Care plan effectiveness",
      "Visit utilization optimization",
      "Patient outcome measures",
      "Team coordination"
    ],
    "value_propositions": [
      "Enhanced care plan coordination",
      "Optimized visit utilization",
      "Improved patient outcomes",
      "Better team collaboration"
    ],
    "talking_points": [
      "We collaborate on care plans to ensure comprehensive patient support",
      "Appropriate transitions optimize your visit utilization and resources",
      "Our partnership improves patient outcomes and satisfaction scores",
      "Joint care conferences enhance team coordination and communication"
    ]
  }'::jsonb, 5),

-- Home Health Partnership Models
('home_health', 'Strategic Partnership Models', 'best_practice',
  '{"title": "Home Health Partnership Models",
    "models": [
      {
        "name": "Continuum of Care Model",
        "icon": "exchange-alt",
        "color": "blue",
        "description": "Seamless transitions between curative and comfort care",
        "components": [
          "Clear transition criteria and protocols",
          "Concurrent care options when appropriate",
          "Bidirectional referral agreements",
          "Shared care planning processes",
          "Live discharge collaboration"
        ],
        "benefits": [
          "Patient-centered care continuity",
          "Reduced readmission rates",
          "Enhanced patient satisfaction",
          "Optimized resource utilization"
        ]
      },
      {
        "name": "Co-Marketing Partnership",
        "icon": "handshake",
        "color": "green",
        "description": "Joint marketing and business development",
        "components": [
          "Joint marketing materials and campaigns",
          "Shared educational events",
          "Cross-referral tracking systems",
          "Combined community outreach",
          "Unified messaging strategies"
        ],
        "benefits": [
          "Expanded market reach",
          "Cost-effective marketing",
          "Stronger community presence",
          "Increased referral volume"
        ]
      },
      {
        "name": "Clinical Collaboration Model",
        "icon": "user-md",
        "color": "purple",
        "description": "Integrated clinical teams and protocols",
        "components": [
          "Joint assessment protocols",
          "Shared clinical pathways",
          "Integrated documentation systems",
          "Combined staff training programs",
          "Collaborative quality initiatives"
        ],
        "benefits": [
          "Improved clinical outcomes",
          "Enhanced staff competencies",
          "Streamlined operations",
          "Better care coordination"
        ]
      }
    ]
  }'::jsonb, 6),

-- Home Health 90-Day Plan
('home_health', '90-Day Implementation Roadmap', 'action_plan',
  '{"title": "90-Day Home Health Partnership Development",
    "overview": "Create synergistic partnerships that benefit both organizations and improve patient care",
    "phases": [
      {
        "name": "Partnership Foundation",
        "days": "Days 1-30",
        "color": "blue",
        "focus": "Assessment and relationship building",
        "key_activities": {
          "agency_assessment": [
            "Analyze service area overlap",
            "Review patient demographics",
            "Understand referral patterns",
            "Identify collaboration opportunities"
          ],
          "relationship_building": [
            "Executive leadership meetings",
            "Clinical team introductions",
            "Operational alignment discussions",
            "Cultural compatibility assessment"
          ]
        }
      },
      {
        "name": "Integration Planning",
        "days": "Days 31-60",
        "color": "green",
        "focus": "Process development and alignment",
        "key_activities": {
          "process_alignment": [
            "Develop transition protocols",
            "Create communication standards",
            "Design referral workflows",
            "Establish care conference schedules"
          ],
          "team_preparation": [
            "Joint staff education sessions",
            "Cross-training opportunities",
            "Collaborative care planning",
            "Technology integration planning"
          ]
        }
      },
      {
        "name": "Partnership Activation",
        "days": "Days 61-90",
        "color": "purple",
        "focus": "Launch and optimization",
        "key_activities": {
          "program_launch": [
            "Implement referral processes",
            "Begin joint marketing efforts",
            "Start collaborative care planning",
            "Launch co-marketing campaigns"
          ],
          "continuous_improvement": [
            "Monitor transition success rates",
            "Track patient satisfaction",
            "Evaluate financial impact",
            "Plan partnership expansion"
          ]
        }
      }
    ]
  }'::jsonb, 7),

-- Home Health KPIs
('home_health', 'Key Performance Indicators', 'kpi',
  '{"title": "Home Health Partnership Success Metrics",
    "metrics": [
      {
        "category": "Referral Metrics",
        "metrics": [
          {"name": "Monthly referral exchange", "target": "Track bidirectional"},
          {"name": "Transition success rate", "target": "95%+"},
          {"name": "Time to transition", "target": "<48 hours"},
          {"name": "Referral source diversification", "target": "Monitor growth"}
        ]
      },
      {
        "category": "Clinical Outcomes",
        "metrics": [
          {"name": "Care continuity score", "target": "90%+ maintained"},
          {"name": "Patient satisfaction", "target": "4.5+ out of 5"},
          {"name": "Readmission rates", "target": "<10%"},
          {"name": "Clinical goal achievement", "target": "85%+"}
        ]
      },
      {
        "category": "Operational Efficiency",
        "metrics": [
          {"name": "Transition time efficiency", "target": "Continuous improvement"},
          {"name": "Documentation completeness", "target": "98%+"},
          {"name": "Communication effectiveness", "target": "95%+ positive"},
          {"name": "Cost per transition", "target": "Track and optimize"}
        ]
      },
      {
        "category": "Partnership Health",
        "metrics": [
          {"name": "Joint marketing ROI", "target": "Positive return"},
          {"name": "Cross-referral balance", "target": "Mutually beneficial"},
          {"name": "Stakeholder satisfaction", "target": "Quarterly surveys"},
          {"name": "Partnership growth rate", "target": "Year-over-year increase"}
        ]
      }
    ]
  }'::jsonb, 8),

-- Home Health Partnership Development Strategy
('home_health', 'Partnership Development Strategy', 'best_practice',
  '{"title": "Home Health Partnership Development Framework",
    "stages": [
      {
        "stage": "Assessment",
        "icon": "search",
        "duration": "2-4 weeks",
        "activities": [
          "Evaluate agency size and service area",
          "Analyze current partnership landscape",
          "Review patient demographics and needs",
          "Assess leadership openness to collaboration"
        ],
        "deliverables": [
          "Partnership opportunity analysis",
          "Stakeholder mapping document",
          "Initial value proposition outline",
          "Go/no-go recommendation"
        ]
      },
      {
        "stage": "Engagement",
        "icon": "comments",
        "duration": "4-6 weeks",
        "activities": [
          "Conduct leadership meetings",
          "Facilitate clinical team discussions",
          "Present partnership models",
          "Address concerns and objections"
        ],
        "deliverables": [
          "Partnership proposal",
          "Pilot program design",
          "Success metrics agreement",
          "Timeline and milestones"
        ]
      },
      {
        "stage": "Formalization",
        "icon": "file-contract",
        "duration": "2-4 weeks",
        "activities": [
          "Draft partnership agreements",
          "Define referral protocols",
          "Establish communication systems",
          "Create quality metrics"
        ],
        "deliverables": [
          "Signed agreements",
          "Operational protocols",
          "Communication plans",
          "Measurement systems"
        ]
      },
      {
        "stage": "Optimization",
        "icon": "chart-line",
        "duration": "Ongoing",
        "activities": [
          "Monitor performance metrics",
          "Conduct regular reviews",
          "Refine processes",
          "Expand successful programs"
        ],
        "deliverables": [
          "Performance dashboards",
          "Quarterly business reviews",
          "Process improvements",
          "Growth strategies"
        ]
      }
    ]
  }'::jsonb, 9);

-- ====================================
-- CHECKLISTS FOR PHYSICIAN OFFICES
-- ====================================

INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES

-- Days 1-15: Foundation
('physician_office', 'Practice Assessment & Initial Outreach', 'foundation',
  '[
    {"id": "1", "task": "Research practice size, specialties, and patient volume", "priority": "high"},
    {"id": "2", "task": "Identify key physicians and decision makers", "priority": "high"},
    {"id": "3", "task": "Map current referral patterns and hospice relationships", "priority": "high"},
    {"id": "4", "task": "Schedule meet-and-greet with practice administrator", "priority": "high"},
    {"id": "5", "task": "Understand practice workflow and culture", "priority": "medium"},
    {"id": "6", "task": "Identify pain points in end-of-life care management", "priority": "high"},
    {"id": "7", "task": "Review patient satisfaction scores if available", "priority": "medium"},
    {"id": "8", "task": "Prepare customized value propositions", "priority": "high"}
  ]'::jsonb, 1, '1-15'),

-- Days 16-30: Relationship Building
('physician_office', 'Stakeholder Engagement & Education Planning', 'foundation',
  '[
    {"id": "1", "task": "Meet with lead physicians individually", "priority": "high"},
    {"id": "2", "task": "Present collaborative care model concept", "priority": "high"},
    {"id": "3", "task": "Address concerns about patient relationship continuity", "priority": "high"},
    {"id": "4", "task": "Connect with nursing staff leadership", "priority": "medium"},
    {"id": "5", "task": "Schedule lunch-and-learn presentation", "priority": "high"},
    {"id": "6", "task": "Provide sample communication protocols", "priority": "medium"},
    {"id": "7", "task": "Share relevant case studies and outcomes data", "priority": "high"},
    {"id": "8", "task": "Establish regular follow-up schedule", "priority": "medium"}
  ]'::jsonb, 2, '16-30'),

-- Days 31-45: Process Development
('physician_office', 'Process Integration & Protocol Development', 'engagement',
  '[
    {"id": "1", "task": "Develop practice-specific referral protocols", "priority": "high"},
    {"id": "2", "task": "Create streamlined communication templates", "priority": "high"},
    {"id": "3", "task": "Design consultation request process", "priority": "high"},
    {"id": "4", "task": "Establish after-hours coverage protocols", "priority": "high"},
    {"id": "5", "task": "Create patient education materials", "priority": "medium"},
    {"id": "6", "task": "Set up physician-to-physician consultation process", "priority": "medium"},
    {"id": "7", "task": "Integrate with practice workflow systems", "priority": "medium"},
    {"id": "8", "task": "Train staff on referral processes", "priority": "high"}
  ]'::jsonb, 3, '31-45'),

-- Days 46-60: Education & Training
('physician_office', 'Clinical Education & Collaboration Launch', 'engagement',
  '[
    {"id": "1", "task": "Deliver comprehensive hospice education session", "priority": "high"},
    {"id": "2", "task": "Provide continuing education credits if applicable", "priority": "medium"},
    {"id": "3", "task": "Share symptom management best practices", "priority": "high"},
    {"id": "4", "task": "Demonstrate 24/7 support capabilities", "priority": "high"},
    {"id": "5", "task": "Begin pilot collaboration with interested physicians", "priority": "high"},
    {"id": "6", "task": "Establish regular case consultation schedule", "priority": "medium"},
    {"id": "7", "task": "Create resource library for practice", "priority": "medium"},
    {"id": "8", "task": "Plan ongoing education schedule", "priority": "medium"}
  ]'::jsonb, 4, '46-60'),

-- Days 61-75: Service Optimization
('physician_office', 'Partnership Launch & Early Optimization', 'optimization',
  '[
    {"id": "1", "task": "Process first referrals with extra attention", "priority": "high"},
    {"id": "2", "task": "Conduct follow-up on initial cases", "priority": "high"},
    {"id": "3", "task": "Gather physician feedback on processes", "priority": "high"},
    {"id": "4", "task": "Fine-tune communication protocols", "priority": "medium"},
    {"id": "5", "task": "Celebrate early successes with practice", "priority": "medium"},
    {"id": "6", "task": "Address any concerns promptly", "priority": "high"},
    {"id": "7", "task": "Begin tracking quality metrics", "priority": "high"},
    {"id": "8", "task": "Plan expansion to additional physicians", "priority": "medium"}
  ]'::jsonb, 5, '61-75'),

-- Days 76-90: Measurement & Growth
('physician_office', 'Performance Review & Growth Planning', 'optimization',
  '[
    {"id": "1", "task": "Analyze referral patterns and volume", "priority": "high"},
    {"id": "2", "task": "Review patient/family satisfaction data", "priority": "high"},
    {"id": "3", "task": "Collect physician satisfaction feedback", "priority": "high"},
    {"id": "4", "task": "Calculate practice efficiency improvements", "priority": "medium"},
    {"id": "5", "task": "Conduct quarterly business review", "priority": "high"},
    {"id": "6", "task": "Present outcomes data to practice leadership", "priority": "high"},
    {"id": "7", "task": "Plan next phase of partnership growth", "priority": "medium"},
    {"id": "8", "task": "Document best practices for replication", "priority": "medium"}
  ]'::jsonb, 6, '76-90'),

-- ====================================
-- CHECKLISTS FOR SKILLED NURSING FACILITIES
-- ====================================

-- Days 1-15: Assessment Phase
('nursing_home', 'Facility Assessment & Stakeholder Mapping', 'foundation',
  '[
    {"id": "1", "task": "Analyze facility size, census, and acuity levels", "priority": "high"},
    {"id": "2", "task": "Review quality ratings and recent survey results", "priority": "high"},
    {"id": "3", "task": "Map current hospice relationships and utilization", "priority": "high"},
    {"id": "4", "task": "Schedule meeting with Administrator", "priority": "high"},
    {"id": "5", "task": "Identify key department heads and influencers", "priority": "high"},
    {"id": "6", "task": "Assess facility culture and values", "priority": "medium"},
    {"id": "7", "task": "Review competitive landscape", "priority": "medium"},
    {"id": "8", "task": "Categorize facility (A/B/C level)", "priority": "high"}
  ]'::jsonb, 1, '1-15'),

-- Days 16-30: Relationship Development
('nursing_home', 'Leadership Engagement & Needs Analysis', 'foundation',
  '[
    {"id": "1", "task": "Conduct in-depth meeting with DON", "priority": "high"},
    {"id": "2", "task": "Meet with Social Services Director", "priority": "high"},
    {"id": "3", "task": "Connect with Quality Assurance Coordinator", "priority": "medium"},
    {"id": "4", "task": "Present census optimization strategies", "priority": "high"},
    {"id": "5", "task": "Discuss quality metric improvement opportunities", "priority": "high"},
    {"id": "6", "task": "Address liability and risk management benefits", "priority": "high"},
    {"id": "7", "task": "Schedule facility tour and observation", "priority": "medium"},
    {"id": "8", "task": "Plan initial staff education session", "priority": "high"}
  ]'::jsonb, 2, '16-30'),

-- Days 31-45: Value Demonstration
('nursing_home', 'Education Delivery & Program Design', 'engagement',
  '[
    {"id": "1", "task": "Deliver staff in-service on hospice benefits", "priority": "high"},
    {"id": "2", "task": "Present quality metric improvement data", "priority": "high"},
    {"id": "3", "task": "Share facility-specific case studies", "priority": "high"},
    {"id": "4", "task": "Demonstrate 24/7 clinical support model", "priority": "high"},
    {"id": "5", "task": "Introduce specialized programs (music, pet therapy)", "priority": "medium"},
    {"id": "6", "task": "Discuss survey readiness support", "priority": "high"},
    {"id": "7", "task": "Provide sample documentation templates", "priority": "medium"},
    {"id": "8", "task": "Design customized partnership proposal", "priority": "high"}
  ]'::jsonb, 3, '31-45'),

-- Days 46-60: Process Integration
('nursing_home', 'Protocol Development & System Integration', 'engagement',
  '[
    {"id": "1", "task": "Establish admission criteria and protocols", "priority": "high"},
    {"id": "2", "task": "Create rapid response referral process", "priority": "high"},
    {"id": "3", "task": "Develop care conference schedule", "priority": "high"},
    {"id": "4", "task": "Design quality tracking systems", "priority": "medium"},
    {"id": "5", "task": "Implement communication protocols", "priority": "high"},
    {"id": "6", "task": "Create family meeting processes", "priority": "medium"},
    {"id": "7", "task": "Begin pilot program with select residents", "priority": "high"},
    {"id": "8", "task": "Train key staff on new processes", "priority": "high"}
  ]'::jsonb, 4, '46-60'),

-- Days 61-75: Program Launch
('nursing_home', 'Full Program Implementation & Early Results', 'optimization',
  '[
    {"id": "1", "task": "Launch comprehensive partnership programs", "priority": "high"},
    {"id": "2", "task": "Implement regular nursing rounds", "priority": "high"},
    {"id": "3", "task": "Begin family support group meetings", "priority": "medium"},
    {"id": "4", "task": "Start tracking all quality metrics", "priority": "high"},
    {"id": "5", "task": "Monitor census optimization impact", "priority": "high"},
    {"id": "6", "task": "Document early success stories", "priority": "medium"},
    {"id": "7", "task": "Address staff concerns and feedback", "priority": "high"},
    {"id": "8", "task": "Celebrate early wins with facility", "priority": "medium"}
  ]'::jsonb, 5, '61-75'),

-- Days 76-90: Partnership Optimization
('nursing_home', 'Performance Analysis & Strategic Planning', 'optimization',
  '[
    {"id": "1", "task": "Analyze census and financial impact", "priority": "high"},
    {"id": "2", "task": "Review quality metric improvements", "priority": "high"},
    {"id": "3", "task": "Conduct comprehensive stakeholder survey", "priority": "high"},
    {"id": "4", "task": "Calculate ROI for facility", "priority": "high"},
    {"id": "5", "task": "Hold quarterly business review", "priority": "high"},
    {"id": "6", "task": "Present outcomes to corporate/ownership", "priority": "medium"},
    {"id": "7", "task": "Plan expansion strategies", "priority": "medium"},
    {"id": "8", "task": "Formalize long-term partnership agreement", "priority": "high"}
  ]'::jsonb, 6, '76-90'),

-- ====================================
-- CHECKLISTS FOR HOME HEALTH AGENCIES
-- ====================================

-- Days 1-15: Partnership Assessment
('home_health', 'Agency Analysis & Opportunity Assessment', 'foundation',
  '[
    {"id": "1", "task": "Analyze agency size, service area, and volume", "priority": "high"},
    {"id": "2", "task": "Review current partnership landscape", "priority": "high"},
    {"id": "3", "task": "Identify service area overlap opportunities", "priority": "high"},
    {"id": "4", "task": "Schedule executive leadership meeting", "priority": "high"},
    {"id": "5", "task": "Assess cultural compatibility", "priority": "medium"},
    {"id": "6", "task": "Review patient demographics alignment", "priority": "high"},
    {"id": "7", "task": "Identify mutual benefit opportunities", "priority": "high"},
    {"id": "8", "task": "Prepare partnership proposal outline", "priority": "medium"}
  ]'::jsonb, 1, '1-15'),

-- Days 16-30: Relationship Building
('home_health', 'Stakeholder Engagement & Vision Alignment', 'foundation',
  '[
    {"id": "1", "task": "Meet with agency owner/administrator", "priority": "high"},
    {"id": "2", "task": "Present partnership model options", "priority": "high"},
    {"id": "3", "task": "Connect with Director of Nursing", "priority": "high"},
    {"id": "4", "task": "Engage intake/admissions team", "priority": "high"},
    {"id": "5", "task": "Discuss mutual referral opportunities", "priority": "high"},
    {"id": "6", "task": "Explore co-marketing possibilities", "priority": "medium"},
    {"id": "7", "task": "Address competitive concerns", "priority": "high"},
    {"id": "8", "task": "Define shared vision and goals", "priority": "high"}
  ]'::jsonb, 2, '16-30'),

-- Days 31-45: Process Development
('home_health', 'Workflow Integration & Protocol Design', 'engagement',
  '[
    {"id": "1", "task": "Develop transition criteria and protocols", "priority": "high"},
    {"id": "2", "task": "Create bidirectional referral processes", "priority": "high"},
    {"id": "3", "task": "Design communication workflows", "priority": "high"},
    {"id": "4", "task": "Establish care coordination protocols", "priority": "high"},
    {"id": "5", "task": "Plan joint care conferences", "priority": "medium"},
    {"id": "6", "task": "Create co-marketing materials", "priority": "medium"},
    {"id": "7", "task": "Develop shared documentation standards", "priority": "medium"},
    {"id": "8", "task": "Design quality tracking systems", "priority": "medium"}
  ]'::jsonb, 3, '31-45'),

-- Days 46-60: Team Preparation
('home_health', 'Staff Education & Collaboration Training', 'engagement',
  '[
    {"id": "1", "task": "Conduct joint staff education sessions", "priority": "high"},
    {"id": "2", "task": "Share best practices for transitions", "priority": "high"},
    {"id": "3", "task": "Train on referral processes", "priority": "high"},
    {"id": "4", "task": "Establish clinical collaboration protocols", "priority": "high"},
    {"id": "5", "task": "Create cross-training opportunities", "priority": "medium"},
    {"id": "6", "task": "Develop shared care planning tools", "priority": "medium"},
    {"id": "7", "task": "Plan technology integration", "priority": "low"},
    {"id": "8", "task": "Prepare launch communication plan", "priority": "medium"}
  ]'::jsonb, 4, '46-60'),

-- Days 61-75: Partnership Launch
('home_health', 'Program Implementation & Early Operations', 'optimization',
  '[
    {"id": "1", "task": "Launch referral exchange program", "priority": "high"},
    {"id": "2", "task": "Begin joint marketing initiatives", "priority": "medium"},
    {"id": "3", "task": "Implement care coordination meetings", "priority": "high"},
    {"id": "4", "task": "Start collaborative care planning", "priority": "high"},
    {"id": "5", "task": "Monitor early transition success", "priority": "high"},
    {"id": "6", "task": "Address operational challenges", "priority": "high"},
    {"id": "7", "task": "Collect staff feedback", "priority": "medium"},
    {"id": "8", "task": "Document success stories", "priority": "medium"}
  ]'::jsonb, 5, '61-75'),

-- Days 76-90: Optimization & Growth
('home_health', 'Performance Review & Expansion Planning', 'optimization',
  '[
    {"id": "1", "task": "Analyze referral exchange patterns", "priority": "high"},
    {"id": "2", "task": "Measure patient satisfaction impact", "priority": "high"},
    {"id": "3", "task": "Evaluate financial benefits", "priority": "high"},
    {"id": "4", "task": "Review operational efficiency gains", "priority": "medium"},
    {"id": "5", "task": "Conduct partnership health assessment", "priority": "high"},
    {"id": "6", "task": "Plan expansion opportunities", "priority": "medium"},
    {"id": "7", "task": "Formalize long-term agreements", "priority": "high"},
    {"id": "8", "task": "Celebrate partnership success", "priority": "medium"}
  ]'::jsonb, 6, '76-90');
