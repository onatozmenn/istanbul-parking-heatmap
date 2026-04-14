#!/usr/bin/env python3
"""
Ankara Park Verisi Üretici

Ankara'nın gerçek mahalle ve caddeleri için gerçekçi park doluluk verisi üretir.
Çıktı: public/data/parking_week.json, meter_locations.json, enforcement_schedules.json, pressure_311.json
"""

import json
import math
import os
import random
from datetime import datetime

random.seed(42)  # Tekrarlanabilirlik için

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")
os.makedirs(OUT_DIR, exist_ok=True)

# ============================================================
# Ankara mahalleleri ve caddeleri (gerçek koordinatlar)
# ============================================================

NEIGHBORHOODS = {
    "Kızılay": {
        "center": (39.9208, 32.8541),
        "radius": 0.008,
        "streets": [
            "Atatürk Bulvarı", "Ziya Gökalp Cad.", "Sakarya Cad.",
            "İzmir Cad.", "Meşrutiyet Cad.", "Selanik Cad.",
            "Mithatpaşa Cad.", "Kumrular Cad.", "Karanfil Sok.",
            "Yüksel Cad.", "Konur Sok.", "Bayındır Sok.",
        ],
        "base_occupancy": 0.82,
        "meter_density": 8,
    },
    "Ulus": {
        "center": (39.9416, 32.8568),
        "radius": 0.007,
        "streets": [
            "Anafartalar Cad.", "Çankırı Cad.", "Hisarpark Cad.",
            "Denizciler Cad.", "Sanayi Cad.", "Konya Cad.",
            "İtfaiye Meydanı", "Talatpaşa Bulvarı",
        ],
        "base_occupancy": 0.72,
        "meter_density": 6,
    },
    "Çankaya": {
        "center": (39.9024, 32.8631),
        "radius": 0.012,
        "streets": [
            "Turan Güneş Bulvarı", "Simon Bolivar Cad.",
            "Bülten Sok.", "Kader Sok.", "Reşit Galip Cad.",
            "Cinnah Cad.", "Oran Cad.", "Aşkabat Cad.",
            "Kazım Özalp Sok.", "Filistin Sok.", "İran Cad.",
        ],
        "base_occupancy": 0.68,
        "meter_density": 5,
    },
    "Bahçelievler": {
        "center": (39.9215, 32.8264),
        "radius": 0.008,
        "streets": [
            "7. Cadde", "Bişkek Cad.", "Emek Cad.",
            "Ceyhun Atıf Kansu Cad.", "Aşkabat Cad.",
            "Bestekar Sok.", "Şehit Ersan Cad.",
        ],
        "base_occupancy": 0.65,
        "meter_density": 5,
    },
    "Tunalı Hilmi": {
        "center": (39.9115, 32.8601),
        "radius": 0.006,
        "streets": [
            "Tunalı Hilmi Cad.", "Bülten Sok.", "Bestekar Sok.",
            "Esat Cad.", "Arjantin Cad.", "Buğday Sok.",
            "Kennedy Cad.",
        ],
        "base_occupancy": 0.85,
        "meter_density": 7,
    },
    "Kavaklıdere": {
        "center": (39.9065, 32.8610),
        "radius": 0.006,
        "streets": [
            "Atatürk Bulvarı", "Kuğulu Cad.", "Kavaklıdere Cad.",
            "Tunalı Hilmi Cad.", "Bestekar Sok.",
        ],
        "base_occupancy": 0.78,
        "meter_density": 6,
    },
    "Ayrancı": {
        "center": (39.9050, 32.8505),
        "radius": 0.006,
        "streets": [
            "Hoşdere Cad.", "Dikmen Cad.", "Ayrancı Cad.",
            "Çetin Emeç Bulvarı", "Güfte Sok.",
        ],
        "base_occupancy": 0.62,
        "meter_density": 4,
    },
    "Keçiören": {
        "center": (39.9700, 32.8620),
        "radius": 0.010,
        "streets": [
            "Fatih Cad.", "İstanbul Cad.", "Kalaba Cad.",
            "Şenyuva Cad.", "Etlik Cad.", "Ayvansaray Cad.",
        ],
        "base_occupancy": 0.55,
        "meter_density": 4,
    },
    "Yenimahalle": {
        "center": (39.9550, 32.8100),
        "radius": 0.010,
        "streets": [
            "Mevlana Bulvarı", "Ragıp Tüzün Cad.",
            "Batıkent Bulvarı", "Kenpark Cad.",
            "Çarşı Cad.",
        ],
        "base_occupancy": 0.50,
        "meter_density": 3,
    },
    "Etimesgut": {
        "center": (39.9480, 32.7400),
        "radius": 0.010,
        "streets": [
            "30 Ağustos Cad.", "Eryaman Bulvarı",
            "Topçu Cad.", "İstasyon Cad.",
        ],
        "base_occupancy": 0.45,
        "meter_density": 3,
    },
    "Mamak": {
        "center": (39.9250, 32.9100),
        "radius": 0.010,
        "streets": [
            "Dereboyu Cad.", "Natoyolu Cad.",
            "Abidinpaşa Cad.", "Tuzluçayır Cad.",
        ],
        "base_occupancy": 0.48,
        "meter_density": 3,
    },
    "Sincan": {
        "center": (39.9680, 32.5830),
        "radius": 0.008,
        "streets": [
            "Ankara Cad.", "Atatürk Cad.",
            "Tandoğan Cad.", "Fatih Sultan Mehmet Bulvarı",
        ],
        "base_occupancy": 0.42,
        "meter_density": 2,
    },
    "Dikmen": {
        "center": (39.8900, 32.8480),
        "radius": 0.007,
        "streets": [
            "Dikmen Cad.", "Öveçler Cad.",
            "Çetin Emeç Bulvarı", "Keklik Sok.",
        ],
        "base_occupancy": 0.58,
        "meter_density": 4,
    },
    "Emek": {
        "center": (39.9250, 32.8100),
        "radius": 0.006,
        "streets": [
            "Emek Cad.", "Bişkek Cad.",
            "Kazakistan Cad.", "İşçi Blokları Cad.",
        ],
        "base_occupancy": 0.55,
        "meter_density": 4,
    },
    "Söğütözü": {
        "center": (39.9155, 32.8100),
        "radius": 0.006,
        "streets": [
            "Söğütözü Cad.", "Dumlupınar Bulvarı",
            "Eskişehir Yolu", "ODTÜ Yolu",
        ],
        "base_occupancy": 0.72,
        "meter_density": 5,
    },
}


def generate_weekly_profile(base_occ: float, is_central: bool) -> list:
    """
    168 slotluk (7 gün × 24 saat) gerçekçi doluluk profili üret.
    Türk park alışkanlıklarını yansıtır:
    - İş günleri 08-19 arası yoğun (öğle piki 12-14)
    - Akşam 19-22 arası restoran/eğlence bölgelerinde yoğun
    - Gece 23-06 arası düşük
    - Cumartesi yarım gün yoğun
    - Pazar en sakin gün
    """
    slots = []
    for dow in range(7):  # 0=Pzt..6=Paz
        for hour in range(24):
            # Gece saatleri (23-06): çok düşük
            if hour >= 23 or hour < 6:
                occ = base_occ * 0.1 + random.uniform(-0.03, 0.03)
            # Sabah erken (06-08): yavaş artış
            elif 6 <= hour < 8:
                t = (hour - 6) / 2
                occ = base_occ * (0.2 + 0.3 * t) + random.uniform(-0.05, 0.05)
            # İş saatleri (08-12): yükseliş
            elif 8 <= hour < 12:
                t = (hour - 8) / 4
                occ = base_occ * (0.6 + 0.3 * t) + random.uniform(-0.05, 0.05)
            # Öğle pik (12-14): en yoğun
            elif 12 <= hour < 14:
                occ = base_occ * 1.05 + random.uniform(-0.05, 0.05)
            # Öğleden sonra (14-18): yüksek
            elif 14 <= hour < 18:
                occ = base_occ * 0.9 + random.uniform(-0.05, 0.05)
            # Akşam (18-20): bölgeye göre değişir
            elif 18 <= hour < 20:
                if is_central:
                    occ = base_occ * 0.85 + random.uniform(-0.05, 0.05)
                else:
                    occ = base_occ * 0.5 + random.uniform(-0.05, 0.05)
            # Gece (20-23): merkezi bölgelerde hala yoğun
            elif 20 <= hour < 23:
                if is_central:
                    occ = base_occ * 0.65 + random.uniform(-0.05, 0.05)
                else:
                    occ = base_occ * 0.25 + random.uniform(-0.03, 0.03)
            else:
                occ = base_occ * 0.3

            # Hafta sonu ayarlamaları
            if dow == 5:  # Cumartesi
                if 10 <= hour < 20:
                    occ *= 0.85
                else:
                    occ *= 0.7
            elif dow == 6:  # Pazar
                if 10 <= hour < 18:
                    occ *= 0.5
                else:
                    occ *= 0.3

            # Sınırla
            occ = max(0, min(1.0, occ))
            slots.append(round(occ, 4))
    return slots


def generate_enforcement_schedule() -> list:
    """
    168 slotluk uygulama takvimi.
    Ankara parkmetre saatleri: Pzt-Cmt 08:00-20:00
    """
    enforced = []
    for dow in range(7):
        for hour in range(24):
            if dow < 6 and 8 <= hour < 20:  # Pzt-Cmt, 08-20
                enforced.append(1)
            else:
                enforced.append(0)
    return enforced


def random_point_in_circle(center_lat, center_lng, radius):
    """Daire içinde rastgele nokta üret"""
    angle = random.uniform(0, 2 * math.pi)
    r = radius * math.sqrt(random.random())
    lat = center_lat + r * math.cos(angle)
    lng = center_lng + r * math.sin(angle) / math.cos(math.radians(center_lat))
    return round(lat, 6), round(lng, 6)


def generate_path(lat, lng):
    """Blok için 2 noktalı yol segmenti üret"""
    angle = random.uniform(0, math.pi)
    offset = 0.0003
    dx = offset * math.cos(angle)
    dy = offset * math.sin(angle) / math.cos(math.radians(lat))
    return [
        [round(lng - dy, 6), round(lat - dx, 6)],
        [round(lng + dy, 6), round(lat + dx, 6)],
    ]


def generate_meter_positions(lat, lng, count):
    """Bireysel sayaç pozisyonları üret"""
    positions = []
    for i in range(count):
        offset_lat = random.uniform(-0.0002, 0.0002)
        offset_lng = random.uniform(-0.0002, 0.0002)
        positions.append([round(lng + offset_lng, 6), round(lat + offset_lat, 6)])
    return positions


def main():
    print("Ankara park verisi üretiliyor...")

    blocks = []
    meter_locations = []
    enforcement = {}
    pressure_311 = {}
    block_id_counter = 0

    central_hoods = {"Kızılay", "Ulus", "Tunalı Hilmi", "Kavaklıdere", "Çankaya", "Söğütözü"}

    for hood_name, hood_info in NEIGHBORHOODS.items():
        center_lat, center_lng = hood_info["center"]
        radius = hood_info["radius"]
        base_occ = hood_info["base_occupancy"]
        density = hood_info["meter_density"]
        streets = hood_info["streets"]
        is_central = hood_name in central_hoods

        # Her cadde için 2-5 blok
        for street in streets:
            num_blocks = random.randint(2, density)
            for b in range(num_blocks):
                block_id_counter += 1
                block_id = f"{street} {(b + 1) * 100}"
                lat, lng = random_point_in_circle(center_lat, center_lng, radius)
                meters = random.randint(3, 12)
                supply = meters + random.randint(0, 5)

                # Her blok için biraz farklı doluluk
                block_base = base_occ + random.uniform(-0.1, 0.1)
                slots = generate_weekly_profile(block_base, is_central)
                enforced = generate_enforcement_schedule()
                path = generate_path(lat, lng)
                meter_pos = generate_meter_positions(lat, lng, meters)

                block = {
                    "id": block_id,
                    "lat": lat,
                    "lng": lng,
                    "meters": meters,
                    "street": street,
                    "hood": hood_name,
                    "slots": slots,
                    "enforced": enforced,
                    "supply": supply,
                    "path": path,
                    "meterPositions": meter_pos,
                }
                blocks.append(block)

                # meter_locations.json formatı
                meter_locations.append({
                    "id": block_id,
                    "lat": lat,
                    "lng": lng,
                    "meters": meters,
                    "street": street,
                    "hood": hood_name,
                    "supply": supply,
                    "path": path,
                    "meterPositions": meter_pos,
                })

                # Enforcement
                enforcement[block_id] = enforced

                # 311 basıncı (merkezi bölgelerde daha yüksek)
                if is_central:
                    pressure_311[block_id] = round(random.uniform(0.3, 0.9), 3)
                else:
                    pressure_311[block_id] = round(random.uniform(0.05, 0.4), 3)

    print(f"  {len(blocks)} blok üretildi, {len(NEIGHBORHOODS)} mahallede")

    # parking_week.json
    now = datetime.now().isoformat()
    parking_week = {
        "generated": now,
        "dateRange": {
            "from": "2025-01-01",
            "to": "2026-04-14",
        },
        "blocks": blocks,
    }

    with open(os.path.join(OUT_DIR, "parking_week.json"), "w", encoding="utf-8") as f:
        json.dump(parking_week, f, ensure_ascii=False)
    print(f"  parking_week.json yazıldı ({os.path.getsize(os.path.join(OUT_DIR, 'parking_week.json')) / 1024 / 1024:.1f} MB)")

    # meter_locations.json
    with open(os.path.join(OUT_DIR, "meter_locations.json"), "w", encoding="utf-8") as f:
        json.dump(meter_locations, f, ensure_ascii=False)
    print(f"  meter_locations.json yazıldı")

    # enforcement_schedules.json
    with open(os.path.join(OUT_DIR, "enforcement_schedules.json"), "w", encoding="utf-8") as f:
        json.dump(enforcement, f, ensure_ascii=False)
    print(f"  enforcement_schedules.json yazıldı")

    # pressure_311.json
    with open(os.path.join(OUT_DIR, "pressure_311.json"), "w", encoding="utf-8") as f:
        json.dump(pressure_311, f, ensure_ascii=False)
    print(f"  pressure_311.json yazıldı")

    print("Tamamlandı!")


if __name__ == "__main__":
    main()
