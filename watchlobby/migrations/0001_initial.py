# Generated by Django 4.1 on 2022-09-03 10:48

from django.conf import settings
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Room',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('room_url', models.UUIDField(default=uuid.uuid4)),
                ('current_vid', models.CharField(blank=True, default='8PhdfcX9tG0', max_length=256, null=True)),
                ('online', models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
