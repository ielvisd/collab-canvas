import { ref } from 'vue'
import { useEmojis } from './useEmojis'
import { 
  parseMultipleItems, 
  extractCount, 
  extractSize, 
  extractPosition, 
  extractEmojiType,
  generateBorderPositions,
  generateAlternatingPattern,
  generateTrail,
  type CanvasPosition,
  type MultipleItemsResult
} from '~/utils/aiHelpers'
import { generateWordPositions, generateVerticalWordPositions } from '~/utils/letterPatterns'
import { generateShapePattern, convertAsciiToEmojiPositions, type EmojiPosition } from '~/utils/shapePatterns'
import { calculateViewportBounds, getViewportCenterPosition, clampToViewport } from '~/utils/viewportUtils'

  // Utility function for random colors (currently unused)
  const _getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    return colors[Math.floor(Math.random() * colors.length)]
  }

export interface AICommand {
  action: string
  [key: string]: unknown
}

export interface AIAgentState {
  isProcessing: Ref<boolean>
  lastCommand: Ref<AICommand | null>
  error: Ref<string | null>
  isConnected: Ref<boolean>
}

export interface AIAgentActions {
  sendMessage: (message: string) => void
  executeCommand: (command: AICommand) => Promise<boolean>
  clearError: () => void
  reset: () => void
}

export const useAIAgent = (canvasState?: { scale: number; offsetX: number; offsetY: number; canvasWidth: number; canvasHeight: number }, viewportElement?: HTMLElement | null) => {
  // Custom chat implementation since @ai-sdk/vue useChat has import issues
  const messages = ref<Array<{ id: string; role: string; content: string }>>([])
  const input = ref('')
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const isConnected = ref(true)
  const lastCommand = ref<AICommand | null>(null)


  // We only use emojis now, no shapes needed

  // Extract commands from AI message content
  const extractCommandsFromMessage = (content: string): AICommand[] => {
    // console.log('🔍 Extracting commands from:', content)
    
    // Ensure content is a string
    if (typeof content !== 'string') {
      console.warn('⚠️ Content is not a string:', typeof content, content)
      return []
    }
    
    const commands: AICommand[] = []
    const seenCommands = new Set<string>() // Track seen commands to avoid duplicates
    
    // Look for JSON command objects in the message using a more robust approach
    // First try to find complete JSON objects by looking for balanced braces
    const jsonMatches = []
    let start = content.indexOf('{')
    while (start !== -1) {
      let braceCount = 0
      let end = start
      for (let i = start; i < content.length; i++) {
        if (content[i] === '{') braceCount++
        if (content[i] === '}') braceCount--
        if (braceCount === 0) {
          end = i
          break
        }
      }
      if (end > start) {
        const jsonStr = content.substring(start, end + 1)
        if (jsonStr.includes('"action"') || jsonStr.includes('"name"')) {
          jsonMatches.push(jsonStr)
        }
      }
      start = content.indexOf('{', end + 1)
    }
    
    console.log('🔍 JSON matches found:', jsonMatches)
    if (jsonMatches.length > 0) {
      jsonMatches.forEach(match => {
        try {
          const command = JSON.parse(match)
          // Handle both "action" and "name" formats
          const action = command.action || command.name
          if (action) {
            // Convert "name" format to "action" format
            if (command.name) {
              command.action = command.name
              delete command.name
            }
            const commandKey = JSON.stringify(command)
            if (!seenCommands.has(commandKey)) {
              console.log('✅ Parsed command:', command)
              commands.push(command)
              seenCommands.add(commandKey)
            }
          }
        } catch (e) {
          console.warn('Failed to parse command JSON:', match, e)
        }
      })
    }
    
    // Also handle semicolon-separated commands
    if (content.includes(';')) {
      console.log('🔍 Looking for semicolon-separated commands')
      const semicolonCommands = content.split(';').map(s => s.trim()).filter(s => s.startsWith('{'))
      semicolonCommands.forEach(match => {
        try {
          const command = JSON.parse(match)
          const action = command.action || command.name
          if (action) {
            if (command.name) {
              command.action = command.name
              delete command.name
            }
            const commandKey = JSON.stringify(command)
            if (!seenCommands.has(commandKey)) {
              console.log('✅ Parsed semicolon command:', command)
              commands.push(command)
              seenCommands.add(commandKey)
            }
          }
        } catch {
          console.warn('Failed to parse semicolon command JSON:', match)
        }
      })
    }
    
    // Also look for commands in the new fallback format
    if (content.includes('Command:') && content.includes('{')) {
      console.log('🔍 Looking for fallback command format')
      // Find the start of the JSON object after "Command:"
      const commandStart = content.indexOf('Command:')
      const jsonStart = content.indexOf('{', commandStart)
      if (jsonStart !== -1) {
        // Find the matching closing brace
        let braceCount = 0
        let jsonEnd = jsonStart
        for (let i = jsonStart; i < content.length; i++) {
          if (content[i] === '{') braceCount++
          if (content[i] === '}') braceCount--
          if (braceCount === 0) {
            jsonEnd = i
            break
          }
        }
        
        if (jsonEnd > jsonStart) {
          const jsonString = content.substring(jsonStart, jsonEnd + 1)
          console.log('🔍 Extracted JSON string:', jsonString)
          try {
            const command = JSON.parse(jsonString)
            if (command.action) {
              const commandKey = JSON.stringify(command)
              if (!seenCommands.has(commandKey)) {
                console.log('✅ Parsed fallback command:', command)
                commands.push(command)
                seenCommands.add(commandKey)
              }
            }
          } catch {
            console.warn('Failed to parse fallback command JSON:', jsonString)
          }
        }
      }
    }
    
    // console.log('🔍 Final commands:', commands)
    return commands
  }

  // Execute a command on the canvas
  const executeCommand = async (command: AICommand): Promise<boolean> => {
    try {
      isProcessing.value = true
      lastCommand.value = command
      error.value = null

      console.log('🤖 Executing AI command:', command)
      console.log('🔍 Command action:', command.action)
      console.log('🔍 Command keys:', Object.keys(command))

      switch (command.action) {
        case 'create-shape':
          return await handleCreateEmoji(command)
        
        case 'move-shape':
          return await handleMoveEmoji(command)
        
        case 'resize-shape':
          return await handleResizeEmoji(command)
        
        case 'delete-shape':
          return await handleDeleteEmoji(command)
        
        case 'get-shapes':
          return await handleGetEmojis(command)
        
        case 'arrange-shapes':
          return await handleArrangeEmojis(command)
        
        case 'clear-all':
          return await handleClearAll(command)
        
        case 'create-emoji-story':
          return await handleCreateEmojiStory(command)
        
        case 'move-emojis':
          return await handleMoveEmojis(command)
        
        case 'rotate-emojis':
          return await handleRotateEmojis(command)
        
        case 'move-all-emojis':
          return await handleMoveAllEmojis(command)
        
        case 'create-border':
          return await handleCreateBorder(command)
        
        case 'create-alternating-pattern':
          return await handleCreateAlternatingPattern(command)
        
        case 'spell-word':
          console.log('🔤 Handling spell-word command:', command)
          return await handleSpellWord(command)
        
        case 'draw-shape':
          console.log('🎨 Handling draw-shape command:', command)
          return await handleDrawShape(command)
        
        case 'shift-scene':
          return await handleShiftScene(command)
        
        case 'mirror-scene':
          return await handleMirrorScene(command)
        
        default:
          console.warn('Unknown command action:', command.action)
          return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Error executing AI command:', err)
      return false
    } finally {
      isProcessing.value = false
    }
  }

  // Handle emoji creation (since we only use emojis now)
  const handleCreateEmoji = async (command: AICommand): Promise<boolean> => {
    const { x, y, emoji, emojiSize, layer, rotation } = command as unknown as {
      x?: number;
      y?: number;
      emoji?: string;
      emojiSize?: number;
      layer?: number;
      rotation?: number;
    }
    
    console.log('🔧 Raw command received in handleCreateEmoji:', JSON.stringify(command, null, 2))
    console.log('🎨 Creating emoji with command:', { x, y, emoji, emojiSize, layer, rotation })

    // Validate that we have meaningful values for emoji creation
    if (!emoji) {
      console.warn('⚠️ Skipping emoji creation - no emoji provided:', command)
      return false
    }

    try {
      // Use the emoji composable to create emojis
      console.log('🎨 Creating emoji:', { emoji, x, y, size: emojiSize, layer, rotation })
      const { addEmoji } = useEmojis()
      await addEmoji({
        x: x !== undefined ? x : 100,
        y: y !== undefined ? y : 100,
        emoji: emoji,
        size: emojiSize || 48,
        layer: layer || 1,
        rotation: rotation || 0
      })
      console.log('✅ Emoji created successfully')
      return true
    } catch (err) {
      console.error(`❌ Failed to create emoji:`, err)
      return false
    }
  }

  // Handle emoji movement
  const handleMoveEmoji = async (command: AICommand): Promise<boolean> => {
    const { emojiId, x, y } = command as unknown as { emojiId: string; x: number; y: number }

    if (!emojiId) {
      throw new Error('Emoji ID is required for move command')
    }

    try {
      const { updateEmoji } = useEmojis()
      await updateEmoji(emojiId, { x, y })
      console.log(`✅ Moved emoji ${emojiId} to (${x}, ${y})`)
      return true
    } catch (err) {
      console.error(`❌ Failed to move emoji ${emojiId}:`, err)
      return false
    }
  }

  // Handle emoji resizing
  const handleResizeEmoji = async (command: AICommand): Promise<boolean> => {
    const { emojiId, size } = command as unknown as { emojiId: string; size?: number }

    if (!emojiId) {
      throw new Error('Emoji ID is required for resize command')
    }

    try {
      const { updateEmoji } = useEmojis()
      await updateEmoji(emojiId, { size: size || 48 })
      console.log(`✅ Resized emoji ${emojiId} to size ${size}`)
      return true
    } catch (err) {
      console.error(`❌ Failed to resize emoji ${emojiId}:`, err)
      return false
    }
  }

  // Handle emoji deletion
  const handleDeleteEmoji = async (command: AICommand): Promise<boolean> => {
    const { emojiId } = command as unknown as { emojiId: string }

    if (!emojiId) {
      throw new Error('Emoji ID is required for delete command')
    }

    try {
      const { deleteEmoji } = useEmojis()
      await deleteEmoji(emojiId)
      console.log(`✅ Deleted emoji ${emojiId}`)
      return true
    } catch (err) {
      console.error(`❌ Failed to delete emoji ${emojiId}:`, err)
      return false
    }
  }

  // Handle getting emoji information
  const handleGetEmojis = async (_command: AICommand): Promise<boolean> => {
    try {
      const { emojis } = useEmojis()
      console.log(`📊 Found ${emojis.value.length} emojis:`, emojis.value)
      return true
    } catch (err) {
      console.error(`❌ Failed to get emojis:`, err)
      return false
    }
  }

  // Handle emoji arrangement
  const handleArrangeEmojis = async (command: AICommand): Promise<boolean> => {
    const { emojiIds, layout, spacing = 20 } = command as unknown as { emojiIds: string[]; layout: string; spacing?: number }

    if (!emojiIds || emojiIds.length === 0) {
      throw new Error('Emoji IDs are required for arrange command')
    }

    try {
      const { getEmojiById, updateEmoji } = useEmojis()
      const emojis = emojiIds.map((id: string) => getEmojiById(id)).filter(Boolean)
      if (emojis.length === 0) {
        throw new Error('No valid emojis found for arrangement')
      }

      // Calculate positions based on layout
      let positions: { x: number, y: number }[] = []

      switch (layout) {
        case 'horizontal': {
          positions = emojis.map((_, index: number) => ({
            x: 100 + index * (200 + spacing),
            y: 100
          }))
          break
        }
        
        case 'vertical': {
          positions = emojis.map((_, index: number) => ({
            x: 100,
            y: 100 + index * (100 + spacing)
          }))
          break
        }
        
        case 'grid': {
          const cols = Math.ceil(Math.sqrt(emojis.length))
          positions = emojis.map((_, index: number) => ({
            x: 100 + (index % cols) * (200 + spacing),
            y: 100 + Math.floor(index / cols) * (100 + spacing)
          }))
          break
        }
        
        case 'circle': {
          const centerX = 400
          const centerY = 300
          const radius = 150
          positions = emojis.map((_, index: number) => {
            const angle = (index / emojis.length) * 2 * Math.PI
            return {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle)
            }
          })
          break
        }
        
        default:
          throw new Error(`Unknown layout type: ${layout}`)
      }

      // Update emoji positions
      for (let i = 0; i < emojis.length; i++) {
        const emoji = emojis[i]
        const position = positions[i]
        if (position && emoji) {
          await updateEmoji(emoji.id, { x: position.x, y: position.y })
        }
      }

      console.log(`✅ Arranged ${emojis.length} emojis in ${layout} layout`)
      return true
    } catch (err) {
      console.error(`❌ Failed to arrange emojis:`, err)
      return false
    }
  }

  // Handle clear all emojis command
  const handleClearAll = async (_command: AICommand): Promise<boolean> => {
    try {
      const { clearAllEmojis } = useEmojis()
      await clearAllEmojis()
      
      console.log('✅ Cleared all emojis from canvas')
      return true
    } catch (err) {
      console.error('❌ Failed to clear all emojis:', err)
      return false
    }
  }

  // Handle moving specific emojis
  const handleMoveEmojis = async (command: AICommand): Promise<boolean> => {
    const { emojiType, deltaX, deltaY, trailEmoji, createTrail } = command as unknown as { 
      emojiType: string; 
      deltaX: number; 
      deltaY: number;
      trailEmoji?: string;
      createTrail?: boolean;
    }

    try {
      const { emojis, updateEmoji, addEmoji } = useEmojis()
      
      // Filter emojis by type if specified
      const targetEmojis = emojiType 
        ? emojis.value.filter(emoji => emoji.emoji === emojiType)
        : emojis.value

      if (targetEmojis.length === 0) {
        console.log(`⚠️ No emojis found with type: ${emojiType}`)
        return false
      }

      // Update each emoji and create trails if requested
      let successCount = 0
      for (const emoji of targetEmojis) {
        const oldX = emoji.x
        const oldY = emoji.y
        const newX = emoji.x + deltaX
        const newY = emoji.y + deltaY
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
          
          // Create trail if requested
          if (createTrail && trailEmoji) {
            const trailPositions = generateTrail(oldX, oldY, newX, newY, trailEmoji)
            for (const trailPos of trailPositions) {
              await addEmoji({
                ...trailPos,
                rotation: 0
              })
              await new Promise(resolve => setTimeout(resolve, 5)) // Small delay
            }
          }
        }
      }

      console.log(`✅ Moved ${successCount}/${targetEmojis.length} emojis by (${deltaX}, ${deltaY})`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to move emojis:', err)
      return false
    }
  }

  // Handle rotating specific emojis
  const handleRotateEmojis = async (command: AICommand): Promise<boolean> => {
    const { emojiType, degrees } = command as unknown as { 
      emojiType: string; 
      degrees: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      // Filter emojis by type if specified
      const targetEmojis = emojiType 
        ? emojis.value.filter(emoji => emoji.emoji === emojiType)
        : emojis.value

      if (targetEmojis.length === 0) {
        console.log(`⚠️ No emojis found with type: ${emojiType}`)
        return false
      }

      // Update each emoji's rotation
      let successCount = 0
      for (const emoji of targetEmojis) {
        const newRotation = (emoji.rotation + degrees) % 360
        
        const success = await updateEmoji(emoji.id, { rotation: newRotation })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Rotated ${successCount}/${targetEmojis.length} emojis by ${degrees} degrees`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to rotate emojis:', err)
      return false
    }
  }

  // Handle moving all emojis
  const handleMoveAllEmojis = async (command: AICommand): Promise<boolean> => {
    const { deltaX, deltaY } = command as unknown as { 
      deltaX: number; 
      deltaY: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      if (emojis.value.length === 0) {
        console.log('⚠️ No emojis found on canvas')
        return false
      }

      // Update each emoji
      let successCount = 0
      for (const emoji of emojis.value) {
        const newX = emoji.x + deltaX
        const newY = emoji.y + deltaY
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Moved all ${successCount}/${emojis.value.length} emojis by (${deltaX}, ${deltaY})`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to move all emojis:', err)
      return false
    }
  }

  // Handle creating border
  const handleCreateBorder = async (command: AICommand): Promise<boolean> => {
    const { emoji, spacing } = command as unknown as { 
      emoji: string; 
      spacing?: number 
    }

    try {
      const { addEmoji } = useEmojis()
      const borderPositions = generateBorderPositions(emoji, spacing)
      
      for (const pos of borderPositions) {
        await addEmoji({
          ...pos,
          rotation: 0
        })
        await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
      }

      console.log(`✅ Created border with ${borderPositions.length} ${emoji} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to create border:', err)
      return false
    }
  }

  // Handle creating alternating pattern
  const handleCreateAlternatingPattern = async (command: AICommand): Promise<boolean> => {
    const { emojis, count, arrangement, position } = command as unknown as { 
      emojis: string[]; 
      count: number; 
      arrangement?: 'row' | 'column';
      position?: CanvasPosition;
    }

    try {
      const { addEmoji } = useEmojis()
      const patternPositions = generateAlternatingPattern(emojis, count, arrangement, position)
      
      for (const pos of patternPositions) {
        await addEmoji({
          ...pos,
          rotation: 0
        })
        await new Promise(resolve => setTimeout(resolve, 10)) // Small delay
      }

      console.log(`✅ Created alternating pattern with ${patternPositions.length} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to create alternating pattern:', err)
      return false
    }
  }

  // Handle spelling words
  const handleSpellWord = async (command: AICommand): Promise<boolean> => {
    console.log('🔤 handleSpellWord called with:', command)
    const { word, emoji, vertical, position } = command as unknown as { 
      word: string; 
      emoji: string; 
      vertical?: boolean | string;
      position?: CanvasPosition;
    }

    console.log('🔤 Parsed parameters:', { word, emoji, vertical, position })

    try {
      const { addEmoji } = useEmojis()
      let wordPositions: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }>
      
      // Properly parse vertical parameter (handle both boolean and string)
      const isVertical = vertical === true || vertical === 'true' || vertical === 'True'
      console.log('🔤 isVertical:', isVertical, 'original vertical:', vertical)
      
      if (isVertical) {
        console.log('🔤 Generating vertical word positions')
        wordPositions = generateVerticalWordPositions(
          word, 
          emoji, 
          position?.x ?? 200, 
          position?.y ?? 200
        )
      } else {
        console.log('🔤 Generating horizontal word positions')
        wordPositions = generateWordPositions(
          word, 
          emoji, 
          position?.x ?? 200, 
          position?.y ?? 200
        )
      }
      
      console.log('🔤 Generated word positions:', wordPositions.length, 'positions')
      
      for (const pos of wordPositions) {
        console.log('🔤 Adding emoji position:', pos)
        await addEmoji(pos)
        await new Promise(resolve => setTimeout(resolve, 5)) // Small delay
      }

      console.log(`✅ Spelled "${word}" with ${wordPositions.length} ${emoji} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to spell word:', err)
      return false
    }
  }

  // Handle drawing shapes
  const handleDrawShape = async (command: AICommand): Promise<boolean> => {
    console.log('🎨 handleDrawShape called with:', command)
    const { shape, emoji, fillStyle, size, position, asciiPattern } = command as unknown as { 
      shape: string; 
      emoji: string; 
      fillStyle?: 'filled' | 'outline';
      size?: number;
      position?: CanvasPosition;
      asciiPattern?: string[]; // For AI-generated patterns
    }

    console.log('🎨 Parsed parameters:', { shape, emoji, fillStyle, size, position, asciiPattern })

    try {
      const { addEmoji } = useEmojis()
      let emojiPositions: EmojiPosition[] = []

      // Calculate viewport bounds for positioning
      let shapePosition = position || { x: 400, y: 300 }
      
      if (canvasState && viewportElement) {
        const viewportBounds = calculateViewportBounds(canvasState, viewportElement)
        if (viewportBounds) {
          // Use viewport center if no specific position provided
          if (!position) {
            shapePosition = getViewportCenterPosition(viewportBounds)
          } else {
            // Clamp provided position to viewport bounds
            shapePosition = clampToViewport(position, viewportBounds, size || 50)
          }
        }
      }

      // Check if we have an AI-generated ASCII pattern
      if (asciiPattern && Array.isArray(asciiPattern) && asciiPattern.length > 0) {
        console.log('🎨 Using AI-generated ASCII pattern:', asciiPattern)
        emojiPositions = convertAsciiToEmojiPositions(
          asciiPattern,
          emoji,
          shapePosition,
          size ? size / 5 : 1 // Scale based on size
        )
      } else {
        // Use geometric pattern generation
        console.log('🎨 Using geometric pattern generation for:', shape)
        emojiPositions = generateShapePattern(shape, {
          emoji,
          size: size || 5,
          position: shapePosition,
          fillStyle: fillStyle || 'filled',
          scale: size ? size / 5 : 1
        })
      }

      if (emojiPositions.length === 0) {
        console.warn('⚠️ No emoji positions generated for shape:', shape)
        return false
      }

      // Clamp all emoji positions to viewport bounds if available
      if (canvasState && viewportElement) {
        const viewportBounds = calculateViewportBounds(canvasState, viewportElement)
        if (viewportBounds) {
          emojiPositions = emojiPositions.map(pos => ({
            ...pos,
            ...clampToViewport({ x: pos.x, y: pos.y }, viewportBounds, pos.size || 30)
          }))
        }
      }

      console.log('🎨 Generated emoji positions:', emojiPositions.length, 'positions')

      // Add each emoji to the canvas
      for (const pos of emojiPositions) {
        console.log('🎨 Adding emoji position:', pos)
        await addEmoji(pos)
        await new Promise(resolve => setTimeout(resolve, 5)) // Small delay
      }

      console.log(`✅ Drew ${shape} with ${emojiPositions.length} ${emoji} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to draw shape:', err)
      return false
    }
  }

  // Handle shifting entire scene
  const handleShiftScene = async (command: AICommand): Promise<boolean> => {
    const { deltaX, deltaY } = command as unknown as { 
      deltaX: number; 
      deltaY: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      if (emojis.value.length === 0) {
        console.log('⚠️ No emojis found on canvas')
        return false
      }

      // Update each emoji
      let successCount = 0
      for (const emoji of emojis.value) {
        const newX = emoji.x + deltaX
        const newY = emoji.y + deltaY
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Shifted entire scene by (${deltaX}, ${deltaY})`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to shift scene:', err)
      return false
    }
  }

  // Handle mirroring scene
  const handleMirrorScene = async (command: AICommand): Promise<boolean> => {
    const { axis, centerX } = command as unknown as { 
      axis: 'horizontal' | 'vertical'; 
      centerX?: number 
    }

    try {
      const { emojis, updateEmoji } = useEmojis()
      
      if (emojis.value.length === 0) {
        console.log('⚠️ No emojis found on canvas')
        return false
      }

      const mirrorCenter = centerX ?? 400
      let successCount = 0

      for (const emoji of emojis.value) {
        let newX = emoji.x
        let newY = emoji.y

        if (axis === 'horizontal') {
          // Mirror horizontally around centerX
          newX = mirrorCenter - (emoji.x - mirrorCenter)
        } else {
          // Mirror vertically around centerY
          newY = 300 - (emoji.y - 300)
        }
        
        const success = await updateEmoji(emoji.id, { x: newX, y: newY })
        if (success) {
          successCount++
        }
      }

      console.log(`✅ Mirrored scene ${axis}ly`)
      return successCount > 0
    } catch (err) {
      console.error('❌ Failed to mirror scene:', err)
      return false
    }
  }

  // Generate emojis for multiple items (e.g., "one big pumpkin and two small hearts")
  const generateMultipleItemsEmojis = (multipleItems: MultipleItemsResult): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    
    // Calculate viewport bounds for positioning
    let centerX = multipleItems.position?.x || 400
    let centerY = multipleItems.position?.y || 300
    
    if (canvasState && viewportElement) {
      const viewportBounds = calculateViewportBounds(canvasState, viewportElement)
      if (viewportBounds) {
        // Use viewport center if no specific position provided
        if (!multipleItems.position) {
          const viewportCenter = getViewportCenterPosition(viewportBounds)
          centerX = viewportCenter.x
          centerY = viewportCenter.y
        } else {
          // Clamp provided position to viewport bounds
          const clampedPos = clampToViewport(multipleItems.position, viewportBounds, 50)
          centerX = clampedPos.x
          centerY = clampedPos.y
        }
      }
    }
    
    const arrangement = multipleItems.arrangement || 'row'
    
    let currentIndex = 0
    
    for (const item of multipleItems.items) {
      for (let i = 0; i < item.count; i++) {
        let x, y
        
        if (arrangement === 'circle') {
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          const angle = (currentIndex / totalItems) * 2 * Math.PI
          const radius = 120
          x = centerX + radius * Math.cos(angle)
          y = centerY + radius * Math.sin(angle)
        } else if (arrangement === 'triangle') {
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          const angle = (currentIndex / totalItems) * 2 * Math.PI
          const radius = 120
          x = centerX + radius * Math.cos(angle)
          y = centerY + radius * Math.sin(angle)
        } else if (arrangement === 'square') {
          const _totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          const _side = Math.floor(currentIndex / 4)
          const pos = currentIndex % 4
          const radius = 100
          if (pos === 0) { x = centerX - radius; y = centerY - radius }
          else if (pos === 1) { x = centerX + radius; y = centerY - radius }
          else if (pos === 2) { x = centerX + radius; y = centerY + radius }
          else { x = centerX - radius; y = centerY + radius }
        } else {
          // Default to row arrangement
          const totalItems = multipleItems.items.reduce((sum, it) => sum + it.count, 0)
          x = centerX - (totalItems * 40) + (currentIndex * 80)
          y = centerY
        }
        
        emojis.push({
          emoji: item.emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: item.size,
          layer: 1,
          rotation: 0
        })
        
        currentIndex++
      }
    }
    
    // Clamp all emoji positions to viewport bounds if available
    if (canvasState && viewportElement) {
      const viewportBounds = calculateViewportBounds(canvasState, viewportElement)
      if (viewportBounds) {
        return emojis.map(emoji => ({
          ...emoji,
          ...clampToViewport({ x: emoji.x, y: emoji.y }, viewportBounds, emoji.size || 30)
        }))
      }
    }
    
    return emojis
  }

  // Generate fallback emojis based on story description
  const generateFallbackEmojis = (story: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const storyLower = story.toLowerCase()
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    
    // Check for multiple items first
    const multipleItems = parseMultipleItems(story)
    if (multipleItems) {
      return generateMultipleItemsEmojis(multipleItems)
    }
    
    // Extract count from story (handles both words and numbers)
    const count = extractCount(story)
    
    // Extract size from story
    const size = extractSize(story)
    
    // Extract position from story
    const position = extractPosition(story)
    
    // Determine emoji type using utility function
    const emoji = extractEmojiType(story)
    
    // Handle creative requests
    if (storyLower.includes('spelled') || storyLower.includes('spell')) {
      // Try to spell out a word with emojis
      const wordMatch = story.match(/(?:spelled?|spell)\s+(?:in|with|using)\s+\w+\s+(\w+)/i)
      if (wordMatch && wordMatch[1]) {
        const word = wordMatch[1].toUpperCase()
        const vertical = storyLower.includes('vertically') || storyLower.includes('vertical')
        return spellWordWithEmojis(word, emoji, vertical)
      }
    }
    
    if (storyLower.includes('draw') && storyLower.includes('using')) {
      // Try to draw a shape using emojis
      if (storyLower.includes('heart')) {
        return drawHeartWithEmojis(emoji)
      } else if (storyLower.includes('star')) {
        return drawStarWithEmojis(emoji)
      } else if (storyLower.includes('circle')) {
        return drawCircleWithEmojis(emoji)
      }
    }
    
    // Determine arrangement with position and size awareness
    const centerX = position?.x || 400
    const centerY = position?.y || 300
    
    if (storyLower.includes('in a row') || storyLower.includes('in row')) {
      // Horizontal row
      for (let i = 0; i < count; i++) {
        emojis.push({
          emoji: emoji,
          x: centerX - (count * 40) + (i * 80), // Center the row
          y: centerY,
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    } else if (storyLower.includes('around') || storyLower.includes('circle')) {
      // Circular arrangement
      const radius = 120
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        emojis.push({
          emoji: emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    } else if (storyLower.includes('triangle')) {
      // Triangular arrangement
      const radius = 120
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        emojis.push({
          emoji: emoji,
          x: Math.round(x),
          y: Math.round(y),
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    } else {
      // Default arrangement (horizontal row)
      for (let i = 0; i < count; i++) {
        emojis.push({
          emoji: emoji,
          x: centerX - (count * 40) + (i * 80), // Center the row
          y: centerY,
          size: size,
          layer: 1,
          rotation: 0
        })
      }
    }
    
    return emojis
  }
  
  // Helper function to spell words with emojis using letter patterns
  const spellWordWithEmojis = (word: string, emoji: string, vertical: boolean = false): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const startX = 200
    const startY = 200
    
    if (vertical) {
      return generateVerticalWordPositions(word, emoji, startX, startY)
    } else {
      return generateWordPositions(word, emoji, startX, startY)
    }
  }
  
  // Helper function to draw a heart with emojis
  const drawHeartWithEmojis = (emoji: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = 400
    const centerY = 300
    
    // Simple heart shape pattern
    const heartPattern = [
      { x: 0, y: -2 }, { x: 1, y: -2 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
      { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
      { x: 0, y: 2 }
    ]
    
    heartPattern.forEach(({ x, y }) => {
      emojis.push({
        emoji: emoji,
        x: centerX + (x * 30),
        y: centerY + (y * 30),
        size: 30,
        layer: 1,
        rotation: 0
      })
    })
    
    return emojis
  }
  
  // Helper function to draw a star with emojis
  const drawStarWithEmojis = (emoji: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = 400
    const centerY = 300
    const radius = 100
    
    // 5-pointed star pattern
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      emojis.push({
        emoji: emoji,
        x: Math.round(x),
        y: Math.round(y),
        size: 40,
        layer: 1,
        rotation: 0
      })
    }
    
    return emojis
  }
  
  // Helper function to draw a circle with emojis
  const drawCircleWithEmojis = (emoji: string): Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> => {
    const emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }> = []
    const centerX = 400
    const centerY = 300
    const radius = 120
    const count = 12
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      emojis.push({
        emoji: emoji,
        x: Math.round(x),
        y: Math.round(y),
        size: 40,
        layer: 1,
        rotation: 0
      })
    }
    
    return emojis
  }
  
  // Create emoji story with provided emojis
  const createEmojiStoryWithEmojis = async (story: string, emojis: Array<{ emoji: string; x: number; y: number; size: number; layer: number; rotation: number }>): Promise<boolean> => {
    try {
      const { addEmoji } = useEmojis()
      
      // Add each emoji to the canvas with proper positioning and layering
      for (const emojiData of emojis) {
        const emoji = {
          emoji: emojiData.emoji,
          x: emojiData.x,
          y: emojiData.y,
          size: emojiData.size,
          layer: emojiData.layer,
          rotation: emojiData.rotation
        }
        
        await addEmoji(emoji)
        
        // Add a small delay between emoji additions for better visual effect
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      console.log(`✅ Emoji story "${story}" created successfully with ${emojis.length} emojis`)
      return true
    } catch (err) {
      console.error('❌ Failed to create emoji story with fallback emojis:', err)
      return false
    }
  }

  // Handle emoji story creation
  const handleCreateEmojiStory = async (command: AICommand): Promise<boolean> => {
    try {
      console.log('🔧 Raw command received in handleCreateEmojiStory:', JSON.stringify(command, null, 2))
      const { story, emojis } = command as unknown as { story: string; emojis: Array<{ emoji: string; x: number; y: number; size?: number; layer?: number; rotation?: number }> }
      console.log('🎭 Creating emoji story:', { story, emojis })
      console.log('🔍 Emojis type:', typeof emojis, 'Is array:', Array.isArray(emojis), 'Value:', emojis)
      
      // Check if we have a valid story and emojis
      if (!story || !emojis || !Array.isArray(emojis) || emojis.length === 0) {
        console.error('❌ Invalid command: missing story or emojis array. Story:', story, 'Emojis:', emojis)
        
        // If we don't have a story, we can't generate a fallback
        if (!story) {
          console.error('❌ Cannot generate fallback without story description')
          return false
        }
        
        // Try to generate a fallback emoji story based on the story description
        console.log('🔄 Attempting to generate fallback emoji story from story description:', story)
        const fallbackEmojis = generateFallbackEmojis(story)
        if (fallbackEmojis.length > 0) {
          console.log('✅ Generated fallback emojis:', fallbackEmojis)
          return await createEmojiStoryWithEmojis(story, fallbackEmojis)
        }
        
        return false
      }

      // Use the helper function to create the emoji story
      // Ensure all emoji properties have default values
      const normalizedEmojis = emojis.map(emojiData => ({
        emoji: emojiData.emoji,
        x: emojiData.x || 100,
        y: emojiData.y || 100,
        size: emojiData.size || 40,
        layer: emojiData.layer || 1,
        rotation: emojiData.rotation || 0
      }))
      
      return await createEmojiStoryWithEmojis(story, normalizedEmojis)
    } catch (err) {
      console.error('❌ Failed to create emoji story:', err)
      return false
    }
  }

  // Generate warm, conversational responses
  const generateWarmResponse = (originalMessage: string, commandCount: number): string => {
    const warmResponses = [
      "✨ Your creation is complete! I've brought your vision to life on the canvas.",
      "🎨 Perfect! I've crafted something beautiful just for you.",
      "🌟 Ta-da! Your emoji masterpiece is ready to admire.",
      "💫 Wonderful! I've painted your imagination onto the canvas.",
      "🎭 Amazing! Your creative request has been brought to life.",
      "🌈 Fantastic! I've created something special just for you.",
      "✨ Your artistic vision is now a reality on the canvas!",
      "🎨 Beautiful! I've made your emoji dreams come true.",
      "🌟 Excellent! Your creation is ready for you to enjoy.",
      "💫 Perfect! I've transformed your idea into emoji art."
    ]
    
    // If there are multiple commands, make it more specific
    if (commandCount > 1) {
      const multiCommandResponses = [
        "🎨 Wonderful! I've created a complex scene with multiple elements just for you.",
        "✨ Amazing! I've built something intricate and beautiful on your canvas.",
        "🌟 Fantastic! I've crafted a detailed emoji composition for you.",
        "💫 Perfect! I've created a multi-layered masterpiece on your canvas.",
        "🎭 Excellent! I've brought together several elements to create something special."
      ]
      return multiCommandResponses[Math.floor(Math.random() * multiCommandResponses.length)]!
    }
    
    // For single commands or fallback
    return warmResponses[Math.floor(Math.random() * warmResponses.length)]!
  }

  // Optimized sendMessage implementation with better error handling
  const sendMessage = async (message: string) => {
    if (!message.trim()) return

    // Add user message
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content: message
    })
    
    // Set loading state
    isLoading.value = true
    isProcessing.value = true
    error.value = null
    
    try {
      // Use $fetch for better Nuxt integration and error handling
      const response = await $fetch('/api/chat', {
        method: 'POST',
        body: { messages: messages.value }
      })
      
      // Handle streaming response
      let assistantMessage = ''
      let commands: AICommand[] = []
      
      if (typeof response === 'string') {
        assistantMessage = response
        // Extract commands from text response (fallback mode)
        commands = extractCommandsFromMessage(assistantMessage)
      } else if (response && typeof response === 'object' && 'content' in response) {
        assistantMessage = String(response.content) // Ensure it's a string
        
        // Check if we have structured commands from AI
        console.log('🔍 Response structure:', Object.keys(response))
        console.log('🔍 Commands in response:', response.commands)
        console.log('🔍 Commands is array:', Array.isArray(response.commands))
        console.log('🔍 Full response:', JSON.stringify(response, null, 2))
        console.log('🔍 Full response:', JSON.stringify(response, null, 2))
        
        if ('commands' in response && Array.isArray(response.commands)) {
          console.log('🎯 Using structured commands from AI')
          commands = response.commands as AICommand[]
          console.log('🎯 Received structured commands from AI:', commands)
          console.log('🔍 First command details:', JSON.stringify(commands[0], null, 2))
        } else {
          console.log('🎯 Using fallback command extraction from message')
          // Extract commands from text response (fallback mode)
          commands = extractCommandsFromMessage(assistantMessage)
        }
      }
      
      // Add assistant message with warm, conversational response
      const warmResponse = generateWarmResponse(assistantMessage, commands.length)
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: warmResponse
      })
      
      // Execute commands from the response
      console.log('🔧 About to execute commands:', commands.length, 'commands')
      for (const command of commands) {
        console.log('🔧 Executing command:', JSON.stringify(command, null, 2))
        console.log('🔧 Command keys:', Object.keys(command))
        
        // Skip malformed commands that might be causing issues
        if (command.action === 'create-shape' && !command.emoji) {
          console.warn('⚠️ Skipping malformed create-shape command - no emoji provided:', command)
          continue
        }
        
        await executeCommand(command)
      }
      
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to get AI response'
      
      // Add error message
      messages.value.push({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.value}`
      })
    } finally {
      isLoading.value = false
      isProcessing.value = false
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    if (input.value.trim()) {
      sendMessage(input.value)
      input.value = ''
    }
  }

  // Stop function (placeholder)
  const stop = () => {
    isLoading.value = false
    isProcessing.value = false
  }

  // Reload function (placeholder)
  const reload = () => {
    // Could implement retry logic here
    if (messages.value.length > 0) {
      const lastUserMessage = messages.value.filter(m => m.role === 'user').pop()
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content)
      }
    }
  }

  // Clear error state
  const clearError = () => {
    error.value = null
  }

  // Reset AI agent state
  const reset = () => {
    messages.value = []
    input.value = ''
    error.value = null
    lastCommand.value = null
    isProcessing.value = false
    isLoading.value = false
  }

  // State
  const state: AIAgentState = {
    isProcessing,
    lastCommand,
    error,
    isConnected
  }

  // Actions
  const actions: AIAgentActions = {
    sendMessage,
    executeCommand,
    clearError,
    reset
  }

  return {
    ...state,
    ...actions,
    // Expose chat state
    messages,
    input,
    isLoading,
    stop,
    reload,
    handleSubmit,
    error
  }
}
