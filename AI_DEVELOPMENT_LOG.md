# AI Development Log: CollabCanvas 

### 🛠️ Tools 
**Tech Stack:** Nuxt 4, Supabase, Konva.js, TypeScript, Tailwind CSS, Vercel
- **Grok, Chat GPT & Claude**: Creation of PRD, Tasks & Architecture diagrams. Used PDF of project assignment and ran into limits so I needed to use all 3 free tiers. 
- **Claude Sonnet 4 (via Cursor)**: Primary development assistant for architecture, coding, complex logic, and debugging
- **MCP Servers**: Specialized documentation access for Nuxt and Nuxt UI. 

## Workflow
Used 3 different free AI chat interfaces to plan and produce the PRD, tasks & mermaid diagram and then used Cursor to do all the code with AI. I typed but will experiment with voice next time.

### 🎯 Prompting Strategies that worked well
### 1. Use another AI to check your primary one
During one particular part of the project Claude was struggling to sync between 2 users. I asked Grok to give Claude a suggestion for a fix and that was helpful. 


### 2. Remind the AI to use MCPs
I’m using Nuxt and Nuxt UI for my frontend. They have MCP servers. I would have to remind Claude to refer to these servers whenever there was issues with reactivity or component implementation details. “Use the Nuxt UI MCP to fix this component error”. 

### 3. Screenshots 
“Show it” what’s wrong. “My navigation bar is covering the controls”. 

### 4. Telling it what the issue is and providing logs
“I added a circle in browser 1 but I don’t see it in browser 2, here are the logs”. 


## 📊 Code Analysis
100% AI 

## 💪 Strengths & Limitations
### Where AI Excelled
**Rapid Prototyping**,  **Complex Integration (Nuxt, Konva, Supabase)**, **Error Handling & Edge Cases**, **Documentation & Comments**
### Where AI Struggled, 
**Real-time Debugging - I had to really guide it to fix some errors copy pasting logs and what I was testing/experiencing**, **Results are kind of ugly (imo)**. **Integration Testing 

## 🎓 Key Learnings - AI coding is orders of magnitude faster than traditional coding. Knowing what to ask, how to learn, and how to problem solve is critical. It's important to check the AI's work and keep concerns separate. It is brilliant but I also caught it making very simple mistakes.

## 🐛 Debugging Session: AI Agent Shape Creation Issues

### **Problem**: AI-created shapes only appeared after page refresh, not immediately
- Shapes were being created and saved to database successfully
- Canvas watcher was triggered but `hasNewShapes` was `false`
- Color issues: shapes showing default colors instead of AI-specified colors

### **Root Cause**: Vue Reactivity Timing Issue
The canvas component's watcher was being triggered before the DOM had finished updating, causing the canvas refresh to happen too early.

### **Solution**: Used Nuxt MCP Documentation + nextTick()
1. **Leveraged MCP Tools**: Used `mcp_nuxt_search_nuxt_docs` to find the exact solution
2. **Applied nextTick()**: Ensured DOM updates complete before canvas refresh
3. **Canvas Page Watcher**: Added watcher that monitors shape arrays and calls `forceRefresh()` after `nextTick()`

### **Key Debugging Lessons**:

#### 1. **Use MCP Tools for Framework-Specific Issues**
- When dealing with Nuxt/Vue reactivity issues, always check MCP documentation first
- MCP tools provide framework-specific solutions that generic AI knowledge might miss
- **Prompt**: "nuxt mcp is for these types of issues" - this was the breakthrough moment

#### 2. **Timing Issues in Vue Reactivity**
- `useState` arrays update asynchronously
- Canvas components need DOM to be fully updated before refreshing
- `nextTick()` is essential for ensuring proper timing

#### 3. **Debugging Strategy**
- **Add extensive logging** to trace the exact flow
- **Check both data layer AND visual layer** - shapes were in arrays but not on canvas
- **Look for timing mismatches** between watchers and DOM updates

#### 4. **Code Organization**
- **Separate concerns**: Canvas page handles visual updates, AI agent handles data
- **Use refs properly**: `canvasRef.value.forceRefresh()` for direct component access
- **Clean up debug logs** once issues are resolved

### **Final Working Pattern**:
```typescript
// Canvas page watcher with proper timing
watch([rectangles, circles, texts], async ([newRects, newCircles, newTexts], [oldRects, oldCircles, oldTexts]) => {
    // Use nextTick to ensure DOM has been updated
    await nextTick()
    
    // Force refresh the canvas
    if (canvasRef.value && canvasRef.value.forceRefresh) {
      canvasRef.value.forceRefresh()
    }
}, { deep: true })
```

### **MCP Tools Used**:
- `mcp_nuxt_search_nuxt_docs` - Found Vue reactivity and nextTick solutions
- `mcp_nuxt-ui_*` - For component-specific issues

**Lesson**: Always leverage specialized MCP tools for framework-specific debugging! 
