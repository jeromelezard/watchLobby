from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import async_to_sync
from .models import *
from channels.generic.websocket import WebsocketConsumer
class ChatRoomConsumer(WebsocketConsumer):
    
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_name = None
        self.room_group_name = None
        self.room = None
        self.user = None
    

    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        self.room = Room.objects.get(room_url=self.room_name)
        #self.user = self.scope['session']['username']
        self.user = Username.objects.get(username=self.scope['session']['username'])
        self.accept()
        
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, 
            self.channel_name
        )
        print("connected")
        
        if self.user is not None:
            
            # send the join event to the room
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'user': self.user.username,
                }
            )
        
            self.room.online.add(self.user)
 
        self.send(json.dumps({
            'type': 'user_list',
            'users': [username.username for username in self.room.online.all()],
        }))

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

        if self.user is not None:
            print("user leaving room")

            # send the leave event to the room
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.user.username,
                }
            )
            self.room.online.remove(self.user)


    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        if action == "message":
            async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': text_data_json['value'],
                        'user': self.user.username,
                    }
                )
        elif action == "username":
            
            async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'username_change',
                        'old_username': self.user.username,
                        'new_username': text_data_json['value'],
                    }
                )
        elif action == "url":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'url_change',
                    'new_url': text_data_json['value'],
                }
            )
        elif action == "play_pause":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'play_pause',
                    'control': text_data_json['value'],
                }
            )
        elif action == "seek":
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'seek',
                    'time': text_data_json['value'],
                }
            )
    def chat_message(self, event):
        self.send(text_data=json.dumps(event))


    def user_join(self, event):
        self.send(text_data=json.dumps(event))


    def user_leave(self, event):
        self.send(text_data=json.dumps(event))

    def username_change(self, event):
        self.send(text_data=json.dumps(event))

    def url_change(self, event):
        self.send(text_data=json.dumps(event))

    def play_pause(self, event):
        self.send(text_data=json.dumps(event))
    def seek(self, event):
        self.send(text_data=json.dumps(event))
    pass