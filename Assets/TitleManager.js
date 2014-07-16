﻿#pragma strict

import TextManager;

public var customSkin : GUISkin;
public var disabledStyle : GUIStyle;
public var verseManager : VerseManager;
public var showError : boolean = false;
public var sndSelect : AudioClip;
public var background : Transform;
public var mainCam : Camera;
public var titleLabel : GUIText;
public var titleLabelShadow : GUIText;
public var selectLanguageLabel : GUIText;
public var selectLanguageLabelShadow : GUIText;
public var sceneSetup : SceneSetup;

private	var selectedDifficulty : Difficulty;

function OnGUI() {
	var style : GUIStyle = customSkin.button;
	var enabled : boolean = true;
	
	style.font = sceneSetup.GetCurrentFont();
	
	GUI.skin = customSkin;
	var buttonSize = new Vector2(170,60);
	var h = Screen.height;
	var w = Screen.width;
//	var maxDifficulty : Difficulty = verseManager.GetCurrentDifficultyAllowed();
	
	var selected:boolean = false;
	var dH = h*0.7;
	
	// language buttons
	selected = false;
	style = customSkin.button;
	
	if (GUI.Button(Rect(w*0.333-buttonSize.x*0.5,h*0.55,buttonSize.x,buttonSize.y),"English", style)) {
		verseManager.SetLanguage("en");
		selected = true;
	}

	if (GUI.Button(Rect(w*0.666-buttonSize.x*0.5,h*0.55,buttonSize.x,buttonSize.y),"中文", style)) {
		verseManager.SetLanguage("zh");
		selected = true;
	}
	
	if (selected) {
		audio.PlayOneShot(sndSelect);
		Application.LoadLevel("verselist");
	}
	
}

function Start () {
	Application.targetFrameRate = 60;
	TextManager.LoadLanguage(verseManager.GetLanguage());
	var gt = TextManager.GetText;
	titleLabel.guiText.text = gt("Bible Verse Scramble");
	titleLabelShadow.guiText.text = titleLabel.guiText.text;
	selectLanguageLabel.guiText.text = gt("Select Language");
	selectLanguageLabelShadow.guiText.text = selectLanguageLabel.guiText.text;
	
}

function Update () {

}