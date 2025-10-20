export interface Database {
  public: {
    Tables: {
      action_history: {
        Row: {
          id: string
          user_id: string | null
          canvas_id: string
          action_type: 'add' | 'update' | 'delete' | 'delete-multiple'
          object_type: 'emoji' | 'rectangle' | 'circle' | 'text'
          object_id: string
          before_state: any | null
          after_state: any
          timestamp: string
          undone_at: string | null
        }
        Insert: {
          id?: string
          user_id: string | null
          canvas_id: string
          action_type: 'add' | 'update' | 'delete' | 'delete-multiple'
          object_type: 'emoji' | 'rectangle' | 'circle' | 'text'
          object_id: string
          before_state?: any | null
          after_state: any
          timestamp?: string
          undone_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          canvas_id?: string
          action_type?: 'add' | 'update' | 'delete'
          object_type?: 'emoji' | 'rectangle' | 'circle' | 'text'
          object_id?: string
          before_state?: any | null
          after_state?: any
          timestamp?: string
          undone_at?: string | null
        }
      }
      canvas_objects: {
        Row: {
          id: string
          canvas_id: string
          user_id: string | null
          type: 'rect' | 'circle' | 'text' | 'line' | 'star' | 'ellipse' | 'arrow' | 'image' | 'emoji' | 'pen'
          data: {
            x: number
            y: number
            width?: number
            height?: number
            radius?: number
            text?: string
            fontSize?: number
            fill: string
            stroke?: string
            strokeWidth?: number
            draggable?: boolean
            rotation?: number
            scaleX?: number
            scaleY?: number
            opacity?: number
            [key: string]: any
          }
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          canvas_id: string
          user_id: string | null
          type: 'rect' | 'circle' | 'text' | 'line' | 'star' | 'ellipse' | 'arrow' | 'image' | 'emoji' | 'pen'
          data: {
            x: number
            y: number
            width?: number
            height?: number
            radius?: number
            text?: string
            fontSize?: number
            fill: string
            stroke?: string
            strokeWidth?: number
            draggable?: boolean
            rotation?: number
            scaleX?: number
            scaleY?: number
            opacity?: number
            [key: string]: any
          }
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          canvas_id?: string
          user_id?: string | null
          type?: 'rect' | 'circle' | 'text' | 'line' | 'ellipse' | 'arrow' | 'image' | 'emoji' | 'pen'
          data?: {
            x?: number
            y?: number
            width?: number
            height?: number
            radius?: number
            text?: string
            fontSize?: number
            fill?: string
            stroke?: string
            strokeWidth?: number
            draggable?: boolean
            rotation?: number
            scaleX?: number
            scaleY?: number
            opacity?: number
            [key: string]: any
          }
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_canvas_objects: {
        Args: {
          canvas_uuid: string
        }
        Returns: {
          id: string
          canvas_id: string
          user_id: string | null
          type: string
          data: any
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type ActionHistory = Database['public']['Tables']['action_history']['Row']
export type ActionHistoryInsert = Database['public']['Tables']['action_history']['Insert']
export type ActionHistoryUpdate = Database['public']['Tables']['action_history']['Update']

export type CanvasObject = Database['public']['Tables']['canvas_objects']['Row']
export type CanvasObjectInsert = Database['public']['Tables']['canvas_objects']['Insert']
export type CanvasObjectUpdate = Database['public']['Tables']['canvas_objects']['Update']

// Action types for undo/redo
export type ActionType = 'add' | 'update' | 'delete' | 'delete-multiple'
export type ObjectType = 'emoji' | 'rectangle' | 'circle' | 'text'

