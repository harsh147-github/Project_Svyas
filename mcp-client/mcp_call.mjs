import fs from 'fs';

const url = "https://mcp.unframer.co/mcp?id=acc9bcc36e3135df6f929ae18acfc6bc7059692f88601e096ff4b6668e361cbb&secret=Di2nSdnOHUbCpFTvddDgQSRPCCk0mdft";

async function main() {
    const payloadFile = process.argv[2];
    const req = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(req)
    });

    const text = await response.text();
    fs.writeFileSync('mcp_out.json', text);
    console.log(`Saved output to mcp_out.json. Status: ${response.status}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
