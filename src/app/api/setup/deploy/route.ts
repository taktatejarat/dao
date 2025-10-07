// src/app/api/deploy/route.ts

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Readable } from 'stream';

// Function to update .env.local file
async function updateEnvFile(updates: { key: string, value: string }[]): Promise<void> {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';
    try {
        envContent = await fs.readFile(envPath, 'utf-8');
    } catch (e) { /* .env.local might not exist, that's okay. */ }

    let lines = envContent.split('\n');
    
    updates.forEach(({ key, value }) => {
        const keyPattern = new RegExp(`^${key}=`);
        const keyIndex = lines.findIndex(line => keyPattern.test(line));

        if (keyIndex !== -1) {
            lines[keyIndex] = `${key}=${value}`;
        } else {
            lines.push(`${key}=${value}`);
        }
    });

    await fs.writeFile(envPath, lines.join('\n'));
}


export async function POST() {
    const stream = new ReadableStream({
        start(controller) {
            const network = process.env.NEXT_PUBLIC_NETWORK || 'amoy';
            const deployProcess = exec(`npx hardhat run scripts/deploy.ts --network ${network}`, {
                cwd: process.cwd(),
                env: { ...process.env },
            });
            
            let fullLogs = '';
            const encoder = new TextEncoder();

            const sendEvent = (type: string, data: any) => {
                const eventString = `data: ${JSON.stringify({ type, data })}\n\n`;
                controller.enqueue(encoder.encode(eventString));
            };

            deployProcess.stdout?.on('data', (data: Buffer | string) => {
                const chunk = data.toString();
                fullLogs += chunk;
                sendEvent('log', chunk);
            });

            // لاگ‌های پیشرفت (از stderr) که نباید به عنوان خطای نهایی نمایش داده شوند
            deployProcess.stderr?.on('data', (data: Buffer | string) => {
                const chunk = data.toString();
                fullLogs += chunk;
                // ما این‌ها را به عنوان 'progress' ارسال می‌کنیم، نه 'error'
                sendEvent('progress', chunk);
            });

            deployProcess.on('close', async (code) => {
                if (code === 0) {
                    const match = fullLogs.match(/--- DEPLOYMENT_SUMMARY_START ---\s*(\{[\s\S]*?\})\s*--- DEPLOYMENT_SUMMARY_END ---/);
                    const summaryJson = match ? match[1] : null;

                    if (summaryJson) {
                        try {
                            const addresses = JSON.parse(summaryJson);
                            // Persist registry address for client bootstrapping
                            if (addresses.registryAddress) {
                                await updateEnvFile([
                                    { key: 'NEXT_PUBLIC_REGISTRY_ADDRESS', value: addresses.registryAddress },
                                ]);
                            }
                            // Optionally, we could persist deployed addresses under separate keys if needed.
                            // ارسال یک رویداد 'success' نهایی با تمام داده‌ها
                            sendEvent('success', { message: 'Deployment successful!', addresses });
                        } catch(e) {
                             sendEvent('error', `Failed to save contract addresses: ${(e as Error).message}`);
                        }
                    } else {
                        sendEvent('error', 'Deployment script finished, but couldn\'t find the summary in the output.');
                    }
                } else {
                    // یک خطای واقعی رخ داده است
                    sendEvent('error', `Deployment process exited with code ${code}. Check logs for details.`);
                }
                controller.close();
            });
        }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
}