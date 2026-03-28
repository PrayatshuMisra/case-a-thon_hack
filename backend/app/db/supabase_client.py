import os
from pathlib import Path
from dotenv import load_dotenv
import httpx
from dataclasses import dataclass
from typing import Any

_BACKEND_ENV = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_BACKEND_ENV)

HTTP_TIMEOUT_SECONDS = 5.0

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")


class QueryResponse:
    def __init__(self, data: Any = None, count: int | None = None):
        self.data = data
        self.count = count


@dataclass
class _TableQuery:
    base_url: str
    table_name: str
    headers: dict[str, str]
    _query: dict[str, str] | None = None
    _limit: int | None = None

    def select(self, _columns: str = "*", count: str | None = None):
        self._query = {"select": _columns}
        if count:
            self.headers["Prefer"] = f"count={count}"
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def upsert(self, payload: dict[str, Any], on_conflict: str = "id"):
        url = f"{self.base_url}/rest/v1/{self.table_name}"
        headers = {
            **self.headers,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        }
        params = {"on_conflict": on_conflict}
        with httpx.Client(timeout=HTTP_TIMEOUT_SECONDS) as client:
            response = client.post(url, headers=headers, params=params, json=payload)
            response.raise_for_status()
            data = response.json() if response.text else []
        return QueryResponse(data=data, count=len(data) if isinstance(data, list) else None)

    def insert(self, payload: dict[str, Any]):
        url = f"{self.base_url}/rest/v1/{self.table_name}"
        headers = {
            **self.headers,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        with httpx.Client(timeout=HTTP_TIMEOUT_SECONDS) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json() if response.text else []
        return QueryResponse(data=data, count=len(data) if isinstance(data, list) else None)

    def execute(self):
        url = f"{self.base_url}/rest/v1/{self.table_name}"
        params = dict(self._query or {})
        if self._limit is not None:
            params["limit"] = str(self._limit)
        with httpx.Client(timeout=HTTP_TIMEOUT_SECONDS) as client:
            response = client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json() if response.text else []
            count_header = response.headers.get("content-range", "")
            count = None
            if "/" in count_header:
                try:
                    count = int(count_header.split("/")[-1])
                except Exception:
                    count = None
        return QueryResponse(data=data, count=count)


class SupabaseLiteClient:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
        }

    def table(self, table_name: str) -> _TableQuery:
        return _TableQuery(base_url=self.url, table_name=table_name, headers=dict(self.headers))


def get_supabase_client() -> SupabaseLiteClient:
    """
    Returns a lightweight Supabase REST client instance.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials not found. Please check your .env file.")
    return SupabaseLiteClient(SUPABASE_URL, SUPABASE_KEY)
