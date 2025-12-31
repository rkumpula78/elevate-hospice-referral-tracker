# Complete SQL Migration Content for Physician Offices, SNFs, and Home Health

This document contains the complete SQL migration content for adding comprehensive training materials for physician offices, skilled nursing facilities, and home health agencies.

## File Location
Create this file: `supabase/migrations/20250118_physician_snf_homehealth_content.sql`

## SQL Content Structure

```sql
-- COMPREHENSIVE TRAINING CONTENT FOR PHYSICIAN OFFICES, SNFs, AND HOME HEALTH AGENCIES
-- ===================================================================================
-- This migration adds detailed training content for three additional organization types
-- to match the depth and quality of ALF and Cancer Center content

-- Clear existing placeholder content for these organization types
DELETE FROM public.organization_training_modules 
WHERE organization_type IN ('physician_office', 'nursing_home', 'home_health');

DELETE FROM public.organization_checklists 
WHERE organization_type IN ('physician_office', 'nursing_home', 'home_health');
```

## Physician Office Content

### 1. Core Value Proposition
```sql
INSERT INTO public.organization_training_modules (organization_type, module_name, module_category, content, order_index) VALUES
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
  }'::jsonb, 1);
```

### 2. Stakeholder Value Propositions
Add modules for:
- Primary Care Physicians (color: blue)
- Specialists (color: green)
- Practice Administrators (color: purple)
- Nursing Staff (color: orange)

### 3. 90-Day Implementation Roadmap
Three phases:
- Days 1-30: Foundation Building
- Days 31-60: Development Phase
- Days 61-90: Optimization Phase

### 4. KPIs
Categories:
- Referral Metrics
- Quality Indicators
- Partnership Health

### 5. Best Practices
Sections:
- Communication Excellence
- Clinical Collaboration
- Practice Integration

### 6. Checklists (6 total)
```sql
INSERT INTO public.organization_checklists (organization_type, checklist_name, phase, items, order_index, days_range) VALUES
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
  ]'::jsonb, 1, '1-15');
```

## Skilled Nursing Facility Content

### 1. Core Value Proposition
Main message: "Optimize census management while providing specialized end-of-life expertise"

### 2. Stakeholder Value Propositions
- Administrators (color: green)
- Directors of Nursing (color: blue)
- Social Services Directors (color: purple)
- Quality Assurance Coordinators (color: orange)

### 3. 90-Day Implementation Roadmap
- Days 1-30: Assessment & Analysis
- Days 31-60: Value Demonstration
- Days 61-90: Partnership Launch

### 4. Strategic Partnership Models
- Census Optimization Program
- Clinical Education Partnership
- Quality Enhancement Initiative

### 5. Account Assessment Framework
- A-Level Facilities (6+ referrals/month)
- B-Level Facilities (3-5 referrals/month)
- C-Level Facilities (1-2 referrals/month)

### 6. KPIs
- Operational Metrics
- Quality Metrics
- Financial Impact

### 7. Checklists (6 total)

## Home Health Agency Content

### 1. Core Value Proposition
Main message: "Natural continuum of care partnerships for seamless patient transitions"

### 2. Stakeholder Value Propositions
- Administrators/Owners (color: blue)
- Directors of Nursing (color: green)
- Intake Coordinators (color: purple)
- Clinical Managers (color: orange)

### 3. Strategic Partnership Models
- Continuum of Care Model
- Co-Marketing Partnership
- Clinical Collaboration Model

### 4. 90-Day Implementation Roadmap
- Days 1-30: Partnership Foundation
- Days 31-60: Integration Planning
- Days 61-90: Partnership Activation

### 5. Partnership Development Strategy
- Assessment (2-4 weeks)
- Engagement (4-6 weeks)
- Formalization (2-4 weeks)
- Optimization (Ongoing)

### 6. KPIs
- Referral Metrics
- Clinical Outcomes
- Operational Efficiency
- Partnership Health

### 7. Checklists (6 total)

## Implementation Instructions

1. **Create the SQL file** with all content sections
2. **Run the migration**:
   ```bash
   supabase db push
   ```
3. **Verify in application**:
   - Create test organizations of each type
   - Check training tab displays all content
   - Test checklist functionality

## Key Differences by Organization Type

### Physician Offices
- Focus on maintaining physician relationships
- Emphasis on reducing after-hours burden
- Collaborative care model

### Skilled Nursing Facilities
- Focus on census optimization
- Quality metrics improvement
- Liability reduction

### Home Health Agencies
- Focus on seamless transitions
- Bidirectional referral opportunities
- Co-marketing partnerships

## Success Metrics Summary

| Organization Type | Target Monthly Referrals | Key Success Indicator |
|-------------------|-------------------------|----------------------|
| Physician Office  | 2-4 per physician      | 85%+ conversion rate |
| SNF               | 6-10 per facility      | 20%+ transfer reduction |
| Home Health       | Track bidirectional    | 95%+ transition success |

This comprehensive content will provide your marketing team with all the tools needed to build successful partnerships across these three critical referral source types. 