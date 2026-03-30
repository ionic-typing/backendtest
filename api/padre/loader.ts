import type { FastifyRequest, FastifyReply } from 'fastify';
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

export default async function handler(req: FastifyRequest, reply: FastifyReply) {
  if (req.method !== 'GET') {
    return reply.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const loaderPath = resolve(process.cwd(), 'scripts/padre/loader.js');
    
    if (!existsSync(loaderPath)) {
      console.error('❌ loader.js not found at:', loaderPath);
      return reply.status(500).send({
        error: 'Loader file not found',
        details: 'loader.js is missing from scripts/padre/'
      });
    }

    console.log('📖 Loading padre/loader.js...');
    
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
      return reply.status(500).send({
        error: 'Failed to read loader file',
        details: fileError instanceof Error ? fileError.message : 'Unknown error'
      });
    }

    let obfuscatedCode: string;
    try {
      console.log('🔒 Obfuscating loader.js...');
      obfuscatedCode = obfuscateCode(loaderCode);
      console.log(`✅ Obfuscated (${obfuscatedCode.length} bytes)`);
    } catch (obfuscateError) {
      console.error('❌ Failed to obfuscate code:', obfuscateError);
      return reply.status(500).send({
        error: 'Failed to obfuscate code',
        details: obfuscateError instanceof Error ? obfuscateError.message : 'Unknown error'
      });
    }

    return reply
      .header('Content-Type', 'application/javascript; charset=utf-8')
      .header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
      .header('Pragma', 'no-cache')
      .header('Expires', '0')
      .header('Surrogate-Control', 'no-store')
      .header('X-Content-Type-Options', 'nosniff')
      .status(200)
      .send(obfuscatedCode);
  } catch (error) {
    console.error('❌ Error processing loader.js request:', error);
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

