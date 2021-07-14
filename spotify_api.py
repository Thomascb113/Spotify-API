import requests
import webbrowser
import urllib
import string
import random
import time

def formAuthURL(client_id):
	auth_url = "https://accounts.spotify.com/authorize"
	redirect_uri = "http://127.0.0.1:5000/callback"
	scopes = "user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private"
	state = generateState(9)
	params = {"client_id": client_id, 
		"response_type": "code", 
		"redirect_uri": redirect_uri,
		"state": state,
		"scope": scopes}

	r = requests.get(auth_url, params=params)
	return r.url

def formURLBody(code, client_id, client_secret):
	body = "grant_type=authorization_code"
	redirect_uri = "http://127.0.0.1:5000/callback"

	body += "&code=" + code
	body += "&redirect_uri=" + redirect_uri
	body += "&client_id=" + client_id
	body += "&client_secret=" + client_secret

	return body

def generateState(length):
	letters = string.ascii_lowercase
	text = ''.join(random.choice(letters) for i in range(length))
	return text


def waiting(number):
	time.sleep(number)