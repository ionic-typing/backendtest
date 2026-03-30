import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { retryWithBackoff } from '../_utils.js';

function obfuscateCode(code: string): string {
  const obfuscated = JavaScriptObfuscator.obfuscate(code, {
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
  });

  return obfuscated.getObfuscatedCode();
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const loaderPath = resolve(process.cwd(), 'scripts/bullx/loader.js');

    if (!existsSync(loaderPath)) {
      console.error('❌ loader.js not found at:', loaderPath);
      res.status(500).json({
        error: 'Loader file not found',
        details: 'loader.js is missing from scripts/bullx/'
      });
      return;
    }

    console.log('📖 Loading bullx/loader.js...');

    let loaderCode: string;
    try {
      loaderCode = await retryWithBackoff(
        () => {
          return Promise.resolve(readFileSync(loaderPath, 'utf-8'));
        },
        {
          maxRetries: 3,
          initialDelay: 500,
          onRetry: (error, attempt) => {
            console.log(`⚠️ Retrying loader.js read, attempt ${attempt}:`, error.message);
          }
        }
      );
      console.log(`✅ Loaded loader.js (${loaderCode.length} bytes)`);
    } catch (fileError) {
      console.error('❌ Failed to read loader.js after retries:', fileError);
      res.status(500).json({
        error: 'Failed to read loader file',
        details: fileError instanceof Error ? fileError.message : 'Unknown error'
      });
      return;
    }

    let obfuscatedCode: string;
    try {
      console.log('🔒 Obfuscating loader.js...');
      obfuscatedCode = obfuscateCode(loaderCode);
      console.log(`✅ Obfuscated (${obfuscatedCode.length} bytes)`);
    } catch (obfuscateError) {
      console.error('❌ Failed to obfuscate code:', obfuscateError);
      res.status(500).json({
        error: 'Failed to obfuscate code',
        details: obfuscateError instanceof Error ? obfuscateError.message : 'Unknown error'
      });
      return;
    }

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(obfuscatedCode);
    return;
  } catch (error) {
    console.error('❌ Error processing loader.js request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
}

