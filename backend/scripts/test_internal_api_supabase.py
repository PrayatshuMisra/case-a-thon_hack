from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


def main() -> int:
    c = TestClient(app)

    before = c.get('/api/supabase-status')
    add = c.post('/api/add-fisher', json={
        'name': 'Admin Studio Path Test',
        'boat_id': 'MALPE-ADMIN-01',
        'species_focus': 'Seer Fish',
        'avg_weekly_catch_kg': 120,
        'commitment_level': 'High',
        'mobile_number': '9999999999',
    })
    after = c.get('/api/supabase-status')

    out = {
        'before_status': before.status_code,
        'before': before.json() if before.headers.get('content-type', '').startswith('application/json') else before.text,
        'add_status': add.status_code,
        'add': add.json() if add.headers.get('content-type', '').startswith('application/json') else add.text,
        'after_status': after.status_code,
        'after': after.json() if after.headers.get('content-type', '').startswith('application/json') else after.text,
    }
    output_file = Path(__file__).resolve().parent / "test_internal_api_supabase_output.json"
    output_file.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(json.dumps(out, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
