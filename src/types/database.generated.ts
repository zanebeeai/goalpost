export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_moderation: {
        Row: {
          is_suspended: boolean
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          is_suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          is_suspended?: boolean
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_moderation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json
          id: number
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: never
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: never
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          byte_size: number | null
          created_at: string
          goal_update_id: string | null
          goalpost_id: string | null
          id: string
          idea_id: string | null
          kind: Database["public"]["Enums"]["attachment_kind"]
          mime_type: string | null
          moderation_state: Database["public"]["Enums"]["moderation_state"]
          storage_path: string | null
          title: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          goal_update_id?: string | null
          goalpost_id?: string | null
          id?: string
          idea_id?: string | null
          kind: Database["public"]["Enums"]["attachment_kind"]
          mime_type?: string | null
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          storage_path?: string | null
          title: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          goal_update_id?: string | null
          goalpost_id?: string | null
          id?: string
          idea_id?: string | null
          kind?: Database["public"]["Enums"]["attachment_kind"]
          mime_type?: string | null
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          storage_path?: string | null
          title?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_goal_update_id_fkey"
            columns: ["goal_update_id"]
            isOneToOne: false
            referencedRelation: "goal_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          position: number
          title: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          position?: number
          title: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          goalpost_id: string | null
          id: string
          idea_id: string | null
          position: number
          title: string
        }
        Insert: {
          created_at?: string
          goalpost_id?: string | null
          id?: string
          idea_id?: string | null
          position?: number
          title?: string
        }
        Update: {
          created_at?: string
          goalpost_id?: string | null
          id?: string
          idea_id?: string | null
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          goalpost_id: string | null
          id: string
          idea_id: string | null
          moderation_state: Database["public"]["Enums"]["moderation_state"]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          goalpost_id?: string | null
          id?: string
          idea_id?: string | null
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          goalpost_id?: string | null
          id?: string
          idea_id?: string | null
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_collaborators: {
        Row: {
          goalpost_id: string
          is_admin: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          goalpost_id: string
          is_admin?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          goalpost_id?: string
          is_admin?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_collaborators_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["goal_event_type"]
          goalpost_id: string
          id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["goal_event_type"]
          goalpost_id: string
          id?: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["goal_event_type"]
          goalpost_id?: string
          id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_invitations: {
        Row: {
          created_at: string
          goalpost_id: string
          id: string
          invitee_id: string
          inviter_id: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          created_at?: string
          goalpost_id: string
          id?: string
          invitee_id: string
          inviter_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          created_at?: string
          goalpost_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "goal_invitations_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tasks: {
        Row: {
          assignee_user_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          goalpost_id: string
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          goalpost_id: string
          id?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          goalpost_id?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tasks_assignee_user_id_fkey"
            columns: ["assignee_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_tasks_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_updates: {
        Row: {
          author_id: string | null
          content: Json
          goalpost_id: string
          id: string
          moderation_state: Database["public"]["Enums"]["moderation_state"]
          published_at: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: Json
          goalpost_id: string
          id?: string
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          published_at?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: Json
          goalpost_id?: string
          id?: string
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          published_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_updates_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
        ]
      }
      goalposts: {
        Row: {
          admin_user_id: string | null
          completed_at: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          moderation_state: Database["public"]["Enums"]["moderation_state"]
          parent_goalpost_id: string | null
          public_id: string
          started_on: string
          status: Database["public"]["Enums"]["goal_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          completed_at?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          parent_goalpost_id?: string | null
          public_id?: string
          started_on?: string
          status?: Database["public"]["Enums"]["goal_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          completed_at?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          moderation_state?: Database["public"]["Enums"]["moderation_state"]
          parent_goalpost_id?: string | null
          public_id?: string
          started_on?: string
          status?: Database["public"]["Enums"]["goal_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goalposts_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goalposts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goalposts_parent_goalpost_id_fkey"
            columns: ["parent_goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_lists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          list_id: string
          position: number
          status: Database["public"]["Enums"]["idea_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          list_id: string
          position?: number
          status?: Database["public"]["Enums"]["idea_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          list_id?: string
          position?: number
          status?: Database["public"]["Enums"]["idea_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "idea_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_invitations: {
        Row: {
          created_at: string
          id: string
          invitee_id: string
          inviter_id: string | null
          list_id: string
          responded_at: string | null
          role: Database["public"]["Enums"]["list_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          invitee_id: string
          inviter_id?: string | null
          list_id: string
          responded_at?: string | null
          role: Database["public"]["Enums"]["list_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          created_at?: string
          id?: string
          invitee_id?: string
          inviter_id?: string | null
          list_id?: string
          responded_at?: string | null
          role?: Database["public"]["Enums"]["list_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "list_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_invitations_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "idea_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_members: {
        Row: {
          joined_at: string
          list_id: string
          role: Database["public"]["Enums"]["list_role"]
          user_id: string
        }
        Insert: {
          joined_at?: string
          list_id: string
          role: Database["public"]["Enums"]["list_role"]
          user_id: string
        }
        Update: {
          joined_at?: string
          list_id?: string
          role?: Database["public"]["Enums"]["list_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "idea_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          href: string | null
          id: string
          notification_type: string
          read_at: string | null
          source_key: string | null
          title: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          notification_type: string
          read_at?: string | null
          source_key?: string | null
          title: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          notification_type?: string
          read_at?: string | null
          source_key?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string
          email_reminders_enabled: boolean
          id: string
          timezone: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          email_reminders_enabled?: boolean
          id: string
          timezone?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email_reminders_enabled?: boolean
          id?: string
          timezone?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          action: string
          actor_key: string
          created_at: string
          id: number
        }
        Insert: {
          action: string
          actor_key: string
          created_at?: string
          id?: never
        }
        Update: {
          action?: string
          actor_key?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      reminders: {
        Row: {
          attempt_count: number
          claimed_at: string | null
          created_at: string
          goal_event_id: string | null
          goal_task_id: string | null
          goalpost_id: string
          id: string
          last_error: string | null
          remind_at: string
          send_email: boolean
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          user_id: string
        }
        Insert: {
          attempt_count?: number
          claimed_at?: string | null
          created_at?: string
          goal_event_id?: string | null
          goal_task_id?: string | null
          goalpost_id: string
          id?: string
          last_error?: string | null
          remind_at: string
          send_email?: boolean
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          user_id: string
        }
        Update: {
          attempt_count?: number
          claimed_at?: string | null
          created_at?: string
          goal_event_id?: string | null
          goal_task_id?: string | null
          goalpost_id?: string
          id?: string
          last_error?: string | null
          remind_at?: string
          send_email?: boolean
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_goal_event_id_fkey"
            columns: ["goal_event_id"]
            isOneToOne: false
            referencedRelation: "goal_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_goal_task_id_fkey"
            columns: ["goal_task_id"]
            isOneToOne: false
            referencedRelation: "goal_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_goalpost_id_fkey"
            columns: ["goalpost_id"]
            isOneToOne: false
            referencedRelation: "goalposts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
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
      accept_goal_invitation: {
        Args: { p_accept: boolean; p_invitation_id: string }
        Returns: undefined
      }
      accept_list_invitation: {
        Args: { p_accept: boolean; p_invitation_id: string }
        Returns: undefined
      }
      are_friends: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      can_edit_idea: {
        Args: { p_idea_id: string; p_user_id?: string }
        Returns: boolean
      }
      can_view_idea: {
        Args: { p_idea_id: string; p_user_id?: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_actor_key: string
          p_limit: number
          p_window: string
        }
        Returns: boolean
      }
      claim_due_reminders: {
        Args: { p_limit?: number }
        Returns: {
          attempt_count: number
          claimed_at: string | null
          created_at: string
          goal_event_id: string | null
          goal_task_id: string | null
          goalpost_id: string
          id: string
          last_error: string | null
          remind_at: string
          send_email: boolean
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "reminders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_onboarding: {
        Args: { p_display_name: string; p_timezone: string; p_username: string }
        Returns: string
      }
      create_goalpost: {
        Args: {
          p_content?: Json
          p_parent_goalpost_id?: string
          p_started_on?: string
          p_tags?: string[]
          p_title: string
        }
        Returns: {
          goalpost_id: string
          public_id: string
        }[]
      }
      create_idea_list: {
        Args: { p_description?: string; p_title: string }
        Returns: string
      }
      current_list_role: {
        Args: { p_list_id: string; p_user_id?: string }
        Returns: Database["public"]["Enums"]["list_role"]
      }
      is_blocked_between: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      is_goal_admin: {
        Args: { p_goalpost_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_goal_collaborator: {
        Args: { p_goalpost_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { p_user_id?: string }; Returns: boolean }
      is_suspended: { Args: { p_user_id?: string }; Returns: boolean }
      prepare_account_deletion: { Args: never; Returns: undefined }
      promote_idea: {
        Args: { p_idea_id: string }
        Returns: {
          goalpost_id: string
          public_id: string
        }[]
      }
      respond_to_friend_request: {
        Args: { p_accept: boolean; p_request_id: string }
        Returns: undefined
      }
      transition_goal: {
        Args: {
          p_goalpost_id: string
          p_status: Database["public"]["Enums"]["goal_status"]
        }
        Returns: {
          admin_user_id: string | null
          completed_at: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          moderation_state: Database["public"]["Enums"]["moderation_state"]
          parent_goalpost_id: string | null
          public_id: string
          started_on: string
          status: Database["public"]["Enums"]["goal_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "goalposts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      attachment_kind: "image" | "document" | "link"
      friend_request_status: "pending" | "accepted" | "declined"
      goal_event_type:
        | "delivery"
        | "deadline"
        | "milestone"
        | "resume"
        | "custom"
      goal_status: "active" | "waiting" | "done"
      idea_status: "active" | "archived" | "done"
      invitation_status: "pending" | "accepted" | "declined"
      list_role: "owner" | "editor" | "viewer"
      moderation_state: "visible" | "hidden" | "removed"
      reminder_status:
        | "scheduled"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attachment_kind: ["image", "document", "link"],
      friend_request_status: ["pending", "accepted", "declined"],
      goal_event_type: [
        "delivery",
        "deadline",
        "milestone",
        "resume",
        "custom",
      ],
      goal_status: ["active", "waiting", "done"],
      idea_status: ["active", "archived", "done"],
      invitation_status: ["pending", "accepted", "declined"],
      list_role: ["owner", "editor", "viewer"],
      moderation_state: ["visible", "hidden", "removed"],
      reminder_status: [
        "scheduled",
        "processing",
        "sent",
        "failed",
        "cancelled",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
    },
  },
} as const
