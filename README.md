# İstanbul Park Isı Haritası

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

İstanbul İSPARK otoparkları için zamansal doluluk ısı haritası. Herhangi bir haftanın gününü ve saatini seçin; harita şehirdeki her İSPARK otoparkının doluluk oranını göstersin — İBB Açık Veri Portalı'ndaki İSPARK API'sinden saatlik olarak toplanan gerçek doluluk verileri kullanılarak oluşturulmuştur.

![İstanbul Park Isı Haritası](public/data/screenshot.png)

![İstanbul Park Isı Haritası - Detay](public/data/screenshot2.png)

## Ne yapar

- **Otopark başına 168 slotluk haftalık profil**: 7 gün × 24 saat doluluk oranı, İSPARK API'sinden saatlik olarak toplanan gerçek verilerden hesaplanır
- **Çok katmanlı görselleştirme**: şehir ölçeğinde ısı haritası → mahalle ölçeğinde 3D sütunlar → sokak ölçeğinde yol segmentleri ve bireysel park yeri noktaları
- **Zaman oynatma**: hafta boyunca kaydırın veya oynat düğmesine basarak talebin nasıl değiştiğini izleyin
- **Otopark detay paneli**: otopark bazında saatlik doluluk dağılımı, kapasite, çalışma saatleri
- **Karşılaştırma modu**: referans zaman dilimini sabitleyin, başka bir dilimle farkları görün
- **Arama + yarıçap**: belirli bir adresi bulun ve çevresindeki park durumunu inceleyin
- **İzokron modu**: bir başlangıç noktası seçin ve N dakikada araba/bisiklet/yürüyüşle ne kadar uzağa gidebileceğinizi görün (yerel Valhalla yönlendirme kullanır — aşağıya bakın)
- **Derin bağlantılı URL durumu**: her seçim (zaman, görünüm, otopark, arama, izokron) URL'de saklanır, böylece her görünüm paylaşılabilir

## Veri kaynakları

Tüm veriler herkese açık, kimlik doğrulama gerektirmeyen uç noktalardan gelir. **Yapılandırılacak API anahtarı yoktur.**

| Kaynak | API | Kullanım amacı |
|---|---|---|
| [İBB Açık Veri Portalı](https://data.ibb.gov.tr) | `api.ibb.gov.tr/ispark/Park` | İSPARK otopark konumları, kapasiteler, anlık doluluk |
| İSPARK API (saatlik) | Saatte 1 otomatik toplama | Gerçek haftalık doluluk profilleri (GitHub Actions ile) |

Harita altlığı [CARTO Dark Matter](https://carto.com/basemaps/) açık vektör haritasıdır (token gerekmez).

## Teknoloji yığını

- **Frontend**: Vite 7 + React 19 + TypeScript + Tailwind CSS v4
- **Haritalama**: [deck.gl](https://deck.gl) v9 katmanları, [MapLibre GL](https://maplibre.org) üzerinde `react-map-gl` ile
- **Veri hattı**: Python 3 standart kütüphanesi + SQLite — `requirements.txt` gerekmez
- **Otomasyon**: GitHub Actions ile saatlik veri toplama ve haftalık profil güncelleme
- **Test**: Vitest ile birim testleri
- **Yönlendirme (opsiyonel)**: İzokron hesaplaması için Docker'da çalışan [Valhalla](https://github.com/valhalla/valhalla)

## Kurulum

```bash
# 1. JS bağımlılıklarını kur
pnpm install

# 2. Veriyi çek (tek seferlik, birkaç dakika sürer)
pnpm fetch-data            # İSPARK API'den otopark verisi çeker → public/data/*.json

# Veya pipeline olarak:
pnpm pipeline

# 3. Geliştirme sunucusunu başlat
pnpm dev
```

Ardından http://localhost:5173 adresini açın.

## Proje yapısı

```
istanbul-parking-heatmap/
├── public/data/        # Frontend tarafından kullanılan üretilmiş JSON dosyaları
│   ├── meter_locations.json      # Otopark konumları ve kapasiteleri
│   ├── parking_week.json         # 168 slotluk doluluk profilleri
│   ├── enforcement_schedules.json # Çalışma saatleri
│   └── pressure_311.json         # Basınç skorları
├── data/               # SQLite veritabanı (saatlik snapshot'lar)
│   └── ispark_history.db         # Tüm toplanan veriler
├── scripts/            # Python veri hattı
│   ├── fetch_ispark_data.py      # İSPARK API → simüle haftalık profil (eski)
│   ├── collect_hourly.py         # Saatlik snapshot toplayıcı → SQLite
│   └── build_profiles.py         # SQLite → gerçek haftalık profiller
├── .github/workflows/  # Otomatik veri toplama
│   ├── collect-hourly.yml        # Her saat API'den veri çek & commit
│   └── build-profiles.yml        # Her Pazartesi profilleri güncelle
├── src/
│   ├── App.tsx
│   ├── components/     # Harita, paneller, kontroller, ipuçları
│   ├── hooks/          # Veri yükleme, zaman dilimi, URL durumu, izokronlar
│   ├── layers/         # deck.gl katman fabrikaları (zoom seviyesine göre)
│   ├── lib/            # Renk ölçekleri, sabitler, coğrafi yardımcılar
│   ├── __tests__/      # Vitest birim testleri
│   └── types.ts
└── docker-compose.yml  # İzokronlar için opsiyonel Valhalla servisi
```

## Doluluk nasıl hesaplanır

İSPARK API'si (`api.ibb.gov.tr/ispark/Park`) her otopark için anlık `capacity` ve `emptyCapacity` değerlerini döndürür.

### Gerçek veri pipeline'ı (aktif)

GitHub Actions ile otomatik çalışır — siz hiçbir şey yapmazsınız:

1. **Saatlik toplama** (`collect_hourly.py`): Her saat başı İSPARK API'den tüm otoparkların anlık doluluk oranı çekilir ve SQLite veritabanına kaydedilir
2. **Haftalık profil oluşturma** (`build_profiles.py`): Her Pazartesi, biriken tüm snapshot'lardan her otopark × her (gün, saat) çifti için gerçek ortalama doluluk hesaplanır
3. **Eksik slot interpolasyonu**: Henüz veri toplanmamış saatler, komşu saatlerden ve aynı saatteki diğer günlerden interpolasyonla doldurulur
4. **Otomatik commit**: Güncellenmiş profiller otomatik olarak repo'ya push'lanır

```
İSPARK API ──(her saat)──→ SQLite DB ──(her Pazartesi)──→ parking_week.json
```

### Eski simülasyon pipeline'ı (yedek)

Yeterli gerçek veri birikmeden önce veya hızlı başlangıç için `fetch_ispark_data.py` kullanılabilir. Bu script anlık doluluk oranından ilçe/tip çarpanları ve İstanbul park alışkanlıklarına uygun saatlik kalıplar uygulayarak sentetik bir haftalık profil üretir.

## Kullanılabilir komutlar

```bash
pnpm dev                  # Vite geliştirme sunucusu
pnpm build                # Üretim derlemesi (tsc -b && vite build)
pnpm lint                 # ESLint
pnpm preview              # Derlenmiş paketi önizle
pnpm test                 # Birim testlerini çalıştır

# Veri hattı
pnpm collect              # Anlık snapshot topla (SQLite'a yazar)
pnpm build-profiles       # Gerçek haftalık profilleri oluştur (min 7 gün veri gerekli)
pnpm build-profiles:force # Yeterli veri olmasa da profil oluştur
pnpm fetch-data           # Eski simülasyon yöntemiyle veri çek (yedek)
```

## Opsiyonel: İzokronlar

İzokron görünümü (herhangi bir noktadan araba/bisiklet/yürüyüş erişilebilirliği) bir yönlendirme motoruna ihtiyaç duyar. Repo, [Valhalla](https://github.com/valhalla/valhalla) için bir `docker-compose.yml` içerir:

```bash
docker compose up -d           # İlk çalıştırmada Türkiye OSM verisini indirir
```

İzokronları umursamıyorsanız, bu adımı atlayın — uygulama sorunsuz çalışmaya devam eder.

## Dikkat edilmesi gerekenler

- **Veriler gerçek ve otomatik güncellenir.** GitHub Actions ile saatte bir İSPARK API'sinden çekilen anlık doluluk verileri toplanır, haftada bir gerçek ortalama profiller hesaplanır. Yeni toplanan verilerde ilk hafta bazı saatler eksik olabilir; bu slotlar komşu saatlerden interpolasyonla doldurulur.
- **Sadece İSPARK otoparkları.** Özel otoparklar ve sokak üzeri düzensiz park veride yoktur.
- **Tipik hafta, gerçek zamanlı değil.** Profiller geçmiş verilerin ortalamasıdır; anlık canlı akış yoktur. Bayram, etkinlik gibi özel günler ortalamayı etkileyebilir.
- **Çalışma saatleri otopark bazındadır.** Çalışma saatleri dışında doluluk sıfır olarak gösterilir.

## Lisans

MIT — [LICENSE](LICENSE) dosyasına bakın.

## Teşekkürler

- Bu proje [wolfiesch/sf-parking-heatmap](https://github.com/wolfiesch/sf-parking-heatmap) temel alınarak İstanbul için uyarlanmıştır. Orijinal San Francisco versiyonunu geliştiren **Wolfgang Schoenberger**'e teşekkürler.
- [İBB Açık Veri Portalı](https://data.ibb.gov.tr) ve İSPARK API'si
- [deck.gl](https://deck.gl), [MapLibre](https://maplibre.org) ve [CARTO basemaps](https://carto.com/basemaps/) açık haritalama altyapısı
- [Valhalla](https://github.com/valhalla/valhalla) yönlendirme motoru
