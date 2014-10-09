﻿#pragma strict

public var button : Button;
public var label : Text;
public var view : String;
public var verseSetsManager : VerseSetsManager;

private var normalColor : Color;
static var selectedButton : NavigationButton = null;

function Awake() {
	normalColor = button.colors.normalColor;
	verseSetsManager = GameObject.FindObjectOfType(VerseSetsManager);
}

function Update () {
}

function Start () {
	button = GetComponent(Button);
	//button.onClick.AddListener(HandleOnClick);
}

function HandleApiVerseSetList(resultData : Hashtable) {
	var currentView = VerseManager.GetCurrentView(false);
	if (currentView != view) return;
	
	VerseManager.ClearVerseSets(view);

	var versesetsData : Array = resultData["versesets"];
	for (var i=0;i<versesetsData.length;i++) {
		var versesetData = versesetsData[i];
		VerseManager.LoadVerseSetData(versesetData);
	}
	verseSetsManager.ShowVerseSets();
}

function HandleOnClick() {
	Highlight();
	VerseManager.SetCurrentView(view);
	
	var versesets : Array = VerseManager.GetCurrentVerseSets();
	
	var apiManager : ApiManager = ApiManager.GetInstance();
	if ((view == "popular") || (view == "new")) {
		apiManager.CallApi("verseset/list",
		new Hashtable({"order_by":view,"page":1,"language_code":VerseManager.GetLanguage()}),
		HandleApiVerseSetList);
	} else if (view == "history") {
		if (UserSession.IsLoggedIn() && (versesets.length == 0)) {
			apiManager.CallApi("profile/versesets/history",
			new Hashtable({}),
			HandleApiVerseSetList);
		}
	}
	verseSetsManager.ShowVerseSets();
	verseSetsManager.ShowVerses();
}

function Highlight() {
	var rt : RectTransform = GetComponent(RectTransform);	
	if (selectedButton != null) {
		selectedButton.UnHighlight();
	}
	selectedButton = this;
	button.colors.normalColor = button.colors.highlightedColor;
}

function UnHighlight() {
	button.colors.normalColor = normalColor;
}

