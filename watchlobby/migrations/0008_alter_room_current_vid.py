# Generated by Django 4.1 on 2022-10-12 08:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('watchlobby', '0007_username_room_connected'),
    ]

    operations = [
        migrations.AlterField(
            model_name='room',
            name='current_vid',
            field=models.CharField(blank=True, default='akHD_O_11Uo', max_length=256, null=True),
        ),
    ]