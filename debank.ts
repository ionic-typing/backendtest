import crypto from 'crypto';
import type { OptionsOfTextResponseBody } from 'got';

const API_URL = 'https://api.debank.com';

interface BrowserUID {
  random_at: number;
  random_id: string;
  user_addr: null;
}

interface SignatureParams {
  method: string;
  pathname: string;
  query: string;
}

interface SignatureOptions {
  nonce: string;
  ts: number;
}

interface DebankHeaders {
  'x-api-nonce': string;
  'x-api-sign': string;
  'x-api-ts': string;
  'x-api-ver': string;
}

interface ApiOptions {
  query?: Record<string, string | number> | string;
}

interface DebankResponse<T = any> {
  error_code?: string;
  error_msg?: string;
  data: T;
}

type GotScraping = typeof import('got-scraping').gotScraping;

export class Debank {
  private account: BrowserUID;
  private nonce: DebankNonce;
  private signer: DebankSigner;
  private _options: Partial<OptionsOfTextResponseBody>;
  private static gotInstance: GotScraping | null = null;

  constructor(opts: Partial<OptionsOfTextResponseBody> = {}) {
    this.account = makeBrowserUID();
    this.nonce = new DebankNonce();
    this.signer = new DebankSigner();
    this._options = opts;
  }

  make(method: string, pathname: string, query: string): DebankHeaders {
    if (query && query[0] === '?') query = query.slice(1);

    const nonce = this.nonce.next();
    const ts = getTimestamp();
    const signature = this.signer.sign({ method, pathname, query }, { nonce, ts });

    return {
      'x-api-nonce': 'n_' + nonce,
      'x-api-sign': signature,
      'x-api-ts': ts.toString(),
      'x-api-ver': 'v2'
    };
  }

  async api<T = any>(method: string, pathname: string, opts: ApiOptions = {}): Promise<T> {
    if (!Debank.gotInstance) {
      Debank.gotInstance = await importGot();
    }

    let query = opts.query;

    if (query && typeof query === 'object') {
      const searchParams = new URLSearchParams(
        Object.entries(query).map(([k, v]) => [k, String(v)]) as [string, string][]
      );

      // Must be reversed for valid signature
      query = [...searchParams.entries()].reverse().map(encodeParams).join('&');
    }

    method = method.toUpperCase();
    query = (query && query[0] !== '?') ? ('?' + query) : (query || '');

    const headers = this.make(method, pathname, query);

    const response = await Debank.gotInstance(API_URL + pathname + query, {
      http2: false,
      ...this._options,
      method: method as any,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US',
        'accept-encoding': 'gzip, deflate, br',

        'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Linux"',

        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',

        'upgrade-insecure-requests': '1',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',

        source: 'web',
        account: JSON.stringify(this.account),
        ...headers
      }
    });

    const body = JSON.parse(response.body) as DebankResponse<T>;

    if (body.error_code) {
      throw new Error(body.error_code + ': ' + body.error_msg);
    }

    return body.data;
  }

  async get<T = any>(pathname: string, query?: Record<string, string | number> | string): Promise<T> {
    return this.api<T>('GET', pathname, { query });
  }
}

async function importGot(): Promise<GotScraping> {
  return (await import('got-scraping')).gotScraping;
}

function getTimestamp(): number {
  return Math.floor(Date.now() / 1e3);
}

function makeBrowserUID(): BrowserUID {
  return {
    random_at: Math.floor(Date.now() / 1e3),
    random_id: uuidv4().replace(/-/g, ''),
    user_addr: null
  };
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-bxxx-xxxxxxxxxxxx'.replace(/[xb]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);

    return v.toString(16);
  });
}

class DebankNonce {
  private abc: string;
  private local: bigint;

  constructor() {
    this.abc = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    this.local = 0n;
  }

  private pcg32(): number {
    const loadValue = BigInt(this.local);
    const tmp = loadValue * 6364136223846793005n + 1n;

    this.local = BigInt.asIntN(64, tmp);

    return Number(BigInt.asUintN(64, this.local) >> 33n);
  }

  next(): string {
    const result: string[] = [];

    for (let i = 0; i < 40; i++) {
      const index = parseInt((this.pcg32() / 2147483647.0 * 61.0).toString());

      result.push(this.abc[index] || '');
    }

    return result.join('');
  }
}

class DebankSigner {
  sign(a: SignatureParams, b: SignatureOptions): string {
    const data1 = a.method + '\n' + a.pathname + '\n' + a.query;
    const data2 = 'debank-api\nn_' + b.nonce + '\n' + b.ts;

    const hash1 = sha256(data1).toString('hex');
    const hash2 = sha256(data2).toString('hex');
    const xorData = this.xor(hash2);

    const xor1 = xorData[0];
    const xor2 = xorData[1];

    const h1 = sha256(Buffer.from(xor1 + hash1, 'utf-8'));
    const h2 = sha256(Buffer.concat([Buffer.from(xor2, 'utf-8'), h1]));

    return h2.toString('hex');
  }

  private xor(hash: string): [string, string] {
    const rez1: string[] = [];
    const rez2: string[] = [];

    for (let i = 0; i < 64; i++) {
      const char1 = hash[i]!.charCodeAt(0) ^ 54;
      const char2 = hash[i]!.charCodeAt(0) ^ 92;

      rez1.push(String.fromCharCode(char1));
      rez2.push(String.fromCharCode(char2));
    }

    return [rez1.join(''), rez2.join('')];
  }
}

function sha256(data: string | Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

function encodeParams([k, v]: [string, string]): string {
  return encodeURIComponent(k) + '=' + encodeURIComponent(v);
}