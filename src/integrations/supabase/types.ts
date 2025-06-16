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
      organizations: {
        Row: {
          address: string | null
          assigned_marketer: string | null
          contact_email: string | null
          contact_person: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assigned_marketer?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assigned_marketer?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          type?: string
          updated_at?: string | null
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
      referrals: {
        Row: {
          admission_date: string | null
          assigned_marketer: string | null
          contact_date: string | null
          created_at: string | null
          diagnosis: string | null
          id: string
          insurance: string | null
          insurance_verification: boolean | null
          medical_records_received: boolean | null
          notes: string | null
          organization_id: string | null
          patient_name: string
          patient_phone: string | null
          priority: string | null
          referral_contact_email: string | null
          referral_contact_person: string | null
          referral_contact_phone: string | null
          referral_date: string | null
          referring_physician: string | null
          status: Database["public"]["Enums"]["referral_status"] | null
          updated_at: string | null
        }
        Insert: {
          admission_date?: string | null
          assigned_marketer?: string | null
          contact_date?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          insurance?: string | null
          insurance_verification?: boolean | null
          medical_records_received?: boolean | null
          notes?: string | null
          organization_id?: string | null
          patient_name: string
          patient_phone?: string | null
          priority?: string | null
          referral_contact_email?: string | null
          referral_contact_person?: string | null
          referral_contact_phone?: string | null
          referral_date?: string | null
          referring_physician?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          updated_at?: string | null
        }
        Update: {
          admission_date?: string | null
          assigned_marketer?: string | null
          contact_date?: string | null
          created_at?: string | null
          diagnosis?: string | null
          id?: string
          insurance?: string | null
          insurance_verification?: boolean | null
          medical_records_received?: boolean | null
          notes?: string | null
          organization_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          priority?: string | null
          referral_contact_email?: string | null
          referral_contact_person?: string | null
          referral_contact_phone?: string | null
          referral_date?: string | null
          referring_physician?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          updated_at?: string | null
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
