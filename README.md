# Final Project: WatchLobby

## About

I have decided to create a website that utilises a very useful feature of modern web protocols: Websockets. My project allows users to watch youtube videos in sync with multiple other users just by sending over the url of the page. This is done extremely quickly with minimal unnecessary user interface clutter. All that needs to be done is paste in a youtube URL into the "change video" tab, and the site will instantly start playing the video for all that are in that particular lobby. A chat feature allows instant communication with everyone in the room, with the chat also being able to be displayed over the video if the user is in fullscreen. By clicking on your username in the top corner you can easily change your randomly generated username into anything you like as long as no other user in the room has the same name, and the name is not empty.

## Distinctiveness and Complexity

The project is sufficiently distinct from others in the course as it is built ontop of an API that is not touched on at all in the course: the WebSocket API. As well as this it has to utilise a Django plugin called Channels to allow it to function, another which is unlike anything in the course. The project is also distinct from competitors, the main competitor being 'WatchTogether'. The user interface of WatchTogether has several shortcomings that my project overcomes. For example, in WatchTogether you cannot play or pause a video by clicking on the video itself, you must click the actual play/pause button in the bottom left corner. You also cannot see the control bar when full screen, or the chat feature. These features as well as many more severely hinder the user experience and is why my project remains a distinct competitor.

In terms of complexity, my project has implemented a complex Django back-end that is not covered in the course in anyway. The idea of channel layers and consumers in 'consumers.py', as well as the manipulation and handling of the websocket data in the JavaScript file takes this project steps ahead of the previous projects in this course. Due to the shortcoming of the YouTube iFrame API that I had to use, there were many roadblocks put in place by YouTube that I had to manoeuvre around to make the project work. For example, a custom control bar had to be created solely because the API does not have an event listener for when a user seeks to a new time in the video. Another example is that iFrames do not allow JavaScript event handlers on top of them, meaning that by standard convention, causing the mouse to disappear when playing the video or if the user is inactive was not possible.

## Each File

Within the Core folder, new files are needed to allow the Channels and Websocket features to work:
For example in the watchlobby folder, routing.py acts similarly to the standard django urls.py. The difference being that routing.py is setting up paths for the websocket rather than the views file. Routing.py uses Regex to direct the websocket route defined in the JavaScript code, and direct it to the "ChatRoomConsumer" class in the "consumers.py" file.

The routing.py file in the "core" folder is necessary for the Channels plugin, simply telling the Django backend to allow the other routing.py file to run as middleware.

The main new file in this project that is not seen in the CS50w course is "consumers.py". This is the main backend file of the project. This file handles all cases of user interaction to the websocket. When a user connects, the "connect" function is automatically run, setting up the room the user has connected to or created, and sending the information back to the user. These functions are all run asynchronously, to allow smooth user experience with no lag. This file also handles custom websocket events that are created in the server.js file. These include actions like changing a username or changing the url, or controlling the video. These actions are received by a single user, and then sent back to all users in the same room, allowing changes to happen instantaneously among all users.

In the static folder within the watchlobby folder, we will find the CSS file and the javascript file. The CSS is actually written is SCSS to allow easier code writing, and a better design. Within "server.js" we have the bulk of the project, handling every bit of user experience, from showing notification icons to controlling the video. This is the file in which we make a connection to a websocket, that is then recieved by the Django backend, which then allows us to send instantaneous messages to the front and back end, and thus all users connected to that backend.

## How to run

After installing the requirements in requirements.txt, all that is needed to do is start a virtual environment by running:

> python -m venv venv

> venv\Scripts\activate

Then:

> python manage.py runserver

### Additional information

Due to requirements from Google, videos cannot autoplay unless they are muted, hence why unmuting videos when you join a room is necessary.
