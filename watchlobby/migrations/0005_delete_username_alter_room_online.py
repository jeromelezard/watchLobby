# Generated by Django 4.1 on 2022-10-05 09:29

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('watchlobby', '0004_username_alter_room_online'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Username',
        ),
        migrations.AlterField(
            model_name='room',
            name='online',
            field=models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL),
        ),
    ]
