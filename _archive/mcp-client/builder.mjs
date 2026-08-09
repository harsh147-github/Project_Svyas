import fs from 'fs';

const url = "https://mcp.unframer.co/mcp?id=acc9bcc36e3135df6f929ae18acfc6bc7059692f88601e096ff4b6668e361cbb&secret=Di2nSdnOHUbCpFTvddDgQSRPCCk0mdft";

async function callMcp(method, params) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: method, arguments: params }
        })
    });
    const text = await response.text();
    const json = JSON.parse(text);
    if (json.error) {
        throw new Error(JSON.stringify(json.error));
    }
    const resultText = json.result.content[0].text;
    try {
        return JSON.parse(resultText);
    } catch {
        return resultText; // if it's plain string like diff
    }
}

async function fix2() {
    console.log("FIX 2: PremiumHero padding");
    const code = await callMcp("readCodeFile", { codeFileId: "t3pKJ8U" });
    let content = code.content;
    
    // add paddingTop: '120px'
    // We'll just replace the main padding. Let's find the main container.
    // I am going to save to disk so we can see it and modify it precisely.
    fs.writeFileSync("t3pKJ8U.tsx", content);
    console.log("Saved t3pKJ8U.tsx");
}

async function fetchAnimationFiles() {
    const ids = ["Nnzhq57", "nxmUWxv", "bk_lBrP", "s3LJnE5", "E6eGvWs", "rYpx04C", "PHgdOn3", "t3pKJ8U"];
    for (const codeFileId of ids) {
        try {
            const result = await callMcp("readCodeFile", { codeFileId });
            fs.writeFileSync(`${codeFileId}.tsx`, result.content);
            console.log(`Saved ${codeFileId}.tsx`);
        } catch (e) {
            console.error(`Failed ${codeFileId}`, e.message);
        }
    }
}

async function main() {
    await fetchAnimationFiles();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
