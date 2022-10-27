from django.db import models
import uuid


class Room(models.Model):
    room_url = models.UUIDField(default=uuid.uuid4)
    current_vid = models.CharField(max_length=256, blank=True, null=True, default="MBzi6hRrkww")
    
  