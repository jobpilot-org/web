export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_api_keys: {
        Row: {
          created_at: string;
          secret_id: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          secret_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          secret_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          applied_at: string;
          archived_at: string | null;
          company: string;
          created_at: string;
          id: string;
          job_description: string | null;
          job_url: string | null;
          location: string;
          next_step: string | null;
          priority: string;
          role: string;
          salary_max: number | null;
          salary_min: number | null;
          source: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          work_mode: string | null;
        };
        ComputedFields: never;
        Insert: {
          applied_at: string;
          archived_at?: string | null;
          company: string;
          created_at?: string;
          id?: string;
          job_description?: string | null;
          job_url?: string | null;
          location: string;
          next_step?: string | null;
          priority?: string;
          role: string;
          salary_max?: number | null;
          salary_min?: number | null;
          source?: string | null;
          status: string;
          updated_at?: string;
          user_id?: string;
          work_mode?: string | null;
        };
        Update: {
          applied_at?: string;
          archived_at?: string | null;
          company?: string;
          created_at?: string;
          id?: string;
          job_description?: string | null;
          job_url?: string | null;
          location?: string;
          next_step?: string | null;
          priority?: string;
          role?: string;
          salary_max?: number | null;
          salary_min?: number | null;
          source?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          work_mode?: string | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          application_id: string;
          created_at: string;
          id: string;
          kind: string;
          location: string | null;
          notes: string | null;
          starts_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          created_at?: string;
          id?: string;
          kind: string;
          location?: string | null;
          notes?: string | null;
          starts_at: string;
          user_id?: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          location?: string | null;
          notes?: string | null;
          starts_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_user_id_application_id_fkey';
            columns: ['user_id', 'application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
      contacts: {
        Row: {
          application_id: string;
          created_at: string;
          email: string | null;
          id: string;
          linkedin_url: string | null;
          name: string;
          phone: string | null;
          role: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          linkedin_url?: string | null;
          name: string;
          phone?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          linkedin_url?: string | null;
          name?: string;
          phone?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_user_id_application_id_fkey';
            columns: ['user_id', 'application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
      notes: {
        Row: {
          application_id: string;
          body: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          body: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          application_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_user_id_application_id_fkey';
            columns: ['user_id', 'application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
      reminders: {
        Row: {
          application_id: string;
          body: string;
          created_at: string;
          done_at: string | null;
          due_at: string;
          key: string;
          kind: string;
          snoozed_until: string | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          body: string;
          created_at?: string;
          done_at?: string | null;
          due_at: string;
          key: string;
          kind: string;
          snoozed_until?: string | null;
          title: string;
          user_id?: string;
        };
        Update: {
          application_id?: string;
          body?: string;
          created_at?: string;
          done_at?: string | null;
          due_at?: string;
          key?: string;
          kind?: string;
          snoozed_until?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reminders_user_id_application_id_fkey';
            columns: ['user_id', 'application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
      settings: {
        Row: {
          key: string;
          user_id: string;
          value: string;
        };
        ComputedFields: never;
        Insert: {
          key: string;
          user_id?: string;
          value: string;
        };
        Update: {
          key?: string;
          user_id?: string;
          value?: string;
        };
        Relationships: [];
      };
      status_events: {
        Row: {
          application_id: string;
          at: string;
          from_status: string | null;
          id: number;
          to_status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          at?: string;
          from_status?: string | null;
          id?: never;
          to_status: string;
          user_id?: string;
        };
        Update: {
          application_id?: string;
          at?: string;
          from_status?: string | null;
          id?: never;
          to_status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'status_events_user_id_application_id_fkey';
            columns: ['user_id', 'application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_ai_api_key: { Args: Record<PropertyKey, never>; Returns: undefined };
      get_ai_api_key: { Args: Record<PropertyKey, never>; Returns: string };
      save_ai_api_key: {
        Args: { api_key: string };
        Returns: {
          created_at: string;
          updated_at: string;
          user_id: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
