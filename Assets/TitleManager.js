﻿#pragma strict

public var customSkin : GUISkin;
public var disabledStyle : GUIStyle;
public var verseManager : VerseManager;
public var showError : boolean = false;
public var sndSelect : AudioClip;
public var background : Transform;
public var mainCam : Camera;

private	var selectedDifficulty : Difficulty;

function OnGUI() {
	var style : GUIStyle = customSkin.button;
	var enabled : boolean = true;
	
	if (Screen.width > 1500) {
		Screen.SetResolution(Screen.width * 0.5f, Screen.height * 0.5f, false);
	} else if (Screen.width < 700) {
		Screen.SetResolution(Screen.width * 1.5f, Screen.height * 1.5f, false);
	}
	
	GUI.skin = customSkin;
	var buttonSize = new Vector2(170,60);
	var h = Screen.height;
	var w = Screen.width;
	var maxDifficulty : Difficulty = verseManager.GetCurrentDifficultyAllowed();
	
	var selected:boolean = false;
	var dH = h*0.7;
	
	// difficulty buttons
	
	if (GUI.Button(Rect(w*0.2-buttonSize.x*0.5,dH,buttonSize.x,buttonSize.y),"Easy")) {
		selected = true;
		selectedDifficulty = Difficulty.Easy;
	}

	if (parseInt(maxDifficulty) < VerseManager.GetDifficultyFromInt(Difficulty.Medium)) {
		style = disabledStyle;
	} else {
		style = customSkin.button;
	}
	
	if (GUI.Button(Rect(w*0.5-buttonSize.x*0.5,dH,buttonSize.x,buttonSize.y),"Medium", style)) {
		selected = true;
		selectedDifficulty = Difficulty.Medium;
	}

	if (parseInt(maxDifficulty) < VerseManager.GetDifficultyFromInt(Difficulty.Hard)) {
		style = disabledStyle;
	} else {
		style = customSkin.button;
	}

	if (GUI.Button(Rect(w*0.8-buttonSize.x*0.5,dH,buttonSize.x,buttonSize.y),"Hard", style)) {
		selected = true;
		selectedDifficulty = Difficulty.Hard;
	}
	
	if (selected) {
		if (parseInt(maxDifficulty) < VerseManager.GetDifficultyFromInt(selectedDifficulty)) {
			showError = true;
		} else {
			audio.PlayOneShot(sndSelect);
			verseManager.SetDifficulty(selectedDifficulty);
			Application.LoadLevel("verselist");
		}
	}
	
	if (showError) {
	
		GUI.Button(Rect(w*0.5-buttonSize.x*1.25,h*0.85,buttonSize.x*2.5,buttonSize.y),
		"master more verses for " + VerseManager.DifficultyToString(selectedDifficulty));
	}

	// language buttons
	selected = false;
	
	if (verseManager.GetLanguage() == "en") {
		style = customSkin.button;
	} else {
		style = disabledStyle;
	}
	
	if (GUI.Button(Rect(w*0.333-buttonSize.x*0.5,h*0.4,buttonSize.x,buttonSize.y),"English", style)) {
		verseManager.SetLanguage("en");
		selected = true;
	}

	if (verseManager.GetLanguage() == "zh") {
		style = customSkin.button;
	} else {
		style = disabledStyle;
	}


	if (GUI.Button(Rect(w*0.666-buttonSize.x*0.5,h*0.4,buttonSize.x,buttonSize.y),"中文", style)) {
		verseManager.SetLanguage("zh");
		selected = true;
	}

	if (verseManager.GetLanguage() == "he") {
		style = customSkin.button;
	} else {
		style = disabledStyle;
	}
/*
	if (GUI.Button(Rect(w*0.8-buttonSize.x*0.5,h*0.4,buttonSize.x,buttonSize.y),"עברית", style)) {
		verseManager.SetLanguage("he");	
		selected = true;
	}
*/	
	if (selected) {
		audio.PlayOneShot(sndSelect);
	}
	
}
	

function resizeBackground() {
	var w = background.renderer.bounds.size.x;
	var h = background.renderer.bounds.size.y;
	var camW = mainCam.pixelWidth;
	var camH = mainCam.pixelHeight;
	var camX = 2*mainCam.ScreenToWorldPoint(new Vector3(camW, 0f, 0f)).x;
	var camY = 2*mainCam.ScreenToWorldPoint(new Vector3(0f, camH, 0f)).y;
	background.transform.localScale.x = camX/w;
	background.transform.localScale.y = camY/h;
}

function Start () {
	Application.targetFrameRate = 60;
	resizeBackground();
}

function Update () {

}