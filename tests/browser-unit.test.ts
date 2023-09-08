import * as puppeteer from 'puppeteer';
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import * as child_process from "node:child_process";
import * as mime from "mime-types";
import * as util from "util";

test('Browser Unit Tests', async () => {
    child_process.spawnSync('npm', ['run', 'build:dev'], { stdio: 'inherit' });

    const PORT = 3000;
    const ROOT_PATH = path.join(process.cwd(), "./dist");

    const server = http.createServer(async (req, res) => {
        const filePath = path.join(ROOT_PATH, req.url!);
        const contentType = mime.lookup(filePath) || "text/html";

        if (fs.existsSync(filePath)) {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(fs.readFileSync(filePath));
        } else {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end("<h1>404 Not Found</h1>");
        }
    })
    
    await util.promisify(server.listen).bind(server)(PORT);

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}/browser-unit.html`);

    let failures = (await page.evaluate("window.__result__") as number);
    if (failures > 0) {
        throw new Error(`${failures} browser unit test(s) failed!`);
    }

    await browser.close();
    server.close();
}, 30 * 1000);