from sqlalchemy import text
from sqlalchemy.orm import Session

from src.app.utils.color import Colors

def clear_all_data(db: Session, tables: list[str] = None):
    """
    Clears all data respecting foreign keys.

    Oracle does not support the PostgreSQL-style
    ``TRUNCATE ... RESTART IDENTITY CASCADE`` syntax, so we use a
    dependency-safe delete order there.
    """
    if tables is None:
        tables = ["payments", "invoices", "tenants", "rooms", "users", "roles"]
    
    try:
        bind = db.get_bind()
        dialect_name = bind.dialect.name if bind is not None else ""

        if dialect_name == "oracle":
            for table in tables:
                db.execute(text(f"DELETE FROM {table}"))
        else:
            table_list = ", ".join(tables)
            db.execute(text(f"TRUNCATE TABLE {table_list} RESTART IDENTITY CASCADE"))

        db.commit()
        Colors.success(f"All data cleared and IDs reset for: {', '.join(tables)}")
        return True
    except Exception as e:
        db.rollback()
        Colors.warning(f"Failed to clear data: {type(e).__name__}: {e}")
        return False