import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'docs', 'screenshots')

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto('http://localhost:5173/#/admin', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#admin-password', { timeout: 15000 })
await page.fill('#admin-password', 'admin123')
await page.locator('.admin-login-form button[type=submit]').click()
await page.waitForTimeout(800)
const loggedIn = await page.locator('.admin-topnav').isVisible().catch(() => false)
if (!loggedIn) {
  await page.screenshot({ path: path.join(outDir, 'debug-after-login.png') })
  throw new Error('Login failed — see debug-after-login.png')
}
await page.locator('.admin-topnav-item', { hasText: 'Тактическая доска' }).click()
await page.waitForSelector('.tactical-board')
await page.waitForTimeout(400)

await page.screenshot({
  path: path.join(outDir, 'tactical-board-overview.png'),
  fullPage: true,
})

const manager = page.locator('.tactical-manager-card').nth(2)
const taskPartial = page.locator('.tactical-task-card').nth(0)
const taskNone = page.locator('.tactical-task-card').nth(1)

async function shotDrag(managerLoc, taskLoc, filename) {
  const m = await managerLoc.boundingBox()
  const t = await taskLoc.boundingBox()
  if (!m || !t) return
  await page.mouse.move(m.x + m.width / 2, m.y + m.height / 2)
  await page.mouse.down()
  await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 12 })
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false })
  await page.mouse.move(20, 20)
  await page.mouse.up()
  await page.waitForTimeout(200)
}

await shotDrag(page.locator('.tactical-manager-card').nth(0), taskPartial, 'tactical-drag-match-full.png')
await shotDrag(manager, taskPartial, 'tactical-drag-match-partial.png')
await shotDrag(manager, taskNone, 'tactical-drag-match-none.png')

await browser.close()
console.log('Saved screenshots to', outDir)
