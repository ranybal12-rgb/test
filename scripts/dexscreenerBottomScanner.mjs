#!/usr/bin/env node

/**
 * Dexscreener "bottomed out" scanner for Solana PumpSwap pairs.
 *
 * Filters:
 * - chainId: solana
 * - dexId containing "pump" (PumpSwap / pumpfun-related pools)
 * - market cap >= 50k (configurable)
 * - pair age >= 7 days (configurable)
 *
 * Notes:
 * - Dexscreener's free pair payload does not expose full daily OHLC history directly,
 *   so this script uses a momentum/volatility heuristic from priceChange windows.
 */

const CONFIG = {
  minMarketCap: Number(process.env.MIN_MARKET_CAP ?? 50_000),
  minAgeDays: Number(process.env.MIN_AGE_DAYS ?? 7),
  profileLimit: Number(process.env.PROFILE_LIMIT ?? 120),
  maxTokensToScan: Number(process.env.MAX_TOKENS_TO_SCAN ?? 80),
  maxResults: Number(process.env.MAX_RESULTS ?? 20),
  timeoutMs: Number(process.env.HTTP_TIMEOUT_MS ?? 15000),
};

async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'accept': 'application/json',
        'user-agent': 'bottom-scanner/1.0',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function scoreBottom(pair) {
  const pc = pair.priceChange ?? {};

  const ch24 = Number(pc.h24 ?? 0);
  const ch7d = Number(pc.h6 ?? 0); // h6 exists more consistently than d7 in this payload
  const ch1h = Number(pc.h1 ?? 0);

  // Heuristic for "bottomed and starting to curl":
  // 1h mild positive, 24h near flat, 6h not explosive.
  let score = 0;
  if (ch1h >= 0 && ch1h <= 6) score += 2;
  if (ch24 >= -8 && ch24 <= 12) score += 3;
  if (ch7d >= -15 && ch7d <= 20) score += 2;

  const v24 = Number(pair.volume?.h24 ?? 0);
  if (v24 > 20_000 && v24 < 2_500_000) score += 1;

  const buys = Number(pair.txns?.h24?.buys ?? 0);
  const sells = Number(pair.txns?.h24?.sells ?? 0);
  if (buys > 0 && sells > 0) {
    const ratio = buys / sells;
    if (ratio >= 0.8 && ratio <= 1.4) score += 1;
  }

  return score;
}

function ageDaysFrom(pairCreatedAt) {
  const t = Number(pairCreatedAt ?? 0);
  if (!t) return 0;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

async function main() {
  console.log('Scanning Dexscreener for Solana PumpSwap pairs...');

  const profiles = await getJson('https://api.dexscreener.com/token-profiles/latest/v1');
  const solProfiles = (profiles || [])
    .filter((p) => p.chainId === 'solana' && typeof p.tokenAddress === 'string')
    .slice(0, CONFIG.profileLimit);

  const tokenSet = [...new Set(solProfiles.map((p) => p.tokenAddress))].slice(0, CONFIG.maxTokensToScan);

  const candidates = [];

  for (const token of tokenSet) {
    try {
      const data = await getJson(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
      const pairs = data?.pairs ?? [];
      for (const pair of pairs) {
        const dexId = String(pair.dexId ?? '').toLowerCase();
        if (pair.chainId !== 'solana') continue;
        if (!dexId.includes('pump')) continue;

        const marketCap = Number(pair.marketCap ?? 0);
        if (marketCap < CONFIG.minMarketCap) continue;

        const ageDays = ageDaysFrom(pair.pairCreatedAt);
        if (ageDays < CONFIG.minAgeDays) continue;

        const score = scoreBottom(pair);
        if (score < 5) continue;

        candidates.push({
          pairAddress: pair.pairAddress,
          token: pair.baseToken?.symbol ?? pair.baseToken?.name ?? token,
          marketCap,
          ageDays,
          dexId: pair.dexId,
          priceUsd: Number(pair.priceUsd ?? 0),
          volume24h: Number(pair.volume?.h24 ?? 0),
          h1: Number(pair.priceChange?.h1 ?? 0),
          h24: Number(pair.priceChange?.h24 ?? 0),
          h6: Number(pair.priceChange?.h6 ?? 0),
          score,
          url: pair.url,
        });
      }
    } catch (err) {
      console.error(`Skipping token ${token}: ${err.message}`);
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.marketCap - a.marketCap);

  const top = candidates.slice(0, CONFIG.maxResults);
  if (top.length === 0) {
    console.log('No matches found with current filters/heuristics.');
    return;
  }

  console.table(
    top.map((c) => ({
      token: c.token,
      dexId: c.dexId,
      marketCap: Math.round(c.marketCap),
      ageDays: c.ageDays.toFixed(1),
      h1: c.h1,
      h24: c.h24,
      h6: c.h6,
      score: c.score,
    }))
  );

  console.log('\nLinks:');
  for (const c of top) {
    console.log(`- ${c.token}: ${c.url || `https://dexscreener.com/solana/${c.pairAddress}`}`);
  }
}

main().catch((err) => {
  console.error('Scanner failed:', err.message);
  process.exit(1);
});
