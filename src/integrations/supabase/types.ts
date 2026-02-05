export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_communications: {
        Row: {
          activity_date: string
          completed_by: string
          contact_id: string | null
          cost_amount: number | null
          created_at: string | null
          discussion_points: string | null
          duration_minutes: number | null
          follow_up_completed: boolean | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          interaction_type: string
          materials_provided: string[] | null
          next_step: string | null
          organization_id: string | null
          outcome_sentiment: string | null
          purpose: string[] | null
          referral_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_date?: string
          completed_by: string
          contact_id?: string | null
          cost_amount?: number | null
          created_at?: string | null
          discussion_points?: string | null
          duration_minutes?: number | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_type: string
          materials_provided?: string[] | null
          next_step?: string | null
          organization_id?: string | null
          outcome_sentiment?: string | null
          purpose?: string[] | null
          referral_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_date?: string
          completed_by?: string
          contact_id?: string | null
          cost_amount?: number | null
          created_at?: string | null
          discussion_points?: string | null
          duration_minutes?: number | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          interaction_type?: string
          materials_provided?: string[] | null
          next_step?: string | null
          organization_id?: string | null
          outcome_sentiment?: string | null
          purpose?: string[] | null
          referral_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_communications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          activity_date: string
          activity_type: string
          contact_id: string | null
          created_at: string | null
          discussion_points: string | null
          duration_minutes: number | null
          follow_up_completed: boolean | null
          follow_up_date: string | null
          id: string
          marketer_name: string | null
          materials_left: string[] | null
          next_steps: string | null
          notes: string | null
          organization_id: string | null
          participants: string[] | null
          purpose: string | null
          updated_at: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: string
          contact_id?: string | null
          created_at?: string | null
          discussion_points?: string | null
          duration_minutes?: number | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          id?: string
          marketer_name?: string | null
          materials_left?: string[] | null
          next_steps?: string | null
          notes?: string | null
          organization_id?: string | null
          participants?: string[] | null
          purpose?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          contact_id?: string | null
          created_at?: string | null
          discussion_points?: string | null
          duration_minutes?: number | null
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          id?: string
          marketer_name?: string | null
          materials_left?: string[] | null
          next_steps?: string | null
          notes?: string | null
          organization_id?: string | null
          participants?: string[] | null
          purpose?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      admission_data: {
        Row: {
          admissions: number
          average_los: number
          cap_year: number
          census_end_of_month: number
          created_at: string | null
          discharges: number
          id: string
          month: number
          notes: string | null
          provider_number: string
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admissions: number
          average_los: number
          cap_year: number
          census_end_of_month: number
          created_at?: string | null
          discharges: number
          id?: string
          month: number
          notes?: string | null
          provider_number: string
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admissions?: number
          average_los?: number
          cap_year?: number
          census_end_of_month?: number
          created_at?: string | null
          discharges?: number
          id?: string
          month?: number
          notes?: string | null
          provider_number?: string
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bereavement_tracking: {
        Row: {
          bereavement_status: string | null
          created_at: string | null
          enrollment_date: string | null
          family_contact_id: string | null
          id: string
          referral_id: string
          support_notes: string | null
          updated_at: string | null
        }
        Insert: {
          bereavement_status?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          family_contact_id?: string | null
          id?: string
          referral_id: string
          support_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          bereavement_status?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          family_contact_id?: string | null
          id?: string
          referral_id?: string
          support_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bereavement_tracking_family_contact_id_fkey"
            columns: ["family_contact_id"]
            isOneToOne: false
            referencedRelation: "referral_family_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bereavement_tracking_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      care_team_assignments: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          patient_id: string | null
          role: Database["public"]["Enums"]["care_team_role"]
          staff_name: string
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          patient_id?: string | null
          role: Database["public"]["Enums"]["care_team_role"]
          staff_name: string
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          patient_id?: string | null
          role?: Database["public"]["Enums"]["care_team_role"]
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_team_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      census_entries: {
        Row: {
          census_date: string
          created_at: string | null
          id: string
          notes: string | null
          patient_count: number
          updated_at: string | null
        }
        Insert: {
          census_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_count?: number
          updated_at?: string | null
        }
        Update: {
          census_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_count?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_completions: {
        Row: {
          checklist_id: string | null
          completed_at: string | null
          completed_by: string | null
          completed_items: Json | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_items?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          checklist_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completed_items?: Json | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "organization_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          organization_type: string | null
          subject_line: string | null
          success_rate: number | null
          template_category: string
          template_content: string
          template_name: string
          template_type: string
          updated_at: string
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_type?: string | null
          subject_line?: string | null
          success_rate?: number | null
          template_category: string
          template_content: string
          template_name: string
          template_type: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_type?: string | null
          subject_line?: string | null
          success_rate?: number | null
          template_category?: string
          template_content?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: []
      }
      competitive_analysis: {
        Row: {
          competitor_name: string
          contract_details: string | null
          created_at: string | null
          displacement_opportunities: string | null
          id: string
          last_updated: string | null
          organization_id: string | null
          relationship_strength: string | null
          strengths: string | null
          weaknesses: string | null
        }
        Insert: {
          competitor_name: string
          contract_details?: string | null
          created_at?: string | null
          displacement_opportunities?: string | null
          id?: string
          last_updated?: string | null
          organization_id?: string | null
          relationship_strength?: string | null
          strengths?: string | null
          weaknesses?: string | null
        }
        Update: {
          competitor_name?: string
          contract_details?: string | null
          created_at?: string | null
          displacement_opportunities?: string | null
          id?: string
          last_updated?: string | null
          organization_id?: string | null
          relationship_strength?: string | null
          strengths?: string | null
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_metrics: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          last_updated: string | null
          metric_name: string
          period: string
          target_value: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          last_updated?: string | null
          metric_name: string
          period: string
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          last_updated?: string | null
          metric_name?: string
          period?: string
          target_value?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      "Elevate CRM": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      hospice_profiles: {
        Row: {
          address: string | null
          administrator_name: string | null
          created_at: string | null
          email: string | null
          fax: string | null
          id: string
          is_default: boolean | null
          license_number: string | null
          medical_director: string | null
          npi_number: string | null
          phone: string | null
          provider_name: string
          provider_number: string
          ptan_number: string | null
          service_area: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          administrator_name?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          is_default?: boolean | null
          license_number?: string | null
          medical_director?: string | null
          npi_number?: string | null
          phone?: string | null
          provider_name: string
          provider_number: string
          ptan_number?: string | null
          service_area?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          administrator_name?: string | null
          created_at?: string | null
          email?: string | null
          fax?: string | null
          id?: string
          is_default?: boolean | null
          license_number?: string | null
          medical_director?: string | null
          npi_number?: string | null
          phone?: string | null
          provider_name?: string
          provider_number?: string
          ptan_number?: string | null
          service_area?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hospice_referrals: {
        Row: {
          additional_comments: string | null
          advance_directives: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          insurance_provider: string | null
          medicare_number: string | null
          patient_address: string | null
          patient_name: string
          physician_name: string
          primary_care_physician: string | null
          primary_caregiver: string | null
          primary_diagnosis: string
          referring_facility: string
          submission_date: string
          updated_at: string
        }
        Insert: {
          additional_comments?: string | null
          advance_directives?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          insurance_provider?: string | null
          medicare_number?: string | null
          patient_address?: string | null
          patient_name: string
          physician_name: string
          primary_care_physician?: string | null
          primary_caregiver?: string | null
          primary_diagnosis: string
          referring_facility: string
          submission_date?: string
          updated_at?: string
        }
        Update: {
          additional_comments?: string | null
          advance_directives?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          insurance_provider?: string | null
          medicare_number?: string | null
          patient_address?: string | null
          patient_name?: string
          physician_name?: string
          primary_care_physician?: string | null
          primary_caregiver?: string | null
          primary_diagnosis?: string
          referring_facility?: string
          submission_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      liaison_goals: {
        Row: {
          created_at: string | null
          goal_period_end: string
          goal_period_start: string
          id: string
          in_person_visits_goal: number | null
          liaison_name: string
          lunch_learns_goal: number | null
          new_referrals_goal: number | null
          phone_calls_goal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_period_end: string
          goal_period_start: string
          id?: string
          in_person_visits_goal?: number | null
          liaison_name: string
          lunch_learns_goal?: number | null
          new_referrals_goal?: number | null
          phone_calls_goal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_period_end?: string
          goal_period_start?: string
          id?: string
          in_person_visits_goal?: number | null
          liaison_name?: string
          lunch_learns_goal?: number | null
          new_referrals_goal?: number | null
          phone_calls_goal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketer_training_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          marketer_name: string
          module_id: string | null
          notes: string | null
          quiz_score: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          marketer_name: string
          module_id?: string | null
          notes?: string | null
          quiz_score?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          marketer_name?: string
          module_id?: string | null
          notes?: string | null
          quiz_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketer_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "organization_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          target_audience: string | null
          theme_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          target_audience?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          target_audience?: string | null
          theme_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "marketing_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_materials: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          material_type: string
          theme_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          material_type: string
          theme_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          material_type?: string
          theme_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_materials_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "marketing_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_themes: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_checklists: {
        Row: {
          checklist_name: string
          created_at: string
          days_range: string | null
          id: string
          is_active: boolean | null
          items: Json
          order_index: number | null
          organization_type: string
          phase: string
          updated_at: string
        }
        Insert: {
          checklist_name: string
          created_at?: string
          days_range?: string | null
          id?: string
          is_active?: boolean | null
          items: Json
          order_index?: number | null
          organization_type: string
          phase: string
          updated_at?: string
        }
        Update: {
          checklist_name?: string
          created_at?: string
          days_range?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          order_index?: number | null
          organization_type?: string
          phase?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_contacts: {
        Row: {
          activity_log: Json | null
          affiliation_agreements: boolean | null
          areas_of_service: string | null
          assigned_owner: string | null
          best_contact_times: string | null
          communication_log: Json | null
          communication_preferences: string[] | null
          consent_status: string | null
          contact_stage: string | null
          contact_type: string | null
          created_at: string | null
          credential_verification_status: string | null
          department: string | null
          direct_phone: string | null
          email: string | null
          fax_number: string | null
          first_name: string
          hipaa_compliance: boolean | null
          id: string
          influence_level: string | null
          last_contact_date: string | null
          last_name: string
          lead_source: string | null
          linked_organizations: string[] | null
          mailing_address: string | null
          marketing_preferences: string[] | null
          middle_name: string | null
          next_followup_date: string | null
          npi_number: string | null
          organization_id: string
          patient_population_served: string | null
          personal_interests: string | null
          personal_notes: string | null
          preferred_contact_method: string | null
          preferred_hospital: string | null
          previous_experience: string | null
          professional_license: string | null
          professional_networks: string | null
          referral_conversion_rate: number | null
          referral_history: Json | null
          referral_source_category: string | null
          relationship_notes: string | null
          relationship_strength: number | null
          relationship_to_patient: string | null
          role_in_referral: string | null
          role_in_referral_process: string | null
          specialty: string | null
          tags_categories: string[] | null
          title: string | null
          updated_at: string | null
          years_in_position: number | null
        }
        Insert: {
          activity_log?: Json | null
          affiliation_agreements?: boolean | null
          areas_of_service?: string | null
          assigned_owner?: string | null
          best_contact_times?: string | null
          communication_log?: Json | null
          communication_preferences?: string[] | null
          consent_status?: string | null
          contact_stage?: string | null
          contact_type?: string | null
          created_at?: string | null
          credential_verification_status?: string | null
          department?: string | null
          direct_phone?: string | null
          email?: string | null
          fax_number?: string | null
          first_name: string
          hipaa_compliance?: boolean | null
          id?: string
          influence_level?: string | null
          last_contact_date?: string | null
          last_name: string
          lead_source?: string | null
          linked_organizations?: string[] | null
          mailing_address?: string | null
          marketing_preferences?: string[] | null
          middle_name?: string | null
          next_followup_date?: string | null
          npi_number?: string | null
          organization_id: string
          patient_population_served?: string | null
          personal_interests?: string | null
          personal_notes?: string | null
          preferred_contact_method?: string | null
          preferred_hospital?: string | null
          previous_experience?: string | null
          professional_license?: string | null
          professional_networks?: string | null
          referral_conversion_rate?: number | null
          referral_history?: Json | null
          referral_source_category?: string | null
          relationship_notes?: string | null
          relationship_strength?: number | null
          relationship_to_patient?: string | null
          role_in_referral?: string | null
          role_in_referral_process?: string | null
          specialty?: string | null
          tags_categories?: string[] | null
          title?: string | null
          updated_at?: string | null
          years_in_position?: number | null
        }
        Update: {
          activity_log?: Json | null
          affiliation_agreements?: boolean | null
          areas_of_service?: string | null
          assigned_owner?: string | null
          best_contact_times?: string | null
          communication_log?: Json | null
          communication_preferences?: string[] | null
          consent_status?: string | null
          contact_stage?: string | null
          contact_type?: string | null
          created_at?: string | null
          credential_verification_status?: string | null
          department?: string | null
          direct_phone?: string | null
          email?: string | null
          fax_number?: string | null
          first_name?: string
          hipaa_compliance?: boolean | null
          id?: string
          influence_level?: string | null
          last_contact_date?: string | null
          last_name?: string
          lead_source?: string | null
          linked_organizations?: string[] | null
          mailing_address?: string | null
          marketing_preferences?: string[] | null
          middle_name?: string | null
          next_followup_date?: string | null
          npi_number?: string | null
          organization_id?: string
          patient_population_served?: string | null
          personal_interests?: string | null
          personal_notes?: string | null
          preferred_contact_method?: string | null
          preferred_hospital?: string | null
          previous_experience?: string | null
          professional_license?: string | null
          professional_networks?: string | null
          referral_conversion_rate?: number | null
          referral_history?: Json | null
          referral_source_category?: string | null
          relationship_notes?: string | null
          relationship_strength?: number | null
          relationship_to_patient?: string | null
          role_in_referral?: string | null
          role_in_referral_process?: string | null
          specialty?: string | null
          tags_categories?: string[] | null
          title?: string | null
          updated_at?: string | null
          years_in_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          content_type: string | null
          created_at: string
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          organization_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_kpis: {
        Row: {
          actual_value: number | null
          created_at: string
          id: string
          kpi_type: string
          notes: string | null
          organization_id: string | null
          period_end: string
          period_start: string
          target_value: number | null
          updated_at: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          id?: string
          kpi_type: string
          notes?: string | null
          organization_id?: string | null
          period_end: string
          period_start: string
          target_value?: number | null
          updated_at?: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          id?: string
          kpi_type?: string
          notes?: string | null
          organization_id?: string | null
          period_end?: string
          period_start?: string
          target_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_kpis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_training_modules: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean | null
          module_category: string
          module_name: string
          order_index: number | null
          organization_type: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          module_category: string
          module_name: string
          order_index?: number | null
          organization_type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          module_category?: string
          module_name?: string
          order_index?: number | null
          organization_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          account_rating: string | null
          address: string | null
          after_hours_contact: string | null
          assigned_marketer: string | null
          bed_count: number | null
          competition_level: string | null
          competitive_landscape: string | null
          contact_email: string | null
          contact_person: string | null
          contract_on_file: boolean | null
          contract_status: string | null
          created_at: string | null
          cultural_alignment_score: number | null
          current_hospice_providers: string[] | null
          current_provider_satisfaction_score: number | null
          dba_name: string | null
          decision_maker_email: string | null
          decision_maker_name: string | null
          decision_maker_phone: string | null
          decision_maker_title: string | null
          estimated_annual_revenue: number | null
          estimated_monthly_referrals: number | null
          expansion_plans: string | null
          financial_health_notes: string | null
          financial_stability_score: number | null
          geographic_alignment_score: number | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          is_active: boolean | null
          last_contact_date: string | null
          last_training_review: string | null
          license_numbers: string[] | null
          medicare_id: string | null
          name: string
          next_followup_date: string | null
          ownership_type: string | null
          partnership_notes: string | null
          partnership_priority_level: string | null
          partnership_score: number | null
          partnership_stage: string | null
          phone: string | null
          referral_potential: number | null
          referral_potential_level: string | null
          regulatory_notes: string | null
          relationship_accessibility_score: number | null
          relationship_status: string | null
          relationship_temperature: string | null
          research_completed: boolean | null
          revenue_ytd: number | null
          roi_calculation: Json | null
          service_radius: number | null
          sub_type: string | null
          type: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_rating?: string | null
          address?: string | null
          after_hours_contact?: string | null
          assigned_marketer?: string | null
          bed_count?: number | null
          competition_level?: string | null
          competitive_landscape?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_on_file?: boolean | null
          contract_status?: string | null
          created_at?: string | null
          cultural_alignment_score?: number | null
          current_hospice_providers?: string[] | null
          current_provider_satisfaction_score?: number | null
          dba_name?: string | null
          decision_maker_email?: string | null
          decision_maker_name?: string | null
          decision_maker_phone?: string | null
          decision_maker_title?: string | null
          estimated_annual_revenue?: number | null
          estimated_monthly_referrals?: number | null
          expansion_plans?: string | null
          financial_health_notes?: string | null
          financial_stability_score?: number | null
          geographic_alignment_score?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          is_active?: boolean | null
          last_contact_date?: string | null
          last_training_review?: string | null
          license_numbers?: string[] | null
          medicare_id?: string | null
          name?: string
          next_followup_date?: string | null
          ownership_type?: string | null
          partnership_notes?: string | null
          partnership_priority_level?: string | null
          partnership_score?: number | null
          partnership_stage?: string | null
          phone?: string | null
          referral_potential?: number | null
          referral_potential_level?: string | null
          regulatory_notes?: string | null
          relationship_accessibility_score?: number | null
          relationship_status?: string | null
          relationship_temperature?: string | null
          research_completed?: boolean | null
          revenue_ytd?: number | null
          roi_calculation?: Json | null
          service_radius?: number | null
          sub_type?: string | null
          type: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_rating?: string | null
          address?: string | null
          after_hours_contact?: string | null
          assigned_marketer?: string | null
          bed_count?: number | null
          competition_level?: string | null
          competitive_landscape?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_on_file?: boolean | null
          contract_status?: string | null
          created_at?: string | null
          cultural_alignment_score?: number | null
          current_hospice_providers?: string[] | null
          current_provider_satisfaction_score?: number | null
          dba_name?: string | null
          decision_maker_email?: string | null
          decision_maker_name?: string | null
          decision_maker_phone?: string | null
          decision_maker_title?: string | null
          estimated_annual_revenue?: number | null
          estimated_monthly_referrals?: number | null
          expansion_plans?: string | null
          financial_health_notes?: string | null
          financial_stability_score?: number | null
          geographic_alignment_score?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          is_active?: boolean | null
          last_contact_date?: string | null
          last_training_review?: string | null
          license_numbers?: string[] | null
          medicare_id?: string | null
          name?: string
          next_followup_date?: string | null
          ownership_type?: string | null
          partnership_notes?: string | null
          partnership_priority_level?: string | null
          partnership_score?: number | null
          partnership_stage?: string | null
          phone?: string | null
          referral_potential?: number | null
          referral_potential_level?: string | null
          regulatory_notes?: string | null
          relationship_accessibility_score?: number | null
          relationship_status?: string | null
          relationship_temperature?: string | null
          research_completed?: boolean | null
          revenue_ytd?: number | null
          roi_calculation?: Json | null
          service_radius?: number | null
          sub_type?: string | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partnership_agreements: {
        Row: {
          agreement_type: string
          approved_by: string | null
          auto_renewal: boolean | null
          communication_protocols: Json | null
          created_at: string
          created_by: string | null
          effective_date: string | null
          expiration_date: string | null
          financial_terms: Json | null
          id: string
          initial_term_months: number | null
          notes: string | null
          organization_id: string
          performance_metrics: Json | null
          quality_standards: Json | null
          service_level_agreements: Json | null
          signed_date: string | null
          status: string
          termination_notice_days: number | null
          updated_at: string
          volume_targets: Json | null
        }
        Insert: {
          agreement_type?: string
          approved_by?: string | null
          auto_renewal?: boolean | null
          communication_protocols?: Json | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          financial_terms?: Json | null
          id?: string
          initial_term_months?: number | null
          notes?: string | null
          organization_id: string
          performance_metrics?: Json | null
          quality_standards?: Json | null
          service_level_agreements?: Json | null
          signed_date?: string | null
          status?: string
          termination_notice_days?: number | null
          updated_at?: string
          volume_targets?: Json | null
        }
        Update: {
          agreement_type?: string
          approved_by?: string | null
          auto_renewal?: boolean | null
          communication_protocols?: Json | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          financial_terms?: Json | null
          id?: string
          initial_term_months?: number | null
          notes?: string | null
          organization_id?: string
          performance_metrics?: Json | null
          quality_standards?: Json | null
          service_level_agreements?: Json | null
          signed_date?: string | null
          status?: string
          termination_notice_days?: number | null
          updated_at?: string
          volume_targets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_performance_metrics: {
        Row: {
          accepted_referrals: number | null
          average_admission_time_hours: number | null
          communication_timeliness_score: number | null
          created_at: string
          family_satisfaction_score: number | null
          goals_met: Json | null
          id: string
          investment_costs: number | null
          metric_period_end: string
          metric_period_start: string
          notes: string | null
          organization_id: string
          partner_satisfaction_score: number | null
          patient_satisfaction_score: number | null
          performance_alerts: Json | null
          revenue_generated: number | null
          roi_ratio: number | null
          total_referrals: number | null
          updated_at: string
        }
        Insert: {
          accepted_referrals?: number | null
          average_admission_time_hours?: number | null
          communication_timeliness_score?: number | null
          created_at?: string
          family_satisfaction_score?: number | null
          goals_met?: Json | null
          id?: string
          investment_costs?: number | null
          metric_period_end: string
          metric_period_start: string
          notes?: string | null
          organization_id: string
          partner_satisfaction_score?: number | null
          patient_satisfaction_score?: number | null
          performance_alerts?: Json | null
          revenue_generated?: number | null
          roi_ratio?: number | null
          total_referrals?: number | null
          updated_at?: string
        }
        Update: {
          accepted_referrals?: number | null
          average_admission_time_hours?: number | null
          communication_timeliness_score?: number | null
          created_at?: string
          family_satisfaction_score?: number | null
          goals_met?: Json | null
          id?: string
          investment_costs?: number | null
          metric_period_end?: string
          metric_period_start?: string
          notes?: string | null
          organization_id?: string
          partner_satisfaction_score?: number | null
          patient_satisfaction_score?: number | null
          performance_alerts?: Json | null
          revenue_generated?: number | null
          roi_ratio?: number | null
          total_referrals?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partnership_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          patient_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          content_type: string | null
          created_at: string
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          patient_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          patient_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          patient_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_evaluations: {
        Row: {
          additional_cap_liability: number | null
          approval_date: string | null
          approved_by: string | null
          created_at: string | null
          diagnosis: string | null
          estimated_los: number | null
          evaluation_date: string | null
          id: string
          insurance_type: string | null
          notes: string | null
          patient_age: number | null
          patient_id: string
          primary_caregiver: string | null
          prognosis_months: number | null
          proposed_admission_date: string | null
          provider_number: string
          recommendation: string | null
          risk_factors: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_cap_liability?: number | null
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          diagnosis?: string | null
          estimated_los?: number | null
          evaluation_date?: string | null
          id?: string
          insurance_type?: string | null
          notes?: string | null
          patient_age?: number | null
          patient_id: string
          primary_caregiver?: string | null
          prognosis_months?: number | null
          proposed_admission_date?: string | null
          provider_number: string
          recommendation?: string | null
          risk_factors?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_cap_liability?: number | null
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string | null
          diagnosis?: string | null
          estimated_los?: number | null
          evaluation_date?: string | null
          id?: string
          insurance_type?: string | null
          notes?: string | null
          patient_age?: number | null
          patient_id?: string
          primary_caregiver?: string | null
          prognosis_months?: number | null
          proposed_admission_date?: string | null
          provider_number?: string
          recommendation?: string | null
          risk_factors?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          admission_date: string | null
          advanced_directive: boolean | null
          attending_physician: string | null
          caregiver_contact: string | null
          caregiver_name: string | null
          created_at: string | null
          date_of_birth: string | null
          diagnosis: string | null
          discharge_date: string | null
          dme_needs: string | null
          dnr_status: boolean | null
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string
          funeral_arrangements: string | null
          height: number | null
          id: string
          insurance: string | null
          last_name: string
          medicaid_number: string | null
          medicare_number: string | null
          msw_notes: string | null
          next_steps: string | null
          notes: string | null
          phone: string | null
          physician: string | null
          primary_insurance: string | null
          prior_hospice_info: string | null
          referral_id: string | null
          responsible_party_contact: string | null
          responsible_party_name: string | null
          responsible_party_relationship: string | null
          secondary_insurance: string | null
          special_medical_needs: string | null
          spiritual_preferences: string | null
          ssn: string | null
          status: Database["public"]["Enums"]["patient_status"] | null
          transport_needs: string | null
          upcoming_appointments: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          advanced_directive?: boolean | null
          attending_physician?: string | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          discharge_date?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name: string
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          last_name: string
          medicaid_number?: string | null
          medicare_number?: string | null
          msw_notes?: string | null
          next_steps?: string | null
          notes?: string | null
          phone?: string | null
          physician?: string | null
          primary_insurance?: string | null
          prior_hospice_info?: string | null
          referral_id?: string | null
          responsible_party_contact?: string | null
          responsible_party_name?: string | null
          responsible_party_relationship?: string | null
          secondary_insurance?: string | null
          special_medical_needs?: string | null
          spiritual_preferences?: string | null
          ssn?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          advanced_directive?: boolean | null
          attending_physician?: string | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          discharge_date?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          last_name?: string
          medicaid_number?: string | null
          medicare_number?: string | null
          msw_notes?: string | null
          next_steps?: string | null
          notes?: string | null
          phone?: string | null
          physician?: string | null
          primary_insurance?: string | null
          prior_hospice_info?: string | null
          referral_id?: string | null
          responsible_party_contact?: string | null
          responsible_party_name?: string | null
          responsible_party_relationship?: string | null
          secondary_insurance?: string | null
          special_medical_needs?: string | null
          spiritual_preferences?: string | null
          ssn?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      psr_data: {
        Row: {
          cap_year: number
          claims: number
          created_at: string | null
          gross_reimbursement: number
          id: string
          medicare_days: number
          month: number
          net_reimbursement: number
          post_sequestration_reduction: number | null
          provider_number: string
          sequestration: number | null
          service_period_end: string | null
          service_period_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cap_year: number
          claims: number
          created_at?: string | null
          gross_reimbursement: number
          id?: string
          medicare_days: number
          month: number
          net_reimbursement: number
          post_sequestration_reduction?: number | null
          provider_number: string
          sequestration?: number | null
          service_period_end?: string | null
          service_period_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cap_year?: number
          claims?: number
          created_at?: string | null
          gross_reimbursement?: number
          id?: string
          medicare_days?: number
          month?: number
          net_reimbursement?: number
          post_sequestration_reduction?: number | null
          provider_number?: string
          sequestration?: number | null
          service_period_end?: string | null
          service_period_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_assessments: {
        Row: {
          assessment_outcome: string | null
          assigned_clinician: string | null
          created_at: string | null
          id: string
          outcome_notes: string | null
          referral_id: string
          scheduled_date: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_outcome?: string | null
          assigned_clinician?: string | null
          created_at?: string | null
          id?: string
          outcome_notes?: string | null
          referral_id: string
          scheduled_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_outcome?: string | null
          assigned_clinician?: string | null
          created_at?: string | null
          id?: string
          outcome_notes?: string | null
          referral_id?: string
          scheduled_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_assessments_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_family_contacts: {
        Row: {
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          is_poa: boolean | null
          is_primary_contact: boolean | null
          phone: string | null
          referral_id: string
          relationship: string | null
          updated_at: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_poa?: boolean | null
          is_primary_contact?: boolean | null
          phone?: string | null
          referral_id: string
          relationship?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_poa?: boolean | null
          is_primary_contact?: boolean | null
          phone?: string | null
          referral_id?: string
          relationship?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_family_contacts_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          address: string | null
          admission_date: string | null
          advanced_directive: boolean | null
          assessment_scheduled_date: string | null
          assigned_marketer: string | null
          attending_physician: string | null
          benefit_period_number: number | null
          caregiver_contact: string | null
          caregiver_name: string | null
          contact_date: string | null
          created_at: string | null
          date_of_birth: string | null
          diagnosis: string | null
          dme_needs: string | null
          dnr_status: boolean | null
          emergency_contact: string | null
          emergency_phone: string | null
          first_name: string | null
          funeral_arrangements: string | null
          height: number | null
          id: string
          insurance: string | null
          insurance_verification: boolean | null
          last_name: string | null
          medicaid_number: string | null
          medical_records_received: boolean | null
          medicare_number: string | null
          msw_notes: string | null
          next_steps: string | null
          notes: string | null
          organization_id: string | null
          patient_location: string | null
          patient_name: string
          patient_phone: string | null
          phone: string | null
          physician: string | null
          primary_insurance: string | null
          prior_hospice_info: string | null
          priority: string | null
          reason_for_non_admittance: string | null
          referral_contact_email: string | null
          referral_contact_person: string | null
          referral_contact_phone: string | null
          referral_date: string | null
          referral_intake_coordinator: string | null
          referral_source: string | null
          referring_physician: string | null
          responsible_party_contact: string | null
          responsible_party_name: string | null
          responsible_party_relationship: string | null
          secondary_insurance: string | null
          special_medical_needs: string | null
          spiritual_preferences: string | null
          ssn: string | null
          status: Database["public"]["Enums"]["referral_status"] | null
          transport_needs: string | null
          upcoming_appointments: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          advanced_directive?: boolean | null
          assessment_scheduled_date?: string | null
          assigned_marketer?: string | null
          attending_physician?: string | null
          benefit_period_number?: number | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          contact_date?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string | null
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          insurance_verification?: boolean | null
          last_name?: string | null
          medicaid_number?: string | null
          medical_records_received?: boolean | null
          medicare_number?: string | null
          msw_notes?: string | null
          next_steps?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_location?: string | null
          patient_name: string
          patient_phone?: string | null
          phone?: string | null
          physician?: string | null
          primary_insurance?: string | null
          prior_hospice_info?: string | null
          priority?: string | null
          reason_for_non_admittance?: string | null
          referral_contact_email?: string | null
          referral_contact_person?: string | null
          referral_contact_phone?: string | null
          referral_date?: string | null
          referral_intake_coordinator?: string | null
          referral_source?: string | null
          referring_physician?: string | null
          responsible_party_contact?: string | null
          responsible_party_name?: string | null
          responsible_party_relationship?: string | null
          secondary_insurance?: string | null
          special_medical_needs?: string | null
          spiritual_preferences?: string | null
          ssn?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          advanced_directive?: boolean | null
          assessment_scheduled_date?: string | null
          assigned_marketer?: string | null
          attending_physician?: string | null
          benefit_period_number?: number | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          contact_date?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          diagnosis?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          first_name?: string | null
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          insurance_verification?: boolean | null
          last_name?: string | null
          medicaid_number?: string | null
          medical_records_received?: boolean | null
          medicare_number?: string | null
          msw_notes?: string | null
          next_steps?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_location?: string | null
          patient_name?: string
          patient_phone?: string | null
          phone?: string | null
          physician?: string | null
          primary_insurance?: string | null
          prior_hospice_info?: string | null
          priority?: string | null
          reason_for_non_admittance?: string | null
          referral_contact_email?: string | null
          referral_contact_person?: string | null
          referral_contact_phone?: string | null
          referral_date?: string | null
          referral_intake_coordinator?: string | null
          referral_source?: string | null
          referring_physician?: string | null
          responsible_party_contact?: string | null
          responsible_party_name?: string | null
          responsible_party_relationship?: string | null
          secondary_insurance?: string | null
          special_medical_needs?: string | null
          spiritual_preferences?: string | null
          ssn?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teams_configuration: {
        Row: {
          config_key: string
          config_type: string
          config_value: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          config_key: string
          config_type: string
          config_value: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_type?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      teams_notifications: {
        Row: {
          attempt_count: number | null
          created_at: string
          error_message: string | null
          id: string
          n8n_webhook_url: string | null
          notification_type: string
          organization_id: string | null
          payload: Json | null
          referral_id: string | null
          response_data: Json | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          n8n_webhook_url?: string | null
          notification_type: string
          organization_id?: string | null
          payload?: Json | null
          referral_id?: string | null
          response_data?: Json | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          n8n_webhook_url?: string | null
          notification_type?: string
          organization_id?: string | null
          payload?: Json | null
          referral_id?: string | null
          response_data?: Json | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_notifications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          completed_date: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          notes: string | null
          referral_id: string | null
          scheduled_date: string
          staff_name: string
          updated_at: string | null
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          referral_id?: string | null
          scheduled_date: string
          staff_name: string
          updated_at?: string | null
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          referral_id?: string | null
          scheduled_date?: string
          staff_name?: string
          updated_at?: string | null
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visits_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dreamlit_auth_admin_executor: {
        Args: { command: string }
        Returns: undefined
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_kpi_metrics: { Args: never; Returns: Json }
      has_healthcare_access: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      care_team_role:
        | "nurse"
        | "physician"
        | "social_worker"
        | "chaplain"
        | "aide"
      patient_status: "active" | "discharged" | "deceased" | "transferred"
      referral_status:
        | "pending"
        | "contacted"
        | "scheduled"
        | "admitted"
        | "declined"
        | "lost"
        | "admitted_our_hospice"
        | "admitted_other_hospice"
        | "lost_death"
        | "lost_move"
        | "lost_other_hospice"
        | "new_referral"
        | "contact_attempted"
        | "information_gathering"
        | "assessment_scheduled"
        | "pending_admission"
        | "not_admitted_patient_choice"
        | "not_admitted_not_appropriate"
        | "not_admitted_lost_contact"
        | "deceased_prior_admission"
      visit_type: "admission" | "routine" | "urgent" | "discharge"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      care_team_role: [
        "nurse",
        "physician",
        "social_worker",
        "chaplain",
        "aide",
      ],
      patient_status: ["active", "discharged", "deceased", "transferred"],
      referral_status: [
        "pending",
        "contacted",
        "scheduled",
        "admitted",
        "declined",
        "lost",
        "admitted_our_hospice",
        "admitted_other_hospice",
        "lost_death",
        "lost_move",
        "lost_other_hospice",
        "new_referral",
        "contact_attempted",
        "information_gathering",
        "assessment_scheduled",
        "pending_admission",
        "not_admitted_patient_choice",
        "not_admitted_not_appropriate",
        "not_admitted_lost_contact",
        "deceased_prior_admission",
      ],
      visit_type: ["admission", "routine", "urgent", "discharge"],
    },
  },
} as const
