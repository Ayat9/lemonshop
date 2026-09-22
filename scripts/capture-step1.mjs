import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'screenshots')

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

await page.goto('http://localhost:5173/#/login', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.login-card')
await page.screenshot({ path: path.join(outDir, 'step1-login.png'), fullPage: true })

await page.fill('input[type=email]', 'ceo@lemonshop.kz')
await page.fill('input[type=password]', 'admin123')
await page.locator('.login-form button[type=submit]').click()
await page.waitForSelector('.dashboard')
await page.waitForTimeout(400)
await page.screenshot({ path: path.join(outDir, 'step1-dashboard.png'), fullPage: true })

await browser.close()
console.log('Saved step1 screenshots to', outDir)
