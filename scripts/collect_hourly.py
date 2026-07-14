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
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

ISPARK_API = "https://api.ibb.gov.tr/ispark/Park"
DB_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DB_DIR, "ispark_history.db")

# İstanbul bbox filtresi
LAT_MIN, LAT_MAX = 40.8, 41.3
LNG_MIN, LNG_MAX = 28.5, 29.5
ISTANBUL_TZ = ZoneInfo("Europe/Istanbul")
FETCH_ATTEMPTS = 3
MIN_VALID_PARKS = 200
HISTORY_RETENTION_DAYS = 84


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
        CREATE INDEX IF NOT EXISTS idx_snapshots_ts
        ON snapshots(ts)
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


def fetch_parks(attempts: int = FETCH_ATTEMPTS, base_delay: float = 2.0) -> list:
    """İSPARK API'den tüm otoparkları geçici hatalara dayanıklı biçimde çek."""
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(
                ISPARK_API,
                headers={"User-Agent": "istanbul-parking-heatmap/1.0"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = json.loads(resp.read().decode("utf-8"))

            if not isinstance(payload, list) or not payload:
                raise ValueError("API boş veya beklenmeyen biçimde yanıt verdi")
            return payload
        except (OSError, ValueError) as error:
            last_error = error
            if attempt == attempts:
                break
            delay = base_delay * (2 ** (attempt - 1))
            print(f"  API denemesi {attempt}/{attempts} başarısız: {error}")
            print(f"  {delay:g} saniye sonra tekrar denenecek...")
            time.sleep(delay)

    raise RuntimeError(f"İSPARK API {attempts} denemede alınamadı") from last_error


def _as_int(value) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _normalize_is_open(value) -> int:
    if isinstance(value, str):
        return 1 if value.strip().casefold() in {"1", "true", "open", "açık"} else 0
    return 1 if value else 0


def normalize_parks(parks: list) -> list[dict]:
    """API kayıtlarını doğrula, tekilleştir ve SQLite için normalize et."""
    normalized = []
    seen_park_ids = set()

    for park in parks:
        if not isinstance(park, dict):
            continue

        park_id = _as_int(park.get("parkID"))
        capacity = _as_int(park.get("capacity"))
        empty = _as_int(park.get("emptyCapacity"))

        if park_id is None or park_id <= 0 or park_id in seen_park_ids:
            continue
        if capacity is None or capacity <= 0 or empty is None or not 0 <= empty <= capacity:
            continue

        try:
            lat = float(park.get("lat"))
            lng = float(park.get("lng"))
        except (ValueError, TypeError):
            continue

        if not (LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX):
            continue

        seen_park_ids.add(park_id)
        normalized.append({
            "park_id": park_id,
            "name": str(park.get("parkName") or ""),
            "lat": lat,
            "lng": lng,
            "capacity": capacity,
            "empty": empty,
            "occupancy": (capacity - empty) / capacity,
            "is_open": _normalize_is_open(park.get("isOpen")),
            "work_hours": str(park.get("workHours") or "24 Saat"),
            "park_type": str(park.get("parkType") or ""),
            "district": str(park.get("district") or ""),
        })

    return normalized


def _prune_history(conn: sqlite3.Connection, cutoff_ts: str) -> int:
    """Kayan pencerenin dışında kalan snapshot ve okumaları sil."""
    conn.execute(
        "DELETE FROM readings WHERE snapshot_id IN "
        "(SELECT id FROM snapshots WHERE ts < ?)",
        (cutoff_ts,),
    )
    cursor = conn.execute("DELETE FROM snapshots WHERE ts < ?", (cutoff_ts,))
    return cursor.rowcount


def store_snapshot(
    parks: list[dict],
    now_utc: datetime,
    db_path: str = DB_PATH,
    min_valid_parks: int = MIN_VALID_PARKS,
    retention_days: int = HISTORY_RETENTION_DAYS,
) -> dict:
    """Doğrulanmış bir snapshot'ı atomik olarak SQLite'a yaz."""
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)
    else:
        now_utc = now_utc.astimezone(timezone.utc)

    now_istanbul = now_utc.astimezone(ISTANBUL_TZ)
    ts = now_utc.replace(tzinfo=None).isoformat()
    hour_key = ts[:13]

    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 5000")
        init_db(conn)

        integrity = conn.execute("PRAGMA quick_check").fetchone()[0]
        if integrity != "ok":
            raise RuntimeError(f"SQLite bütünlük kontrolü başarısız: {integrity}")

        existing = conn.execute(
            "SELECT id FROM snapshots WHERE substr(ts, 1, 13) = ? LIMIT 1",
            (hour_key,),
        ).fetchone()
        if existing:
            print(f"  {hour_key}:00 UTC saati zaten kayıtlı; mükerrer snapshot atlandı")
            return {"created": False, "snapshot_id": existing[0], "park_count": 0}

        previous = conn.execute(
            "SELECT park_count FROM snapshots ORDER BY ts DESC LIMIT 1"
        ).fetchone()
        previous_count = previous[0] if previous else 0
        minimum_expected = max(
            min_valid_parks,
            int(previous_count * 0.7) if previous_count else min_valid_parks,
        )
        if len(parks) < minimum_expected:
            raise RuntimeError(
                f"Yalnızca {len(parks)} geçerli otopark geldi; "
                f"beklenen minimum {minimum_expected}"
            )

        with conn:
            cursor = conn.execute(
                "INSERT INTO snapshots (ts, dow, hour, park_count) VALUES (?, ?, ?, ?)",
                (ts, now_istanbul.weekday(), now_istanbul.hour, len(parks)),
            )
            snapshot_id = cursor.lastrowid

            conn.executemany("""
                INSERT INTO parks (
                    park_id, name, lat, lng, district, park_type, work_hours, last_updated
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(park_id) DO UPDATE SET
                    name=excluded.name, lat=excluded.lat, lng=excluded.lng,
                    district=excluded.district, park_type=excluded.park_type,
                    work_hours=excluded.work_hours, last_updated=excluded.last_updated
            """, [
                (
                    park["park_id"], park["name"], park["lat"], park["lng"],
                    park["district"], park["park_type"], park["work_hours"], ts,
                )
                for park in parks
            ])

            conn.executemany(
                "INSERT INTO readings "
                "(snapshot_id, park_id, capacity, empty, occupancy, is_open) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                [
                    (
                        snapshot_id, park["park_id"], park["capacity"], park["empty"],
                        park["occupancy"], park["is_open"],
                    )
                    for park in parks
                ],
            )

            cutoff = now_utc - timedelta(days=retention_days)
            pruned = _prune_history(conn, cutoff.replace(tzinfo=None).isoformat())

        total_snapshots = conn.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
        total_readings = conn.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
        unique_parks = conn.execute("SELECT COUNT(*) FROM parks").fetchone()[0]
        first_ts = conn.execute("SELECT MIN(ts) FROM snapshots").fetchone()[0]

        print(f"  {len(parks)} geçerli otopark kaydedildi (snapshot #{snapshot_id})")
        if pruned:
            print(f"  12 haftalık pencere dışında kalan {pruned} snapshot temizlendi")
        print(f"  Veritabanı: {db_path}")
        print(
            f"\n  Toplam: {total_snapshots} snapshot, {total_readings} reading, "
            f"{unique_parks} otopark"
        )
        print(f"  İlk veri: {first_ts}")
        days = (
            now_utc.replace(tzinfo=None) - datetime.fromisoformat(first_ts)
        ).days if first_ts else 0
        print(f"  Kapsam: {days} gün")

        return {
            "created": True,
            "snapshot_id": snapshot_id,
            "park_count": len(parks),
            "pruned": pruned,
        }
    finally:
        conn.close()


def collect():
    """Bir snapshot çek ve veritabanına kaydet."""
    now_utc = datetime.now(timezone.utc)
    ts = now_utc.replace(tzinfo=None).isoformat()

    print(f"[{ts}] İSPARK verisi toplanıyor...")

    raw_parks = fetch_parks()
    parks = normalize_parks(raw_parks)
    print(f"  API'den {len(raw_parks)} kayıt alındı, {len(parks)} tanesi geçerli")
    store_snapshot(parks, now_utc)


if __name__ == "__main__":
    collect()
