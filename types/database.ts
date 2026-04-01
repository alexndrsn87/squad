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
      users: {
        Row: {
          id: string
          name: string
          nickname: string | null
          email: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          nickname?: string | null
          email: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          nickname?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_id: string
          format: number
          venue: string | null
          subscription_status: string
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id: string
          format?: number
          venue?: string | null
          subscription_status?: string
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          format?: number
          venue?: string | null
          subscription_status?: string
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          preferred_position: string
          joined_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          preferred_position?: string
          joined_at?: string
        }
        Update: {
          preferred_position?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          code: string
          created_by: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          code: string
          created_by: string
          expires_at?: string
          created_at?: string
        }
        Update: {
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      games: {
        Row: {
          id: string
          team_id: string
          scheduled_at: string
          poll_opens_at: string
          cost_per_player: number
          status: string
          team_a_label: string
          team_b_label: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          scheduled_at: string
          poll_opens_at?: string
          cost_per_player?: number
          status?: string
          team_a_label?: string
          team_b_label?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          scheduled_at?: string
          cost_per_player?: number
          status?: string
          team_a_label?: string
          team_b_label?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      availability: {
        Row: {
          id: string
          game_id: string
          user_id: string
          status: string
          payment_status: string
          payment_intent_id: string | null
          responded_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          status: string
          payment_status?: string
          payment_intent_id?: string | null
          responded_at?: string
        }
        Update: {
          status?: string
          payment_status?: string
          payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      game_teams: {
        Row: {
          id: string
          game_id: string
          user_id: string
          team: string
          assigned_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          team: string
          assigned_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "game_teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      ratings: {
        Row: {
          id: string
          game_id: string
          rater_id: string
          ratee_id: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          rater_id: string
          ratee_id: string
          score: number
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      motm_votes: {
        Row: {
          id: string
          game_id: string
          voter_id: string
          nominee_id: string
        }
        Insert: {
          id?: string
          game_id: string
          voter_id: string
          nominee_id: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "motm_votes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          }
        ]
      }
      player_stats: {
        Row: {
          id: string
          user_id: string
          team_id: string
          games_played: number
          avg_rating: number
          form_score: number
          ability_score: number
          motm_count: number
          games_missed_priority: number
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          games_played?: number
          avg_rating?: number
          form_score?: number
          ability_score?: number
          motm_count?: number
          games_missed_priority?: number
          last_updated?: string
        }
        Update: {
          games_played?: number
          avg_rating?: number
          form_score?: number
          ability_score?: number
          motm_count?: number
          games_missed_priority?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      kitty: {
        Row: {
          id: string
          team_id: string
          user_id: string
          balance: number
          last_updated: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          balance?: number
          last_updated?: string
        }
        Update: {
          balance?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitty_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      kitty_transactions: {
        Row: {
          id: string
          team_id: string
          user_id: string
          amount: number
          type: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          amount: number
          type: string
          description?: string | null
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "kitty_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      chip_in_items: {
        Row: {
          id: string
          team_id: string
          created_by: string
          name: string
          total_cost: number
          per_player_amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          created_by: string
          name: string
          total_cost: number
          per_player_amount: number
          status?: string
          created_at?: string
        }
        Update: {
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chip_in_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      priority_credits: {
        Row: {
          id: string
          team_id: string
          user_id: string
          credits: number
          last_updated: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          credits?: number
          last_updated?: string
        }
        Update: {
          credits?: number
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "priority_credits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_kitty: {
        Args: {
          p_team_id: string
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      update_player_stats: {
        Args: {
          p_game_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']
export type TeamInvite = Database['public']['Tables']['team_invites']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type GameTeam = Database['public']['Tables']['game_teams']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']
export type MotmVote = Database['public']['Tables']['motm_votes']['Row']
export type PlayerStats = Database['public']['Tables']['player_stats']['Row']
export type Kitty = Database['public']['Tables']['kitty']['Row']
export type KittyTransaction = Database['public']['Tables']['kitty_transactions']['Row']
export type ChipInItem = Database['public']['Tables']['chip_in_items']['Row']
export type PriorityCredit = Database['public']['Tables']['priority_credits']['Row']

// Extended types with joins
export type GameWithTeam = Game & { teams: Team }
export type AvailabilityWithUser = Availability & { users: User }
export type TeamMemberWithUser = TeamMember & { users: User; player_stats: PlayerStats | null }
