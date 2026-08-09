import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const url = "https://mcp.unframer.co/mcp?id=acc9bcc36e3135df6f929ae18acfc6bc7059692f88601e096ff4b6668e361cbb&secret=Di2nSdnOHUbCpFTvddDgQSRPCCk0mdft";

async function main() {
    const transport = new SSEClientTransport(new URL(url));
    const client = new Client({ name: "cli", version: "1.0.0" }, { capabilities: { tools: {} } });
    
    await client.connect(transport);
    
    const tools = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));

    const cmd = process.argv[2];
    if (cmd) {
        const args = JSON.parse(process.argv[3] || "{}");
        const result = await client.callTool({ name: cmd, arguments: args });
        console.log(JSON.stringify(result, null, 2));
    }
    
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
