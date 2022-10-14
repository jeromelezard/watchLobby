from django.shortcuts import render
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from .models import *
import secrets
from django.urls import reverse

# Create your views here.
def index(request):
    try:
        request.session['username']
    except:
        request.session['username'] = 'User-' + secrets.token_hex(nbytes=2).upper()
        new_user = Username(username=request.session['username'])
        new_user.save()
    print(request.session['username'])
    return render(request, "watchlobby/index.html")


def room(request, room_name):
    try:   
        room_info = Room.objects.get(room_url=room_name)
    except:
        return HttpResponseRedirect(reverse('error'))
    try:
        request.session['username']
    except:
        request.session['username'] = 'User-' + secrets.token_hex(nbytes=2).upper()
        new_user = Username(username=request.session['username'])
        new_user.save()

    
    # if room_info not in Username.objects.get(username=request.session['username']).room_connected.all():
        # new_room = Username.objects.get(username=request.session['username'])
        # new_room.room_connected.add(room_info)
    return render(request, "watchlobby/room.html", {
        'room_info': room_info,
    })

def error(request):
    return render(request, 'watchlobby/error.html')


@csrf_exempt
def create_room(request):
    new_room = Room()
    new_room.save()
    return JsonResponse({'room_url': str(new_room.room_url)})

@csrf_exempt
def change_username(request):
    
    return JsonResponse({'response': 'username changed'})

