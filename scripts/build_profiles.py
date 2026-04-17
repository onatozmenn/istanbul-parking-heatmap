#!/usr/bin/env python3
"""
Gerçek Haftalık Profil Oluşturucu

SQLite veritabanındaki toplanan saatlik verilerden gerçek haftalık doluluk
profilleri hesaplar ve parking_week.json çıktısı üretir.

Kullanım:
    python scripts/build_profiles.py [--min-days 7]

--min-days: Minimum kaç günlük veri gerektiğini belirtir (varsayılan: 7)

Algoritma:
  1. Her otopark için, her (dow, hour) çifti için tüm reading'lerin ortalamasını al
  2. Eksik slotları (veri olmayan saatler) komşu saatlerden interpolasyonla doldur
  3. Enforcement takvimini is_open + work_hours'dan belirle
  4. parking_week.json formatında yaz
"""

import json
import math
import os
import random
import sqlite3
import sys
from datetime import datetime

random.seed(42)

DB_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_PATH = os.path.join(DB_DIR, "ispark_history.db")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")


def check_db():
    """Veritabanı ve yeterli veri var mı kontrol et."""
    if not os.path.exists(DB_PATH):
        print(f"HATA: Veritabanı bulunamadı: {DB_PATH}")
        print("Önce 'python scripts/collect_hourly.py' ile veri toplamaya başlayın.")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    total = conn.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
    if total == 0:
        print("HATA: Veritabanında hiç snapshot yok.")
        conn.close()
        sys.exit(1)

    first = conn.execute("SELECT MIN(ts) FROM snapshots").fetchone()[0]
    last = conn.execute("SELECT MAX(ts) FROM snapshots").fetchone()[0]
    parks = conn.execute("SELECT COUNT(*) FROM parks").fetchone()[0]
    conn.close()

    days = (datetime.fromisoformat(last) - datetime.fromisoformat(first)).days
    print(f"Veritabanı: {total} snapshot, {parks} otopark, {days} gün kapsam")
    print(f"  İlk: {first}")
    print(f"  Son: {last}")
    return days


def compute_profiles(min_days: int):
    """Tüm otoparklar için 168 slotluk gerçek ortalama profiller hesapla."""
    conn = sqlite3.connect(DB_PATH)

    # Tüm park bilgilerini al
    parks_meta = {}
    for row in conn.execute("SELECT park_id, name, lat, lng, district, park_type, work_hours FROM parks"):
        parks_meta[row[0]] = {
            "park_id": row[0],
            "name": row[1],
            "lat": row[2],
            "lng": row[3],
            "district": row[4],
            "park_type": row[5],
            "work_hours": row[6],
        }

    print(f"\n{len(parks_meta)} otopark için profil hesaplanıyor...")

    # Her park için (dow, hour) bazında ortalama doluluk
    # Query: readings JOIN snapshots → group by park_id, dow, hour
    query = """
        SELECT r.park_id, s.dow, s.hour,
               AVG(r.occupancy) as avg_occ,
               COUNT(*) as sample_count,
               AVG(r.is_open) as open_ratio
        FROM readings r
        JOIN snapshots s ON r.snapshot_id = s.id
        GROUP BY r.park_id, s.dow, s.hour
        ORDER BY r.park_id, s.dow, s.hour
    """

    # park_id -> {(dow, hour) -> (avg_occ, sample_count, open_ratio)}
    profiles = {}
    for row in conn.execute(query):
        pid, dow, hour, avg_occ, count, open_ratio = row
        if pid not in profiles:
            profiles[pid] = {}
        profiles[pid][(dow, hour)] = {
            "occ": avg_occ,
            "count": count,
            "open_ratio": open_ratio,
        }

    conn.close()

    print(f"  {len(profiles)} otopark için veri var")

    # Her park için 168-slot dizisi oluştur
    blocks = []
    skipped = 0

    for pid, meta in parks_meta.items():
        profile_data = profiles.get(pid, {})

        # En az 1 slot verisi olan otoparkları al (ideal: 24+)
        if len(profile_data) < 1:
            skipped += 1
            continue

        slots = []
        enforced = []

        for dow in range(7):
            for hour in range(24):
                key = (dow, hour)
                if key in profile_data:
                    entry = profile_data[key]
                    occ = max(0.0, min(1.0, entry["occ"]))
                    is_enforced = 1 if entry["open_ratio"] > 0.5 else 0
                else:
                    # Eksik veri: komşu saatlerden interpolasyon
                    occ = interpolate_missing(profile_data, dow, hour)
                    is_enforced = interpolate_enforcement(profile_data, dow, hour)

                slots.append(round(occ, 4))
                enforced.append(is_enforced)

        # Kapasite bazında meter sayısı
        capacity = 0
        # Son kapasiteyi readings'ten al
        conn2 = sqlite3.connect(DB_PATH)
        cap_row = conn2.execute(
            "SELECT capacity FROM readings WHERE park_id = ? ORDER BY snapshot_id DESC LIMIT 1",
            (pid,),
        ).fetchone()
        conn2.close()
        if cap_row:
            capacity = cap_row[0]
        meters = min(capacity, 50)

        # Path ve meter pozisyonları üret (bunlar hala geometrik)
        path = generate_path(meta["lat"], meta["lng"])
        meter_pos = generate_meter_positions(meta["lat"], meta["lng"], meters)

        block = {
            "id": f"ISPARK-{pid}",
            "lat": meta["lat"],
            "lng": meta["lng"],
            "meters": meters,
            "street": meta["name"],
            "hood": (meta["district"] or "").title(),
            "slots": slots,
            "enforced": enforced,
            "supply": capacity,
            "path": path,
            "meterPositions": meter_pos,
        }
        blocks.append(block)

    print(f"  {len(blocks)} otopark profili oluşturuldu ({skipped} atlandı, yetersiz veri)")
    return blocks


def interpolate_missing(profile_data: dict, dow: int, hour: int) -> float:
    """Eksik (dow, hour) slotunu komşu saatlerden interpolasyon ile doldur."""
    # Aynı günde önceki ve sonraki saati bul
    prev_occ = None
    next_occ = None

    for delta in range(1, 4):
        prev_key = (dow, (hour - delta) % 24)
        if prev_key in profile_data and prev_occ is None:
            prev_occ = profile_data[prev_key]["occ"]
        next_key = (dow, (hour + delta) % 24)
        if next_key in profile_data and next_occ is None:
            next_occ = profile_data[next_key]["occ"]

    if prev_occ is not None and next_occ is not None:
        return (prev_occ + next_occ) / 2
    if prev_occ is not None:
        return prev_occ
    if next_occ is not None:
        return next_occ

    # Aynı saatte diğer günlerin ortalaması
    same_hour = [
        profile_data[(d, hour)]["occ"]
        for d in range(7)
        if (d, hour) in profile_data
    ]
    if same_hour:
        return sum(same_hour) / len(same_hour)

    return 0.0


def interpolate_enforcement(profile_data: dict, dow: int, hour: int) -> int:
    """Eksik enforcement verisini komşu slotlardan tahmin et."""
    for delta in range(1, 4):
        for d in [dow, (dow + delta) % 7, (dow - delta) % 7]:
            key = (d, hour)
            if key in profile_data:
                return 1 if profile_data[key]["open_ratio"] > 0.5 else 0
    return 1  # varsayılan: enforced


def parse_work_hours(wh: str):
    """Çalışma saati string'ini (start_hour, end_hour) tuple'ına çevir."""
    if not wh or "24 Saat" in wh:
        return (0, 24)
    try:
        parts = wh.split("-")
        start = int(parts[0].split(":")[0])
        end = int(parts[1].split(":")[0])
        if end == 0:
            end = 24
        return (start, end)
    except (ValueError, IndexError):
        return (0, 24)


def generate_path(lat, lng):
    """Blok için 2 noktalı yol segmenti."""
    angle = random.uniform(0, math.pi)
    offset = 0.0004
    dx = offset * math.cos(angle)
    dy = offset * math.sin(angle) / math.cos(math.radians(lat))
    return [
        [round(lng - dy, 6), round(lat - dx, 6)],
        [round(lng + dy, 6), round(lat + dx, 6)],
    ]


def generate_meter_positions(lat, lng, count):
    """Bireysel park yeri pozisyonları."""
    positions = []
    for _ in range(min(count, 30)):
        offset_lat = random.uniform(-0.0003, 0.0003)
        offset_lng = random.uniform(-0.0003, 0.0003)
        positions.append([round(lng + offset_lng, 6), round(lat + offset_lat, 6)])
    return positions


def write_output(blocks: list):
    """parking_week.json ve yardımcı dosyaları yaz."""
    os.makedirs(OUT_DIR, exist_ok=True)

    now = datetime.now().isoformat()

    # İlk ve son snapshot tarihlerini al
    conn = sqlite3.connect(DB_PATH)
    first_ts = conn.execute("SELECT MIN(ts) FROM snapshots").fetchone()[0]
    last_ts = conn.execute("SELECT MAX(ts) FROM snapshots").fetchone()[0]
    conn.close()

    date_from = first_ts[:10] if first_ts else now[:10]
    date_to = last_ts[:10] if last_ts else now[:10]

    parking_week = {
        "generated": now,
        "dateRange": {"from": date_from, "to": date_to},
        "blocks": blocks,
    }

    fpath = os.path.join(OUT_DIR, "parking_week.json")
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(parking_week, f, ensure_ascii=False)
    mb = os.path.getsize(fpath) / 1024 / 1024
    print(f"\n  parking_week.json yazıldı ({mb:.1f} MB)")

    # meter_locations.json
    meter_locations = [
        {
            "id": b["id"], "lat": b["lat"], "lng": b["lng"],
            "meters": b["meters"], "street": b["street"],
            "hood": b["hood"], "supply": b["supply"],
            "path": b["path"], "meterPositions": b["meterPositions"],
        }
        for b in blocks
    ]
    with open(os.path.join(OUT_DIR, "meter_locations.json"), "w", encoding="utf-8") as f:
        json.dump(meter_locations, f, ensure_ascii=False)

    # enforcement_schedules.json
    enforcement = {b["id"]: b["enforced"] for b in blocks}
    with open(os.path.join(OUT_DIR, "enforcement_schedules.json"), "w", encoding="utf-8") as f:
        json.dump(enforcement, f, ensure_ascii=False)

    # pressure_311.json — gerçek veriden ortalama doluluk bazlı
    pressure = {}
    for b in blocks:
        avg_occ = sum(b["slots"]) / len(b["slots"]) if b["slots"] else 0
        pressure[b["id"]] = round(avg_occ, 3)
    with open(os.path.join(OUT_DIR, "pressure_311.json"), "w", encoding="utf-8") as f:
        json.dump(pressure, f, ensure_ascii=False)

    print("  meter_locations.json yazıldı")
    print("  enforcement_schedules.json yazıldı")
    print("  pressure_311.json yazıldı")


def main():
    min_days = 7
    # Basit arg parse
    if "--min-days" in sys.argv:
        idx = sys.argv.index("--min-days")
        if idx + 1 < len(sys.argv):
            min_days = int(sys.argv[idx + 1])

    print("=" * 60)
    print("İSPARK Gerçek Haftalık Profil Oluşturucu")
    print("=" * 60)

    days = check_db()

    if days < min_days:
        print(f"\nUYARI: Henüz {days} günlük veri var, minimum {min_days} gün gerekli.")
        print("Daha fazla veri toplamak için 'python scripts/collect_hourly.py' çalıştırmaya devam edin.")
        if "--force" not in sys.argv:
            print("Yine de devam etmek için --force ekleyin.")
            sys.exit(0)
        print("--force ile devam ediliyor...")

    blocks = compute_profiles(min_days)

    if not blocks:
        print("\nHATA: Hiçbir otopark profili oluşturulamadı.")
        sys.exit(1)

    write_output(blocks)

    print(f"\n✓ {len(blocks)} otopark için gerçek haftalık profil oluşturuldu!")
    print(f"  Veri kapsamı: {days} gün")
    print(f"  Kaynak: {DB_PATH}")


if __name__ == "__main__":
    main()
