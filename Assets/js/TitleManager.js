﻿#pragma strict

import TextManager;

public var showError : boolean = false;
public var sndSelect : AudioClip;
public var background : Transform;

private	var selectedDifficulty : Difficulty;

function Awake() {
	Application.targetFrameRate = 60;
	TextManager.LoadLanguage(VerseManager.GetLanguage());
}

function Start () {
}

function Update () {

}