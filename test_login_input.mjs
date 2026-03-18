import { chromium } from 'playwright';

const browser = await chromium.launch({ 
    executablePath: process.env.CHROME_PATH || '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
});
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 720 });
await page.goto('file:///home/user/sw_runescape/index.html', { timeout: 10000, waitUntil: 'commit' });

const inp = page.locator('#username');

// Test 1: Type a word with repeated letters
await inp.click();
await inp.type('Hello');
const val1 = await inp.inputValue();
console.log(`Test 1 - Type "Hello": got "${val1}" — ${val1 === 'Hello' ? 'PASS' : 'FAIL'}`);

// Test 2: clear and type WASD letters
await inp.fill('');
await inp.type('wasdwasd');
const val2 = await inp.inputValue();
console.log(`Test 2 - Type "wasdwasd": got "${val2}" — ${val2 === 'wasdwasd' ? 'PASS' : 'FAIL'}`);

// Test 3: clear and type "aabbcc"
await inp.fill('');
await inp.type('aabbcc');
const val3 = await inp.inputValue();
console.log(`Test 3 - Type "aabbcc": got "${val3}" — ${val3 === 'aabbcc' ? 'PASS' : 'FAIL'}`);

// Test 4: type via keyboard key presses (simulates real typing more closely)
await inp.fill('');
await page.keyboard.type('Luminara');
const val4 = await inp.inputValue();
console.log(`Test 4 - keyboard.type "Luminara": got "${val4}" — ${val4 === 'Luminara' ? 'PASS' : 'FAIL'}`);

// Test 5: press individual keys including repeats
await inp.fill('');
for (const ch of 'Annabel') {
    await page.keyboard.press(ch);
}
const val5 = await inp.inputValue();
console.log(`Test 5 - press each key of "Annabel": got "${val5}" — ${val5 === 'Annabel' ? 'PASS' : 'FAIL'}`);

await browser.close();
