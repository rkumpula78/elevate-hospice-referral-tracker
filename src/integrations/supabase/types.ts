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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_kind"]
          anneli_present: boolean
          contact_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          legacy_ref: string | null
          logged_by: string | null
          logged_by_label: string | null
          next_step: string | null
          next_step_date: string | null
          notes: string | null
          occurred_at: string
          organization_id: string
          outcome: Database["public"]["Enums"]["activity_outcome"]
          referral_id: string | null
          source: Database["public"]["Enums"]["activity_source"]
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_kind"]
          anneli_present?: boolean
          contact_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          legacy_ref?: string | null
          logged_by?: string | null
          logged_by_label?: string | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          occurred_at?: string
          organization_id: string
          outcome?: Database["public"]["Enums"]["activity_outcome"]
          referral_id?: string | null
          source?: Database["public"]["Enums"]["activity_source"]
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_kind"]
          anneli_present?: boolean
          contact_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          legacy_ref?: string | null
          logged_by?: string | null
          logged_by_label?: string | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          occurred_at?: string
          organization_id?: string
          outcome?: Database["public"]["Enums"]["activity_outcome"]
          referral_id?: string | null
          source?: Database["public"]["Enums"]["activity_source"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activities_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_communications: {
        Row: {
          activity_date: string
          competitive_mentions: string[] | null
          completed_by: string
          contact_id: string | null
          cost_amount: number | null
          created_at: string | null
          discussion_points: string | null
          duration_minutes: number | null
          extracted_data: Json | null
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
          sentiment: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          activity_date?: string
          competitive_mentions?: string[] | null
          completed_by: string
          contact_id?: string | null
          cost_amount?: number | null
          created_at?: string | null
          discussion_points?: string | null
          duration_minutes?: number | null
          extracted_data?: Json | null
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
          sentiment?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_date?: string
          competitive_mentions?: string[] | null
          completed_by?: string
          contact_id?: string | null
          cost_amount?: number | null
          created_at?: string | null
          discussion_points?: string | null
          duration_minutes?: number | null
          extracted_data?: Json | null
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
          sentiment?: string | null
          source?: string | null
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
            foreignKeyName: "activity_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activity_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activity_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activity_communications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_communications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_templates: {
        Row: {
          created_at: string
          default_duration_minutes: number | null
          default_notes: string | null
          id: string
          interaction_type: string
          is_global: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          default_duration_minutes?: number | null
          default_notes?: string | null
          id?: string
          interaction_type: string
          is_global?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          default_duration_minutes?: number | null
          default_notes?: string | null
          id?: string
          interaction_type?: string
          is_global?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: []
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
      bd_activities: {
        Row: {
          activity_date: string
          activity_type: string
          anneli_present: boolean | null
          id: string
          logged_at: string | null
          logged_by_user_id: string | null
          next_step: string | null
          next_step_date: string | null
          notes: string | null
          organization_id: string
          outcome: string | null
        }
        Insert: {
          activity_date?: string
          activity_type: string
          anneli_present?: boolean | null
          id?: string
          logged_at?: string | null
          logged_by_user_id?: string | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          organization_id: string
          outcome?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          anneli_present?: boolean | null
          id?: string
          logged_at?: string | null
          logged_by_user_id?: string | null
          next_step?: string | null
          next_step_date?: string | null
          notes?: string | null
          organization_id?: string
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bd_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bd_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "bd_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "bd_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
        ]
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
          {
            foreignKeyName: "bereavement_tracking_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
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
          {
            foreignKeyName: "care_team_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_duplicate_candidates"
            referencedColumns: ["patient_id_a"]
          },
          {
            foreignKeyName: "care_team_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_duplicate_candidates"
            referencedColumns: ["patient_id_b"]
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
          {
            foreignKeyName: "checklist_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "checklist_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "checklist_completions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
      comp_visits: {
        Row: {
          completed_by: string | null
          completed_date: string
          created_at: string | null
          id: string
          notes: string | null
          patient_id: string
          patient_name: string | null
          visit_type: string | null
        }
        Insert: {
          completed_by?: string | null
          completed_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          patient_name?: string | null
          visit_type?: string | null
        }
        Update: {
          completed_by?: string | null
          completed_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          patient_name?: string | null
          visit_type?: string | null
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
          {
            foreignKeyName: "competitive_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "competitive_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "competitive_analysis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
      huddle_item_notes: {
        Row: {
          author_id: string | null
          author_label: string | null
          body: string
          created_at: string
          id: string
          item_id: string
          meeting_id: string | null
        }
        Insert: {
          author_id?: string | null
          author_label?: string | null
          body: string
          created_at?: string
          id?: string
          item_id: string
          meeting_id?: string | null
        }
        Update: {
          author_id?: string | null
          author_label?: string | null
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          meeting_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "huddle_item_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_item_notes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "huddle_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_item_notes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_open_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_item_notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "huddle_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      huddle_items: {
        Row: {
          body: string | null
          carried_count: number
          contact_id: string | null
          created_at: string
          created_by: string | null
          due_date: string | null
          expires_on: string | null
          goal_text: string | null
          id: string
          organization_id: string | null
          origin_meeting_id: string | null
          owner_id: string | null
          owner_label: string | null
          priority: number
          referral_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["huddle_item_status"]
          title: string
          type: Database["public"]["Enums"]["huddle_item_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          carried_count?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          expires_on?: string | null
          goal_text?: string | null
          id?: string
          organization_id?: string | null
          origin_meeting_id?: string | null
          owner_id?: string | null
          owner_label?: string | null
          priority?: number
          referral_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["huddle_item_status"]
          title: string
          type: Database["public"]["Enums"]["huddle_item_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          carried_count?: number
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          expires_on?: string | null
          goal_text?: string | null
          id?: string
          organization_id?: string | null
          origin_meeting_id?: string | null
          owner_id?: string | null
          owner_label?: string | null
          priority?: number
          referral_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["huddle_item_status"]
          title?: string
          type?: Database["public"]["Enums"]["huddle_item_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "huddle_items_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "huddle_items_origin_meeting_id_fkey"
            columns: ["origin_meeting_id"]
            isOneToOne: false
            referencedRelation: "huddle_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      huddle_meetings: {
        Row: {
          avg_rating: number | null
          closed_at: string | null
          created_at: string
          facilitator_id: string | null
          id: string
          meeting_date: string
          segment_notes: Json
          segments_done: Json
          started_at: string | null
          status: Database["public"]["Enums"]["huddle_meeting_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          avg_rating?: number | null
          closed_at?: string | null
          created_at?: string
          facilitator_id?: string | null
          id?: string
          meeting_date: string
          segment_notes?: Json
          segments_done?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["huddle_meeting_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          avg_rating?: number | null
          closed_at?: string | null
          created_at?: string
          facilitator_id?: string | null
          id?: string
          meeting_date?: string
          segment_notes?: Json
          segments_done?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["huddle_meeting_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "huddle_meetings_facilitator_id_fkey"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      huddle_metrics: {
        Row: {
          auto_sql_key: string | null
          category: Database["public"]["Enums"]["huddle_metric_category"]
          created_at: string
          direction: string
          help_text: string | null
          id: string
          is_active: boolean
          label: string
          metric_key: string
          owner_id: string | null
          owner_label: string | null
          sort_order: number
          source_mode: Database["public"]["Enums"]["huddle_metric_source"]
          target_text: string | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          auto_sql_key?: string | null
          category: Database["public"]["Enums"]["huddle_metric_category"]
          created_at?: string
          direction?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          label: string
          metric_key: string
          owner_id?: string | null
          owner_label?: string | null
          sort_order?: number
          source_mode?: Database["public"]["Enums"]["huddle_metric_source"]
          target_text?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          auto_sql_key?: string | null
          category?: Database["public"]["Enums"]["huddle_metric_category"]
          created_at?: string
          direction?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          label?: string
          metric_key?: string
          owner_id?: string | null
          owner_label?: string | null
          sort_order?: number
          source_mode?: Database["public"]["Enums"]["huddle_metric_source"]
          target_text?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "huddle_metrics_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      huddle_snapshots: {
        Row: {
          entered_at: string
          entered_by: string | null
          id: string
          meeting_id: string
          metric_key: string
          note: string | null
          owner_id: string | null
          prior_value: number | null
          source: Database["public"]["Enums"]["huddle_metric_source"]
          status: string | null
          target_value: number | null
          value: number | null
          value_text: string | null
        }
        Insert: {
          entered_at?: string
          entered_by?: string | null
          id?: string
          meeting_id: string
          metric_key: string
          note?: string | null
          owner_id?: string | null
          prior_value?: number | null
          source?: Database["public"]["Enums"]["huddle_metric_source"]
          status?: string | null
          target_value?: number | null
          value?: number | null
          value_text?: string | null
        }
        Update: {
          entered_at?: string
          entered_by?: string | null
          id?: string
          meeting_id?: string
          metric_key?: string
          note?: string | null
          owner_id?: string | null
          prior_value?: number | null
          source?: Database["public"]["Enums"]["huddle_metric_source"]
          status?: string | null
          target_value?: number | null
          value?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "huddle_snapshots_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_snapshots_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "huddle_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_snapshots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      marketer_day_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          note_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          note_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          note_date?: string
          updated_at?: string
          user_id?: string
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
      notifications: {
        Row: {
          activity_log_id: string | null
          actor_email: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          referral_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          activity_log_id?: string | null
          actor_email?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          referral_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          activity_log_id?: string | null
          actor_email?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          referral_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_activity_log_id_fkey"
            columns: ["activity_log_id"]
            isOneToOne: false
            referencedRelation: "referral_activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
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
          activity_log: Json | null
          affiliation_agreements: boolean | null
          areas_of_service: string | null
          assigned_owner: string | null
          best_contact_times: string | null
          cell_phone: string | null
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
          is_primary_referrer: boolean | null
          is_referring_contact: boolean | null
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
          referral_volume_monthly: number | null
          relationship_notes: string | null
          relationship_strength: number | null
          relationship_to_patient: string | null
          role_in_referral: string | null
          role_in_referral_process: string | null
          specialization: string | null
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
          cell_phone?: string | null
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
          is_primary_referrer?: boolean | null
          is_referring_contact?: boolean | null
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
          referral_volume_monthly?: number | null
          relationship_notes?: string | null
          relationship_strength?: number | null
          relationship_to_patient?: string | null
          role_in_referral?: string | null
          role_in_referral_process?: string | null
          specialization?: string | null
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
          cell_phone?: string | null
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
          is_primary_referrer?: boolean | null
          is_referring_contact?: boolean | null
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
          referral_volume_monthly?: number | null
          relationship_notes?: string | null
          relationship_strength?: number | null
          relationship_to_patient?: string | null
          role_in_referral?: string | null
          role_in_referral_process?: string | null
          specialization?: string | null
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
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
          {
            foreignKeyName: "organization_kpis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_kpis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_kpis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
          anneli_covisit_status: string | null
          assigned_marketer: string | null
          bd_status: string | null
          bd_tier: string | null
          bed_count: number | null
          city: string | null
          competition_level: string | null
          competitive_landscape: string | null
          contact_email: string | null
          contact_person: string | null
          contract_expiry_date: string | null
          contract_notes: string | null
          contract_on_file: boolean | null
          contract_start_date: string | null
          contract_status: string | null
          contract_types: string[] | null
          created_at: string | null
          cultural_alignment_score: number | null
          current_hospice_providers: string[] | null
          current_month_referrals: number | null
          current_provider_satisfaction_score: number | null
          current_quarter_referrals: number | null
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
          growth_notes: string | null
          growth_status: string | null
          id: string
          is_active: boolean | null
          is_pinned_producer: boolean
          is_target_account: boolean
          last_contact_date: string | null
          last_training_review: string | null
          license_numbers: string[] | null
          medicare_id: string | null
          monthly_referral_goal: number | null
          name: string
          next_followup_date: string | null
          ownership_type: string | null
          partnership_notes: string | null
          partnership_priority_level: string | null
          partnership_score: number | null
          partnership_stage: string | null
          phone: string | null
          quarterly_referral_goal: number | null
          referral_potential: number | null
          referral_potential_level: string | null
          regulatory_notes: string | null
          relationship_accessibility_score: number | null
          relationship_status: string | null
          relationship_temperature: string | null
          research_completed: boolean | null
          revenue_ytd: number | null
          roi_calculation: Json | null
          routing_week: number | null
          service_radius: number | null
          state: string | null
          sub_type: string | null
          target_added_at: string | null
          target_goal: string | null
          target_rank: number | null
          type: string
          updated_at: string | null
          website: string | null
          ytd_referrals: number | null
          zip_code: string | null
        }
        Insert: {
          account_rating?: string | null
          address?: string | null
          after_hours_contact?: string | null
          anneli_covisit_status?: string | null
          assigned_marketer?: string | null
          bd_status?: string | null
          bd_tier?: string | null
          bed_count?: number | null
          city?: string | null
          competition_level?: string | null
          competitive_landscape?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_expiry_date?: string | null
          contract_notes?: string | null
          contract_on_file?: boolean | null
          contract_start_date?: string | null
          contract_status?: string | null
          contract_types?: string[] | null
          created_at?: string | null
          cultural_alignment_score?: number | null
          current_hospice_providers?: string[] | null
          current_month_referrals?: number | null
          current_provider_satisfaction_score?: number | null
          current_quarter_referrals?: number | null
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
          growth_notes?: string | null
          growth_status?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned_producer?: boolean
          is_target_account?: boolean
          last_contact_date?: string | null
          last_training_review?: string | null
          license_numbers?: string[] | null
          medicare_id?: string | null
          monthly_referral_goal?: number | null
          name?: string
          next_followup_date?: string | null
          ownership_type?: string | null
          partnership_notes?: string | null
          partnership_priority_level?: string | null
          partnership_score?: number | null
          partnership_stage?: string | null
          phone?: string | null
          quarterly_referral_goal?: number | null
          referral_potential?: number | null
          referral_potential_level?: string | null
          regulatory_notes?: string | null
          relationship_accessibility_score?: number | null
          relationship_status?: string | null
          relationship_temperature?: string | null
          research_completed?: boolean | null
          revenue_ytd?: number | null
          roi_calculation?: Json | null
          routing_week?: number | null
          service_radius?: number | null
          state?: string | null
          sub_type?: string | null
          target_added_at?: string | null
          target_goal?: string | null
          target_rank?: number | null
          type: string
          updated_at?: string | null
          website?: string | null
          ytd_referrals?: number | null
          zip_code?: string | null
        }
        Update: {
          account_rating?: string | null
          address?: string | null
          after_hours_contact?: string | null
          anneli_covisit_status?: string | null
          assigned_marketer?: string | null
          bd_status?: string | null
          bd_tier?: string | null
          bed_count?: number | null
          city?: string | null
          competition_level?: string | null
          competitive_landscape?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contract_expiry_date?: string | null
          contract_notes?: string | null
          contract_on_file?: boolean | null
          contract_start_date?: string | null
          contract_status?: string | null
          contract_types?: string[] | null
          created_at?: string | null
          cultural_alignment_score?: number | null
          current_hospice_providers?: string[] | null
          current_month_referrals?: number | null
          current_provider_satisfaction_score?: number | null
          current_quarter_referrals?: number | null
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
          growth_notes?: string | null
          growth_status?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned_producer?: boolean
          is_target_account?: boolean
          last_contact_date?: string | null
          last_training_review?: string | null
          license_numbers?: string[] | null
          medicare_id?: string | null
          monthly_referral_goal?: number | null
          name?: string
          next_followup_date?: string | null
          ownership_type?: string | null
          partnership_notes?: string | null
          partnership_priority_level?: string | null
          partnership_score?: number | null
          partnership_stage?: string | null
          phone?: string | null
          quarterly_referral_goal?: number | null
          referral_potential?: number | null
          referral_potential_level?: string | null
          regulatory_notes?: string | null
          relationship_accessibility_score?: number | null
          relationship_status?: string | null
          relationship_temperature?: string | null
          research_completed?: boolean | null
          revenue_ytd?: number | null
          roi_calculation?: Json | null
          routing_week?: number | null
          service_radius?: number | null
          state?: string | null
          sub_type?: string | null
          target_added_at?: string | null
          target_goal?: string | null
          target_rank?: number | null
          type?: string
          updated_at?: string | null
          website?: string | null
          ytd_referrals?: number | null
          zip_code?: string | null
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
          {
            foreignKeyName: "partnership_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partnership_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partnership_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
          {
            foreignKeyName: "partnership_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partnership_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partnership_performance_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
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
          {
            foreignKeyName: "patient_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_duplicate_candidates"
            referencedColumns: ["patient_id_a"]
          },
          {
            foreignKeyName: "patient_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_duplicate_candidates"
            referencedColumns: ["patient_id_b"]
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
          referral_id: string | null
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
          referral_id?: string | null
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
          referral_id?: string | null
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
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_duplicate_candidates"
            referencedColumns: ["patient_id_a"]
          },
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "v_patient_duplicate_candidates"
            referencedColumns: ["patient_id_b"]
          },
          {
            foreignKeyName: "patient_documents_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
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
          acuity: string | null
          address: string | null
          admission_date: string | null
          advanced_directive: boolean | null
          assigned_marketer: string | null
          attending_physician: string | null
          caregiver_contact: string | null
          caregiver_name: string | null
          city: string | null
          comp_visit_interval_days: number | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          diagnosis: string | null
          discharge_date: string | null
          dme_needs: string | null
          dnr_status: boolean | null
          emergency_contact: string | null
          emergency_phone: string | null
          facility: string | null
          first_name: string
          funeral_arrangements: string | null
          height: number | null
          id: string
          insurance: string | null
          last_comp_date: string | null
          last_name: string
          latitude: number | null
          longitude: number | null
          medicaid_number: string | null
          medicare_number: string | null
          middle_name: string | null
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
          state: string | null
          status: Database["public"]["Enums"]["patient_status"] | null
          transport_needs: string | null
          upcoming_appointments: string | null
          updated_at: string | null
          visits_per_week: number | null
          weight: number | null
          zip: string | null
        }
        Insert: {
          acuity?: string | null
          address?: string | null
          admission_date?: string | null
          advanced_directive?: boolean | null
          assigned_marketer?: string | null
          attending_physician?: string | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          city?: string | null
          comp_visit_interval_days?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          diagnosis?: string | null
          discharge_date?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          facility?: string | null
          first_name: string
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          last_comp_date?: string | null
          last_name: string
          latitude?: number | null
          longitude?: number | null
          medicaid_number?: string | null
          medicare_number?: string | null
          middle_name?: string | null
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
          state?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          visits_per_week?: number | null
          weight?: number | null
          zip?: string | null
        }
        Update: {
          acuity?: string | null
          address?: string | null
          admission_date?: string | null
          advanced_directive?: boolean | null
          assigned_marketer?: string | null
          attending_physician?: string | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          city?: string | null
          comp_visit_interval_days?: number | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          diagnosis?: string | null
          discharge_date?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          facility?: string | null
          first_name?: string
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          last_comp_date?: string | null
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          medicaid_number?: string | null
          medicare_number?: string | null
          middle_name?: string | null
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
          state?: string | null
          status?: Database["public"]["Enums"]["patient_status"] | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          visits_per_week?: number | null
          weight?: number | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
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
          phone: string | null
          role: string | null
          staff_type: string | null
          updated_at: string
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          staff_type?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          staff_type?: string | null
          updated_at?: string
          whatsapp_opt_in?: boolean | null
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
      referral_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string
          id: string
          mentioned_user_ids: string[]
          next_action: string | null
          next_action_date: string | null
          note_text: string
          referral_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          created_by?: string
          id?: string
          mentioned_user_ids?: string[]
          next_action?: string | null
          next_action_date?: string | null
          note_text?: string
          referral_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string
          id?: string
          mentioned_user_ids?: string[]
          next_action?: string | null
          next_action_date?: string | null
          note_text?: string
          referral_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_activity_log_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_activity_log_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "referral_assessments_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_eligibility: {
        Row: {
          beneficiary_address: string | null
          beneficiary_city: string | null
          beneficiary_state: string | null
          beneficiary_zip: string | null
          copay_inpatient_days: number | null
          copay_snf_days: number | null
          created_at: string
          date_of_birth: string | null
          date_of_death: string | null
          eligibility_span_end: string | null
          eligibility_span_start: string | null
          eligibility_verified_by: string | null
          eligibility_verified_date: string | null
          full_inpatient_days: number | null
          full_snf_days: number | null
          hospice_election_exists: boolean | null
          hospice_election_notes: string | null
          id: string
          inpatient_blood_ded_units_remain: number | null
          inpatient_ded_amt_remaining: number | null
          lifetime_psychiatric_days_remain: number | null
          lifetime_reserve_days_remain: number | null
          mbi_term_date: string | null
          medicare_advantage_active: boolean | null
          medicare_advantage_notes: string | null
          medicare_number: string | null
          msp_active: boolean | null
          msp_notes: string | null
          notes: string | null
          part_a_entitlement_date: string | null
          part_a_entitlement_reason: string | null
          part_a_termination_date: string | null
          part_b_entitlement_date: string | null
          part_b_entitlement_reason: string | null
          part_b_termination_date: string | null
          referral_id: string
          sex: string | null
          updated_at: string
          verification_source: string | null
        }
        Insert: {
          beneficiary_address?: string | null
          beneficiary_city?: string | null
          beneficiary_state?: string | null
          beneficiary_zip?: string | null
          copay_inpatient_days?: number | null
          copay_snf_days?: number | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          eligibility_span_end?: string | null
          eligibility_span_start?: string | null
          eligibility_verified_by?: string | null
          eligibility_verified_date?: string | null
          full_inpatient_days?: number | null
          full_snf_days?: number | null
          hospice_election_exists?: boolean | null
          hospice_election_notes?: string | null
          id?: string
          inpatient_blood_ded_units_remain?: number | null
          inpatient_ded_amt_remaining?: number | null
          lifetime_psychiatric_days_remain?: number | null
          lifetime_reserve_days_remain?: number | null
          mbi_term_date?: string | null
          medicare_advantage_active?: boolean | null
          medicare_advantage_notes?: string | null
          medicare_number?: string | null
          msp_active?: boolean | null
          msp_notes?: string | null
          notes?: string | null
          part_a_entitlement_date?: string | null
          part_a_entitlement_reason?: string | null
          part_a_termination_date?: string | null
          part_b_entitlement_date?: string | null
          part_b_entitlement_reason?: string | null
          part_b_termination_date?: string | null
          referral_id: string
          sex?: string | null
          updated_at?: string
          verification_source?: string | null
        }
        Update: {
          beneficiary_address?: string | null
          beneficiary_city?: string | null
          beneficiary_state?: string | null
          beneficiary_zip?: string | null
          copay_inpatient_days?: number | null
          copay_snf_days?: number | null
          created_at?: string
          date_of_birth?: string | null
          date_of_death?: string | null
          eligibility_span_end?: string | null
          eligibility_span_start?: string | null
          eligibility_verified_by?: string | null
          eligibility_verified_date?: string | null
          full_inpatient_days?: number | null
          full_snf_days?: number | null
          hospice_election_exists?: boolean | null
          hospice_election_notes?: string | null
          id?: string
          inpatient_blood_ded_units_remain?: number | null
          inpatient_ded_amt_remaining?: number | null
          lifetime_psychiatric_days_remain?: number | null
          lifetime_reserve_days_remain?: number | null
          mbi_term_date?: string | null
          medicare_advantage_active?: boolean | null
          medicare_advantage_notes?: string | null
          medicare_number?: string | null
          msp_active?: boolean | null
          msp_notes?: string | null
          notes?: string | null
          part_a_entitlement_date?: string | null
          part_a_entitlement_reason?: string | null
          part_a_termination_date?: string | null
          part_b_entitlement_date?: string | null
          part_b_entitlement_reason?: string | null
          part_b_termination_date?: string | null
          referral_id?: string
          sex?: string | null
          updated_at?: string
          verification_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_eligibility_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_eligibility_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
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
          {
            foreignKeyName: "referral_family_contacts_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          referral_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          referral_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          referral_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_status_history_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_status_history_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          address: string | null
          admission_date: string | null
          admission_notes: string | null
          advanced_directive: boolean | null
          assessment_scheduled_date: string | null
          assigned_marketer: string | null
          attending_physician: string | null
          benefit_period_number: number | null
          caregiver_contact: string | null
          caregiver_name: string | null
          chaplain: string | null
          closed_reason: string | null
          cna: string | null
          contact_date: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          diagnosis: string | null
          dme_needs: string | null
          dnr_status: boolean | null
          emergency_contact: string | null
          emergency_phone: string | null
          facility_organization_id: string | null
          first_name: string | null
          followup_frequency: string | null
          funeral_arrangements: string | null
          height: number | null
          id: string
          insurance: string | null
          insurance_verification: boolean | null
          last_name: string | null
          location_city: string | null
          location_type: string | null
          marketer: string | null
          md_notified: boolean | null
          medicaid_number: string | null
          medical_records_received: boolean | null
          medicare_number: string | null
          middle_name: string | null
          msw_notes: string | null
          next_followup_date: string | null
          next_steps: string | null
          notes: string | null
          organization_id: string | null
          patient_location: string | null
          patient_name: string
          patient_phone: string | null
          patient_status_note: string | null
          pcp_company: string | null
          pcp_provider: string | null
          phone: string | null
          physician: string | null
          primary_insurance: string | null
          primary_rn: string | null
          prior_hospice_info: string | null
          priority: string | null
          reason_for_non_admittance: string | null
          referral_contact_email: string | null
          referral_contact_person: string | null
          referral_contact_phone: string | null
          referral_date: string | null
          referral_intake_coordinator: string | null
          referral_source: string | null
          referring_contact_name: string | null
          referring_physician: string | null
          responsible_party_contact: string | null
          responsible_party_name: string | null
          responsible_party_relationship: string | null
          secondary_insurance: string | null
          social_worker: string | null
          special_medical_needs: string | null
          spiritual_preferences: string | null
          ssn: string | null
          status: Database["public"]["Enums"]["referral_status"] | null
          teams_message_id: string | null
          transport_needs: string | null
          upcoming_appointments: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          admission_notes?: string | null
          advanced_directive?: boolean | null
          assessment_scheduled_date?: string | null
          assigned_marketer?: string | null
          attending_physician?: string | null
          benefit_period_number?: number | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          chaplain?: string | null
          closed_reason?: string | null
          cna?: string | null
          contact_date?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          diagnosis?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          facility_organization_id?: string | null
          first_name?: string | null
          followup_frequency?: string | null
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          insurance_verification?: boolean | null
          last_name?: string | null
          location_city?: string | null
          location_type?: string | null
          marketer?: string | null
          md_notified?: boolean | null
          medicaid_number?: string | null
          medical_records_received?: boolean | null
          medicare_number?: string | null
          middle_name?: string | null
          msw_notes?: string | null
          next_followup_date?: string | null
          next_steps?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_location?: string | null
          patient_name: string
          patient_phone?: string | null
          patient_status_note?: string | null
          pcp_company?: string | null
          pcp_provider?: string | null
          phone?: string | null
          physician?: string | null
          primary_insurance?: string | null
          primary_rn?: string | null
          prior_hospice_info?: string | null
          priority?: string | null
          reason_for_non_admittance?: string | null
          referral_contact_email?: string | null
          referral_contact_person?: string | null
          referral_contact_phone?: string | null
          referral_date?: string | null
          referral_intake_coordinator?: string | null
          referral_source?: string | null
          referring_contact_name?: string | null
          referring_physician?: string | null
          responsible_party_contact?: string | null
          responsible_party_name?: string | null
          responsible_party_relationship?: string | null
          secondary_insurance?: string | null
          social_worker?: string | null
          special_medical_needs?: string | null
          spiritual_preferences?: string | null
          ssn?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          teams_message_id?: string | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          admission_notes?: string | null
          advanced_directive?: boolean | null
          assessment_scheduled_date?: string | null
          assigned_marketer?: string | null
          attending_physician?: string | null
          benefit_period_number?: number | null
          caregiver_contact?: string | null
          caregiver_name?: string | null
          chaplain?: string | null
          closed_reason?: string | null
          cna?: string | null
          contact_date?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          diagnosis?: string | null
          dme_needs?: string | null
          dnr_status?: boolean | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          facility_organization_id?: string | null
          first_name?: string | null
          followup_frequency?: string | null
          funeral_arrangements?: string | null
          height?: number | null
          id?: string
          insurance?: string | null
          insurance_verification?: boolean | null
          last_name?: string | null
          location_city?: string | null
          location_type?: string | null
          marketer?: string | null
          md_notified?: boolean | null
          medicaid_number?: string | null
          medical_records_received?: boolean | null
          medicare_number?: string | null
          middle_name?: string | null
          msw_notes?: string | null
          next_followup_date?: string | null
          next_steps?: string | null
          notes?: string | null
          organization_id?: string | null
          patient_location?: string | null
          patient_name?: string
          patient_phone?: string | null
          patient_status_note?: string | null
          pcp_company?: string | null
          pcp_provider?: string | null
          phone?: string | null
          physician?: string | null
          primary_insurance?: string | null
          primary_rn?: string | null
          prior_hospice_info?: string | null
          priority?: string | null
          reason_for_non_admittance?: string | null
          referral_contact_email?: string | null
          referral_contact_person?: string | null
          referral_contact_phone?: string | null
          referral_date?: string | null
          referral_intake_coordinator?: string | null
          referral_source?: string | null
          referring_contact_name?: string | null
          referring_physician?: string | null
          responsible_party_contact?: string | null
          responsible_party_name?: string | null
          responsible_party_relationship?: string | null
          secondary_insurance?: string | null
          social_worker?: string | null
          special_medical_needs?: string | null
          spiritual_preferences?: string | null
          ssn?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          teams_message_id?: string | null
          transport_needs?: string | null
          upcoming_appointments?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_chaplain_fkey"
            columns: ["chaplain"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_cna_fkey"
            columns: ["cna"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_facility_organization_id_fkey"
            columns: ["facility_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_facility_organization_id_fkey"
            columns: ["facility_organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_facility_organization_id_fkey"
            columns: ["facility_organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_facility_organization_id_fkey"
            columns: ["facility_organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_marketer_fkey"
            columns: ["marketer"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_primary_rn_fkey"
            columns: ["primary_rn"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_social_worker_fkey"
            columns: ["social_worker"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          assets: Json | null
          consent_form_url: string | null
          consent_status: Database["public"]["Enums"]["story_consent_status"]
          created_at: string
          id: string
          notes: string | null
          patient_alias: string | null
          quote_full: string | null
          quote_short: string | null
          source: Database["public"]["Enums"]["story_source"]
          staff_mentioned: string[] | null
          status: Database["public"]["Enums"]["story_status"]
          story_date: string | null
          submitted_by: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assets?: Json | null
          consent_form_url?: string | null
          consent_status?: Database["public"]["Enums"]["story_consent_status"]
          created_at?: string
          id?: string
          notes?: string | null
          patient_alias?: string | null
          quote_full?: string | null
          quote_short?: string | null
          source?: Database["public"]["Enums"]["story_source"]
          staff_mentioned?: string[] | null
          status?: Database["public"]["Enums"]["story_status"]
          story_date?: string | null
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assets?: Json | null
          consent_form_url?: string | null
          consent_status?: Database["public"]["Enums"]["story_consent_status"]
          created_at?: string
          id?: string
          notes?: string | null
          patient_alias?: string | null
          quote_full?: string | null
          quote_short?: string | null
          source?: Database["public"]["Enums"]["story_source"]
          staff_mentioned?: string[] | null
          status?: Database["public"]["Enums"]["story_status"]
          story_date?: string | null
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      story_submissions: {
        Row: {
          consent_obtained: boolean | null
          created_at: string
          id: string
          patient_alias: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["submission_status"]
          story_notes: string | null
          submission_type: Database["public"]["Enums"]["submission_type"]
          submitted_by: string
          submitted_by_role: string | null
          suggested_quote: string | null
        }
        Insert: {
          consent_obtained?: boolean | null
          created_at?: string
          id?: string
          patient_alias?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          story_notes?: string | null
          submission_type?: Database["public"]["Enums"]["submission_type"]
          submitted_by: string
          submitted_by_role?: string | null
          suggested_quote?: string | null
        }
        Update: {
          consent_obtained?: boolean | null
          created_at?: string
          id?: string
          patient_alias?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          story_notes?: string | null
          submission_type?: Database["public"]["Enums"]["submission_type"]
          submitted_by?: string
          submitted_by_role?: string | null
          suggested_quote?: string | null
        }
        Relationships: []
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
            foreignKeyName: "teams_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "teams_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "teams_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "teams_notifications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_notifications_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "visits_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_config: {
        Row: {
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          last_status: string | null
          last_triggered_at: string | null
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          last_status?: string | null
          last_triggered_at?: string | null
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          last_status?: string | null
          last_triggered_at?: string | null
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          http_status: number | null
          id: string
          payload: Json | null
          referral_id: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          http_status?: number | null
          id?: string
          payload?: Json | null
          referral_id?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          http_status?: number | null
          id?: string
          payload?: Json | null
          referral_id?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_state: {
        Row: {
          created_at: string | null
          current_flow: string | null
          flow_state: Json | null
          id: string
          last_message_at: string | null
          user_id: string | null
          user_phone: string
        }
        Insert: {
          created_at?: string | null
          current_flow?: string | null
          flow_state?: Json | null
          id?: string
          last_message_at?: string | null
          user_id?: string | null
          user_phone: string
        }
        Update: {
          created_at?: string | null
          current_flow?: string | null
          flow_state?: Json | null
          id?: string
          last_message_at?: string | null
          user_id?: string | null
          user_phone?: string
        }
        Relationships: []
      }
      whatsapp_notification_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          message_body: string | null
          message_type: string
          recipient_phone: string
          referral_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string | null
          message_type: string
          recipient_phone: string
          referral_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string | null
          message_type?: string
          recipient_phone?: string
          referral_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notification_queue_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_notification_queue_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_huddle_open_items: {
        Row: {
          body: string | null
          carried_count: number | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          expires_on: string | null
          goal_text: string | null
          id: string | null
          is_expired: boolean | null
          is_overdue: boolean | null
          last_note: string | null
          note_count: number | null
          organization_id: string | null
          organization_name: string | null
          origin_meeting_id: string | null
          owner_id: string | null
          owner_label: string | null
          owner_name: string | null
          priority: number | null
          referral_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["huddle_item_status"] | null
          title: string | null
          type: Database["public"]["Enums"]["huddle_item_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "huddle_items_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "organization_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "huddle_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "huddle_items_origin_meeting_id_fkey"
            columns: ["origin_meeting_id"]
            isOneToOne: false
            referencedRelation: "huddle_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "huddle_items_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
      v_huddle_org_pulse: {
        Row: {
          activities_30d: number | null
          admits_90d: number | null
          assigned_marketer: string | null
          bd_status: string | null
          bd_tier: string | null
          city: string | null
          days_since_touch: number | null
          is_pinned_producer: boolean | null
          is_target_account: boolean | null
          last_activity_at: string | null
          last_activity_outcome: string | null
          last_activity_type: string | null
          last_contact_date: string | null
          last_next_step: string | null
          last_next_step_date: string | null
          monthly_referral_goal: number | null
          name: string | null
          never_touched: boolean | null
          next_followup_date: string | null
          open_referrals: number | null
          org_type: string | null
          organization_id: string | null
          referrals_30d: number | null
          referrals_7d: number | null
          referrals_90d: number | null
          relationship_temperature: string | null
          target_goal: string | null
          target_rank: number | null
        }
        Relationships: []
      }
      v_huddle_pipeline_now: {
        Row: {
          new_7d: number | null
          stalled: number | null
          status: string | null
          total: number | null
        }
        Relationships: []
      }
      v_huddle_target_accounts: {
        Row: {
          activities_30d: number | null
          admits_90d: number | null
          assigned_marketer: string | null
          bd_status: string | null
          bd_tier: string | null
          city: string | null
          days_since_touch: number | null
          is_pinned_producer: boolean | null
          is_target_account: boolean | null
          last_activity_at: string | null
          last_activity_outcome: string | null
          last_activity_type: string | null
          last_contact_date: string | null
          last_next_step: string | null
          last_next_step_date: string | null
          monthly_referral_goal: number | null
          name: string | null
          next_followup_date: string | null
          open_referrals: number | null
          org_type: string | null
          organization_id: string | null
          referrals_30d: number | null
          referrals_7d: number | null
          referrals_90d: number | null
          relationship_temperature: string | null
          target_goal: string | null
          target_rank: number | null
        }
        Relationships: []
      }
      v_huddle_top_producers: {
        Row: {
          activities_30d: number | null
          admits_90d: number | null
          assigned_marketer: string | null
          bd_status: string | null
          bd_tier: string | null
          city: string | null
          days_since_touch: number | null
          is_pinned_producer: boolean | null
          is_target_account: boolean | null
          last_activity_at: string | null
          last_activity_outcome: string | null
          last_activity_type: string | null
          last_contact_date: string | null
          last_next_step: string | null
          last_next_step_date: string | null
          monthly_referral_goal: number | null
          name: string | null
          next_followup_date: string | null
          open_referrals: number | null
          org_type: string | null
          organization_id: string | null
          referrals_30d: number | null
          referrals_7d: number | null
          referrals_90d: number | null
          relationship_temperature: string | null
          target_goal: string | null
          target_rank: number | null
        }
        Relationships: []
      }
      v_huddle_worklist: {
        Row: {
          assigned_marketer: string | null
          created_at: string | null
          days_idle: number | null
          days_open: number | null
          id: string | null
          is_stalled: boolean | null
          loss_reason: string | null
          organization_id: string | null
          organization_name: string | null
          ref_code: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_org_pulse"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_target_accounts"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_huddle_top_producers"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_patient_duplicate_candidates: {
        Row: {
          created_at_a: string | null
          created_at_b: string | null
          dob_a: string | null
          dob_b: string | null
          first_name_a: string | null
          first_name_b: string | null
          last_name: string | null
          patient_id_a: string | null
          patient_id_b: string | null
          referral_id_a: string | null
          referral_id_b: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id_b"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id_a"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id_b"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_referral_id_fkey"
            columns: ["referral_id_a"]
            isOneToOne: false
            referencedRelation: "v_huddle_worklist"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      find_matching_patient: {
        Args: {
          _dob?: string
          _exclude_id?: string
          _first_name: string
          _last_name: string
          _phone?: string
        }
        Returns: string
      }
      fn_huddle_auto_metrics: {
        Args: { p_end: string; p_start: string }
        Returns: {
          metric_key: string
          value: number
        }[]
      }
      fn_huddle_close_meeting: {
        Args: { p_meeting_id: string }
        Returns: undefined
      }
      fn_huddle_open_meeting: { Args: { p_date?: string }; Returns: string }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_kpi_metrics: { Args: never; Returns: Json }
      get_org_name: { Args: { org_id: string }; Returns: string }
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
      activity_kind:
        | "visit"
        | "call"
        | "in_service"
        | "lunch_learn"
        | "drop_by"
        | "event"
        | "email"
        | "co_visit"
        | "other"
      activity_outcome: "positive" | "neutral" | "negative" | "no_contact"
      activity_source: "mobile" | "web" | "import" | "n8n"
      app_role: "admin" | "user"
      care_team_role:
        | "nurse"
        | "physician"
        | "social_worker"
        | "chaplain"
        | "aide"
        | "lpn"
      huddle_item_status:
        | "open"
        | "resolved"
        | "dropped"
        | "graduated"
        | "escalated"
      huddle_item_type: "issue" | "commitment" | "watch"
      huddle_meeting_status: "draft" | "live" | "closed"
      huddle_metric_category: "leading" | "pipeline" | "lagging" | "meta"
      huddle_metric_source: "self_reported" | "partial" | "system"
      patient_status:
        | "active"
        | "discharged"
        | "deceased"
        | "transferred"
        | "transitioning"
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
        | "in_progress"
        | "assessment"
        | "closed"
        | "palliative_outreach"
        | "discharged"
        | "deceased"
        | "not_appropriate"
        | "lost_to_followup"
        | "revoked"
      story_consent_status:
        | "public_source"
        | "consent_on_file"
        | "pending_consent"
        | "anonymous_approved"
      story_source:
        | "google_review"
        | "bereavement_call"
        | "family_submission"
        | "staff_observed"
        | "other"
      story_status: "draft" | "in_review" | "approved" | "archived"
      submission_status: "new" | "in_review" | "approved" | "declined"
      submission_type: "patient_story" | "family_feedback" | "content_idea"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_kind: [
        "visit",
        "call",
        "in_service",
        "lunch_learn",
        "drop_by",
        "event",
        "email",
        "co_visit",
        "other",
      ],
      activity_outcome: ["positive", "neutral", "negative", "no_contact"],
      activity_source: ["mobile", "web", "import", "n8n"],
      app_role: ["admin", "user"],
      care_team_role: [
        "nurse",
        "physician",
        "social_worker",
        "chaplain",
        "aide",
        "lpn",
      ],
      huddle_item_status: [
        "open",
        "resolved",
        "dropped",
        "graduated",
        "escalated",
      ],
      huddle_item_type: ["issue", "commitment", "watch"],
      huddle_meeting_status: ["draft", "live", "closed"],
      huddle_metric_category: ["leading", "pipeline", "lagging", "meta"],
      huddle_metric_source: ["self_reported", "partial", "system"],
      patient_status: [
        "active",
        "discharged",
        "deceased",
        "transferred",
        "transitioning",
      ],
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
        "in_progress",
        "assessment",
        "closed",
        "palliative_outreach",
        "discharged",
        "deceased",
        "not_appropriate",
        "lost_to_followup",
        "revoked",
      ],
      story_consent_status: [
        "public_source",
        "consent_on_file",
        "pending_consent",
        "anonymous_approved",
      ],
      story_source: [
        "google_review",
        "bereavement_call",
        "family_submission",
        "staff_observed",
        "other",
      ],
      story_status: ["draft", "in_review", "approved", "archived"],
      submission_status: ["new", "in_review", "approved", "declined"],
      submission_type: ["patient_story", "family_feedback", "content_idea"],
      visit_type: ["admission", "routine", "urgent", "discharge"],
    },
  },
} as const
