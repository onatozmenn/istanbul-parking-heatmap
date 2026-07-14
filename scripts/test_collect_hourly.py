import json
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from scripts.collect_hourly import fetch_parks, normalize_parks, store_snapshot


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")


def park(park_id, empty=40, capacity=100):
    return {
        "parkID": park_id,
        "parkName": f"Park {park_id}",
        "lat": "41.01",
        "lng": "28.98",
        "capacity": capacity,
        "emptyCapacity": empty,
        "isOpen": 1,
        "workHours": "24 Saat",
        "district": "FATİH",
        "parkType": "AÇIK",
    }


class CollectHourlyTests(unittest.TestCase):
    def test_fetch_retries_after_temporary_failure(self):
        with patch(
            "scripts.collect_hourly.urllib.request.urlopen",
            side_effect=[OSError("temporary"), FakeResponse([park(1)])],
        ), patch("scripts.collect_hourly.time.sleep") as sleep:
            result = fetch_parks(attempts=2, base_delay=0.01)

        self.assertEqual(result[0]["parkID"], 1)
        sleep.assert_called_once_with(0.01)

    def test_normalize_rejects_invalid_and_duplicate_records(self):
        records = [
            park(1),
            park(1),
            park(2, empty=120),
            {**park(3), "lat": "39.0"},
            "invalid",
        ]

        result = normalize_parks(records)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["park_id"], 1)
        self.assertAlmostEqual(result[0]["occupancy"], 0.6)

    def test_store_is_atomic_deduplicated_and_bounded(self):
        records = normalize_parks([park(1), park(2, empty=20)])
        first_time = datetime(2026, 1, 1, 10, tzinfo=timezone.utc)

        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = str(Path(temp_dir) / "history.db")
            first = store_snapshot(
                records,
                first_time,
                db_path=db_path,
                min_valid_parks=2,
                retention_days=84,
            )
            duplicate = store_snapshot(
                records,
                first_time + timedelta(minutes=20),
                db_path=db_path,
                min_valid_parks=2,
                retention_days=84,
            )
            latest = store_snapshot(
                records,
                first_time + timedelta(days=85),
                db_path=db_path,
                min_valid_parks=2,
                retention_days=84,
            )

            conn = sqlite3.connect(db_path)
            snapshots = conn.execute("SELECT COUNT(*) FROM snapshots").fetchone()[0]
            readings = conn.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
            integrity = conn.execute("PRAGMA quick_check").fetchone()[0]
            conn.close()

        self.assertTrue(first["created"])
        self.assertFalse(duplicate["created"])
        self.assertTrue(latest["created"])
        self.assertEqual(snapshots, 1)
        self.assertEqual(readings, 2)
        self.assertEqual(integrity, "ok")


if __name__ == "__main__":
    unittest.main()