# Webflow MCP Setup Guide

The Webflow MCP server allows the AI to manage your Webflow projects, styles, and components directly.

## Prerequisites
1.  **Node.js**: Version 18.0.0 or higher.
2.  **Webflow Account**: Active site in a Webflow workspace.

## Configuration

### Claude Code (CLI)
Run the following command:
```bash
claude mcp add --transport http webflow https://mcp.webflow.com/mcp
```

### Claude Desktop
Add this entry to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "webflow": {
      "command": "npx",
      "args": ["-y", "@webflow/mcp-server"]
    }
  }
}
```

### Cursor / VSCode
1.  **Type**: `command` (if using npx) or `HTTP` (if using the remote URL).
2.  **Command**: `npx -y @webflow/mcp-server`
3.  **Remote URL**: `https://mcp.webflow.com/mcp`

## Authorization
When you first connect, a browser window will open.
1.  Log in to Webflow.
2.  Select the workspaces/sites you want the AI to access.
3.  Click **Grant Access**.
