# Stitch MCP Setup Guide

Stitch is a Remote MCP server that enables AI-driven UI generation and design ideation.

## Prerequisites

1. **Stitch API Key**: Generate one from [Stitch Settings](https://stitch.withgoogle.com/settings).
2. **API Client**: You can use Stitch with Cursor, VSCode, Claude Code, or Claude Desktop.


## Configuration

### Cursor / VSCode (Search for "MCP" in settings)

1. **Type**: `HTTP`
2. **URL**: `https://stitch.googleapis.com/mcp`
3. **Headers**:
   - `X-Goog-Api-Key`: `YOUR_API_KEY`


### Claude Code (CLI)

Run the following command:

```bash
claude mcp add stitch --transport http https://stitch.googleapis.com/mcp
```


### Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "server"],
      "env": {
        "STITCH_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```
```

> [!CAUTION]
> Never commit your API key to code repositories. Use environment variables or local config files.
