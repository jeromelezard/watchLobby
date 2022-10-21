from django.shortcuts import render
import time
import json
import math
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from .models import *
from .consumers import ChatRoomConsumer
import secrets
from datetime import datetime
from django.urls import reverse

# Create your views here.
def index(request):
    try:
        request.session['username'] 
    except:
        request.session['username'] = 'User-' + secrets.token_hex(nbytes=2).upper()
        
    return render(request, "watchlobby/index.html")


def room(request, room_name):
    try:   
        room_info = ChatRoomConsumer.rooms[room_name]
    except:
        return HttpResponseRedirect(reverse('error'))
    try:
        request.session['username']
    except:
        request.session['username'] = 'User-' + secrets.token_hex(nbytes=2).upper()

    #if request.session['username'] in room_info['users']:
    #    return HttpResponseRedirect(reverse('error'))

    print("from views.py ", room_info)
    video_id = room_info['video_id']
    last_time = room_info['last_time']
    status = room_info['status']
    timestamp = room_info['timestamp']
    
    return render(request, "watchlobby/room.html", {
        'video_id': video_id,
        'last_time': str(last_time),
        'status': str(status),
        'timestamp': str(timestamp),
    })

def error(request):
    return render(request, 'watchlobby/error.html')


@csrf_exempt
def create_room(request):
    room_id = uuid.uuid4()
    new_room = {str(room_id): {
        'video_id': 'fXb02MQ78yQ',
        'users': [],
        'status': 0, # 1 for playing, 0 for paused
        'last_time': 0, # seconds of the video elapsed when paused or when last played by user
        'timestamp': math.floor(time.time()),
    }}

    ChatRoomConsumer.rooms.update(new_room)
    print("from views create ", ChatRoomConsumer.rooms)
    return JsonResponse({'room_url': str(room_id)})

@csrf_exempt
def change_username(request):
    data = json.loads(request.body)
    room_name = data.get('room_name')
    username = data.get('username') 
    if data.get('username') in ChatRoomConsumer.rooms[room_name]['users']:
        return JsonResponse({'error': 'username taken'})
    ChatRoomConsumer.rooms[room_name]['users'] = list(map(lambda x: x.replace(request.session['username'], username), ChatRoomConsumer.rooms[room_name]['users']))
    request.session['username'] = username
    request.session.modified = True
    return JsonResponse({'response': 'username changed'})


