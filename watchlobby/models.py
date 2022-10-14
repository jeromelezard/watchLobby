from django.db import models
from django.contrib.auth.models import User
import uuid


    
class Username(models.Model):
    username = models.CharField(max_length=16)
    room_connected = models.ManyToManyField('Room', blank=True)    
    
    def __str__(self):
        return self.username


class Room(models.Model):
    room_url = models.UUIDField(default=uuid.uuid4)
    current_vid = models.CharField(max_length=256, blank=True, null=True, default="MBzi6hRrkww")
    online = models.ManyToManyField(Username, blank=True)
    
    def get_online_count(self):
        return self.online.count()

    def join(self, user):
        self.online.add(user)
        self.save()

    def leave(self, user):
        self.online.remove(user)
        self.save()

    def __str__(self):
        return f'{self.room_url} ({self.get_online_count()})'
