﻿#pragma strict
import UnityEngine;
import UnityEngine.UI;

@script RequireComponent(AudioSource);

public enum Difficulty {Easy, Medium, Hard, Impossible};

var mainCam : Camera;
var wordLabel : WordLabel;
var topWall : BoxCollider2D;
var bottomWall: BoxCollider2D;
var leftWall : BoxCollider2D;
var rightWall : BoxCollider2D;
var finished : boolean = false;
var references : Array = new Array();
var difficulty : Difficulty = Difficulty.Easy;
var scoreManager : ScoreManager;
var verseManager : VerseManager;
var verseMetadata : Hashtable;
var timeUntilHint : int ;
var background : SpriteRenderer;
var sndSuccess1 : AudioClip;
var sndSuccess2 : AudioClip;
var sndSuccess75 : AudioClip;
var sndSuccess50 : AudioClip;
var sndSuccess25 : AudioClip;
var sndSuccess12 : AudioClip;

var sndFailure1 : AudioClip;
var sndExplode1 : AudioClip;
var sndSelect : AudioClip;
var refreshButton : Button;
var hintButton : Button;
var feedbackLabel : Text;
var introReferenceLabel : Text;
var panelReferenceLabel : Text;
var difficultyLabel : Text;
var healthBar : HealthBar;
var wordScale : float;

public var needToSelectDifficulty : boolean = true;
public var difficultyOptions : DifficultyOptions;
public var endOfGameOptions : EndOfGameOptions;
public var numWordsReleased : int = 0;
public var gameStarted : boolean = false;
public var showingSolution : boolean = false;
public var DidRanOutOfTime : boolean = false;

private var wordHinted : boolean = false;

static var needToRecordPlay : boolean = false;
static var currentWord : String;
static var words : Array = new Array();
static var wordLabels : Array = new Array();
static var scrambledWordLabels : Array = new Array();
static var wordIndex : int;
static var score = 0;
static var highScore = 0;
static var screenBounds : Rect;
static var screenBoundsComputed : boolean = false;
static var streak : int = 0;
static var moves : int = 0;
static var lastWordTime : float;
static var challengeModeState : int = -1;

private var windowRect : Rect;

static function SetChallengeModeEnabled(enabled : boolean) {
	var enabledInt = 0;
	if (enabled) enabledInt = 1;
	challengeModeState = enabledInt;
	PlayerPrefs.SetInt("challenge_mode", enabledInt);
}

static function GetChallengeModeEnabled() {
	if (challengeModeState == -1) {
		return PlayerPrefs.GetInt("challenge_mode") == 1;
	} else {
		return challengeModeState == 1;
	}
}


function OnGUI() {

}

function ExitToVerseList() {
	audio.PlayOneShot(sndSelect, 1.0f);
	Cleanup();
	Application.LoadLevel("versesets");
}

function CanShowSolution() {
	return (!showingSolution && (wordIndex < wordLabels.length) && gameStarted && !GetChallengeModeEnabled());	
}

function ShowSolution() {
	if (!CanShowSolution()) {
		audio.PlayOneShot(sndFailure1,1.0f);
		return;
	}
	audio.PlayOneShot(sndSelect,1.0);
	showingSolution = true;
	
	for (var i=wordIndex;i<wordLabels.length;i++) {
		var wordObject : WordLabel = wordLabels[i];
		wordObject.returnToVerse();
	}
}

function SetupWalls () {
	var w = mainCam.pixelWidth;
	var h = mainCam.pixelHeight;

	topWall.size = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(w*2.0f, 0f, 0f)).x, 1f);
	topWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, h,0f)).y + 0.5f);	
	
	bottomWall.size = topWall.size;
	bottomWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).y - 0.5f);	
	
	leftWall.size = new Vector2(1f, mainCam.ScreenToWorldPoint(new Vector3(0f, h*100.0f, 0f)).y);
	leftWall.center = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).x - 0.5f, 0f);	
	
	rightWall.size = leftWall.size;
	rightWall.center = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(w, 0f, 0f)).x+0.5f, 0f);
	
	screenBounds = Rect(leftWall.center.x+0.5,topWall.center.y-0.5,
	rightWall.center.x-leftWall.center.x-1.0,
	topWall.center.y-bottomWall.center.y-1.0);
	
	screenBoundsComputed = true;
}

function HandleWordWrong() {
	streak = 0;
	
	if (!GetChallengeModeEnabled()) {
		ShowHint();	
	}
	
	audio.PlayOneShot(sndFailure1, 0.5f);
		
	if (!healthBar.IsEmpty()) {
		return;
	}
	
	if (finished) return;
	
//	if (GetChallengeModeEnabled()) {
//		ExplodeWords();
//	}
}
	
function ExplodeWords() {
	
	for (var wordLabel : WordLabel in wordLabels) {
		wordLabel.hinting = false;
		wordLabel.Explode();
	}
	
	if (!GetChallengeModeEnabled()) {
		scoreManager.maxTime += wordIndex;
	}
	
	wordIndex = 0;
	currentWord = words[wordIndex];
}

function HandleWordCorrect() {

	var elapsedTime : float = Time.time - lastWordTime;
	lastWordTime = Time.time;
	
	if (elapsedTime < 5) {
		streak += 1;
	}
	
	var snd : AudioClip = sndSuccess75;
	
	switch (streak) {
		case 0: snd = sndSuccess75; break;
		case 1: snd = sndSuccess50; break;
		case 2: snd = sndSuccess25; break;
		case 3: snd = sndSuccess12; break;
		case 4: snd = sndSuccess2; break;
		case 5: snd = sndSuccess1; break;
	}
	
	if (streak > 5) {
		if ((streak % 2) == 0) {
			snd = sndSuccess2;
		} else {
			snd = sndSuccess1;
		}
	}
	
	for (var wordLabel : WordLabel in wordLabels) {
		wordLabel.hinting = false;
	}
	
	audio.PlayOneShot(snd, 0.25f);
	return scoreManager.HandleWordCorrect(elapsedTime);
}

function SetupUI() {
	feedbackLabel.text = "";
	introReferenceLabel.text = "";
	panelReferenceLabel.text = "";
	feedbackLabel.enabled = false;
	healthBar.SetPercentage(healthBar.targetPercentage);
}

function showFeedback(feedbackText : String, time : float) {
	feedbackLabel.enabled = true;
	feedbackLabel.color.a = 1.0f;
	var animDuration = 0.25f;
	feedbackLabel.transform.localScale = new Vector3(0,0,1);
	AnimationManager.ScaleOverTime(feedbackLabel.transform, Vector3(1.0,1.0,1), animDuration);
	feedbackLabel.text = feedbackText;
	yield WaitForSeconds(time+animDuration);
	// there could be another feedback animation running, in which case we want to let that one take over
	if (feedbackText == feedbackLabel.text) {
		AnimationManager.FadeOverTime(feedbackLabel,1.0,0.0,animDuration);
	}
}

function ShowEndOfGameOptions() {
	Instantiate(endOfGameOptions, new Vector3(0,0,0), Quaternion.identity);	
}

function ShowDifficultyOptions() {
	Instantiate(difficultyOptions, new Vector3(0,0,0), Quaternion.identity);
}

function EnableWordColliders() {
	var wordLabel : WordLabel;

	for (wordLabel in wordLabels) {
		wordLabel.collider2D.enabled = true;
	}
}

function nextWord() {
	if (wordIndex == -1) return null;
	wordHinted = false;
	wordIndex += 1;
	if (wordIndex >= words.length) {
		currentWord = null;
		wordIndex = -1;
		
		EnableWordColliders();
		if (!showingSolution) {
			showFeedback(TextManager.GetText("Awesome!"),3);
			HandleVerseFinished();
		} else {
			ShowEndOfGameOptions();
		}
		return null;
	}
	currentWord = words[wordIndex];
	return currentWord;
}


function AnimateIntro() {
	
	var duration : float = 0.25f;
	var endScale : Vector3 = new Vector3(1.0f,1.0f,1.0f);
	var verse : Verse = verseManager.GetCurrentVerse();
	SetVerseReference(verse.reference);	
	introReferenceLabel.color.a = 1.0f;
	introReferenceLabel.transform.localScale = Vector3.zero;
	AnimationManager.ScaleOverTime(introReferenceLabel.transform, endScale, duration);
	
	verseManager.SayVerseReference();	

	yield WaitForSeconds(2.0f);

	AnimationManager.FadeOverTime(introReferenceLabel, 1.0f, 0.0f, duration);
	
	yield WaitForSeconds(duration);
	
	
}

function Start() {
	if (needToRecordPlay) {
		var versesetId = verseManager.currentVerseSet.onlineId;
		if (versesetId != null) {
			ApiManager.GetInstance().CallApi("verseset/record_play", new Hashtable({"verseset_id":versesetId}), null, null);
		}
		needToRecordPlay = false;
	}
	SetupWalls();
	SetupUI();	
	DidRanOutOfTime = false;

	while (!VerseManager.loaded) {
		yield WaitForSeconds(0.1);
	}
	Debug.Log("VerseManager.loaded, GameManager starting");
	
	difficulty = verseManager.GetCurrentDifficulty();
	
	if (GetChallengeModeEnabled()) {
		if (verseManager.verseIndex == 0) {
			ShowDifficultyOptions();
		} else {
			BeginGame();
		}
	} else {
		if (needToSelectDifficulty && 
		    (verseManager.GetCurrentDifficultyAllowed() != Difficulty.Easy)) {
			ShowDifficultyOptions();
		} else {
			BeginGame();
		}
	
		needToSelectDifficulty = true;
	}
}

function SetVerseReference (reference : String) {
	var diffString = verseManager.DifficultyToString(verseManager.GetCurrentDifficulty());
	
	introReferenceLabel.text = reference;
	panelReferenceLabel.text = reference;
	difficultyLabel.text = diffString;
}


function SplitVerse(verse : String) {
	var langConfig : Hashtable = new Hashtable({'en':[20,10,5],
								  				'zh':[10,6,3],
								  				'ko':[11,6,3],
								  				'ja':[11,6,3]});
	var language : String = VerseManager.GetVerseLanguage();
	var isChinese : boolean = VerseManager.IsLanguageChinese(language);
	
	var phraseLengths : Array = langConfig['en'];
	
	if (langConfig.Contains(language)) {
		phraseLengths = langConfig[language];
	} else {
		if (isChinese) {
			phraseLengths = langConfig['zh'];
		}
	}
	
	var clauseBreakMultiplier = 1.0f;
	var difficultyInt = verseManager.GetDifficultyFromInt(difficulty);
	var phraseLength : int = phraseLengths[difficultyInt];
		
	//Debug.Log("SplitVerse = " + verse );
	
	//Debug.Log("phrase length = " + phraseLength);
	var clauseArray : Array = new Array();
	var phraseArray : Array = new Array();
	var seps = ["、","，", "，","。","！","；","：","?",",",";",":","？",".","’","”","!"];
	var clause = "";
	
	var paransRe:Regex = new Regex("(.*)");
	
	// filter out paranthesis, unwanted characters
	verse = Regex.Replace(verse, "\\(.*\\)","");
	verse = Regex.Replace(verse, "\\（.*\\）","");
	verse = Regex.Replace(verse, "\\[.*\\]","");
	verse = Regex.Replace(verse, "」|「|『|』","");
	verse = Regex.Replace(verse, "\n|\t|\r", " ");
	verse = Regex.Replace(verse, "\\s+", " ");
	
	var processClause = function(clause : String) {
		var combined : boolean = false;
		if (clauseArray.length > 0) {
			// combine with previous clause if too small
			var previousClause : String = clauseArray[clauseArray.length-1];
			// subtract 2 to account for separators
			if (((clause.Length + previousClause.Length - 2) < phraseLength) ||
				(clause.Length == 1)) {
				clauseArray[clauseArray.length-1] += clause;
				combined = true;
			}	
		}
		if (!combined) {
			clauseArray.push(clause);
		}
	};
	
	for (var c in verse) {
		clause = clause + c;
		for (var s in seps) {
			if (s == c) {
				if ((clause != "") && (clause != " ") && (clause != "  ")) {
					processClause(clause);
				}
				clause = "";
			}
		}
	}
	
	
	if ((clause != "") && (clause != " ") && (clause != "  ")) {
		processClause(clause);
	}
	
		
	var phrase : String = "";
	var newPhrase : String = "";
	var phraseLengthForClause : int;
	
	
	var phraseHasPunctuation = function(phrase : String) {
		for (var sc in seps) {
			if (phrase.Contains(sc)) {
				return true;
			}
		}
		return false;
	};
	
	//Debug.Log("clause array = " + clauseArray);
	
	for (clause in clauseArray) {
		// check for special '\' marker which we cannot split on
		var nobreakMarkers = new Array();
		for (var i=0;i<clause.Length;i++) {
			if ((clause[i] == "／"[0]) || (clause[i] == "/"[0]) || (clause[i] == " "[0])) {
				nobreakMarkers.Add(i);
			}
		}
		
		nobreakMarkers.Add(clause.Length-1);
		
		//Debug.Log("clause.Length > phraseLength*clauseBreakMultiplier = " + clause.Length + " >" + phraseLength + "*"+ clauseBreakMultiplier);
		if (clause.Length > phraseLength*clauseBreakMultiplier) {
			
			var divisor = Mathf.RoundToInt(1.0f*clause.Length/phraseLength);
			var l : int = 0;
			
			while (l < clause.Length) {
				if (difficulty == Difficulty.Hard) {
					phraseLengthForClause = phraseLength;
				} else {
					phraseLengthForClause = Mathf.RoundToInt(clause.Length/divisor);
				}
				
				if ((l + phraseLengthForClause*1.5) > clause.Length) {
					phraseLengthForClause = clause.Length - l;	
				}
				

				while (((l + phraseLengthForClause) < clause.Length) &&
							 (clause[l+phraseLengthForClause] != " ") ) {
							phraseLengthForClause += 1;
				}
				
				// glob onto the closest no break marker
				if (nobreakMarkers.length > 0) {
					var best = 100;
					var bestIndex = -1;
					for (var index : int in nobreakMarkers) {
						var diff = Mathf.Abs(index - (phraseLengthForClause + l));
						if ((diff < best) && (index >= l)) {
							bestIndex = index;
							best = diff;
//							Debug.Log("best index = " + index + " best diff = " +  best);
						}
					}
					if (bestIndex != -1) {
						phraseLengthForClause = bestIndex+1-l;
					}
				}
				
				phrase = clause.Substring(l, phraseLengthForClause);
				
				// filter out no break markers
				phrase = phrase.Replace("／","");
				phrase = phrase.Replace("/","");
				
				if (isChinese) { phrase = phrase.Replace(" ",""); }
				
				// filter out leading or trailing spaces
				if ((phrase.Length > 0) && (phrase[0] == " ")) {
					phrase = phrase.Substring(1,phrase.Length-1);
				}
				//Debug.Log("phrase.Length = " + phrase.Length);
				if ((phrase.Length > 0) && (phrase[phrase.Length-1] == " ")) {
					phrase = phrase.Substring(0,phrase.Length-1);
				}

				
				l = l + phraseLengthForClause;
				
				if ((phrase != "") && (phrase != " ") && (phrase != "  ")) {
					if (isChinese) {phrase = phrase.Replace(" ","");}
					phraseArray.push(phrase);
					
				}
			}	
		} else {
			// filter out no break markers
			clause = clause.Replace("／","");
			clause = clause.Replace("/","");
			if (isChinese) {clause = clause.Replace(" ","");}
			phraseArray.push(clause);
			
		}		
	}
	return phraseArray;

}


function SplitVerseWordByWord(verse : String) {

	var phraseLength = 5;
	var language = verseManager.GetLanguage();
	
	switch (difficulty) {
		case Difficulty.Easy:
			phraseLength = 20;
			break;
		case Difficulty.Medium:
			phraseLength = 15;
			break;
		case Difficulty.Hard:
			phraseLength = 10;
			break;
	}
	//Debug.Log("phrase length = " + phraseLength);

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
		//Debug.Log("Phrase = "+ phrase);
		phraseArray.push(phrase);
	}
	return phraseArray;
}

function Cleanup () {
	var wObject : WordLabel;
	for (wObject in wordLabels) {
		Destroy(wObject.gameObject);
	}
	wordLabels.Clear();
	
}

function BeginGame() {

	SetupVerse();
	AnimateIntro();
}

function GetMaxWordsActive() {
	
	switch(difficulty) {
		case Difficulty.Easy:
			return 4;
		case Difficulty.Medium:
			return 7;
		case Difficulty.Hard:
			return 10;
	}
	return 10;
}

function scrambleWordLabels() {
	scrambledWordLabels = new Array();
	for (var i : int=0;i<wordLabels.length;i++) {
		scrambledWordLabels.push(wordLabels[i]);
	}
	var maxWordsActive = GetMaxWordsActive();
	var g = Mathf.RoundToInt(GetGroupSize() * 1.25);
	if (g >= (maxWordsActive-1)) g = (maxWordsActive-1);
	
	var currentIndex : int = scrambledWordLabels.length;
	var temporaryValue : WordLabel;
	var randomIndex : int;

  	// While there remain elements to shuffle...
  	while (0 != currentIndex) {

    	// Pick a remaining element...
    	randomIndex = (currentIndex - g) + Mathf.Floor(Random.RandomRange(0,1.0f) * g);
    	if (randomIndex < 0) randomIndex = 0;
    	currentIndex -= 1;

    	// And swap it with the current element.
    	temporaryValue = scrambledWordLabels[currentIndex];
    	scrambledWordLabels[currentIndex] = scrambledWordLabels[randomIndex];
    	scrambledWordLabels[randomIndex] = temporaryValue;
  	}
}

function SetupVerse() {
	gameStarted = false;
	showingSolution = false;

	if (GetChallengeModeEnabled()) {
		scoreManager.resetStatsForChallenge();
	} else {
		scoreManager.reset();
	}
	finished = false;
	difficulty = verseManager.GetCurrentDifficulty();
	var maxWordsActive = GetMaxWordsActive();
	
	Cleanup();
	lastWordTime = Time.time;
	
	var clone : WordLabel;
	
	var verse : Verse = verseManager.GetCurrentVerse();
	SetVerseReference(verse.reference);
	verseMetadata = verse.GetMetadata();
	//Debug.Log("verse difficulty is " + verseMetadata["difficulty"]);	
	if (verseMetadata["difficulty"] != null) {
		//difficulty = GetDifficultyFromInt(verseMetadata["difficulty"]);
	}
	
	// calculate word size based on length of text
	//Debug.Log("verse length = " + verse.text.length);
	
	wordScale = 1.0f;
	
	if (verse.text.length > 300) {
		wordScale = 0.5f + 0.5f*(300.0f / verse.text.length);
	}
	
	words = SplitVerse(verse.text);
	wordIndex = 0;
	currentWord = words[wordIndex];
	
	if (GetChallengeModeEnabled() && (verseManager.verseIndex > 0)) {
		var extraTime = scoreManager.CalculateMaxTime();
		var newTime = extraTime + scoreManager.timeLeft;		
		
		var duration = 0.1f*(newTime-scoreManager.timeLeft);
		if ((duration) > 2.0f) duration = 2.0f;
		Debug.Log("new time = " + newTime + " max time = " + scoreManager.timeLeft);
		scoreManager.CountTimeUpTo(newTime);
				
		yield WaitForSeconds(duration);
		scoreManager.resetTime();
	} else {
		scoreManager.maxTime = scoreManager.CalculateMaxTime();
	}
	
	var dy = screenBounds.y;
	var i = 0;
	var rTL = verseManager.rightToLeft;
	for (word in words) {
		clone = Instantiate(wordLabel, new Vector3(0,0,0), Quaternion.identity);
		clone.rightToLeft = rTL;
		clone.setWord(word);
		clone.wordIndex = i;
		wordLabels.push(clone);
		var w = clone.totalSize.x;
		var h = clone.totalSize.y;
		var x = Random.Range(screenBounds.x+w*0.5,screenBounds.x+screenBounds.width-w*0.5);
		var y = screenBounds.y+screenBounds.height+h*2;
		clone.transform.position = new Vector3(x,y,0);
		clone.rigidbody2D.isKinematic = true;
		i += 1;
	}
	
	scrambleWordLabels();
	
	yield WaitForSeconds(2.5f);
	
	numWordsReleased = 0;	
	var numWordsActive = 0;
	var groupSize = GetGroupSize();

	var dt = 0.2f;
	
	while (numWordsReleased < wordLabels.length) {
		numWordsActive = (numWordsReleased - wordIndex);
		
		// don't allow more than maxWordsActive words on screen at the same time
		while (numWordsActive >= maxWordsActive) {
			yield WaitForSeconds(0.1f);
			numWordsActive = (numWordsReleased - wordIndex);
		}		
		
		numWordsReleased = releaseWords(numWordsReleased, 1);
		numWordsActive = (numWordsReleased - wordIndex);
		
		yield WaitForSeconds(dt);

		if (!gameStarted  && ((numWordsReleased >= 2*groupSize) ||
		    (numWordsReleased >= wordLabels.length) || (numWordsReleased == maxWordsActive) ))
		{
			gameStarted = true;
			scoreManager.resetTime();
		}
	}

	
	numWordsReleased = wordLabels.length;
	
}

function GetWordLabelAt(index : int) : WordLabel {
	if (index < 0) return null;
	if (index >= wordLabels.length) return null;
	return wordLabels[index];
}

function GetGroupSize() {
 	// try group size = 1
	var groupSize : int = 3;
	
	switch(difficulty) {
		case Difficulty.Medium:
			groupSize = 4;
			break;
		case Difficulty.Hard:
			groupSize = 5;
			break;
		default:
			break;
	}
	return groupSize;
}

function releaseWords(index: int, numWords : int) {
 	//Debug.Log("release words index = " + index);
 
	var c : int  = 0;
	
	for (var i : int=index;i<scrambledWordLabels.length;i++) {
		var wordObject : WordLabel = scrambledWordLabels[i];
		var h = wordObject.boxCollider2D().size.y;
		wordObject.transform.position.y = screenBounds.y+h*2;
		wordObject.rigidbody2D.isKinematic = false;
		c += 1;	
		if (c == numWords) {
			break;
		}
	}
	return i+1;
}

function StartNextDifficulty() {
	verseManager.upgradeDifficultyForVerse(verseMetadata);
	BeginGame();
}

function StartAnotherVerse() {
	verseManager.GotoNextVerse();
	BeginGame();
}

function HandleRanOutOfTime() {
	DidRanOutOfTime = true;

	if (GetChallengeModeEnabled()) {
		for (var wordLabel : WordLabel in wordLabels) {
			wordLabel.collider2D.enabled = false;
		}
	
		HandleVerseFinished();
	}

}

function HandleVerseFinished() {
	if (GetChallengeModeEnabled() &&
		!verseManager.IsAtFinalVerseOfChallenge() &&
		!DidRanOutOfTime) {
		finished = true;
		yield WaitForSeconds(4);
		StartAnotherVerse();
	} else {
		finished = true;
		gameStarted = false;
		yield WaitForSeconds(1);
		//Debug.Log("verse finished");
		scoreManager.HandleFinished();
	}
}

function ShowHintFromButton() {
	if (finished) return;
	ShowHint();
	scoreManager.HandleWordWrong();
	audio.PlayOneShot(sndSuccess1, 0.5f);
}

function ShowHint() {
	wordHinted = true;	
	var wObject : WordLabel;
	
	for (wObject in wordLabels) {
		if ((wObject.word == currentWord) && !wObject.returnedToVerse && !wObject.gotoVerse) {
			wObject.HintAt();
		}
	}
}

function Update () {
	var elapsedTime : float = Time.time - lastWordTime;
	
	if (!wordHinted && !finished && (elapsedTime > timeUntilHint)) {
		ShowHint();
	}
	refreshButton.active = CanShowSolution();
	hintButton.active = !GetChallengeModeEnabled();
}