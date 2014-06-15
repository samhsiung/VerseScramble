﻿#pragma strict
@script RequireComponent(AudioSource);

public enum Difficulty {Easy, Medium, Hard, Impossible};

var mainCam : Camera;
var wordLabel : WordLabel;
var endOfGameOptions : EndOfGameOptions;
var endOfGameOptionsClone : EndOfGameOptions;
var topWall : BoxCollider2D;
var bottomWall: BoxCollider2D;
var leftWall : BoxCollider2D;
var rightWall : BoxCollider2D;
var verseReference : GUIText;
var feedbackLabel : GUIText;
var finished : boolean = false;
var references : Array = new Array();
var difficulty : Difficulty = Difficulty.Easy;
var scoreManager : ScoreManager;
var verseManager : VerseManager;
var verseMetadata : Hashtable;
var timeUntilHint : int ;
var exitButton : BoxCollider2D;
var background : SpriteRenderer;
var bgSprite1 : Sprite;
var bgSprite2 : Sprite;
var bgSprite3 : Sprite;
var bgSprite4 : Sprite;
var bgSprite5 : Sprite;
var sndSuccess1 : AudioClip;
var sndSuccess2 : AudioClip;
var sndFailure1 : AudioClip;

private var wordHinted : boolean = false;

static var currentWord : String;
static var words : Array = new Array();
static var wordObjects : Array = new Array();
static var wordIndex : int;
static var score = 0;
static var highScore = 0;
static var screenBounds : Rect;
static var streak : int = 0;
static var moves : int = 0;
static var lastWordTime : float;

private var windowRect : Rect;


function OnGUI() {

}

function SetupWalls () {
	var w = mainCam.pixelWidth;
	var h = mainCam.pixelHeight;

	topWall.size = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(w*2.0f, 0f, 0f)).x, 1f);
	topWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, h,0f)).y + 0.5f);	
	
	bottomWall.size = topWall.size;
	bottomWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).y - 0.5f);	
	
	leftWall.size = new Vector2(1f, mainCam.ScreenToWorldPoint(new Vector3(0f, h*2.0f, 0f)).y);
	leftWall.center = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).x - 0.5f, 0f);	
	
	rightWall.size = leftWall.size;
	rightWall.center = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(w, 0f, 0f)).x+0.5f, 0f);

	exitButton.transform.position = new Vector3(mainCam.ScreenToWorldPoint(new Vector3(w, 0f, 0f)).x-0.75f,
									  mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).y+0.75f,
									  0);
									
	screenBounds = Rect(leftWall.center.x,topWall.center.y,
	rightWall.center.x-leftWall.center.x,
	topWall.center.y-bottomWall.center.y);
}

function HandleWordWrong() {
	scoreManager.HandleWordWrong();
	audio.PlayOneShot(sndFailure1, 2.0f);
}

function HandleWordCorrect() {
	var elapsedTime : float = Time.time - lastWordTime;
	lastWordTime = Time.time;
	scoreManager.HandleWordCorrect(elapsedTime);
	
	var snd : AudioClip = sndSuccess1;
	if (Random.RandomRange(0,10.0f) > 5.0f) {
		snd = sndSuccess2;
	}
	audio.PlayOneShot(snd, 1.0);
}

function SetupUI() {
	feedbackLabel.text = "";
}

function showFeedback(feedbackText : String, time : float) {
	feedbackLabel.text = feedbackText;
	yield WaitForSeconds(time);
	feedbackLabel.text = "";
}

function nextWord() {
	if (wordIndex == -1) return null;
	wordHinted = false;
	wordIndex += 1;
	if (wordIndex >= words.length) {
		currentWord = null;
		wordIndex = -1;
		showFeedback("Awesome!",3);
		HandleVerseFinished();
		return null;
	}
	currentWord = words[wordIndex];
	return currentWord;
}

function Start () {
	
	difficulty = verseManager.GetCurrentDifficulty();
	
	SetupWalls();
	SetupUI();
	SetupVerse();
	SetupBackground();
}

function SetupBackground() {
	var index : int = Random.Range(0,5);
	var sprite : Sprite = bgSprite1;
	
	switch (index) {
		case 0: sprite = bgSprite1; break;
		case 1: sprite = bgSprite2; break;
		case 2: sprite = bgSprite3; break;
		case 3: sprite = bgSprite4; break;
		case 4: sprite = bgSprite5; break;
	}
	background.sprite = sprite;
}

function SetVerseReference (reference : String) {
	verseReference.text = reference;
}

function SplitVerseZH(verse : String) {
	var phraseLength = 5;
	
	switch (difficulty) {
		case Difficulty.Easy:
			phraseLength = 12;
			break;
		case Difficulty.Medium:
			phraseLength = 7;
			break;
		case Difficulty.Hard:
			phraseLength = 3;
			break;
	}
	Debug.Log("phrase length = " + phraseLength);
	var clauseArray : Array = new Array();
	var phraseArray : Array = new Array();
	var seps = ["、","，", "，","。","！","；","："];
	var clause = "";
	
	for (var c in verse) {
		clause = clause + c;
		
		for (var s in seps) {
			if (s == c) {
				if ((clause != "") && (clause != " ") && (clause != "  ")) {
					clauseArray.push(clause);
					Debug.Log("clause : " + clause);
				}
				clause = "";
			}
		}
	}
	
	if ((clause != "") && (clause != " ") && (clause != "  ")) {
		clauseArray.push(clause);
		Debug.Log("clause : " + clause);
	}
	
		
	var phrase : String = "";
	var newPhrase : String = "";
	var phraseLengthForClause : int;
	
	for (clause in clauseArray) {
		if (clause.Length > phraseLength*1.5) {
			var divisor = Mathf.RoundToInt(1.0f*clause.Length/phraseLength);
			phraseLengthForClause = Mathf.RoundToInt(clause.Length/divisor);
			var l : int = 0;
			
			while (l < clause.Length) {
				if ((l + phraseLengthForClause) >= (clause.Length-3)) {
					phraseLengthForClause = clause.Length - l;
				}
				
				phrase = clause.Substring(l, phraseLengthForClause);
				l = l + phraseLengthForClause;
				if ((phrase != "") && (phrase != " ") && (phrase != "  ")) {
					phraseArray.push(phrase);
				}
			}	
		} else {
			phraseArray.push(clause);
		}
	}
	return phraseArray;

}

function SplitVerse (verse : String) {

	var phraseLength = 5;
	var language = verseManager.GetLanguage();

	if (language == "zh") {
		return SplitVerseZH(verse);
	}
	
	switch (difficulty) {
		case Difficulty.Easy:
			phraseLength = 20;
			break;
		case Difficulty.Medium:
			phraseLength = 12;
			break;
		case Difficulty.Hard:
			phraseLength = 6;
			break;
	}
	Debug.Log("phrase length = " + phraseLength);
	var wordsArray : Array;
	var phraseArray : Array = new Array();

	wordsArray = verse.Split(" "[0]);
	
	var phrase : String = "";
	var newPhrase : String = "";
	for (word in wordsArray) {
		newPhrase = phrase + word + " ";
		if (newPhrase.Length > phraseLength) {
		  var newPhraseDiff = Mathf.Abs(newPhrase.Length - phraseLength);
		  var phraseDiff = Mathf.Abs(phrase.Length - phraseLength);
		  if ((newPhraseDiff < phraseDiff) || (phrase == "")) {
			  phraseArray.push(newPhrase);
			  phrase = "";
		  } else {
		      // use previous phrase if it's closer to the limit
		  	  phraseArray.push(phrase);
		  	  phrase = word + " ";
		  }
		} else {
		  phrase = newPhrase;
		}
		
	}
	if (phrase != "") {
		phraseArray.push(phrase);
	}
	return phraseArray;
}

function Cleanup () {
	scoreManager.resetStats();
	var wObject : WordLabel;
	for (wObject in wordObjects) {
		Destroy(wObject.gameObject);
	}
	wordObjects.clear();
}

function SetupVerse() {
	scoreManager.reset();
	finished = false;
	endOfGameOptionsClone = null;
	
	Cleanup();
	lastWordTime = Time.time;
	
	var clone : WordLabel;
	
	var reference = verseManager.currentReference();
	SetVerseReference(reference);
	verseMetadata = verseManager.GetVerseMetadata(reference);
	Debug.Log("verse difficulty is " + verseMetadata["difficulty"]);	
	if (verseMetadata["difficulty"] != null) {
		//difficulty = GetDifficultyFromInt(verseMetadata["difficulty"]);
	}
	
	var verse : String = verseManager.currentVerse();
	words = SplitVerse(verse);
	wordIndex = 0;
	currentWord = words[wordIndex];
	
	for (word in words) {
		clone = Instantiate(wordLabel, new Vector3(0,0,0), Quaternion.identity);
		clone.setWord(word);
		wordObjects.push(clone);
		var w = clone.renderer.bounds.size.x;
		var h = clone.renderer.bounds.size.y;
		var x = Random.Range(screenBounds.x+w*0.5,screenBounds.x+screenBounds.width-w*0.5);
		var y = Random.Range(screenBounds.y-screenBounds.height+h*0.5,screenBounds.y-h*0.5);
		clone.transform.position = new Vector3(x,y,0);
	}
}

function StartNextDifficulty() {
	verseManager.upgradeDifficultyForVerse(verseMetadata);
	SetupVerse();
}

function StartAnotherVerse() {
	verseManager.GotoNextVerse();
	SetupVerse();
	SetupBackground();
}

function HandleVerseFinished() {
	finished = true;
	yield WaitForSeconds(2);
	Debug.Log("verse finished");
	scoreManager.HandleFinished();
	endOfGameOptionsClone = Instantiate(endOfGameOptions, new Vector3(0,0,0), Quaternion.identity);	
}

function Update () {
	var elapsedTime : float = Time.time - lastWordTime;
	
	if (!wordHinted && !finished && (elapsedTime > timeUntilHint)) {
		Debug.Log("timeUntilHint = " + timeUntilHint);
		wordHinted = true;
		
		var wObject : WordLabel;
		for (wObject in wordObjects) {
			if (wObject.word == currentWord) {
				wObject.HintAt();
				break;
			}
		}
	}
}