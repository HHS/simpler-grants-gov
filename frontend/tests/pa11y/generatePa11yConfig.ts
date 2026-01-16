import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import dotenv from "dotenv";

// Load the synced variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const BASE_URL = 'http://localhost:3000';

async function fetchSitemapUrls(url: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const matches = data.match(/<loc>\s*(.*?)\s*<\/loc>/g);
                if (!matches) return resolve([]);
                const cleaned = matches.map(m => {
                    const raw = m.replace(/<\/?loc>/g, '').trim();
                    return raw.replace(/\/\([^)]+\)/g, '');
                });
                resolve(cleaned);
            });
        }).on('error', reject);
    });
}

async function run() {
    const E2E_TOKEN = process.env.E2E_USER_AUTH_TOKEN;
    if (!E2E_TOKEN) {
        console.error("Missing E2E_USER_AUTH_TOKEN. Run sync-pa11y-env.sh first.");
        process.exit(1);
    }

    const sitemapUrls = await fetchSitemapUrls(`${BASE_URL}/sitemap.xml`);
    
    const urlConfigs = sitemapUrls
        .filter(url => !url.includes('[') && !url.includes(']'))
        .map(url => {
            const pathName = new URL(url).pathname;
            const fileName = (pathName.replace(/\//g, '_') || 'home').replace(/^_/, '');
            
            return {
                url: `${url}?_ff=authOn:true`,
                actions: [
                    `navigate to ${BASE_URL}/api/user/local-quick-login?jwt=${E2E_TOKEN}`,
                    "wait for element body to be visible",
                    `navigate to ${url}?_ff=authOn:true`,
                    "wait for element main to be visible",
                    `screen capture screenshots-output/${fileName}.png`
                ]
            };
        });

    const config = {
        defaults: { 
            timeout: 120000,
            useIncognitoBrowserContext: false,
            runners: ["axe"],
            rootElement: "main",
            chromeLaunchConfig: {
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            },
            actions: [
                `navigate to ${BASE_URL}/api/user/local-quick-login?jwt=${E2E_TOKEN}`,
                "wait for element body to be visible"
            ]
        },
        urls: urlConfigs
    };

    fs.writeFileSync("pa11y.config.js", `module.exports = ${JSON.stringify(config, null, 2)};`);
    console.log(`Generated config for ${urlConfigs.length} URLs.`);
}

run().catch(console.error);