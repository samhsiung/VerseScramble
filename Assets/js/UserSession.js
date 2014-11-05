﻿#pragma strict

var verseId : String = null;
var versesetId : String = null;
var apiDomain : String = null;
var userId : String = null;
var sessionKey : String = null;
var username : String = null;
var email : String = null;
var fbUid : String = null;
var _name : String = null;
var fbPicUrl : String = null;

var totalScore : int = 0;
var isLoggedIn : boolean = false;

static var started : boolean = false;

static function GetUserSession() {
	
	var usGO : GameObject = GameObject.Find("UserSession");
	if (usGO == null) {
		usGO = new GameObject("UserSession");
		usGO.AddComponent(typeof(UserSession));
	}
	
	var us : UserSession = usGO.GetComponent("UserSession");
	if (us) {
		return us;
	}
	return null;
}

function Awake() {
	DontDestroyOnLoad(this.gameObject);
	LoadUserLogin();
}

function HandleFbLogin(parameters : Hashtable) {
	var accessToken = parameters["accessToken"];
	var fbUid = parameters["fbUid"];
	var fbPicUrl = parameters["fbPicUrl"];
	
	var onLogin = function(userData:Hashtable) {
		HandleLogin(userData);	
		var loginPanel : LoginPanel = GameObject.FindObjectOfType(LoginPanel);
		if (loginPanel != null) {
			Destroy(loginPanel.gameObject);
		}
	};
	
	ApiManager.GetInstance().CallApi("fb/login", 
	new Hashtable({"access_token":accessToken,
				   "fb_uid":fbUid,
				   "fb_pic_url":fbPicUrl}),
	new Hashtable({"cacheEnabled":false,
	               "protocol":"https",
	               "method":"post",
	               "handler":onLogin}));
}

// example URL: verserain://com.hopeofglory.verserain/verse/53ebe35da2ff372bfb9b91f4/www.verserain.com
function HandleURL(url : String) {
	verseId = null;
	versesetId = null;
	
	var parts = url.Split("/"[0]);
	var subject = parts[3];
	var idstr = parts[4];
	var apiDom = parts[5];
	var sessionKey = parts[6];

	if ((idstr == "None") || (idstr == "null")) {
		idstr = null;
	}	
	
	if (subject == "verse") {
		verseId = idstr;
	} else if (subject == "verseset") {
		versesetId = idstr;
	}

	apiDomain = apiDom;	
	Debug.Log("api domain set to " + apiDom);
	
	var _startGame : Function = function() {
		if (idstr != null) {
			StartGame();
		}		
	};
	
	if (!IsLoggedIn() && (sessionKey != "None")) {
		DoLogin(sessionKey, _startGame);
	} else {
		_startGame();
	}
}

var StartGame = function() {
	var gmObject = GameObject.Find("GameManager");	
	
	if (gmObject) {
		var gameManager : GameManager = gmObject.GetComponent("GameManager");
		gameManager.Cleanup();
	}
	
	VerseManager.loaded = false;
	Application.LoadLevel("scramble");
};

function DoLogin(sessionKey : String) {
	DoLogin(sessionKey, null);
}

function DoLogin(sessionKey : String, afterLogin : Function) {
	var onLogin = function(userData:Hashtable) {
		HandleLogin(userData);
		if (afterLogin != null) {
			afterLogin();
		}
	};
	
	var apiManager : ApiManager = ApiManager.GetInstance();
	
	apiManager.CallApi("login/login",
		new Hashtable({"session_key":sessionKey}), 
		new Hashtable({"handler":onLogin,
					   "errorHandler":null,
					   "cacheEnabled":false,
					   "protocol":"https",
					   "method":"post"}));
}

function SetVerseId(verseId_ : String) {
	verseId = verseId_;
}

function SetVerseSetId(versesetId_ : String) {
	versesetId = versesetId_;
}

function SetApiDomain(apiDomain_ : String) {
	apiDomain = apiDomain_;
}

function ApiDomain() : String {
	if (apiDomain) {
		return apiDomain;
	} else {
		return ApiManager.GetApiDomain();
	}
}

function ClearUrlOptions() {
	verseId = null;
	versesetId = null;
}

function HandleLogin(userData : Hashtable) {
	
	if (!userData["logged_in"]) {
		return;
	}
	
	userId = userData["_id"];
	sessionKey = userData["session_key"];
	username = userData["username"];
	email = userData["email"];
	if (userData.ContainsKey("total_score")) {
		totalScore = userData["total_score"];
	} else {
		totalScore = 0;
	}
	if (userData.ContainsKey("fb_uid")) {
		fbUid = userData["fb_uid"];
	}
	if (userData.ContainsKey("fb_pic_url")) {
		fbPicUrl = userData["fb_pic_url"];
	}
	if (userData.ContainsKey("name")) {
		_name = userData["name"];
	}
	isLoggedIn = true;
	
	var json : String = HashtableToJSON(userData);
	PlayerPrefs.SetString("user_data", json);
	
	var loginButton : LoginButton = GameObject.FindObjectOfType(LoginButton);
	if (loginButton != null) {
		loginButton.SyncLoginStatus();
	}
}

function Save() {
	
	var userData : Hashtable = new Hashtable({"email":email,"username":username,
	"_id":userId,"session_key":sessionKey,"total_score":totalScore,"logged_in":isLoggedIn,
	"fb_uid":fbUid, "name":_name, "fb_pic_url":fbPicUrl});
	var json : String = HashtableToJSON(userData);
	PlayerPrefs.SetString("user_data", json);
}

function LoadUserLogin() {
	if (sessionKey && userId) return;
	var json : String = PlayerPrefs.GetString("user_data");
	if (json) {
		Debug.Log("loaded user json = " + json);
		var userData : Hashtable = ParseJSON(json);
		HandleLogin(userData);
		// refresh by logging in again
		var sessionKey = userData["session_key"];
		DoLogin(sessionKey);
	}
}

static function IsLoggedIn() {
	var us : UserSession = GetUserSession();
	//Debug.Log("user logged in: " + us.isLoggedIn);
	return (us.isLoggedIn);
}

function Logout() {
	isLoggedIn = false;
	userId = null;
	sessionKey = null;
	username = null;
	email = null;
	_name = null;
	fbPicUrl = null;
	fbUid = null;
	totalScore = 0;
	PlayerPrefs.DeleteKey("user_data");
}

function Start () {
    // we're ready to pass in parameters from web client to user session
	if (Application.isWebPlayer && !started) {
		Application.ExternalEval(
    	"u.start_verserain();"
		);
		started = true;
	}
	
/*
	SetApiDomain("www.verserain.com");
	SetVerseSetId("542af9923f7ab0224bd53e2f");
    SetVerseId("542afb763f7ab0224bd53e33");
    */
    //HandleURL("verserain://com.hopeofglory.verserain/verse/None/www.verserain.com/bb70d2a9cd8ff9a226b74af7b61d231f151a7cb2-53e42f6da2ff374cfa320f32");
    //HandleURL("verserain://com.hopeofglory.verserain/verse/544a600b3f7ab063b3c5839b/www.verserain.com/bb70d2a9cd8ff9a226b74af7b61d231f151a7cb2-53e42f6da2ff374cfa320f32");
	//HandleURL("verserain://com.hopeofglory.verserain/verse/542afb763f7ab0224bd53e33/www.verserain.com/bb70d2a9cd8ff9a226b74af7b61d231f151a7cb2-53e42f6da2ff374cfa320f32");
}

function Update () {

}