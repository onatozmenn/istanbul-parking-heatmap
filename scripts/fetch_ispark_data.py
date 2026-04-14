#!/usr/bin/env python3
"""
İstanbul İSPARK Veri Çekici

İBB Açık Veri Portalı'ndaki İSPARK API'sinden gerçek otopark verisi çeker.
API: https://api.ibb.gov.tr/ispark/Park (anlık doluluk)
API: https://api.ibb.gov.tr/ispark/ParkDetay?id=X (detay)

Anlık doluluk verisinden haftalık profil simüle edilir:
- emptyCapacity / capacity oranı şu anki doluluk
- Çalışma saatleri ve otopark tipine göre 168 slotluk profil üretilir
- Gerçek koordinat, kapasite ve ilçe bilgileri kullanılır

Çıktı: public/data/parking_week.json, meter_locations.json,
       enforcement_schedules.json, pressure_311.json
"""

import json
import math
import os
import random
import urllib.request
from datetime import datetime

random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
os.makedirs(OUT_DIR, exist_ok=True)

ISPARK_API = "https://api.ibb.gov.tr/ispark/Park"

# İlçe bazında yoğunluk çarpanları (merkezi ilçeler daha yoğun)
DISTRICT_WEIGHT = {
    "FATİH": 1.15, "BEŞİKTAŞ": 1.12, "ŞİŞLİ": 1.10, "BEYOĞLU": 1.18,
    "KADIKÖY": 1.08, "ÜSKÜDAR": 1.05, "BAKIRKÖY": 1.02, "SARIYER": 0.95,
    "BAYRAMPAŞA": 0.98, "BAĞCILAR": 0.95, "EYÜP": 0.92, "KAĞITHANE": 0.95,
    "KARTAL": 0.90, "PENDİK": 0.88, "BAHÇELİEVLER": 0.92, "MALTEPE": 0.90,
    "ESENLER": 0.88, "SULTANGAZI": 0.85, "GAZİOSMANPAŞA": 0.88,
    "SULTANBEYLİ": 0.82, "TUZLA": 0.80, "ARNAVUTKÖY": 0.78,
    "KÜÇÜKÇEKMECE": 0.90, "BÜYÜKÇEKMECE": 0.82, "ÇEKMEKÖY": 0.85,
    "ATAŞEHİR": 1.00, "ÜMRANİYE": 0.95, "SANCAKTEPE": 0.85,
    "ESENYURT": 0.88, "AVCILAR": 0.88, "ZEYTİNBURNU": 0.98,
    "GÜNGÖREN": 0.95, "BAŞAKŞEHIR": 0.90, "BEYLIKDÜZÜ": 0.85,
    "ÇATALCA": 0.75, "SİLİVRİ": 0.75, "ADALAR": 0.70,
}

# Park tipi çarpanı
TYPE_WEIGHT = {
    "YOL ÜSTÜ": 1.15,      # Yol üstü daha yoğun olur
    "AÇIK OTOPARK": 1.0,
    "KAPALI OTOPARK": 0.90, # Kapalı otoparklar biraz daha az dolu
}


def parse_work_hours(wh: str):
    """Çalışma saati string'ini (start_hour, end_hour) tuple'ına çevir"""
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


def generate_weekly_profile(base_occ: float, park_type: str, work_hours: str) -> list:
    """
    168 slotluk (7 gün × 24 saat) gerçekçi doluluk profili üret.
    İstanbul park alışkanlıklarını yansıtır.
    """
    start_h, end_h = parse_work_hours(work_hours)
    is_yol_ustu = park_type == "YOL ÜSTÜ"
    slots = []

    for dow in range(7):  # 0=Pzt..6=Paz
        for hour in range(24):
            # Çalışma saati dışında
            is_24h = (start_h == 0 and end_h == 24)
            if not is_24h and (hour < start_h or hour >= end_h):
                occ = 0.0  # Kapalı
                slots.append(round(occ, 4))
                continue

            # Gece saatleri (23-06): çok düşük
            if hour >= 23 or hour < 6:
                occ = base_occ * 0.15 + random.uniform(-0.03, 0.03)
            # Sabah erken (06-08): yavaş artış
            elif 6 <= hour < 8:
                t = (hour - 6) / 2
                occ = base_occ * (0.25 + 0.35 * t) + random.uniform(-0.05, 0.05)
            # Sabah iş saati (08-10): hızlı dolma
            elif 8 <= hour < 10:
                t = (hour - 8) / 2
                occ = base_occ * (0.6 + 0.3 * t) + random.uniform(-0.05, 0.05)
            # Gündüz pik (10-14): en yoğun
            elif 10 <= hour < 14:
                occ = base_occ * 1.05 + random.uniform(-0.05, 0.08)
            # Öğleden sonra (14-17): yüksek
            elif 14 <= hour < 17:
                occ = base_occ * 0.92 + random.uniform(-0.05, 0.05)
            # Akşam (17-19): trafik piki
            elif 17 <= hour < 19:
                if is_yol_ustu:
                    occ = base_occ * 0.7 + random.uniform(-0.05, 0.05)
                else:
                    occ = base_occ * 0.85 + random.uniform(-0.05, 0.05)
            # Gece erken (19-21): eğlence / restoran
            elif 19 <= hour < 21:
                occ = base_occ * 0.65 + random.uniform(-0.05, 0.05)
            # Gece geç (21-23)
            elif 21 <= hour < 23:
                occ = base_occ * 0.35 + random.uniform(-0.03, 0.03)
            else:
                occ = base_occ * 0.3

            # Hafta sonu ayarlamaları
            if dow == 5:  # Cumartesi
                if 10 <= hour < 20:
                    occ *= 0.90  # Hafta içine göre biraz daha az iş trafiği
                else:
                    occ *= 0.75
            elif dow == 6:  # Pazar
                if 10 <= hour < 18:
                    occ *= 0.55
                else:
                    occ *= 0.35

            # Cuma akşamı İstanbul'da yoğun
            if dow == 4 and 17 <= hour < 23:
                occ *= 1.1

            occ = max(0, min(1.0, occ))
            slots.append(round(occ, 4))
    return slots


def generate_enforcement(work_hours: str) -> list:
    """168 slotluk uygulama takvimi"""
    start_h, end_h = parse_work_hours(work_hours)
    is_24h = (start_h == 0 and end_h == 24)
    enforced = []
    for dow in range(7):
        for hour in range(24):
            if is_24h:
                enforced.append(1)
            elif start_h <= hour < end_h and dow < 6:  # Pazar kapalı varsayalım
                enforced.append(1)
            else:
                enforced.append(0)
    return enforced


def generate_path(lat, lng):
    """Blok için 2 noktalı yol segmenti"""
    angle = random.uniform(0, math.pi)
    offset = 0.0004
    dx = offset * math.cos(angle)
    dy = offset * math.sin(angle) / math.cos(math.radians(lat))
    return [
        [round(lng - dy, 6), round(lat - dx, 6)],
        [round(lng + dy, 6), round(lat + dx, 6)],
    ]


def generate_meter_positions(lat, lng, count):
    """Bireysel park yeri pozisyonları"""
    positions = []
    for _ in range(min(count, 30)):  # Çok büyükler için sınırla
        offset_lat = random.uniform(-0.0003, 0.0003)
        offset_lng = random.uniform(-0.0003, 0.0003)
        positions.append([round(lng + offset_lng, 6), round(lat + offset_lat, 6)])
    return positions


def main():
    print("İSPARK API'den veri çekiliyor...")
    req = urllib.request.Request(ISPARK_API, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        parks = json.loads(resp.read().decode("utf-8"))

    print(f"  {len(parks)} otopark alındı")

    blocks = []
    meter_locations = []
    enforcement = {}
    pressure_311 = {}

    for park in parks:
        pid = park.get("parkID", 0)
        name = park.get("parkName", f"Otopark {pid}")
        lat_s = park.get("lat", "0")
        lng_s = park.get("lng", "0")
        capacity = park.get("capacity", 0) or 0
        empty = park.get("emptyCapacity", 0) or 0
        work_hours = park.get("workHours", "24 Saat") or "24 Saat"
        park_type = park.get("parkType", "AÇIK OTOPARK") or "AÇIK OTOPARK"
        district = park.get("district", "") or ""
        is_open = park.get("isOpen", 0)

        try:
            lat = float(lat_s)
            lng = float(lng_s)
        except (ValueError, TypeError):
            continue

        # Geçersiz koordinatları atla
        if lat < 40.8 or lat > 41.3 or lng < 28.5 or lng > 29.5:
            continue

        if capacity <= 0:
            continue

        # Anlık doluluk oranı
        current_occ = max(0, min(1.0, (capacity - empty) / capacity)) if capacity > 0 else 0.5

        # İlçe ve tip bazında baz doluluk hesapla
        dw = DISTRICT_WEIGHT.get(district, 0.90)
        tw = TYPE_WEIGHT.get(park_type, 1.0)
        base_occ = current_occ * dw * tw

        # Profil üret
        block_id = f"ISPARK-{pid}"
        slots = generate_weekly_profile(base_occ, park_type, work_hours)
        enforced = generate_enforcement(work_hours)
        path = generate_path(lat, lng)

        # Kapasite bazında "meter" sayısı (görselleştirme için)
        meters = min(capacity, 50)  # Görsel amaçlı sınırla
        meter_pos = generate_meter_positions(lat, lng, meters)

        block = {
            "id": block_id,
            "lat": lat,
            "lng": lng,
            "meters": meters,
            "street": name,
            "hood": district.title(),
            "slots": slots,
            "enforced": enforced,
            "supply": capacity,
            "path": path,
            "meterPositions": meter_pos,
        }
        blocks.append(block)

        meter_locations.append({
            "id": block_id,
            "lat": lat,
            "lng": lng,
            "meters": meters,
            "street": name,
            "hood": district.title(),
            "supply": capacity,
            "path": path,
            "meterPositions": meter_pos,
        })

        enforcement[block_id] = enforced

        # Basınç skoru
        pressure_311[block_id] = round(current_occ * dw * random.uniform(0.6, 1.0), 3)

    print(f"  {len(blocks)} geçerli otopark işlendi")

    # İlçe bazında özet
    districts = {}
    for b in blocks:
        d = b["hood"]
        if d not in districts:
            districts[d] = {"count": 0, "total_cap": 0}
        districts[d]["count"] += 1
        districts[d]["total_cap"] += b["supply"]

    for d in sorted(districts, key=lambda x: districts[x]["count"], reverse=True)[:10]:
        info = districts[d]
        print(f"    {d}: {info['count']} otopark, {info['total_cap']} kapasite")

    # parking_week.json
    now = datetime.now().isoformat()
    parking_week = {
        "generated": now,
        "dateRange": {
            "from": "2025-01-01",
            "to": now[:10],
        },
        "blocks": blocks,
    }

    fpath = os.path.join(OUT_DIR, "parking_week.json")
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(parking_week, f, ensure_ascii=False)
    mb = os.path.getsize(fpath) / 1024 / 1024
    print(f"  parking_week.json yazıldı ({mb:.1f} MB)")

    with open(os.path.join(OUT_DIR, "meter_locations.json"), "w", encoding="utf-8") as f:
        json.dump(meter_locations, f, ensure_ascii=False)
    print("  meter_locations.json yazıldı")

    with open(os.path.join(OUT_DIR, "enforcement_schedules.json"), "w", encoding="utf-8") as f:
        json.dump(enforcement, f, ensure_ascii=False)
    print("  enforcement_schedules.json yazıldı")

    with open(os.path.join(OUT_DIR, "pressure_311.json"), "w", encoding="utf-8") as f:
        json.dump(pressure_311, f, ensure_ascii=False)
    print("  pressure_311.json yazıldı")

    print("\nTamamlandı! 'pnpm dev' ile uygulamayı çalıştırabilirsiniz.")


if __name__ == "__main__":
    main()
