var access_token = null;
var refresh_token = null;

var redirect_uri = "http://127.0.0.1:5000/callback";
var tokenURL = "https://accounts.spotify.com/api/token";

var playlists = "https://api.spotify.com/v1/me/playlists";
var tracks = "https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
var track = "https://api.spotify.com/v1/tracks/{id}"
var play_song = "https://api.spotify.com/v1/me/player/play"
var devices = "https://api.spotify.com/v1/me/player/devices"
var player = "https://api.spotify.com/v1/me/player/currently-playing"

var device_id;

let device_list = document.getElementById("device-options").addEventListener('click', function(e){
	if(document.getElementById("device-options").className == "device-options-visible"){
		device_id = e.target.name;
	}
});

let devices_button = document.getElementById("devices").addEventListener('click', function(){
	if(document.getElementById("device-options").className == "device-options-visible"){
		removeAllItems("device-options");
		document.getElementById("device-options").className = "device-options";
	}
	else{
		getDevices();
	}
})

let playlists_list = document.getElementById("list").addEventListener('click', function(e){
	handleListPress(e);
});

function loadHome(){
	let xhr = new XMLHttpRequest();
	let destination = Flask.url_for("loading");

	xhr.open("POST", destination, true);

	var message = JSON.stringify({"message": "ready"});
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(message);
}

function getParams(){
		var code = getCode();

		let xhr = new XMLHttpRequest();
		let destination_url = Flask.url_for("Access_Token")

		xhr.open("GET", destination_url, true)

		xhr.responseType = 'json'

		xhr.onload = () =>{
			const data = xhr.response;
			localStorage.setItem("client_id", data.client_id);
			localStorage.setItem("client_secret", data.client_secret);
		}

		xhr.send(null);

		getAccessToken(code);
}

function getCode(){
	var url = (new URL(window.location.href)).searchParams;

	return url.get("code")
}

function getAccessToken(code){
	let body = "grant_type=authorization_code"
	body += "&code=" + code 
	body += "&redirect_uri=" + encodeURI(redirect_uri)
	body += "&client_id=" + localStorage.getItem("client_id")
	body += "&client_secret=" + localStorage.getItem("client_secret")
	callAuthAPI(body)
}

function callAuthAPI(body){
	let xhr = new XMLHttpRequest();

	xhr.open("POST", tokenURL, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.setRequestHeader('Authorization', 'Basic ' + btoa(localStorage.getItem("client_id") + ":" + localStorage.getItem("client_secret")));
	xhr.send(body);
	xhr.onload = handleAuthorizationResponse;
}

function refreshAccessToken(){
	let body = "grant_type=refresh_token"
	body += "&refresh_token=" + localStorage.getItem("refresh_token");
	body += "&client_id=" + localStorage.getItem("client_id");
	callAuthAPI(body)
}

function handleAuthorizationResponse(){
	if(this.status == 200){
		var data = JSON.parse(this.responseText);
		console.log(data)
		var data = JSON.parse(this.responseText);
		if(data.access_token != undefined){
			access_token = data.access_token;
			localStorage.setItem("access_token", access_token)
		}
		if(data.refresh_token != undefined){
			refresh_token = data.refresh_token;
			localStorage.setItem("refresh_token", refresh_token)
		}

		loadHome();
	}

	else{
		console.log(this.responseText)
		alert("couldn't get access token")
	}
}

function callAPI(method, url, body, callback){
	let xhr = new XMLHttpRequest();
	xhr.open(method, url, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"))
	xhr.send(body)
	xhr.onload = callback
}

function callAPITracks(method, url, body, callback, offset){
	let xhr = new XMLHttpRequest();
	xhr.open(method, url + `?offset=${offset}`, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"));
	xhr.send(body);
	xhr.onload = callback;
	console.log(offset)
	
	if(offset < 300){
		callAPITracks(method, url, body, callback, offset += 100);
	}
}

function refreshPlaylistResponse(){
	callAPI("GET", playlists, null, handlePlaylistsResponse)
}

function handlePlaylistsResponse(){
	if(this.status == 200){
		var data = JSON.parse(this.responseText);
		console.log(data);
		let dropdown = document.getElementById("playlist-dropdown");
		if(dropdown.classList.contains("playlist-dropdown-visible")){
			dropdown.classList.remove("playlist-dropdown-visible");
			dropdown.classList.add("playlist-dropdown")
			document.getElementById("list").className = "playlists-list"
			removeAllItems("list");
		}
		else{
			dropdown.classList.add("playlist-dropdown-visible");
			removeAllItems("list");
			data.items.forEach(item => addPlaylist(item));	
		}
		
	}

	else if(this.status == 401){
		refreshAccessToken();
		alert("Refresh Page Please :[")
	}

	else{
		console.log(this.responseText);
		alert(this.responseText);
	}
}

function addPlaylist(playlist){
	let item = document.createElement("button")
	item.value = playlist.id;
	item.innerHTML = playlist.name + " (" + playlist.tracks.total + ")"
	document.getElementById("list").appendChild(item)
}

function removeAllItems(elementId){
	let item = document.getElementById(elementId)
	while(item.firstChild){
		item.removeChild(item.firstChild)
	}
}

function openTracks(e){
	console.log(e.target.value);
	get_tracks = tracks.replace("{playlist_id}", e.target.value);
	let offset = 0;
	callAPITracks("GET", get_tracks, null, handleTrackResponse, offset);
}

function handleTrackResponse(){
	if(this.status == 200){
		var data = JSON.parse(this.responseText);
		console.log(data);
		document.getElementById("list").className = "track-list"
		data.items.forEach(item => addTracks(item));
	}

	else if(this.status == 401){
		refreshAccessToken();
		alert("Refresh Page Please :[")
	}

	else{
		console.log(this.responseText);
		alert(this.responseText);
	}
}

function handleListPress(e){
	if(document.getElementById("list").classList.contains("playlists-list")){
		removeAllItems("list")
		label = document.getElementById("tab-title").getElementsByTagName("h4")[0].innerHTML = "Tracks"
		console.log(label)
		openTracks(e);
		localStorage.setItem("playlist_id", e.target.value)
	}
	else if(document.getElementById("list").classList.contains("track-list")){
		play_music(e);
	}
}

function addTracks(track){
	let item = document.createElement("button")
	item.name = track.track.id;
	item.innerHTML = track.track.name;
	document.getElementById("list").appendChild(item)
}

function play_music(e){
	var parent = e.target.parentNode;
	let song_index = Array.prototype.indexOf.call(parent.children, e.target);
	console.log(song_index)
	let playlist_id = localStorage.getItem("playlist_id");
	
	let body = {
		"uris": ["spotify:track:" + e.target.name],
		"position_ms":0
	}

	callAPI("PUT", play_song + "?device_id=" + device_id, JSON.stringify(body), handleSongAPIResponse);
}

function shuffle(){
	uri = addToShuffle();
	console.log(uri)

	let body = {
		"uris":uri,
		"position_ms": 0
	}

	callAPI("PUT", play_song + "?device_id=" + device_id, JSON.stringify(body), handleSongAPIResponse);
}

function addToShuffle(){
	var list = document.getElementById("list");
	var i = 0;
	let song_numbers = [];
	while(list.children[i]){
		song_numbers.push(i);
		i++;
	}

	let uri = [];

	for(var j = song_numbers.length - 1; j >= 0; j--){
		var song_number = song_numbers[Math.floor(Math.random() * song_numbers.length)];
		var index = song_numbers.indexOf(song_number);
		song_numbers.splice(index, 1);
		song = list.children[song_number].name;
		uri.push("spotify:track:" + song);
	}

	return uri;
}

function handleSongAPIResponse(){
	if(this.status == 200){
		console.log(this.responseText);
		setTimeout(currentlyPlaying, 2000);
		var data = JSON.parse(this.responseText);
	}
	else if(this.status == 204){
		setTimeout(currentlyPlaying, 2000);
	}
	else if(this.status == 401){
		refreshAccessToken();
		console.log("Refresh Page Please :[");
	}
	else{
		console.log(this.responseText);
		alert(this.responseText);
	}
}

function currentlyPlaying(){
	callAPI("GET", player + "?market=US", null, handleCurrentlyPlayingResponse);
}

function handleCurrentlyPlayingResponse(){
	if(this.status == 200){
		var data = JSON.parse(this.responseText);
		console.log(data);
	}

	else if(this.status == 204){
		console.log(this.responseText);
	}

	else if(this.status == 401){
		refreshAccessToken();
	}

	else{
		console.log(this.responseText);
		alert(this.responseText);
	}
}

function getDevices(){
	callAPI("GET", devices, null, handleDeviceResponse)
}

function handleDeviceResponse(){
	if(this.status == 200){
		var data = JSON.parse(this.responseText);
		console.log(data);
		document.getElementById("device-options").className = "device-options-visible";
		data.devices.forEach(item => addDevices(item));
	}

	else if(this.status == 401){
		refreshAccessToken();
		alert("Refresh Page Please :[");
	}

	else{
		console.log(this.responseText);
		alert(this.responseText)
	}
}

function addDevices(device){
	let option = document.createElement("button");
	option.name = device.id;
	option.innerHTML = device.name;
	document.getElementById("device-options").appendChild(option);
}