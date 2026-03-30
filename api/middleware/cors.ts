import { VercelResponse } from '@vercel/node';

export function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export function handleCorsPreFlight(res: VercelResponse): void {
  applyCors(res);
  res.status(200).end();
}
