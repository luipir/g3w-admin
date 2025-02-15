from __future__ import absolute_import
# This will make sure the Celery app is always imported when
# Django starts so that shared_task will use this app.
from .celery import app as celery_app
__all__ = ('celery_app',)

__version__ = (1, 2, 0, 'unstable', 0)