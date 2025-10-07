// wagmi.config.ts

import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';
import * as fs from 'fs';
import * as path from 'path';

// ✅✅✅ ۱. تعریف مسیر صحیح به پوشه خروجی abi-exporter ✅✅✅
const abisDir = path.resolve(__dirname, './temp_abis');

/**
 * Reads all .json files from the abi-exporter output directory.
 * @returns {Array<{name: string, abi: any}>} An array of contract configurations.
 */
function readAllAbisFromExporter(): { name: string; abi: any }[] {
  try {
    // خواندن نام تمام فایل‌های JSON از پوشه temp_abis
    const files = fs.readdirSync(abisDir);
    
    return files
      .filter(file => file.endsWith('.json')) // فقط فایل‌های JSON را در نظر بگیر
      .map(file => {
        const name = path.basename(file, '.json');
        const abiPath = path.join(abisDir, file);
        const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
        // نام قرارداد باید با حروف بزرگ شروع شود (PascalCase) که abi-exporter تولید می‌کند
        return { name, abi };
      });
  } catch (e) {
    // اگر پوشه temp_abis وجود نداشته باشد (مثلاً قبل از اولین کامپایل)
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`
⚠️  'temp_abis' directory not found. This is normal on the first run.
    Please run 'npm run compile' to generate ABIs first.`);
      return []; // بازگشت آرایه خالی تا build اولیه شکست نخورد
    }
    console.error("❌ Error reading ABIs from 'temp_abis' directory:", e);
    return [];
  }
}

// ۲. تمام ABI ها را از پوشه موقت می‌خوانیم
const allContractsFromExporter = readAllAbisFromExporter();
if (allContractsFromExporter.length > 0) {
    console.log(' wagmi.config: Found ABIs for:', allContractsFromExporter.map(c => c.name));
}

export default defineConfig({
  out: 'src/lib/blockchain/generated.ts',
  // ۳. لیست قراردادها را به صورت داینامیک برای wagmi می‌سازیم
  contracts: allContractsFromExporter,
  plugins: [
    react(),
  ],
});