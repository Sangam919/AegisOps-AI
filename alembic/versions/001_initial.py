"""Initial migration to create all tables via SQLAlchemy metadata"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Use sync engine for Alembic migration
    from app.db.session import sync_engine, Base
    Base.metadata.create_all(bind=sync_engine)

def downgrade():
    from app.db.session import sync_engine, Base
    Base.metadata.drop_all(bind=sync_engine)
