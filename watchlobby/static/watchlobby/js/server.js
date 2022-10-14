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
 * * chat overlay when fullscreen
 * 
 * TODO: smaller fixed
 *  change tab design (?)
 * * find workaround for fullscreen control bar bug
 * * make control bar same size as user input
 *  MAKE IFRAME RESPONSIVE 
 *  make mobile friendly
 *  fix video time bug, check for hours
 * * fix change url input from being selected (make display none)
*/

function socketSend(action, value) {
    webSocket.send(JSON.stringify({
        'action': action,
        'value': value,
    }))
}

//send message to webocket on click or enter
message_box.onkeyup = function(e) {
    if (e.keyCode === 13) {  // enter key
        send_message.click();
    }
};
send_message.onclick = function (e) {
    if (message_box.value.length === 0) return;
    socketSend('message', message_box.value);
    message_box.value = '';
}

//handle all the cases of what has been sent to the websocket
webSocket.onmessage = function (e) {
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




// *all functions handling events from websocket messages

//display the message received by the websocket in the <ul>
var create_message = function(input, user) {
    let chat_message = document.createElement('li');
    let chat_user = document.createElement('li');
    if (username_tags[user] == null) {
        username_tags[user] = [];
    }
    //handle case of whether the client has sent the message or a different user
    if (user == current_user) {
        chat_message.classList.add('client_message');
        chat_user.classList.add('client_user', 'name');

    } else {
        chat_message.classList.add('foreign_message');
        chat_user.classList.add('foreign_user', 'name');
    
    }
    username_tags[user].push(chat_user);
    console.log(username_tags);
    
    //hide the name of the user if they are sending multiple messages in a row
    if (chat_box.lastElementChild.classList.contains('client_message') && !chat_message.classList.contains('foreign_message')) {
        chat_user.classList.add('hide');
    }
    if (chat_box.lastElementChild.classList.contains('foreign_message') && !chat_message.classList.contains('client_message')) {
        chat_user.classList.add('hide');
    }
    chat_user.innerHTML = user;
    chat_message.innerHTML = input;
    chat_box.appendChild(chat_user);
    chat_box.appendChild(chat_message);

    //show a notification alert if the user is not on the chat tab
    if (on_user_tab == true) {
        chat_notify.style.display = 'inline-block';
    }
    if (minimized = true) {
        chat_notify_fullscreen.style.display = 'inline-block';
    }
}

function change_username(old_username, new_username) {
    for (let i = 0; i < username_tags[old_username].length; i++) {
        username_tags[old_username][i].innerHTML = new_username;

    }
    username_tags[new_username] = username_tags[old_username];
    delete username_tags[old_username];
    console.log("updated dict ", username_tags);
}

//add user to user list once they join the websocket connection
function add_online_user(value){
    if (document.getElementById(value)) return;
    if (username_tags[value] == null) {
        username_tags[value] = [];
    }
    let new_join = document.createElement('li');
    let new_join_username = document.createElement('span');
    new_join_username.innerHTML = value;
    new_join.append(new_join_username);
    new_join.append(' joined the room');
    new_join.classList.add('new_join');
    new_join.id = `${value}_join`;
    username_tags[value].push(new_join_username);  
    chat_box.appendChild(new_join);
    
    let new_option = document.createElement('li');
    new_option.id = value;
    new_option.classList.add('user_list_item');
    
    username_tags[value].push(new_option);

    new_option.innerHTML = value;
    user_list.appendChild(new_option);
    user_count.innerHTML = user_list.getElementsByTagName('li').length - 1;

}
function remove_online_user(value){
    if (username_tags[value] == null) {
        username_tags[value] = [];
    }
    
    let old_option = document.getElementById(value);
    if (old_option !== null) user_list.removeChild(old_option);
    user_count.innerHTML = user_list.getElementsByTagName('li').length - 1;
    
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


//dynamic onclick handlers 

document.getElementById('users_button').addEventListener('click', e => {
    on_user_tab = true;
    chat_box.style.display = 'none';
    chat_input_div.style.display = 'none';
    user_list.style.display = 'flex';
});

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
    document.getElementById('dropdown_checkbox').checked = false;
    document.getElementById('username_input_text').value = '';
    socketSend('username', new_username);
});
document.getElementById('change_url_text').addEventListener('click', e => {
    if (document.getElementById('change_url_checkbox').checked == false){
        
        document.getElementById('new_url').focus();
    }
})
document.getElementById('url_submit').addEventListener('click', e => {
    let new_vid = getId(document.getElementById('new_url').value);
    if (new_vid == null) {
        document.getElementById('new_url').value = "";
        return;
    }
    document.getElementById('new_url').value = "";
    document.getElementById('change_url_checkbox').checked = false;
    socketSend('url', new_vid);
});

document.getElementById('new_url').onkeyup = function(e) {
    if (e.key === "Enter") {  // enter key
        document.getElementById('url_submit').click();
    }
};
function getId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11)
    ? match[2]
    : null;
}

// * initialise iframe according to the API documentation

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


var player;
var time_total;
var timeout_setter;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('video_player', {
        height: '607.5',                                  
        width: '1080',                                  // TODO figure out how to change size dynamically for mobile use
        videoId: vid_id, 
        playerVars: {
            'playsinline': 1,
            'autoplay': 0,
            'disablekb': 1,
            'controls': 0,
            'rel': 0,
            'fs': 0,
        
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
    // time_total = convert_to_mins_and_secs(player.getDuration(), 1);
    move_progress();

  } 
  function onPlayerStateChange(event) {
    check_volume(player.getVolume());
    check_pause();
    if (event.data == YT.PlayerState.PAUSED) {
        document.getElementById('player_overlay').style.display = "none";
        socketSend('play_pause', 'pause');
        clearTimeout(timeout_setter);
    } 

    if (event.data == YT.PlayerState.PLAYING) {
        document.getElementById('player_overlay').style.display = "block";

        socketSend('play_pause', 'play');
        move_progress();
    }
    if (event.data == YT.PlayerState.ENDED) {
        clearTimeout(timeout_setter);
    }
  }




// * MAKE THE PROGRESS BAR DRAGABLE
const checkbox = document.getElementById('open_chat_checkbox');
const open_chat = document.getElementById('open_chat');
const player_container = document.getElementById('player_container_id');
const bar = document.getElementById('bar');
const barProgress = document.getElementById('bar_progress');
const handle = document.getElementById('handle');
const bar_container = document.getElementById('bar_container');
const video_progress = document.getElementById('video_time');
let isDragging = false;
bar.addEventListener('mousedown', event => {
    isDragging = true;
    event.preventDefault()
})

bar.addEventListener('click', seek);

window.addEventListener('mousemove', event => {
    if (!isDragging) return;
    event.preventDefault()
    seek(event);
})

window.addEventListener('mouseup', event => {
    event.preventDefault();
    
    isDragging = false;

})

function seek(event) {
    let x = event.pageX - bar.getBoundingClientRect().left;
    let width = bar.offsetWidth;
    let percent = x / width;
    if (percent > 1) percent = 1;
    if (percent < 0) percent = 0;
    barProgress.style.width = `${(percent * 100)}%`;

    video_progress.innerHTML = convert_to_mins_and_secs(Math.round(percent * player.getDuration()), 0) + ' : ' + convert_to_mins_and_secs(player.getDuration(), 1); 
    let new_time = Math.round(player.getDuration() * percent);
    console.log("new time ", new_time);
    socketSend('seek', `${new_time}`);
}
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



// * MAKE THE VOLUME BAR DRAGABLE

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
    check_volume(volume);

}

// * check whether volume icon needs to change

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

// * if volume icon clicked, toggle mute

volume_button.addEventListener('click', e => {
    
    if (player.isMuted()) {
        player.unMute()
        let volume = player.getVolume();
        volume_progress.style.height = `${volume}%`;
        check_volume(volume);

    } else {
        player.mute();
        volume_progress.style.height = '0%';
        check_volume(0);
    }
})

document.getElementById('play_pause').addEventListener('click', play_or_pause);
document.getElementById('player_overlay').addEventListener('click', play_or_pause);
function play_or_pause() {
    if (check_pause() == 1) {
        socketSend('play_pause', 'play');
    } else if (check_pause() == 0) {
        socketSend('play_pause', 'pause');

    } else{
        return;
    }
}

// since the iframe api allows users to click on the video itself to pause, 
//this function is used as a check to see if the video is playing or not to choose the right icon
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


// * FULLSCREEN CONTROLS
document.onkeyup = checkKey;
function checkKey(evt) {
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'];
    evt = evt || window.event;
    if (!formElements.includes(evt.target.tagName) && evt.key == "f") {

      toggle_fullscreen();
    } 
}
const chat_container = document.getElementById('chat_container');
function toggle_fullscreen() {
    // check if fullscreen, different browsers use different methods so all must be checked
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


// since the exit or F key can be used to exit fullscreen this needs to be detected to change the icons back
player_container.addEventListener('fullscreenchange', e => {
    if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    ) {
        console.log("now fullscreen");
        minimized = true;
        chat_container.classList.add('chat_overlay');
        chat_container.style.height = '0';
        chat_container.style.opacity = '0';
        document.getElementById('close_chat').style.display = 'block';
        document.getElementById('fullscreen').getElementsByTagName('svg')[0].style.display = 'none';
        document.getElementById('fullscreen').getElementsByTagName('svg')[1].style.display = 'block';
        player_container.append(chat_container);
    } else {
        minimized = false;

        console.log("exit fullscreen");
        chat_container.classList.remove('chat_overlay');
        document.getElementById('close_chat').style.display = 'none';

        document.getElementById('room_container').append(chat_container);
        document.getElementById('fullscreen').getElementsByTagName('svg')[0].style.display = 'block';
        document.getElementById('fullscreen').getElementsByTagName('svg')[1].style.display = 'none';
        chat_container.style.height = '100%';
        chat_container.style.opacity = '1';
    }
});

// ! control bar still disappearing even though overlay should not be present
// ! make overlay disappear immediately after pausing? (after click event)


player_container.addEventListener('mouseenter', e => {
    bar_container.style.opacity = '1';
});

player_container.addEventListener('mouseleave', e => {
    bar_container.style.opacity = '0';
});


let timer;
document.getElementById('player_overlay').addEventListener('mousemove', check_inactivity);
bar_container.addEventListener('mousemove', check_inactivity);
function check_inactivity(){
    bar_container.style.opacity = '1';
    document.getElementById('player_overlay').style.cursor = 'auto';
    clearTimeout(timer);
    timer = setTimeout(function() {
        bar_container.style.opacity = '0';
        document.getElementById('player_overlay').style.cursor = 'none';

    }, 2000);
}


checkbox.addEventListener('change', e=> {
    console.log('toggled');
    toggle_chat(checkbox.checked);
    
})

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
