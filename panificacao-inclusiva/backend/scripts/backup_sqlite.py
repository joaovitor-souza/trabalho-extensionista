"""Cópia pontual de padaria.db. Rode a partir de backend/:

    python -m app.backup
    python scripts/backup_sqlite.py
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.backup import main

if __name__ == "__main__":
    main()
