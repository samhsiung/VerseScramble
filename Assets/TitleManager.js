﻿#pragma strict

public var customSkin : GUISkin;
public var disabledStyle : GUIStyle;
public var verseManager : VerseManager;
public var showError : boolean = false;
private	var selectedDifficulty : Difficulty;

function OnGUI() {
	var style : GUIStyle = customSkin.button;
	var enabled : boolean = true;
	
	if (Screen.width > 1024) {
		Screen.SetResolution(1024, 768, false);
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
			verseManager.SetDifficulty(selectedDifficulty);
			Application.LoadLevel("verselist");
		}
	}
	
	if (showError) {
		GUI.Button(Rect(w*0.5-buttonSize.x,h*0.825,buttonSize.x*2,buttonSize.y),
		"You need to master more verses for " + VerseManager.DifficultyToString(selectedDifficulty));
	}
	
	if (verseManager.GetLanguage() == "en") {
		style = customSkin.button;
	} else {
		style = disabledStyle;
	}
	
	// language buttons
	if (GUI.Button(Rect(w*0.33-buttonSize.x*0.5,h*0.4,buttonSize.x,buttonSize.y),"English", style)) {
		verseManager.SetLanguage("en");
	}

	if (verseManager.GetLanguage() == "zh") {
		style = customSkin.button;
	} else {
		style = disabledStyle;
	}


	if (GUI.Button(Rect(w*0.66-buttonSize.x*0.5,h*0.4,buttonSize.x,buttonSize.y),"中文", style)) {
		verseManager.SetLanguage("zh");
	}

	if (verseManager.GetLanguage() == "he") {
		style = customSkin.button;
	} else {
		style = disabledStyle;
	}
/*
	if (GUI.Button(Rect(w*0.8-buttonSize.x*0.5,h*0.4,buttonSize.x,buttonSize.y),"עברית", style)) {
		verseManager.SetLanguage("he");	
	}
*/
}
	

function Start () {
	Application.targetFrameRate = 60;
}

function Update () {

}