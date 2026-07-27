web: gunicorn config.wsgi --workers 4 --max-requests 1200
release: python manage.py migrate --settings=config.settings.prod
