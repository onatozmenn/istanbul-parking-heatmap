#!/usr/bin/env python3
"""
Saatlik İSPARK Veri Toplayıcı

İBB İSPARK API'sinden anlık doluluk verisi çekip SQLite veritabanına kaydeder.
Her çalıştırmada tüm otoparkların o anki doluluk oranını bir satır olarak ekler.

Kullanım:
    python scripts/collect_hourly.py

Cron ile saatte bir çalıştırılmalıdır:
    0 * * * * cd /path/to/project && python scripts/collect_hourly.py

Veritabanı: data/ispark_history.db
"""

import json
import os
import sqlite3
import urllib.request
from datetime import datetime

ISPARK_API = "https://api.ibb.gov.tr/ispark/Park"
DB_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DB_DIR, "ispark_history.db")

# İstanbul bbox filtresi
LAT_MIN, LAT_MAX = 40.8, 41.3
LNG_MIN, LNG_MAX = 28.5, 29.5


def init_db(conn: sqlite3.Connection):
    """Veritabanı tablolarını oluştur."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,          -- ISO 8601 timestamp
            dow INTEGER NOT NULL,      -- day of week: 0=Mon..6=Sun
            hour INTEGER NOT NULL,     -- 0-23
            park_count INTEGER NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            snapshot_id INTEGER NOT NULL,
            park_id INTEGER NOT NULL,
            capacity INTEGER NOT NULL,
            empty INTEGER NOT NULL,
            occupancy REAL NOT NULL,    -- 0.0 - 1.0
            is_open INTEGER NOT NULL,   -- 0 or 1
            FOREIGN KEY (snapshot_id) REFERENCES snapshots(id)
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_readings_park
        ON readings(park_id, snapshot_id)
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS parks (
            park_id INTEGER PRIMARY KEY,
            name TEXT,
            lat REAL,
            lng REAL,
            district TEXT,
            park_type TEXT,
            work_hours TEXT,
            last_updated TEXT
        )
    """)
    conn.commit()


def fetch_parks() -> list:
    """İSPARK API'den tüm otoparkları çek."""
    req = urllib.request.Request(ISPARK_API, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def collect():
    """Bir snapshot çek ve veritabanına kaydet."""
    now = datetime.now()
    # ISO weekday: Monday=0 .. Sunday=6
    dow = now.weekday()
    hour = now.hour
    ts = now.isoformat()

    print(f"[{ts}] İSPARK verisi toplanıyor...")

    parks = fetch_parks()
    print(f"  API'den {len(parks)} otopark alındı")

    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    # Snapshot kaydı
    cursor = conn.execute(
        "INSERT INTO snapshots (ts, dow, hour, park_count) VALUES (?, ?, ?, ?)",
        (ts, dow, hour, 0),
    )
    snapshot_id = cursor.lastrowid

    valid_count = 0
    readings = []

    for park in parks:
        pid = park.get("parkID", 0)
        name = park.get("parkName", "")
        lat_s = park.get("lat", "0")
        lng_s = park.get("lng", "0")
        capacity = park.get("capacity", 0) or 0
        empty = park.get("emptyCapacity", 0) or 0
        work_hours = park.get("workHours", "24 Saat") or "24 Saat"
        park_type = park.get("parkType", "") or ""
        district = park.get("district", "") or ""
        is_open = park.get("isOpen", 0) or 0

        try:
            lat = float(lat_s)
            lng = float(lng_s)
        except (ValueError, TypeError):
            continue

        # Bbox filtre
        if lat < LAT_MIN or lat > LAT_MAX or lng < LNG_MIN or lng > LNG_MAX:
            continue
        if capacity <= 0:
            continue

        occ = max(0.0, min(1.0, (capacity - empty) / capacity))

        readings.append((snapshot_id, pid, capacity, empty, occ, is_open))
        valid_count += 1

        # Park meta verisini upsert
        conn.execute("""
            INSERT INTO parks (park_id, name, lat, lng, district, park_type, work_hours, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(park_id) DO UPDATE SET
                name=excluded.name, lat=excluded.lat, lng=excluded.lng,
                district=excluded.district, park_type=excluded.park_type,
                work_hours=excluded.work_hours, last_updated=excluded.last_updated
        """, (pid, name, lat, lng, district, park_type, work_hours, ts))

    # Toplu reading ekle
    conn.executemany(
        "INSERT INTO readings (snapshot_id, park_id, capacity, empty, occupancy, is_open) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        readings,
    )

    # Snapshot park sayısını güncelle
    conn.execute(
        "UPDATE snapshots SET park_count = ? WHERE id = ?",
        (valid_count, snapshot_id),
    )

    conn.commit()
    conn.close()

    print(f"  {valid_count} geçerli otopark kaydedildi (snapshot #{snapshot_id})")
    print(f"  Veritabanı: {DB_PATH}")

    # İstatistik
    conn2 = sqlite3.connect(DB_PATH)
    total_snapshots = conn2.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
    total_readings = conn2.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
    unique_parks = conn2.execute("SELECT COUNT(*) FROM parks").fetchone()[0]
    first_ts = conn2.execute("SELECT MIN(ts) FROM snapshots").fetchone()[0]
    conn2.close()

    print(f"\n  Toplam: {total_snapshots} snapshot, {total_readings} reading, {unique_parks} otopark")
    print(f"  İlk veri: {first_ts}")
    days = (now - datetime.fromisoformat(first_ts)).days if first_ts else 0
    print(f"  Kapsam: {days} gün")


if __name__ == "__main__":
    collect()
