export interface Database {
  public: {
    Tables: {
      canvas_objects: {
        Row: {
          id: string
          canvas_id: string
          user_id: string
          type: 'rect' | 'circle' | 'text' | 'line' | 'ellipse' | 'arrow' | 'image'
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
          user_id: string
          type: 'rect' | 'circle' | 'text' | 'line' | 'ellipse' | 'arrow' | 'image'
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
          user_id?: string
          type?: 'rect' | 'circle' | 'text' | 'line' | 'ellipse' | 'arrow' | 'image'
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
          user_id: string
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

export type CanvasObject = Database['public']['Tables']['canvas_objects']['Row']
export type CanvasObjectInsert = Database['public']['Tables']['canvas_objects']['Insert']
export type CanvasObjectUpdate = Database['public']['Tables']['canvas_objects']['Update']

