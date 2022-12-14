import time
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from asgiref.sync import async_to_sync
from .models import *
from channels.generic.websocket import WebsocketConsumer
import math



class ChatRoomConsumer(WebsocketConsumer):
    
    rooms = {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(args, kwargs)
        self.room_name = None
        self.room_group_name = None
        self.room = None
        self.user = None
    

    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        self.room = ChatRoomConsumer.rooms[self.room_name]
        self.user = self.scope['session']['username']
        self.accept()
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, 
            self.channel_name
        )
        print("connected")
        # stop running if already in room 

        if self.user is not None:
            #if self.user not in self.room['users']:
            self.room['users'].append(self.user)
            
            # send the join event to the room
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'user': self.user,
                }
            )
            

        self.send(json.dumps({
            'type': 'room_info',
            'dict': json.dumps(ChatRoomConsumer.rooms[self.room_name], default=str),
        }))

    def disconnect(self, close_code):

        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

        if self.user is not None:

            # send the leave event to the room
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'user': self.user,
                    'user_list': json.dumps(ChatRoomConsumer.rooms[self.room_name], default=str),
                }
            )
            self.room['users'].remove(self.user)    



    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        if action == "message":
            async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': text_data_json['value'],
                        'user': self.user,
                    }
                )

        elif action == "username":
            async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'username_change',
                        'old_username': self.user,
                        'new_username': text_data_json['value'],
                    }
                )
            self.user = text_data_json['value']

        elif action == "url":
            self.room['video_id'] = text_data_json['value']
            self.room['status'] = 1
            self.room['last_time'] = 0
            self.room['timestamp'] = math.floor(time.time())

            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'url_change',
                    'new_url': text_data_json['value'],
                }
            )

        elif action == "pause":

            self.room['status'] = 0
            self.room['last_time'] = text_data_json['time']
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'pause',
                    'control': text_data_json['value'],
                }
            )
            

        elif action == "play":
            self.room['status'] = 1
            self.room['timestamp'] = math.floor(time.time())
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'play',
                    'control': text_data_json['value'],
                }
            )
            
        elif action == "seek":
            self.room['last_time'] = int(text_data_json['value'])
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

    def play(self, event):
        self.send(text_data=json.dumps(event))
    def pause(self, event):
        self.send(text_data=json.dumps(event))
    def seek(self, event):
        self.send(text_data=json.dumps(event))
    pass