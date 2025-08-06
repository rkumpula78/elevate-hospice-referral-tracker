# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a hospice referral tracking CRM application for Elevate Hospice & Palliative Care. It's a comprehensive dashboard system for managing referrals, patient tracking, organization relationships, training programs, and compliance metrics in the hospice care industry.

## Common Development Commands

### React/TypeScript Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Development Workflow
- The project uses Vite for fast development and hot reloading
- All TypeScript files should be type-checked before committing
- Run linting to maintain code quality standards

## High-Level Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router DOM v6
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Authentication**: Supabase Auth with email domain restrictions (@elevatehospiceaz.com)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation

### Application Structure

#### Core Pages & Features
- **Dashboard**: KPI metrics, alerts, census tracking, and performance charts
- **Referrals**: Patient referral management with comprehensive tracking
- **Organizations**: Healthcare facility relationship management
- **Patients**: Patient information and care coordination
- **Training**: Educational content delivery and progress tracking
- **Analytics**: Performance metrics and reporting
- **Compliance**: Regulatory tracking and metrics

#### Database Schema (Supabase)
The application uses a comprehensive PostgreSQL schema with key tables:
- `referrals` - Core patient referral data with status tracking
- `organizations` - Healthcare facilities and partnership information
- `patients` - Patient demographics and care information
- `activity_communications` - CRM activity tracking
- `organization_contacts` - Key contacts at partner facilities
- `marketer_training_progress` - Training completion tracking
- `compliance_metrics` - Regulatory compliance data
- `visits` - Patient visit scheduling and tracking

#### Component Organization
```
src/
├── components/
│   ├── ui/           # shadcn/ui components (buttons, forms, etc.)
│   ├── auth/         # Authentication components
│   ├── crm/          # CRM-specific components
│   ├── charts/       # Data visualization components
│   ├── training/     # Training module components
│   └── layout/       # Layout and navigation components
├── pages/            # Route components
├── hooks/            # Custom React hooks (useAuth, useProfile)
├── lib/              # Utility functions
└── integrations/
    └── supabase/     # Supabase client and type definitions
```

### Key Architectural Patterns

#### Authentication & Authorization
- Domain-restricted authentication (@elevatehospiceaz.com only)
- Role-based access through user profiles
- Protected routes using `ProtectedRoute` component
- Session management with Supabase Auth

#### State Management Philosophy
- **Server State**: React Query for caching, synchronization, and optimistic updates
- **Local State**: React hooks (useState, useReducer) for component state
- **Form State**: React Hook Form for complex form handling
- **Global State**: Context API for authentication and theme management

#### Data Flow Architecture
- Components use React Query hooks for data fetching
- Mutations invalidate relevant queries for real-time updates
- Optimistic updates for better user experience
- Error boundaries for graceful error handling

#### UI/UX Patterns
- Consistent shadcn/ui component usage across the application
- Responsive design with Tailwind CSS breakpoints
- Loading states and skeleton components
- Toast notifications using Sonner
- Modal dialogs for forms and confirmations

### Supabase Integration

#### Client Configuration
- Auto-generated TypeScript types from database schema
- Row Level Security (RLS) policies for data access control
- Real-time subscriptions for live data updates
- Edge functions for server-side logic

#### Database Relationships
- Foreign key relationships between referrals, organizations, and patients
- Many-to-many relationships for contacts and training modules
- Comprehensive audit trails with created_at/updated_at timestamps

### Performance Considerations
- React Query caching reduces unnecessary API calls
- Component lazy loading for code splitting
- Optimized bundle size with Vite's tree shaking
- Image optimization and lazy loading where applicable

### Development Workflow Integration
- Built for deployment on Lovable platform
- Git-based workflow with automatic deployments
- Environment variable management through Supabase
- TypeScript strict mode for type safety

### Business Logic Domains
- **Referral Management**: Patient intake, status tracking, and care coordination
- **Relationship Management**: Healthcare facility partnerships and contact management
- **Training & Compliance**: Educational content delivery and regulatory tracking
- **Analytics & Reporting**: Performance metrics and business intelligence
- **Census Management**: Patient count tracking and capacity planning

### Security & Compliance
- HIPAA-conscious data handling patterns
- Audit trails for all data modifications
- Secure authentication with domain restrictions
- Data encryption at rest and in transit through Supabase

This architecture supports rapid development cycles while maintaining healthcare industry standards for data security and regulatory compliance.