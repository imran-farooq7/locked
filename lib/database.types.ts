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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_history: {
        Row: {
          alert_id: string | null
          alert_type: string
          context: Json | null
          created_at: string | null
          email_sent: boolean | null
          id: string
          message: string
          severity: string
          slack_sent: boolean | null
          webhook_sent: boolean | null
        }
        Insert: {
          alert_id?: string | null
          alert_type: string
          context?: Json | null
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          message: string
          severity: string
          slack_sent?: boolean | null
          webhook_sent?: boolean | null
        }
        Update: {
          alert_id?: string | null
          alert_type?: string
          context?: Json | null
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          message?: string
          severity?: string
          slack_sent?: boolean | null
          webhook_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "job_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_logs: {
        Row: {
          cancelled: number | null
          emails_sent: number | null
          error: string | null
          executed_at: string | null
          failed: number | null
          id: string
          job_name: string
          processed: number | null
          results: Json | null
          status: string
          successful: number | null
          synced: number | null
        }
        Insert: {
          cancelled?: number | null
          emails_sent?: number | null
          error?: string | null
          executed_at?: string | null
          failed?: number | null
          id?: string
          job_name: string
          processed?: number | null
          results?: Json | null
          status: string
          successful?: number | null
          synced?: number | null
        }
        Update: {
          cancelled?: number | null
          emails_sent?: number | null
          error?: string | null
          executed_at?: string | null
          failed?: number | null
          id?: string
          job_name?: string
          processed?: number | null
          results?: Json | null
          status?: string
          successful?: number | null
          synced?: number | null
        }
        Relationships: []
      }
      goal_checkins: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_at: string
          goal_id: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_at: string
          goal_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_at?: string
          goal_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_checkins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_submissions: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string | null
          goal_id: string
          id: string
          submission_text: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          goal_id: string
          id?: string
          submission_text?: string | null
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          goal_id?: string
          id?: string
          submission_text?: string | null
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_submissions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_submissions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          penalty_amount: number
          proof_required: boolean | null
          proof_type: string | null
          status: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          target_date: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          penalty_amount: number
          proof_required?: boolean | null
          proof_type?: string | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          target_date: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          penalty_amount?: number
          proof_required?: boolean | null
          proof_type?: string | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          target_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_alerts: {
        Row: {
          alert_type: string
          comparison: string
          created_at: string | null
          email_recipients: string[] | null
          enabled: boolean | null
          id: string
          last_triggered_at: string | null
          notify_email: boolean | null
          notify_slack: boolean | null
          notify_webhook: boolean | null
          slack_webhook_url: string | null
          threshold: number
          trigger_count: number | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          alert_type: string
          comparison: string
          created_at?: string | null
          email_recipients?: string[] | null
          enabled?: boolean | null
          id?: string
          last_triggered_at?: string | null
          notify_email?: boolean | null
          notify_slack?: boolean | null
          notify_webhook?: boolean | null
          slack_webhook_url?: string | null
          threshold: number
          trigger_count?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          alert_type?: string
          comparison?: string
          created_at?: string | null
          email_recipients?: string[] | null
          enabled?: boolean | null
          id?: string
          last_triggered_at?: string | null
          notify_email?: boolean | null
          notify_slack?: boolean | null
          notify_webhook?: boolean | null
          slack_webhook_url?: string | null
          threshold?: number
          trigger_count?: number | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      job_queue: {
        Row: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          error_stack: string | null
          id: string
          job_type: string
          last_attempt_at: string | null
          max_attempts: number | null
          next_attempt_at: string | null
          payload: Json | null
          priority: number | null
          result: Json | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_type: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: string
          job_type?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          next_attempt_at?: string | null
          payload?: Json | null
          priority?: number | null
          result?: Json | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_charges: {
        Row: {
          amount: number
          charge_attempts: number | null
          charged_at: string | null
          created_at: string | null
          currency: string | null
          due_date: string
          goal_id: string
          id: string
          last_attempt_at: string | null
          reason: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          charge_attempts?: number | null
          charged_at?: string | null
          created_at?: string | null
          currency?: string | null
          due_date: string
          goal_id: string
          id?: string
          last_attempt_at?: string | null
          reason?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          charge_attempts?: number | null
          charged_at?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string
          goal_id?: string
          id?: string
          last_attempt_at?: string | null
          reason?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalty_charges_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_charges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          last_sign_in_at: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          status: string | null
          stripe_charge_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          status?: string | null
          stripe_charge_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          status?: string | null
          stripe_charge_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          proof_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proof_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proof_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expired_goals: { Args: never; Returns: undefined }
      check_job_alerts: {
        Args: never
        Returns: {
          alerts_skipped: number
          alerts_triggered: number
        }[]
      }
      check_recurring_proofs: {
        Args: never
        Returns: {
          goal_id: string
          last_checkin_date: string
          next_checkin_date: string
          penalty_amount: number
          status: string
          user_id: string
        }[]
      }
      complete_job: {
        Args: { p_job_id: string; p_result?: Json }
        Returns: undefined
      }
      enqueue_job: {
        Args: {
          p_job_type: string
          p_max_attempts?: number
          p_payload?: Json
          p_priority?: number
          p_scheduled_for?: string
        }
        Returns: string
      }
      fail_job: {
        Args: {
          p_error_message: string
          p_error_stack?: string
          p_job_id: string
        }
        Returns: undefined
      }
      fetch_next_job: {
        Args: never
        Returns: {
          attempt_count: number | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          error_stack: string | null
          id: string
          job_type: string
          last_attempt_at: string | null
          max_attempts: number | null
          next_attempt_at: string | null
          payload: Json | null
          priority: number | null
          result: Json | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_proof_file_path: {
        Args: {
          file_name: string
          file_type: string
          goal_id: string
          user_id: string
        }
        Returns: string
      }
      process_pending_penalties: {
        Args: never
        Returns: {
          failed_count: number
          processed_count: number
        }[]
      }
      vacuum_analyze_tables: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
