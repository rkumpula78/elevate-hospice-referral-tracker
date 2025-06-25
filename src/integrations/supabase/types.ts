export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          best_contact_times: string | null
          communication_preferences: string[] | null
          created_at: string | null
          direct_phone: string | null
          email: string | null
          first_name: string
          id: string
          influence_level: string | null
          last_name: string
          organization_id: string
          personal_interests: string | null
          personal_notes: string | null
          previous_experience: string | null
          professional_networks: string | null
          relationship_strength: number | null
          role_in_referral: string | null
          role_in_referral_process: string | null
          title: string | null
          updated_at: string | null
          years_in_position: number | null
        }
        Insert: {
          best_contact_times?: string | null
          communication_preferences?: string[] | null
          created_at?: string | null
          direct_phone?: string | null
          email?: string | null
          first_name: string
          id?: string
          influence_level?: string | null
          last_name: string
          organization_id: string
          personal_interests?: string | null
          personal_notes?: string | null
          previous_experience?: string | null
          professional_networks?: string | null
          relationship_strength?: number | null
          role_in_referral?: string | null
          role_in_referral_process?: string | null
          title?: string | null
          updated_at?: string | null
          years_in_position?: number | null
        }
        Update: {
          best_contact_times?: string | null
          communication_preferences?: string[] | null
          created_at?: string | null
          direct_phone?: string | null
          email?: string | null
          first_name?: string
          id?: string
          influence_level?: string | null
          last_name?: string
          organization_id?: string
          personal_interests?: string | null
          personal_notes?: string | null
          previous_experience?: string | null
          professional_networks?: string | null
          relationship_strength?: number | null
          role_in_referral?: string | null
          role_in_referral_process?: string | null
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
          competitive_landscape: string | null
          contact_email: string | null
          contact_person: string | null
          contract_on_file: boolean | null
          contract_status: string | null
          created_at: string | null
          current_hospice_providers: string[] | null
          dba_name: string | null
          expansion_plans: string | null
          financial_health_notes: string | null
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
          partnership_stage: string | null
          phone: string | null
          referral_potential: number | null
          referral_potential_level: string | null
          regulatory_notes: string | null
          relationship_status: string | null
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
          competitive_landscape?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_on_file?: boolean | null
          contract_status?: string | null
          created_at?: string | null
          current_hospice_providers?: string[] | null
          dba_name?: string | null
          expansion_plans?: string | null
          financial_health_notes?: string | null
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
          partnership_stage?: string | null
          phone?: string | null
          referral_potential?: number | null
          referral_potential_level?: string | null
          regulatory_notes?: string | null
          relationship_status?: string | null
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
          competitive_landscape?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_on_file?: boolean | null
          contract_status?: string | null
          created_at?: string | null
          current_hospice_providers?: string[] | null
          dba_name?: string | null
          expansion_plans?: string | null
          financial_health_notes?: string | null
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
          partnership_stage?: string | null
          phone?: string | null
          referral_potential?: number | null
          referral_potential_level?: string | null
          regulatory_notes?: string | null
          relationship_status?: string | null
          service_radius?: number | null
          sub_type?: string | null
          type?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
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
      visits: {
        Row: {
          completed_date: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_completed: boolean | null
          notes: string | null
          patient_id: string | null
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
          patient_id?: string | null
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
          patient_id?: string | null
          scheduled_date?: string
          staff_name?: string
          updated_at?: string | null
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
      visit_type: "admission" | "routine" | "urgent" | "discharge"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
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
      ],
      visit_type: ["admission", "routine", "urgent", "discharge"],
    },
  },
} as const
