from datetime import datetime
from pathlib import Path
import shutil


def caminho_sqlite(database_url: str) -> Path:
    if not database_url.startswith("sqlite:///"):
        raise ValueError("Backup automático só está implementado para SQLite.")
    return Path(database_url.removeprefix("sqlite:///"))


def copiar_backup_sqlite(
    origem: Path, destino_dir: Path, agora: datetime | None = None
) -> Path:
    if not origem.is_file():
        raise FileNotFoundError(f"Banco SQLite não encontrado: {origem}")
    destino_dir.mkdir(parents=True, exist_ok=True)
    carimbo = (agora or datetime.now()).strftime("%Y%m%d-%H%M%S")
    destino = destino_dir / f"{origem.stem}-{carimbo}{origem.suffix}"
    shutil.copy2(origem, destino)
    return destino


def main() -> None:
    from app.config import settings

    origem = caminho_sqlite(settings.database_url)
    destino = copiar_backup_sqlite(origem, Path("backups"))
    print(f"Backup gravado em {destino}")


if __name__ == "__main__":
    main()
