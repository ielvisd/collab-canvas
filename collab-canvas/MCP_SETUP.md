# MCP Server Setup

This project is configured with MCP (Model Context Protocol) servers to help AI models understand your Nuxt application better.

## Package Relationship

The [nuxt-mcp repository](https://github.com/antfu/nuxt-mcp) provides two packages:

- **`nuxt-mcp`**: A Nuxt module that integrates MCP support into your Nuxt app
- **`vite-plugin-mcp`**: A Vite plugin that adds MCP support to your Vite app

For Nuxt projects (like this one), you only need to install `nuxt-mcp` - it automatically includes `vite-plugin-mcp` as a dependency. The Nuxt module handles the Vite plugin integration internally.

## Available MCP Servers

### 1. nuxt (Hosted)
- **Purpose**: Provides access to Nuxt framework documentation and core concepts
- **Endpoint**: `https://mcp.nuxt.com/sse`
- **Type**: Hosted MCP server
- **Benefits**: Always up-to-date with latest Nuxt features, no local setup required

### 2. nuxt-ui (Hosted)
- **Purpose**: Provides access to Nuxt UI component library documentation and examples
- **Endpoint**: `https://ui.nuxt.com/mcp`
- **Type**: Hosted MCP server
- **Benefits**: Comprehensive component library knowledge, no local setup required

### 3. nuxt-mcp (Local - Optional)
- **Purpose**: Helps models understand your specific Vite/Nuxt app structure, components, and configuration
- **Endpoint**: `http://localhost:3000/__mcp/sse` (when dev server is running)
- **Package**: `nuxt-mcp` (includes `vite-plugin-mcp` internally)
- **Type**: Local development server
- **Note**: Only needed if you want AI to understand your specific project structure

## Configuration Files

The following MCP configuration files are available:

- `.cursor/mcp.json` - Cursor MCP configuration (currently active)
- `.vscode/mcp.json` - VS Code MCP configuration (if using VS Code)
- `mcp.json` - General MCP configuration (for other AI tools)

## Prerequisites

- Cursor AI editor (version 0.48.0 or later for optimal SSE support)
- Internet connection (for hosted MCP servers)

**Note**: No additional packages need to be installed for the hosted MCP servers. The `mcp-remote` package is only needed if you want to add a local MCP server.

## Usage

### For VS Code
1. Install the MCP extension for VS Code
2. The configuration will be automatically loaded from `.vscode/mcp.json`
3. Ensure your Nuxt dev server is running for the local nuxt-mcp server

### For Cursor
1. Cursor should automatically detect the MCP configuration
2. The configuration is loaded from `.cursor/mcp.json`
3. Restart Cursor or reload the window (Cmd/Ctrl + R) for changes to take effect
4. **No additional setup required** - the hosted MCP servers work immediately

### For Other AI Tools
1. Point your AI tool to the `mcp.json` file
2. The hosted MCP servers work immediately without additional setup

## Development

### With Hosted MCP Servers (Current Setup)
No additional setup required! The hosted MCP servers provide immediate access to:
- Nuxt framework documentation
- Nuxt UI component library

### With Local MCP Server (Optional)
If you want AI to understand your specific project structure:

1. Install the nuxt-mcp package:
```bash
pnpm add -D nuxt-mcp
```

2. Add to your `nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  modules: ['nuxt-mcp']
})
```

3. Start your development server:
```bash
pnpm run dev
```

The local MCP server will be available at `http://localhost:3000/__mcp/sse` when the dev server is running.

## Benefits

With the hosted MCP servers, AI models can:
- Access comprehensive Nuxt framework documentation
- Reference Nuxt UI component library with examples and props
- Provide better code suggestions and assistance
- Stay up-to-date with latest Nuxt features automatically

With an optional local MCP server, AI models can additionally:
- Understand your specific Nuxt app structure and components
- Analyze your project's configuration and dependencies
- Provide context-aware suggestions based on your codebase
