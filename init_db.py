import sys
sys.path.insert(0, r'C:\Users\hepsi\OneDrive\Desktop\win\AI')

from database import Base, engine

# Create all tables
print("Creating database tables...")
Base.metadata.create_all(engine)
print("✅ Tables created successfully!")

# List tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nTables in database: {tables}")
