export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      api_rate_limit_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_end: string
          window_start: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_end: string
          window_start: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limit_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approval_history: Json | null
          completed_at: string | null
          created_at: string
          current_step: number
          expires_at: string | null
          id: string
          requester_id: string
          resource_data: Json
          resource_type: string
          status: string
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          approval_history?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          expires_at?: string | null
          id?: string
          requester_id: string
          resource_data: Json
          resource_type: string
          status?: string
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          approval_history?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          expires_at?: string | null
          id?: string
          requester_id?: string
          resource_data?: Json
          resource_type?: string
          status?: string
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          approval_steps: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          resource_type: string
          updated_at: string
        }
        Insert: {
          approval_steps?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          resource_type: string
          updated_at?: string
        }
        Update: {
          approval_steps?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resource_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      biometric_templates: {
        Row: {
          created_at: string
          enrollment_date: string
          extraction_algorithm: string
          id: string
          is_active: boolean
          last_matched: string | null
          match_count: number
          matching_threshold: number
          metadata: Json | null
          quality_metrics: Json
          template_data_encrypted: string
          template_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrollment_date?: string
          extraction_algorithm: string
          id?: string
          is_active?: boolean
          last_matched?: string | null
          match_count?: number
          matching_threshold?: number
          metadata?: Json | null
          quality_metrics?: Json
          template_data_encrypted: string
          template_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string
          extraction_algorithm?: string
          id?: string
          is_active?: boolean
          last_matched?: string | null
          match_count?: number
          matching_threshold?: number
          metadata?: Json | null
          quality_metrics?: Json
          template_data_encrypted?: string
          template_type?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          generated_by: string
          id: string
          report_data: Json
          report_type: string
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          generated_by: string
          id?: string
          report_data: Json
          report_type: string
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          generated_by?: string
          id?: string
          report_data?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      device_fingerprints: {
        Row: {
          compliance_status: string
          created_at: string
          device_id: string
          fingerprint_data: Json
          id: string
          is_trusted: boolean
          last_seen_at: string | null
          metadata: Json | null
          risk_factors: Json
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          compliance_status?: string
          created_at?: string
          device_id: string
          fingerprint_data?: Json
          id?: string
          is_trusted?: boolean
          last_seen_at?: string | null
          metadata?: Json | null
          risk_factors?: Json
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          compliance_status?: string
          created_at?: string
          device_id?: string
          fingerprint_data?: Json
          id?: string
          is_trusted?: boolean
          last_seen_at?: string | null
          metadata?: Json | null
          risk_factors?: Json
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      directory_integrations: {
        Row: {
          attribute_mappings: Json
          bind_credentials_encrypted: string
          connection_string: string
          created_at: string
          created_by: string
          directory_type: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          name: string
          sync_enabled: boolean
          sync_interval_hours: number
          updated_at: string
        }
        Insert: {
          attribute_mappings?: Json
          bind_credentials_encrypted: string
          connection_string: string
          created_at?: string
          created_by: string
          directory_type: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name: string
          sync_enabled?: boolean
          sync_interval_hours?: number
          updated_at?: string
        }
        Update: {
          attribute_mappings?: Json
          bind_credentials_encrypted?: string
          connection_string?: string
          created_at?: string
          created_by?: string
          directory_type?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name?: string
          sync_enabled?: boolean
          sync_interval_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      emergency_access_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          granted_permissions: Json
          id: string
          is_active: boolean
          reason: string
          token_hash: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          granted_permissions?: Json
          id?: string
          is_active?: boolean
          reason: string
          token_hash: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          granted_permissions?: Json
          id?: string
          is_active?: boolean
          reason?: string
          token_hash?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_access_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "emergency_access_tokens_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      federation_providers: {
        Row: {
          attribute_mappings: Json
          auto_provisioning: boolean
          certificate: string | null
          configuration: Json
          created_at: string
          created_by: string
          id: string
          is_enabled: boolean
          metadata_url: string | null
          name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          attribute_mappings?: Json
          auto_provisioning?: boolean
          certificate?: string | null
          configuration?: Json
          created_at?: string
          created_by: string
          id?: string
          is_enabled?: boolean
          metadata_url?: string | null
          name: string
          provider_type: string
          updated_at?: string
        }
        Update: {
          attribute_mappings?: Json
          auto_provisioning?: boolean
          certificate?: string | null
          configuration?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_enabled?: boolean
          metadata_url?: string | null
          name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      governance_policies: {
        Row: {
          compliance_frameworks: string[]
          created_at: string
          created_by: string
          enforcement_level: string
          id: string
          is_active: boolean
          policy_name: string
          policy_rules: Json
          policy_type: string
          scope_criteria: Json
          updated_at: string
        }
        Insert: {
          compliance_frameworks?: string[]
          created_at?: string
          created_by: string
          enforcement_level?: string
          id?: string
          is_active?: boolean
          policy_name: string
          policy_rules?: Json
          policy_type: string
          scope_criteria?: Json
          updated_at?: string
        }
        Update: {
          compliance_frameworks?: string[]
          created_at?: string
          created_by?: string
          enforcement_level?: string
          id?: string
          is_active?: boolean
          policy_name?: string
          policy_rules?: Json
          policy_type?: string
          scope_criteria?: Json
          updated_at?: string
        }
        Relationships: []
      }
      group_permissions: {
        Row: {
          assigned_at: string
          assigned_by: string
          group_id: string
          id: string
          permission_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          group_id: string
          id?: string
          permission_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          group_id?: string
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_tokens: {
        Row: {
          certificate_id: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          public_key: string
          registered_at: string
          serial_number: string
          token_type: string
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          public_key: string
          registered_at?: string
          serial_number: string
          token_type: string
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          public_key?: string
          registered_at?: string
          serial_number?: string
          token_type?: string
          user_id?: string
        }
        Relationships: []
      }
      identity_lifecycle_events: {
        Row: {
          approver_id: string | null
          completed_at: string | null
          created_at: string
          event_status: string
          event_type: string
          id: string
          metadata: Json | null
          triggered_by: string
          updated_at: string
          user_id: string
          workflow_data: Json
        }
        Insert: {
          approver_id?: string | null
          completed_at?: string | null
          created_at?: string
          event_status?: string
          event_type: string
          id?: string
          metadata?: Json | null
          triggered_by: string
          updated_at?: string
          user_id: string
          workflow_data?: Json
        }
        Update: {
          approver_id?: string | null
          completed_at?: string | null
          created_at?: string
          event_status?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          triggered_by?: string
          updated_at?: string
          user_id?: string
          workflow_data?: Json
        }
        Relationships: []
      }
      ip_access_rules: {
        Row: {
          applies_to: string
          created_at: string
          created_by: string
          id: string
          ip_address: unknown | null
          ip_range: unknown | null
          is_active: boolean
          name: string
          rule_type: string
          target_group_ids: string[] | null
          target_user_ids: string[] | null
          updated_at: string
        }
        Insert: {
          applies_to: string
          created_at?: string
          created_by: string
          id?: string
          ip_address?: unknown | null
          ip_range?: unknown | null
          is_active?: boolean
          name: string
          rule_type: string
          target_group_ids?: string[] | null
          target_user_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          applies_to?: string
          created_at?: string
          created_by?: string
          id?: string
          ip_address?: unknown | null
          ip_range?: unknown | null
          is_active?: boolean
          name?: string
          rule_type?: string
          target_group_ids?: string[] | null
          target_user_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          created_at: string
          created_by: string
          deployment_date: string | null
          hyperparameters: Json
          id: string
          is_active: boolean
          last_retrained: string | null
          model_name: string
          model_type: string
          model_version: string
          performance_metrics: Json
          training_data_summary: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          deployment_date?: string | null
          hyperparameters?: Json
          id?: string
          is_active?: boolean
          last_retrained?: string | null
          model_name: string
          model_type: string
          model_version: string
          performance_metrics?: Json
          training_data_summary?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          deployment_date?: string | null
          hyperparameters?: Json
          id?: string
          is_active?: boolean
          last_retrained?: string | null
          model_name?: string
          model_type?: string
          model_version?: string
          performance_metrics?: Json
          training_data_summary?: Json
        }
        Relationships: []
      }
      oauth_providers: {
        Row: {
          authorization_url: string | null
          client_id: string | null
          client_secret: string | null
          config: Json | null
          created_at: string
          display_name: string
          id: string
          is_enabled: boolean
          name: string
          scope: string | null
          token_url: string | null
          updated_at: string
          user_info_url: string | null
        }
        Insert: {
          authorization_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          config?: Json | null
          created_at?: string
          display_name: string
          id?: string
          is_enabled?: boolean
          name: string
          scope?: string | null
          token_url?: string | null
          updated_at?: string
          user_info_url?: string | null
        }
        Update: {
          authorization_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          config?: Json | null
          created_at?: string
          display_name?: string
          id?: string
          is_enabled?: boolean
          name?: string
          scope?: string | null
          token_url?: string | null
          updated_at?: string
          user_info_url?: string | null
        }
        Relationships: []
      }
      password_policies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lockout_duration_minutes: number
          max_login_attempts: number
          min_length: number
          password_expiry_days: number | null
          password_history_count: number | null
          require_lowercase: boolean
          require_numbers: boolean
          require_special_chars: boolean
          require_uppercase: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lockout_duration_minutes?: number
          max_login_attempts?: number
          min_length?: number
          password_expiry_days?: number | null
          password_history_count?: number | null
          require_lowercase?: boolean
          require_numbers?: boolean
          require_special_chars?: boolean
          require_uppercase?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lockout_duration_minutes?: number
          max_login_attempts?: number
          min_length?: number
          password_expiry_days?: number | null
          password_history_count?: number | null
          require_lowercase?: boolean
          require_numbers?: boolean
          require_special_chars?: boolean
          require_uppercase?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      policy_violations: {
        Row: {
          assigned_to: string | null
          created_at: string
          detection_method: string
          id: string
          policy_id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity_level: string
          status: string
          user_id: string | null
          violation_data: Json
          violation_type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          detection_method: string
          id?: string
          policy_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity_level: string
          status?: string
          user_id?: string | null
          violation_data?: Json
          violation_type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          detection_method?: string
          id?: string
          policy_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity_level?: string
          status?: string
          user_id?: string | null
          violation_data?: Json
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_violations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "governance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      privileged_accounts: {
        Row: {
          access_policy: Json
          account_name: string
          account_type: string
          auto_rotate: boolean
          checkout_duration: unknown
          created_at: string
          created_by: string
          credentials_encrypted: string
          id: string
          is_active: boolean
          last_rotation: string | null
          next_rotation: string | null
          rotation_interval: unknown
          target_system: string
          updated_at: string
        }
        Insert: {
          access_policy?: Json
          account_name: string
          account_type: string
          auto_rotate?: boolean
          checkout_duration?: unknown
          created_at?: string
          created_by: string
          credentials_encrypted: string
          id?: string
          is_active?: boolean
          last_rotation?: string | null
          next_rotation?: string | null
          rotation_interval?: unknown
          target_system: string
          updated_at?: string
        }
        Update: {
          access_policy?: Json
          account_name?: string
          account_type?: string
          auto_rotate?: boolean
          checkout_duration?: unknown
          created_at?: string
          created_by?: string
          credentials_encrypted?: string
          id?: string
          is_active?: boolean
          last_rotation?: string | null
          next_rotation?: string | null
          rotation_interval?: unknown
          target_system?: string
          updated_at?: string
        }
        Relationships: []
      }
      privileged_sessions: {
        Row: {
          activities: Json
          approval_request_id: string | null
          created_at: string
          id: string
          is_recorded: boolean
          privileged_account_id: string
          recording_path: string | null
          risk_score: number
          session_end: string | null
          session_purpose: string
          session_start: string
          user_id: string
        }
        Insert: {
          activities?: Json
          approval_request_id?: string | null
          created_at?: string
          id?: string
          is_recorded?: boolean
          privileged_account_id: string
          recording_path?: string | null
          risk_score?: number
          session_end?: string | null
          session_purpose: string
          session_start?: string
          user_id: string
        }
        Update: {
          activities?: Json
          approval_request_id?: string | null
          created_at?: string
          id?: string
          is_recorded?: boolean
          privileged_account_id?: string
          recording_path?: string | null
          risk_score?: number
          session_end?: string | null
          session_purpose?: string
          session_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privileged_sessions_privileged_account_id_fkey"
            columns: ["privileged_account_id"]
            isOneToOne: false
            referencedRelation: "privileged_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quantum_attack_logs: {
        Row: {
          attack_signature: string
          attack_type: string
          detected_at: string
          detection_method: string
          id: string
          is_blocked: boolean
          metadata: Json | null
          severity: string
          source_ip: unknown | null
          target_resource: string | null
          target_user_id: string | null
        }
        Insert: {
          attack_signature: string
          attack_type: string
          detected_at?: string
          detection_method: string
          id?: string
          is_blocked?: boolean
          metadata?: Json | null
          severity: string
          source_ip?: unknown | null
          target_resource?: string | null
          target_user_id?: string | null
        }
        Update: {
          attack_signature?: string
          attack_type?: string
          detected_at?: string
          detection_method?: string
          id?: string
          is_blocked?: boolean
          metadata?: Json | null
          severity?: string
          source_ip?: unknown | null
          target_resource?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      quantum_certificates: {
        Row: {
          certificate_data: string
          certificate_type: string
          created_at: string
          id: string
          is_revoked: boolean
          issuer: string
          public_key: string
          revocation_reason: string | null
          revoked_at: string | null
          serial_number: string
          subject: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          certificate_data: string
          certificate_type: string
          created_at?: string
          id?: string
          is_revoked?: boolean
          issuer: string
          public_key: string
          revocation_reason?: string | null
          revoked_at?: string | null
          serial_number: string
          subject: string
          updated_at?: string
          user_id: string
          valid_from: string
          valid_until: string
        }
        Update: {
          certificate_data?: string
          certificate_type?: string
          created_at?: string
          id?: string
          is_revoked?: boolean
          issuer?: string
          public_key?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          serial_number?: string
          subject?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      quantum_comm_channels: {
        Row: {
          channel_name: string
          channel_type: string
          created_at: string
          created_by: string
          encryption_algorithm: string
          id: string
          is_active: boolean
          key_exchange_method: string
          participants: Json
        }
        Insert: {
          channel_name: string
          channel_type: string
          created_at?: string
          created_by: string
          encryption_algorithm?: string
          id?: string
          is_active?: boolean
          key_exchange_method?: string
          participants?: Json
        }
        Update: {
          channel_name?: string
          channel_type?: string
          created_at?: string
          created_by?: string
          encryption_algorithm?: string
          id?: string
          is_active?: boolean
          key_exchange_method?: string
          participants?: Json
        }
        Relationships: []
      }
      quantum_comm_messages: {
        Row: {
          channel_id: string
          created_at: string
          delivery_status: Json
          encrypted_content: string
          expires_at: string | null
          id: string
          integrity_hash: string
          message_type: string
          metadata: Json | null
          quantum_signature: string
          recipient_ids: string[]
          sender_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          delivery_status?: Json
          encrypted_content: string
          expires_at?: string | null
          id?: string
          integrity_hash: string
          message_type?: string
          metadata?: Json | null
          quantum_signature: string
          recipient_ids: string[]
          sender_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          delivery_status?: Json
          encrypted_content?: string
          expires_at?: string | null
          id?: string
          integrity_hash?: string
          message_type?: string
          metadata?: Json | null
          quantum_signature?: string
          recipient_ids?: string[]
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_comm_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "quantum_comm_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      quantum_key_policies: {
        Row: {
          auto_rotation_enabled: boolean
          backup_required: boolean
          compliance_framework: string | null
          created_at: string
          created_by: string
          escrow_required: boolean
          id: string
          key_type: string
          policy_name: string
          rotation_interval_days: number
          updated_at: string
        }
        Insert: {
          auto_rotation_enabled?: boolean
          backup_required?: boolean
          compliance_framework?: string | null
          created_at?: string
          created_by: string
          escrow_required?: boolean
          id?: string
          key_type: string
          policy_name: string
          rotation_interval_days?: number
          updated_at?: string
        }
        Update: {
          auto_rotation_enabled?: boolean
          backup_required?: boolean
          compliance_framework?: string | null
          created_at?: string
          created_by?: string
          escrow_required?: boolean
          id?: string
          key_type?: string
          policy_name?: string
          rotation_interval_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      quantum_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_type: string
          public_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_type: string
          public_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_type?: string
          public_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quantum_pki_roots: {
        Row: {
          algorithm: string
          created_at: string
          created_by: string
          description: string | null
          expires_at: string
          id: string
          is_active: boolean
          name: string
          private_key_encrypted: string
          root_certificate: string
        }
        Insert: {
          algorithm?: string
          created_at?: string
          created_by: string
          description?: string | null
          expires_at: string
          id?: string
          is_active?: boolean
          name: string
          private_key_encrypted: string
          root_certificate: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          name?: string
          private_key_encrypted?: string
          root_certificate?: string
        }
        Relationships: []
      }
      quantum_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_quantum_verified: boolean
          quantum_signature: string | null
          session_token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_quantum_verified?: boolean
          quantum_signature?: string | null
          session_token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_quantum_verified?: boolean
          quantum_signature?: string | null
          session_token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quantum_sso_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          jwt_claims_hash: string | null
          provider: string
          quantum_signature: string
          saml_response_hash: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          jwt_claims_hash?: string | null
          provider: string
          quantum_signature: string
          saml_response_hash?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          jwt_claims_hash?: string | null
          provider?: string
          quantum_signature?: string
          saml_response_hash?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["system_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["system_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["system_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_role_mappings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          mapped_role: Database["public"]["Enums"]["system_role"]
          provider: string
          provider_claim_key: string
          provider_claim_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          mapped_role: Database["public"]["Enums"]["system_role"]
          provider: string
          provider_claim_key: string
          provider_claim_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          mapped_role?: Database["public"]["Enums"]["system_role"]
          provider?: string
          provider_claim_key?: string
          provider_claim_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_security_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          is_applied: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_applied?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_applied?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      temporary_role_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          reason: string | null
          role: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          reason?: string | null
          role: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          reason?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      threat_intelligence: {
        Row: {
          confidence_score: number
          created_at: string
          first_seen: string
          id: string
          indicator_type: string
          indicator_value: string
          is_active: boolean
          last_seen: string
          metadata: Json | null
          source: string
          threat_level: string
          threat_type: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          first_seen?: string
          id?: string
          indicator_type: string
          indicator_value: string
          is_active?: boolean
          last_seen?: string
          metadata?: Json | null
          source: string
          threat_level: string
          threat_type: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          first_seen?: string
          id?: string
          indicator_type?: string
          indicator_value?: string
          is_active?: boolean
          last_seen?: string
          metadata?: Json | null
          source?: string
          threat_level?: string
          threat_type?: string
        }
        Relationships: []
      }
      time_based_permissions: {
        Row: {
          created_at: string
          created_by: string
          days_of_week: number[]
          end_time: string
          id: string
          is_active: boolean
          permission_id: string | null
          start_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          days_of_week?: number[]
          end_time: string
          id?: string
          is_active?: boolean
          permission_id?: string | null
          start_time: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          days_of_week?: number[]
          end_time?: string
          id?: string
          is_active?: boolean
          permission_id?: string | null
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_based_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_trusted: boolean
          last_used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_trusted?: boolean
          last_used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_trusted?: boolean
          last_used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          is_quantum_safe: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json | null
          rate_limit: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_quantum_safe?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          rate_limit?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_quantum_safe?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          rate_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_behavioral_patterns: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          last_updated: string
          pattern_data: Json
          pattern_type: string
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          id?: string
          last_updated?: string
          pattern_data: Json
          pattern_type: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          last_updated?: string
          pattern_data?: Json
          pattern_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_biometric_data: {
        Row: {
          biometric_type: string
          created_at: string
          encryption_key_id: string
          id: string
          is_active: boolean
          last_used_at: string | null
          quality_score: number
          template_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          biometric_type: string
          created_at?: string
          encryption_key_id: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          quality_score?: number
          template_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          biometric_type?: string
          created_at?: string
          encryption_key_id?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          quality_score?: number
          template_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_group_memberships: {
        Row: {
          assigned_at: string
          assigned_by: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_memberships_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_mfa_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          is_quantum_safe: boolean | null
          secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_quantum_safe?: boolean | null
          secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_quantum_safe?: boolean | null
          secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quantum_settings: {
        Row: {
          created_at: string
          id: string
          kem_private_key_encrypted: string | null
          quantum_enabled: boolean
          signature_private_key_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kem_private_key_encrypted?: string | null
          quantum_enabled?: boolean
          signature_private_key_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kem_private_key_encrypted?: string | null
          quantum_enabled?: boolean
          signature_private_key_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quantum_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_risk_scores: {
        Row: {
          calculated_at: string
          expires_at: string
          id: string
          risk_factors: Json
          risk_level: string
          risk_score: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          expires_at?: string
          id?: string
          risk_factors?: Json
          risk_level: string
          risk_score: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          expires_at?: string
          id?: string
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["system_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_session_settings: {
        Row: {
          created_at: string
          id: string
          idle_timeout: unknown
          max_concurrent_sessions: number
          max_session_duration: unknown
          require_reauth_for_sensitive: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idle_timeout?: unknown
          max_concurrent_sessions?: number
          max_session_duration?: unknown
          require_reauth_for_sensitive?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idle_timeout?: unknown
          max_concurrent_sessions?: number
          max_session_duration?: unknown
          require_reauth_for_sensitive?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          location_city: string | null
          location_country: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location_city?: string | null
          location_country?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location_city?: string | null
          location_country?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zero_trust_policies: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          policy_type: string
          severity: string
          updated_at: string
        }
        Insert: {
          actions: Json
          conditions: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          policy_type: string
          severity: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          policy_type?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_group_permissions: {
        Args: { _user_id: string; _action: string; _resource: string }
        Returns: boolean
      }
      generate_emergency_token: {
        Args: {
          _reason: string
          _permissions: Json
          _expires_in_hours?: number
        }
        Returns: string
      }
      get_effective_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["system_role"]
      }
      has_enhanced_permission: {
        Args: { _user_id: string; _action: string; _resource: string }
        Returns: boolean
      }
      has_enhanced_permission_v2: {
        Args: { _user_id: string; _action: string; _resource: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["system_role"]
        }
        Returns: boolean
      }
      has_temporary_role: {
        Args: { _user_id: string; _role: string }
        Returns: boolean
      }
      has_time_based_permission: {
        Args: {
          _user_id: string
          _permission_action: string
          _permission_resource: string
          _check_time?: string
        }
        Returns: boolean
      }
      log_api_rate_limit: {
        Args: {
          _api_key_id: string
          _user_id: string
          _endpoint: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _resource: string
          _resource_id?: string
          _details?: Json
          _ip_address?: unknown
          _user_agent?: string
        }
        Returns: string
      }
      process_approval_request: {
        Args: {
          _request_id: string
          _action: string
          _approver_id: string
          _comments?: string
        }
        Returns: boolean
      }
      process_sso_login: {
        Args: { _user_id: string; _provider: string; _user_metadata: Json }
        Returns: undefined
      }
    }
    Enums: {
      system_role: "admin" | "moderator" | "user"
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
      system_role: ["admin", "moderator", "user"],
    },
  },
} as const
