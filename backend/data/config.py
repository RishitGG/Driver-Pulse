"""
Shared configuration and limits for backend demo modules.
Kept small and simple on purpose so it is easy to swap out in a real deployment.
"""

# Soft limit for batch CSV rows. Requests above this size are still processed,
# but responses can include a warning so callers know to chunk work if needed.
BATCH_ROW_SOFT_LIMIT = 5000

