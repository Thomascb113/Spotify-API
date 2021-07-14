from flask import Flask, render_template, url_for, request, redirect, flash, jsonify, make_response
from flask_jsglue import JSGlue
import spotify_api as s_api
import webbrowser
import requests

app = Flask(__name__)
jsglue = JSGlue(app)
app.secret_key = "pineapple"

_id = ""
secret = ""


@app.route("/spotify-login", methods=["POST", "GET"])
def login():
	global _id
	global secret
	if request.method == "POST":
		_id = request.form["client_id"]
		secret = request.form["client_secret"]
		url = s_api.formAuthURL(_id)
		webbrowser.open(url)
		return redirect(url_for("loading"))
	else:
		return render_template("login.html")


@app.route("/loading", methods=["POST", "GET"])
def loading():
	if request.is_json:
		req = request.get_json()
		return redirect(url_for("home"))
	else:
		return redirect(url_for("home"))


@app.route("/home")
def home():
	return render_template("home.html")


@app.route("/Access_Token", methods=["GET", "POST"])
def Access_Token():
	response = {
		"client_id": _id,
		"client_secret": secret
	}
	res = make_response(jsonify(response), 200)
	return res


@app.route("/callback", methods=["GET", "POST"])
def callback():
	return render_template("callback.html")


if __name__ == "__main__":
	app.run(debug=True)