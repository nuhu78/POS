web: gunicorn config.wsgi --workers 4 --max-requests 1200 --bind 0.0.0.0:${PORT:-8000}
release: python manage.py migrate --settings=config.settings.prod && python manage.py ensure_superuser --settings=config.settings.prod
