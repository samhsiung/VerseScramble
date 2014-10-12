﻿#pragma strict
import UnityEngine.UI;

public var button : Button;
public var verseset : VerseSet;
public var label : Text;
public var normalColor : Color;
public var verseSetsManager : VerseSetsManager;
public var createVerseSet : boolean;
static var selectedButton : VerseSetButton = null;

function Awake() {
	normalColor = button.colors.normalColor;
	verseSetsManager = GameObject.Find("VerseSetsManager").GetComponent(VerseSetsManager);
		
}

function Start () {
	button = GetComponent(Button);
	button.onClick.AddListener(HandleOnClick);
}

function AddToScrollView(scrollContent : RectTransform, index : int) {
	var rt : RectTransform = GetComponent(RectTransform);
	
	rt.SetParent(scrollContent, false);
	var labelTransform : RectTransform = label.GetComponent(RectTransform);
	labelTransform.offsetMin.x = 30;
	labelTransform.offsetMin.y = 10;
	labelTransform.offsetMax.x = -30;
	labelTransform.offsetMax.y = -10;
}

function Metadata() : Hashtable {
	return verseset.GetMetadata(); 
}

function SetVerseSet(vs : VerseSet) {
	verseset = vs;
	label.text = String.Format("{0}", vs.setname);
}

function Highlight() {
	var rt : RectTransform = GetComponent(RectTransform);	
	//Debug.Log("selected button = " + selectedButton);
	if (selectedButton != null) {
		selectedButton.UnHighlight();
	}
	
	button.colors.normalColor = button.colors.highlightedColor;
	selectedButton = this;
	
}

function UnHighlight() {
	button.colors.normalColor = normalColor;
	
}

function HandleApiVerseSetShow(resultData : Hashtable) {
	if (this == null) return;
	var versesetData : Hashtable = resultData["verseset"];
	var versesData : Array = resultData["verses"];
	var highScore : int = resultData["high_score"];
	var metadata : Hashtable = verseset.GetMetadata();
	var currentHighScore : int = metadata["high_score"];
	var currentDifficulty : int = metadata["difficulty"];
	var difficulty : int = resultData["difficulty"];
	var mastered : boolean = resultData["mastered"];
	if (mastered) difficulty += 1;
	
	var changed : boolean = false;
	
	if (highScore >= currentHighScore) {
		metadata["high_score"] = highScore;
		changed = true;
	}
	
	if (difficulty > currentDifficulty) {
		metadata["difficulty"] = difficulty;
		changed = true;
	}
	
	if (changed) {
		verseset.SaveMetadata(metadata);
	}
	
	VerseManager.LoadVerseSetData(versesetData);
	verseset.LoadVersesData(versesData);
	verseSetsManager.ShowVerses();
	
}

function HandleOnClick() {
	if (createVerseSet) {
		var url : String = String.Format("http://{0}/verseset/create",ApiManager.GetApiDomain());
		Application.OpenURL(url);
		return;
	}
	
	VerseManager.verseIndex = 0;
	VerseManager.SetCurrentVerseSet(verseset);
	Highlight();
	
	if (verseset.isOnline && (verseset.verses.length == 0)) {
		var apiManager : ApiManager = ApiManager.GetInstance();
		apiManager.CallApi("verseset/show",
		new Hashtable({"verseset_id":verseset.onlineId}),
		HandleApiVerseSetShow);
	} else {
		verseSetsManager.ShowVerses();
	}
}

function Update () {

}