import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLATFORMS = ['hyperliquid', 'bullx', 'padre', 'axiom', 'gmgn'];

const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  identifierNamesGenerator: "hexadecimal",
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ["base64"],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: "function",
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

console.log('🔧 Building obfuscated core.js for all platforms...\n');
const totalStartTime = Date.now();

let successCount = 0;
let failCount = 0;

for (const platform of PLATFORMS) {
  const startTime = Date.now();
  
  try {
    const inputPath = resolve(__dirname, platform, 'core.js');
    const outputPath = resolve(__dirname, platform, 'core.obfuscated.js');

    // Check if source file exists
    if (!existsSync(inputPath)) {
      console.log(`⏭️  Skipping ${platform}: core.js not found`);
      continue;
    }

    console.log(`📦 Processing ${platform}...`);
    
    // Read source file
    const coreCode = readFileSync(inputPath, 'utf-8');
    console.log(`   📖 Read core.js (${coreCode.length} characters)`);

    // Obfuscate
    console.log(`   🔄 Obfuscating...`);
    const obfuscated = JavaScriptObfuscator.obfuscate(coreCode, obfuscatorOptions);
    const obfuscatedCode = obfuscated.getObfuscatedCode();

    // Save obfuscated file
    writeFileSync(outputPath, obfuscatedCode, 'utf-8');

    const duration = Date.now() - startTime;
    const sizeRatio = (obfuscatedCode.length / coreCode.length * 100).toFixed(1);
    
    console.log(`   ✅ Complete! (${duration}ms)`);
    console.log(`   📦 Output: ${obfuscatedCode.length} characters (${sizeRatio}% of original)`);
    console.log('');
    
    successCount++;
  } catch (error) {
    console.error(`   ❌ Failed to build ${platform}:`, error.message);
    console.log('');
    failCount++;
  }
}

const totalDuration = Date.now() - totalStartTime;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 Build complete! (${totalDuration}ms)`);
console.log(`   ✅ Success: ${successCount} platform(s)`);
if (failCount > 0) {
  console.log(`   ❌ Failed: ${failCount} platform(s)`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (failCount > 0) {
  process.exit(1);
}

