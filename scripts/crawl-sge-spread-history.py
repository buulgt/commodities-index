#!/usr/bin/env python3
import json
import csv
import sys
import urllib.request
import urllib.parse
from datetime import datetime, timezone

TROY_OZ_TO_GRAMS = 31.1034768
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def fetch_json(url, data=None):
    req = urllib.request.Request(url, data=data, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as res:
        return json.loads(res.read().decode("utf-8"))

def get_sge_history():
    print("Fetching SGE benchmark history...")
    url = "https://en.sge.com.cn/graph/DayilyJzj"
    headers = {
        **HEADERS,
        "Referer": "https://en.sge.com.cn/data_BenchmarkPrice",
    }
    req = urllib.request.Request(url, data=b"", headers=headers)
    with urllib.request.urlopen(req, timeout=15) as res:
        raw = json.loads(res.read().decode("utf-8"))

    # Prefer afternoon fix wp, fallback to morning fix zp
    wp_map = {}
    for ts_ms, val in raw.get("wp", []):
        if val is not None and val > 0:
            dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
            wp_map[dt] = float(val)

    zp_map = {}
    for ts_ms, val in raw.get("zp", []):
        if val is not None and val > 0:
            dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
            zp_map[dt] = float(val)

    all_dates = sorted(set(wp_map.keys()) | set(zp_map.keys()))
    sge_data = {}
    for d in all_dates:
        # Use afternoon price, fallback to morning price
        sge_data[d] = wp_map.get(d) or zp_map.get(d)
    print(f"SGE: retrieved {len(sge_data)} daily records ({all_dates[0]} to {all_dates[-1]})")
    return sge_data

def get_yahoo_series(symbol):
    print(f"Fetching Yahoo {symbol} 10y history...")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=10y"
    raw = fetch_json(url)
    res0 = raw["chart"]["result"][0]
    timestamps = res0.get("timestamp", [])
    closes = res0["indicators"]["quote"][0].get("close", [])

    series = {}
    last_val = None
    for ts, close in zip(timestamps, closes):
        if close is not None:
            last_val = float(close)
        if last_val is not None:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
            series[dt] = last_val
    print(f"Yahoo {symbol}: retrieved {len(series)} points")
    return series

def build_aligned_spread_dataset():
    sge = get_sge_history()
    gold_world = get_yahoo_series("GC=F")
    usd_cny = get_yahoo_series("CNY=X")

    # Sorted list of SGE trading dates
    sge_dates = sorted(sge.keys())
    
    # Forward-fill tracker for FX and World Gold to handle holiday mismatches
    last_fx = 7.0
    last_world = None

    # Track sorted date lists for lookback fallback
    all_fx_dates = sorted(usd_cny.keys())
    all_gold_dates = sorted(gold_world.keys())

    dataset = []

    for d in sge_dates:
        sge_price_cny = sge[d]
        if not sge_price_cny or sge_price_cny <= 0:
            continue

        # Look up or forward-fill FX
        if d in usd_cny:
            last_fx = usd_cny[d]
        elif d < all_fx_dates[0]:
            last_fx = usd_cny[all_fx_dates[0]]

        # Look up or forward-fill World Gold
        if d in gold_world:
            last_world = gold_world[d]
        elif last_world is None:
            # find closest previous or next
            candidates = [gold_world[cd] for cd in all_gold_dates if cd <= d]
            if candidates:
                last_world = candidates[-1]
            elif all_gold_dates:
                last_world = gold_world[all_gold_dates[0]]

        if last_world is None or last_world <= 0 or last_fx <= 0:
            continue

        # Normalization calculation
        sge_usd_per_oz = (sge_price_cny / last_fx) * TROY_OZ_TO_GRAMS
        spread_usd = sge_usd_per_oz - last_world
        premium_pct = (spread_usd / last_world) * 100

        dataset.append({
            "date": d,
            "sge_cny_per_g": round(sge_price_cny, 2),
            "usd_cny": round(last_fx, 4),
            "sge_usd_per_oz": round(sge_usd_per_oz, 2),
            "world_gold_usd": round(last_world, 2),
            "spread_usd": round(spread_usd, 2),
            "premium_percent": round(premium_pct, 2)
        })

    return dataset

def main():
    dataset = build_aligned_spread_dataset()
    print(f"Aligned dataset: {len(dataset)} trading days.")
    if not dataset:
        print("Error: empty dataset", file=sys.stderr)
        sys.exit(1)

    # Save JSON
    json_path = "public/sge-spread-history.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "count": len(dataset),
            "startDate": dataset[0]["date"],
            "endDate": dataset[-1]["date"],
            "data": dataset
        }, f, indent=2)
    print(f"Saved JSON to {json_path}")

    # Save CSV
    csv_path = "public/sge-spread-history.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date",
            "sge_cny_per_g",
            "usd_cny",
            "sge_usd_per_oz",
            "world_gold_usd",
            "spread_usd",
            "premium_percent"
        ])
        writer.writeheader()
        writer.writerows(dataset)
    print(f"Saved CSV to {csv_path}")

    # Print summary statistics
    spreads = [r["spread_usd"] for r in dataset]
    pcts = [r["premium_percent"] for r in dataset]
    print(f"Min Spread: ${min(spreads):.2f}/oz ({min(pcts):.2f}%)")
    print(f"Max Spread: ${max(spreads):.2f}/oz ({max(pcts):.2f}%)")
    print(f"Average Spread: ${sum(spreads)/len(spreads):.2f}/oz ({sum(pcts)/len(pcts):.2f}%)")
    print(f"Latest ({dataset[-1]['date']}): SGE ¥{dataset[-1]['sge_cny_per_g']}/g | World ${dataset[-1]['world_gold_usd']}/oz | Spread: ${dataset[-1]['spread_usd']}/oz ({dataset[-1]['premium_percent']}%)")

if __name__ == "__main__":
    main()
