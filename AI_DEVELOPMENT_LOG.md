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

## 🎓 Key Learnings - AI coding is orders of magnitude faster than traditional coding. Knowing what to ask, how to learn, and how to problem solve is critical. It’s important to check the AI’s work and keep concerns separate. It is brilliant but I also caught it making very simple mistakes. 
