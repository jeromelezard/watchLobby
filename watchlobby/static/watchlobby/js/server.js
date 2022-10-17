//django backend variables 

const room_name = JSON.parse(document.getElementById('room_url').textContent); 
const vid_id = JSON.parse(document.getElementById('current_vid').textContent); 
const current_user = JSON.parse(document.getElementById('current_user').textContent); 

//html attribute variables
let user_header = document.getElementById('current_username');
const chat_box = document.getElementById('chat_box_list');
const send_message = document.getElementById('submit')
const message_box = document.getElementById('input');
const chat_input_div = document.getElementById('chat_input');
const user_list = document.getElementById('user_list');
const user_count = document.getElementById('user_count');
const chat_notify = document.getElementById('chat_notify');
const chat_notify_fullscreen = document.getElementById('chat_notify_fullscreen');

// determines if a notification dot should be shown
let minimized = true;
let on_user_tab = false; 


// make websocket connection 
const webSocket = new WebSocket(
    'ws://' + window.location.host + 
    '/ws/room/' + 
    room_name + 
    '/'
);

/** 
 * TODO: once backend user system reworked 
 * * make sure place of video sent out after user buffers, so they get taken to the right place
 * * when user loads, video plays at where video is playing for other users, or paused if all paused
 * * fix username change
 * 
 * TODO BIG:
 *  chat overlay when fullscreen
 * 
 * TODO: smaller fixed
 *  change tab design (?)
 *  find workaround for fullscreen control bar bug
 *  make control bar same size as user input
 *  MAKE IFRAME RESPONSIVE 
 *  make mobile friendly
 *  fix video time bug, check for hours
 * * fix change url input from being selected (make display none)
 *  dont disappear control bar when mouse is hovered over it 
 *  fix scroll bar on chat
 *  format js file properly
*/

function send_payload(action, value) {
    webSocket.send(JSON.stringify({
        'action': action,
        'value': value,
    }));
}

//send message to webocket on click or enter
message_box.addEventListener('keyup', e => {
    if (e.key == "Enter") {  
        send_message.click();
    }
});

send_message.addEventListener('click', () => {
    //if the users chat message is empty dont bother sending to websocket
    if (message_box.value.length === 0) return;

    //send message to websocket and clear the input field
    send_payload('message', message_box.value);
    message_box.value = '';
}); 
    


//handle all the cases of what has been sent to the websocket
webSocket.onmessage = function (e) {
    //store object received from the websocket into variable
    const data = JSON.parse(e.data);
    
        switch (data.type) {
            case "chat_message":
                if (data.message.length > 0) {
                    create_message(data.message, data.user);
                }
                break;
            case "user_list":

                console.log("user joining: ", data.users);
                for (let i = 0; i < data.users.length; i++) {
                    add_online_user(data.users[i]);
                }
                break;

            case "user_join":
                add_online_user(data.user);
                break; 

            case "user_leave":
                remove_online_user(data.user);
                break;

            case "username_change":
                console.log("username change", data);
                change_username(data.old_username, data.new_username);
                break;

            case "url_change":
                player.loadVideoById(data.new_url, 0);
                player.seekTo(0, true);
                break;

            case "play_pause":
                if (data.control == "play") player.playVideo();
                if (data.control == "pause") player.pauseVideo();
                break;

            case "seek":
                let time = data.time.substring(data.time.indexOf(':') + 1);
                console.log("Time to seek to ", time);
                player.seekTo(time, true);
                break;
        }       
}

let username_tags = {};
if (username_tags[current_user] == null) {
    username_tags[current_user] = [];
    username_tags[current_user].push(user_header);
    
}





/**
* * display the message received by the websocket in the <ul> 
*/
var create_message = function(input, user) {
    // create list elements for the message itself and the username that sent it
    let chat_message = document.createElement('li');
    let chat_user = document.createElement('li');

    // if user that sent message is not in the array of all users in the room then create a new array for them
    if (username_tags[user] == null) {
        username_tags[user] = [];
    }

    //handle case of whether the client has sent the message or a different user
    if (user == current_user) {
        // if the client is the one sending the message, put specific classes on the message and username to position them correctly
        chat_message.classList.add('client_message');
        chat_user.classList.add('client_user', 'name');

    } else {
        // if the message received is from other user, add classes to position them of the left of the ul
        chat_message.classList.add('foreign_message');
        chat_user.classList.add('foreign_user', 'name');
    }

    //push the tags of any time the username is written to the users array, so changing all instances of the username is simpler
    username_tags[user].push(chat_user);
    
    //hide the name of the user if they are sending multiple messages in a row
    if (chat_box.lastElementChild.classList.contains('client_message') && !chat_message.classList.contains('foreign_message')) {
        chat_user.classList.add('hide');
    }
    if (chat_box.lastElementChild.classList.contains('foreign_message') && !chat_message.classList.contains('client_message')) {
        chat_user.classList.add('hide');
    }

    // after the elements are created and classes set, set the actual text content of the list elements
    chat_user.innerHTML = user;
    chat_message.innerHTML = input;

    // add the list items to the whole unordered list to be displayed
    chat_box.appendChild(chat_user);
    chat_box.appendChild(chat_message);

    // show a notification alert if the user is not on the chat tab
    if (on_user_tab == true) {
        chat_notify.style.display = 'inline-block';
    }

    // show notification on the fullscreen chatbox tab if a message is received but the chatbox is not open
    if (minimized == true) {
        chat_notify_fullscreen.style.display = 'inline-block';
    }
}


/**
 * change all front end instances of the users name thats being changed
 * @param old_username the users current username that will be changed
 * @param new_usernam the name the user wishes to change to 
 */
function change_username(old_username, new_username) {
    //cycles through the array of tags for that user and changes the text content
    for (let i = 0; i < username_tags[old_username].length; i++) {
        username_tags[old_username][i].innerHTML = new_username;
    }

    //updates that array to correspond to the new username instead of old
    username_tags[new_username] = username_tags[old_username];

    //delete instance of old username 
    delete username_tags[old_username];
}

/**
 * adds a new user to the unordered list of all the users in the room
 * @param value the username of the user joining
 * @returns nothing
 */
function add_online_user(value){
    // if the user is already in the list, do not add name
    if (document.getElementById(value)) return;

    // create array of username tags if it doesnt already exist
    if (username_tags[value] == null) {
        username_tags[value] = [];
    }

    // create list item that will display in the chatbox that a user has joined 
    let new_join = document.createElement('li');

    // create span that will contain only the username, so that it can be changed if the user changes their username
    let new_join_username = document.createElement('span');
    new_join_username.innerHTML = value;

    // add the joining message that contains the username into the chat 
    new_join.append(new_join_username);
    new_join.append(' joined the room');

    // assign class and id for the message
    new_join.classList.add('new_join');
    new_join.id = `${value}_join`;

    // push instance to the users array of tags since the username appeared
    username_tags[value].push(new_join_username);  
    chat_box.appendChild(new_join);
    
    // add new user to the list of users online
    let new_option = document.createElement('li');
    new_option.id = value;
    new_option.classList.add('user_list_item');
    username_tags[value].push(new_option);
    new_option.innerHTML = value;
    user_list.appendChild(new_option);

    // update the number of users online, taking away one since the title counts as a list element
    user_count.innerHTML = user_list.getElementsByTagName('li').length - 1;

}

/**
 * remove user from the user list when they disconnect from the websocket
 * @param {*} value the name of the user that left
 */
function remove_online_user(value){
    // create username tag array if it doesnt exist
    if (username_tags[value] == null) {
        username_tags[value] = [];
    }
    
    // find the list item of the user that left and remove it and update the count of users
    let old_option = document.getElementById(value);
    if (old_option !== null) user_list.removeChild(old_option);
    user_count.innerHTML = user_list.getElementsByTagName('li').length - 1;
    
    // create chat message saying the user left, while adding it to the tag array since the user may join back and change their username
    let new_leave = document.createElement('li');
    let new_leave_username = document.createElement('span');
    new_leave_username.innerHTML = value;
    new_leave.append(new_leave_username);
    new_leave.append(' left the room')
    new_leave.classList.add('new_join');
    new_leave.id = `${value}_leave`;
    username_tags[value].push(new_leave_username);
    chat_box.appendChild(new_leave);
}

// if the user views the list of users, hide the chat
document.getElementById('users_button').addEventListener('click', e => {
    on_user_tab = true;
    chat_box.style.display = 'none';
    chat_input_div.style.display = 'none';
    user_list.style.display = 'flex';
});

// if the user views the chat again, hide the user list and hide notification dot if it there
document.getElementById('chat_button').addEventListener('click', e => {
    on_user_tab = false;
    chat_box.style.display = 'flex';
    chat_input_div.style.display = 'flex';
    user_list.style.display = 'none';
    chat_notify.style.display = 'none';
});

// changing username
document.getElementById('username_submit').addEventListener('click', e => {
    let new_username = document.getElementById('username_input_text').value;

    // hide dropdown input field if value is submitted
    document.getElementById('dropdown_checkbox').checked = false;
    document.getElementById('username_input_text').value = '';

    // send new username to the websocket
    send_payload('username', new_username);
});

// auto focus the text field once it comes into view
document.getElementById('change_url_text').addEventListener('click', e => {
    if (document.getElementById('change_url_checkbox').checked == false){
        document.getElementById('new_url').focus();
    }
});

// submitting new url to watch
document.getElementById('url_submit').addEventListener('click', e => {
    // extract video id from the video url
    let new_vid = getId(document.getElementById('new_url').value);

    // break out if not valid url or id
    if (new_vid == null) {
        document.getElementById('new_url').value = "";
        return;
    }

    // clear input field and hide it if successful
    document.getElementById('new_url').value = "";
    document.getElementById('change_url_checkbox').checked = false;
    send_payload('url', new_vid);
});

// allow submission by pressing enter key
document.getElementById('new_url').addEventListener('keyup', e => {
    if (e.key === "Enter") {  // enter key
        document.getElementById('url_submit').click();
    }
});

/**
 * 
 * @param {*} url normal youtube video url 
 * @returns the correct format for the url to be interpreted by the iframe API
 */
function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
    ? match[2]
    : null;
}

/**
 * initialise the iframe player according to the iframe api documentation
 */
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;
var time_total;
var timeout_setter; // set timeout variable that is used to move the progress bar every second

function onYouTubeIframeAPIReady() {
    player = new YT.Player('video_player', {
        height: '607.5',                                  
        width: '1080',                                  // TODO figure out how to change size dynamically for mobile use
        videoId: vid_id, 
        playerVars: {
            'playsinline': 1,
            'autoplay': 0,
            'disablekb': 1, // disable keyboard shortcuts 
            'controls': 0, // hide youtube default controls
            'rel': 0, // dont show related videos
            'fs': 0, // dont allow fullscreen by double clicking the video
        
    },  
    events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
    }
    });
}

function onPlayerReady(event) {
    // when loaded, volume and pause status checked to make sure video loads with correct icons
    check_volume(player.getVolume());
    check_pause();

    // move the custom progress bar to correct position
    move_progress();
} 

/**
 * runs when any change occurs with the youtube video:
 * pausing, playing, buffering, ending video, starting video
 * @param event data on what changed the player state
 */
function onPlayerStateChange(event) {
    check_volume(player.getVolume());
    check_pause();
    if (event.data == YT.PlayerState.PAUSED) {
        // hide the overlay div when paused so the user can close the "more videos" option that appears that cannot be disabled
        document.getElementById('player_overlay').style.display = "none";

        // if the event thats fired is pausing, pause video for all users connected
        send_payload('play_pause', 'pause');
        clearTimeout(timeout_setter);
    } 

    if (event.data == YT.PlayerState.PLAYING) {
        // re set the overlay 
        document.getElementById('player_overlay').style.display = "block";

        send_payload('play_pause', 'play');
        move_progress();
    }
    if (event.data == YT.PlayerState.ENDED) {
        clearTimeout(timeout_setter);
    }
}

const checkbox = document.getElementById('open_chat_checkbox');
const open_chat = document.getElementById('open_chat');
const player_container = document.getElementById('player_container_id');
const bar = document.getElementById('bar');
const barProgress = document.getElementById('bar_progress');
const handle = document.getElementById('handle');
const bar_container = document.getElementById('bar_container');
const video_progress = document.getElementById('video_time');
const chat_container = document.getElementById('chat_container');


let isDragging = false;
bar.addEventListener('mousedown', event => {
    isDragging = true;
    event.preventDefault()
})

bar.addEventListener('click', seek);

window.addEventListener('mousemove', event => {
    // detect whenever mouse is moved but only act when the user is clicked on the progress bar
    if (!isDragging) return;

    event.preventDefault()
    seek(event);
});

window.addEventListener('mouseup', event => {
    // stop moving the progress bar
    event.preventDefault();
    isDragging = false;
});

/**
 * move the progress bar when clicked or dragged, change the video to the corresponding time
 * @param event mouse event data used to determine postition of cursor
 */
function seek(event) {
    // get position of cursor relative to where the progress bar starts
    let x = event.pageX - bar.getBoundingClientRect().left;
    let width = bar.offsetWidth;
    let percent = x / width;
    if (percent > 1) percent = 1;
    if (percent < 0) percent = 0;

    // change width of div inside the progress bar to move along with wherever the mouse is dragging it to 
    barProgress.style.width = `${(percent * 100)}%`;

    // find the time the user has changed the video to and set the text in the video player to display it
    video_progress.innerHTML = convert_to_mins_and_secs(Math.round(percent * player.getDuration()), 0) + ' : ' + convert_to_mins_and_secs(player.getDuration(), 1); 

    // send new time of the video to the websocket, to move the video for all users
    let new_time = Math.round(player.getDuration() * percent);
    send_payload('seek', `${new_time}`);
}

/**
 * converts the lenght of the youtube video into the standard hour minute second format
 * @param {*} seconds length of the current video being played in seconds
 * @param {*} minus1 boolean to determind if 1 seconds should be taken away to correct problem with iframe api
 * @returns the formatted length of the video
 */
function convert_to_mins_and_secs(seconds, minus1){ 
    var is_hour = (seconds >= 3600) ? true : false;
    var mins    = (seconds>60) ? Math.floor(seconds/60):0;
    var secs    = (seconds%60!=0) ? Math.floor(seconds%60):0;
    var secs    = (minus1==true) ?(secs-1):secs; 
    if (is_hour) {
        var hours = Math.floor(seconds/3600);
        var total_mins = (seconds>60) ? Math.floor(seconds/60) : 0;
        var mins = (total_mins%60!=0) ? Math.floor(total_mins%60):0;
        var time    = `${hours}:${((mins<10)?"0"+mins:mins)}:${((secs<10)?"0"+secs:secs)}`;
    } else {
        var time    = `${mins}:${((secs<10)?"0"+secs:secs)}`;
    }
    return time;
}

/**
 * moves the progress bar of the video while it is playing
 */
function move_progress(){
    if (player.getPlayerState() !== 1){
        clearInterval(timeout_setter);
        return;
    }
    let current_time = convert_to_mins_and_secs(player.getCurrentTime(), 0);
    barProgress.style.width = (player.getCurrentTime()/player.getDuration())*100+"%";
    video_progress.innerHTML = current_time + " : " + convert_to_mins_and_secs(player.getDuration(), 1);
    timeout_setter = setTimeout(move_progress, 1000);
}



/**
 * * moving the volume bar, repeats draggable bar code and logic from the progress bar 
 */

const volume_button = document.getElementById('volume_icons');
const volume_bar = document.getElementById('volume_bar');
const volume_progress = document.getElementById('volume_progress');

let volume_dragging = false;
volume_bar.addEventListener('mousedown', event => {
    volume_dragging = true;
    event.preventDefault()
})

volume_bar.addEventListener('click', change_volume);

window.addEventListener('mousemove', event => {
    if (!volume_dragging) return;
    event.preventDefault()
    change_volume(event);
});

window.addEventListener('mouseup', event => {
    event.preventDefault();
    volume_dragging = false;

});

function change_volume(event) {

    let y = volume_bar.getBoundingClientRect().bottom - event.pageY;
    let height = volume_bar.offsetHeight;
    let percent = y / height;
    if (percent > 1) percent = 1;
    if (percent < 0) percent = 0;
    let volume =  percent * 100;
    volume_progress.style.height = `${(volume)}%`;
    player.setVolume(volume);

    // checks which volume icon to use
    check_volume(volume);

}

/**
 * changes the volume icon depending on the volume they set
 * @param volume the new volume of the video for the client
 */
function check_volume(volume) {
    if (volume < 50 && volume > 0) {
        document.getElementById('volume_up').style.display = 'none';
        document.getElementById('volume_down').style.display = 'flex';
        document.getElementById('volume_mute').style.display = 'none';
    } else if (volume == 0 || player.isMuted()) {
        document.getElementById('volume_up').style.display = 'none';
        document.getElementById('volume_down').style.display = 'none';
        document.getElementById('volume_mute').style.display = 'flex';
    } else {
        document.getElementById('volume_up').style.display = 'flex';
        document.getElementById('volume_down').style.display = 'none';
        document.getElementById('volume_mute').style.display = 'none';
    }
}

// if volume icon clicked, toggle mute
volume_button.addEventListener('click', e => {
    if (player.isMuted()) {
        player.unMute()

        // if unmuting, get the volume the user had the player at before they muted it.
        let volume = player.getVolume();

        // set height of volume bar to old volume and check which icon it corresponds to
        volume_progress.style.height = `${volume}%`;
        check_volume(volume);

    } else {
        // mute player
        player.mute();
        volume_progress.style.height = '0%';

        // set icon to muted
        check_volume(0);
    }
});

// check whether to play or pause video if button is clicked or if overlay is clicked
document.getElementById('play_pause').addEventListener('click', play_or_pause);
document.getElementById('player_overlay').addEventListener('click', play_or_pause);



/**
 * checks whether to play video or pause
 * since the iframe api allows users to click on the video itself to pause, 
 * this function is used as a check to see if the video is playing or not to choose the right icon
*/
function check_pause() {
    if (player.getPlayerState() == -1 || player.getPlayerState() == 2 || player.getPlayerState() == 5) {
        document.getElementById('play').style.display = 'block';
        document.getElementById('pause').style.display = 'none';
        return 1;
    }
    else if (player.getPlayerState() == 1) {
        document.getElementById('pause').style.display = 'block';
        document.getElementById('play').style.display = 'none';
        return 0;
    }
}

/**
 * uses result from previous function to send data to websocket
 */
function play_or_pause() {
    if (check_pause() == 1) {
        send_payload('play_pause', 'play');
    } else if (check_pause() == 0) {
        send_payload('play_pause', 'pause');
    }
}

// fullscreen when f key is pressed anywhere 
// ? bug event not fired when key is pressed after playing the video
window.addEventListener('keyup', evt => {
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'];
    evt = evt || window.event;

    // ignore when user is typing in input fields
    if (!formElements.includes(evt.target.tagName) && evt.key == "f") {
      toggle_fullscreen();
    } 
});
    
/**
 * check if fullscreen, different browsers use different methods so all must be checked
 */
function toggle_fullscreen() {
    if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    ) {
        // exit fullscreen
        if (document.exitFullscreen) {
        document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        }

    } else {
        // enter fullscreen
        if (player_container.requestFullscreen) {
        player_container.requestFullscreen();
        } else if (player_container.mozRequestFullScreen) {
        player_container.mozRequestFullScreen();
        } else if (player_container.webkitRequestFullscreen) {
        player_container.webkitRequestFullscreen(player_container.ALLOW_KEYBOARD_INPUT);
        } else if (player_container.msRequestFullscreen) {
        player_container.msRequestFullscreen();
        }
        
    }
}


// since the exit or F key can be used to exit fullscreen this needs to be detected
player_container.addEventListener('fullscreenchange', e => {
    if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    ) {
        // when the user goes into fullscreen hide the chat overlay by default
        minimized = true;

        //add class to chat container to change appearance for when inside the video
        chat_container.classList.add('chat_overlay');

        // set to hidden
        chat_container.style.height = '0';
        chat_container.style.opacity = '0';

        // add X button to chat to allow user easy way to minimise it 
        document.getElementById('close_chat').style.display = 'block';

        // change fullscreen icons
        document.getElementById('fullscreen').getElementsByTagName('svg')[0].style.display = 'none';
        document.getElementById('fullscreen').getElementsByTagName('svg')[1].style.display = 'block';

        // move chat container to inside the player overlay
        player_container.append(chat_container);

    } else {
        // exiting full screen

        // reset chat overlay settings to normal  
        minimized = false;
        checkbox.checked = false;
        chat_container.classList.remove('chat_overlay');

        // remove X button 
        document.getElementById('close_chat').style.display = 'none';

        // move chat back to next to the video
        document.getElementById('room_container').append(chat_container);

        //change fullscreen icons
        document.getElementById('fullscreen').getElementsByTagName('svg')[0].style.display = 'block';
        document.getElementById('fullscreen').getElementsByTagName('svg')[1].style.display = 'none';

        // make sure chat not hidden
        chat_container.style.height = '100%';
        chat_container.style.opacity = '1';
    }
});

// ! control bar still disappearing even though overlay should not be present

// remove or add control bar when mouse not over video
player_container.addEventListener('mouseenter', e => {
    bar_container.style.opacity = '1';
});

player_container.addEventListener('mouseleave', e => {
bar_container.style.opacity = '0';
});

// set time to remove control bar when user is inactive 
let timer;
document.getElementById('player_overlay').addEventListener('mousemove', e => {
    bar_container.style.opacity = '1';
    document.getElementById('player_overlay').style.cursor = 'auto';
    clearTimeout(timer);
    timer = setTimeout(function() {
        console.log('stopped');
        bar_container.style.opacity = '0';
        document.getElementById('player_overlay').style.cursor = 'none';

    }, 2000);
});
bar_container.addEventListener('mouseenter', () => {
    clearTimeout(timer);
});

// detect when user opens chat box when fullscreen
checkbox.addEventListener('click', e=> {
    toggle_chat(checkbox.checked);
});

/**
 * whether the chatbox should be opened or closed based on the invisible checkbox input that is connected to the icon
 * @param checked if checked true open chat, if false close chat
 */
function toggle_chat(checked) {
    if (checked) { 
        minimized = false;   
        chat_notify_fullscreen.style.display = 'none'; 
        chat_container.style.height = '600px';
        chat_container.style.opacity = '1';
    } else {
        minimized = true;
        chat_container.style.height = '0';
        chat_container.style.opacity = '0';    
    }
}
