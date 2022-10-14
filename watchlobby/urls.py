from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('room/<str:room_name>/', views.room, name='room'),
    path('error', views.error, name='error'),   
    #fetch urls
    path('create_room', views.create_room, name='create_room'),
    path('change_username', views.change_username, name='change_username'),
]