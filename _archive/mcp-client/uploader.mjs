import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const endpoint = "https://mcp.unframer.co/mcp?id=acc9bcc36e3135df6f929ae18acfc6bc7059692f88601e096ff4b6668e361cbb&secret=Di2nSdnOHUbCpFTvddDgQSRPCCk0mdft";

async function callMcp(method, params = {}) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params
        })
    });
    return response.json();
}

async function main() {
    console.log("Uploading files to Framer...");
    
    // the files we explicitly touched:
    const filesToUpload = [
        "Nnzhq57.tsx", 
        "nxmUWxv.tsx", 
        "bk_lBrP.tsx", 
        "s3LJnE5.tsx", 
        "E6eGvWs.tsx", 
        "rYpx04C.tsx",
        "t3pKJ8U.tsx",
        "PHgdOn3.tsx"
    ];

    for (const file of filesToUpload) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const fileId = file.replace('.tsx', '');
            
            console.log(`Uploading ${fileId}...`);
            const res = await callMcp("tools/call", {
                name: "updateCodeFile",
                arguments: {
                    codeFileId: fileId,
                    content: content
                }
            });
            console.log(`Response for ${fileId}:`, JSON.stringify(res).substring(0, 150) + "...");
        } else {
            console.log(`File ${file} does not exist locally.`);
        }
    }
    
    console.log("Done uploading.");
}

main().catch(console.error);
