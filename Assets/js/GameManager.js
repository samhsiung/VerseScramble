﻿#pragma strict
import UnityEngine;
import UnityEngine.UI;
import System.Collections.Generic;

@script RequireComponent(AudioSource);

public enum Difficulty {Easy, Medium, Hard, Impossible};

public var victorySnd : AudioClip;
public var skyManager : SkyManager;
public var wordLabelContainer : PanCamera;
public var mainCam : Camera;
public var wordLabel : WordLabel;
public var topWall : BoxCollider2D;
public var bottomWall: BoxCollider2D;
public var leftWall : BoxCollider2D;
public var rightWall : BoxCollider2D;
public var medWall : BoxCollider2D;
public var finished : boolean = false;
public var difficulty : Difficulty = Difficulty.Easy;
public var scoreManager : ScoreManager;
public var verseManager : VerseManager;
public var verseMetadata : Hashtable;
public var timeUntilHint : int ;
public var background : SpriteRenderer;
public var sndSuccess1 : AudioClip;
public var sndSuccess2 : AudioClip;
public var sndSuccess75 : AudioClip;
public var sndSuccess50 : AudioClip;
public var sndSuccess25 : AudioClip;
public var sndSuccess12 : AudioClip;

public var sndFailure1 : AudioClip;
public var sndExplode1 : AudioClip;
public var sndSelect : AudioClip;
public var refreshButton : Button;
public var hintButton : Button;
public var feedbackLabel : Text;
public var introReferenceLabel : Text;
public var panelReferenceLabel : Text;
public var difficultyLabel : Text;
public var healthBar : HealthBar;
public var wordScale : float;
public var setProgressLabel : Text;
public var updateCount : int = 0;
public var line : int = 0;
public var separators : String[] = ["、","，", "，","。","！","；","：","?",",",";",":","？",".","’","”","!"];

public var needToSelectDifficulty : boolean = true;
public var difficultyOptions : DifficultyOptions;
public var endOfGameOptions : EndOfGameOptions;
public var numWordsReleased : int = 0;
public var gameStarted : boolean = false;
public var showingSolution : boolean = false;
public var DidRanOutOfTime : boolean = false;

private var wordHinted : boolean = false;

static var lastDiffSpoken : String;
static var needToRecordPlay : boolean = true;
static var currentWord : String;
static var words : List.<String> = new List.<String>();
static var wordLabels : List.<WordLabel> = new List.<WordLabel>();
static var scrambledWordLabels : List.<WordLabel> = new List.<WordLabel>();
static var wordIndex : int;
static var score = 0;
static var highScore = 0;
static var screenBounds : Rect;
static var screenBoundsComputed : boolean = false;
static var streak : int = 0;
static var moves : int = 0;
static var lastWordTime : float;
static var challengeModeState : int = -1;
static var activeWordLabels : List.<WordLabel> = new List.<WordLabel>();

private var windowRect : Rect;

static function SetChallengeModeEnabled(enabled : boolean) {
	var enabledInt = 0;
	if (enabled) enabledInt = 1;
	challengeModeState = enabledInt;
	PlayerPrefs.SetInt("challenge_mode", enabledInt);
}

static function GetChallengeModeEnabled() : boolean {
	if (challengeModeState == -1) {
		return PlayerPrefs.GetInt("challenge_mode") == 1;
	} else {
		return (challengeModeState == 1);
	}
}


function OnGUI() {

}

static function GetReviewURL() : String {
	var url : String = "https://itunes.apple.com/us/app/verse-rain-fun-bible-verse/id928732025?ls=1&mt=8";
				
	if (Application.platform == RuntimePlatform.Android) {
		url = "https://play.google.com/store/apps/details?id=com.hopeofglory.verserain";
	}
	return url;
}

function ExitToVerseList() {
	audio.PlayOneShot(sndSelect, 1.0f);
	Cleanup();
	Application.LoadLevel("versesets");
}

function CanShowSolution() : boolean {
	return ((wordIndex < wordLabels.Count) && !finished && gameStarted && !GetChallengeModeEnabled());	
}

function HandleCountTimeFinished() {
	if (scoreManager.isHighScore && scoreManager.WasVerseMastered()) {
		audio.PlayOneShot(victorySnd, 1.0f);
		yield WaitForSeconds(0.5f);
		skyManager.LookAtRainbow();
		skyManager.ShowRainbow();
		yield WaitForSeconds(3.0f);
	} else {
		yield WaitForSeconds(2.0f);
	}
	
	ShowEndOfGameOptions();
}

function ShowSolution() {
	if (!CanShowSolution()) {
		if (finished) {
			ShowEndOfGameOptions();
			return;
		}
		audio.PlayOneShot(sndFailure1,1.0f);
		return;
	}
	if (showingSolution) {
		var endPopup : EndOfGameOptions = GameObject.FindObjectOfType(EndOfGameOptions);
		if (endPopup == null) {
			ShowEndOfGameOptions();
		}
		return;
	}
	
	audio.PlayOneShot(sndSelect,1.0);
	showingSolution = true;
	
	if (wordIndex < 0) return;
	
	for (var i=wordIndex;i<wordLabels.Count;i++) {
		var wordObject : WordLabel = wordLabels[i];
		wordObject.returnToVerse();
	}

}

function SetupWalls () {
	var w : int = mainCam.pixelWidth;
	var h : int = mainCam.pixelHeight;
	var thickness : float = 0.2f;
	
	topWall.size = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(w*2.0f, 0f, 0f)).x, thickness);
	topWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, h ,0f)).y + 0.5f*thickness);	
	
	medWall.size = topWall.size;
	medWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, h*0.8f,0f)).y +thickness*0.1f);	
	
	bottomWall.size = topWall.size;
	bottomWall.center = new Vector2(0f, mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).y - thickness*0.5f);	
	
	leftWall.size = new Vector2(thickness, mainCam.ScreenToWorldPoint(new Vector3(0f, h*100.0f, 0f)).y);
	leftWall.center = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(0f, 0f,0f)).x - 0.5f*thickness, 0f);	
	
	rightWall.size = leftWall.size;
	rightWall.center = new Vector2(mainCam.ScreenToWorldPoint(new Vector3(w, 0f, 0f)).x+0.5f*thickness, 0f);
	
	screenBounds = Rect(leftWall.center.x+0.5*thickness,topWall.center.y-0.5*thickness,
	rightWall.center.x-leftWall.center.x-1.0*thickness,
	topWall.center.y-bottomWall.center.y-1.0*thickness);
	
	screenBoundsComputed = true;
}

function HandleWordWrong() {
	streak = 0;
	
	ShowHint();	
	
	audio.PlayOneShot(sndFailure1, 0.5f);
		
	if (!healthBar.IsEmpty()) {
		return;
	}
	
	if (finished) return;
	
}

function CheckWordSubsetMatches(wLabel1 : WordLabel, wLabel2 : WordLabel) : boolean {
	var minLength :int = Mathf.Min(wLabel1.word.Length, wLabel2.word.Length);
	for (var i:int =0;i<minLength;i++) {
		var c1 : String = wLabel1.word[i].ToString();
		var c2 : String = wLabel2.word[i].ToString();
		// ignore separators
		var hasSep : boolean = false;
		if (c1 != c2) {
			for (var s:String in separators) {
				if ((s == c1) || (s == c2)) {
					hasSep = true;
					break;
				}
			}
			if (hasSep) {
				continue;
			}
			return false;
		}
	}
	return true;
}

function CheckForActiveDuplicate(wordLabel : WordLabel) : WordLabel {
	
	var wLabel : WordLabel = wordLabels[wordIndex];
	
	if (wLabel == wordLabel) return null;
	
	if (CheckWordSubsetMatches(wLabel, wordLabel)) {
		return wLabel;
	}
	
	return null;
}


function GetProgress() : float {
	var verseProgress : float = 0.0f;
	
	if (finished) {
		verseProgress = 1.0f;
	} else {
		if (wordLabels.Count > 0) {
			verseProgress = (wordIndex*1.0f) / (1.0f*wordLabels.Count);
		} else {
			verseProgress = 0.0f;
		}
	}
	if (GetChallengeModeEnabled()) {
		var versesCount : int = verseManager.GetCurrentVerses().Count;
		if (versesCount == 0) {
			return 0.0f;
		}
		var setProgress : float = (verseManager.verseIndex+verseProgress) / (1.0f* versesCount);
		return setProgress;
	} else {
		return verseProgress;
	}
}

function HandleProgress() {
	var terrain : GameObject = GameObject.Find("GroundTerrain");
	var p : float = GetProgress()*3.0f;
	terrain.SendMessage("SetTargetProgress", p);
}

function HandleWordCorrect(wordLabel : WordLabel) {

	var timeSinceLastWord : float = Time.time - lastWordTime;
	lastWordTime = Time.time;
	
	if (timeSinceLastWord < 5) {
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
	
	audio.PlayOneShot(snd, 0.25f);
	HandleProgress();
	
	var wasHinting : boolean = wordLabel.hinting;
	
	for (var wLabel : WordLabel in wordLabels) {
		wLabel.hinting = false;
	}
	
	// no credit for hinting
	if (wasHinting) return 0;
	
	return scoreManager.HandleWordCorrect(timeSinceLastWord);
}

function SetupUI() {
	feedbackLabel.text = "";
	introReferenceLabel.text = "";
	panelReferenceLabel.text = "";
	difficultyLabel.text = "";
	feedbackLabel.enabled = false;
	healthBar.SetPercentage(healthBar.targetPercentage);	
	SyncSetProgressLabel();
}

function SyncSetProgressLabel() {
	setProgressLabel.active = GetChallengeModeEnabled();
	setProgressLabel.text = String.Format("{0}/{1}", verseManager.verseIndex+1, verseManager.GetCurrentVerses().Count);
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
	if (wordIndex >= words.Count) {
		currentWord = null;
		wordIndex = -1;
		
		EnableWordColliders();
		if (!showingSolution) {
			showFeedback(TextManager.GetText("Awesome!"),3);
			HandleVerseFinished();
		} else {
			//ShowEndOfGameOptions();
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
	SetVerseReference(verse.reference, verse.version);	
	introReferenceLabel.enabled = true;
	introReferenceLabel.color.a = 1.0f;
	introReferenceLabel.transform.localScale = Vector3.zero;
	AnimationManager.ScaleOverTime(introReferenceLabel.transform, endScale, duration);
	
	verseManager.SayVerseReference();	

	yield WaitForSeconds(3.0f);

	AnimationManager.FadeOverTime(introReferenceLabel, 1.0f, 0.0f, duration);
	
	yield WaitForSeconds(duration);
	
	
}

function RecordPlay() {

	while (!VerseManager.loaded) {
		yield WaitForSeconds(1);
	}

	var verseset : VerseSet = VerseManager.currentVerseSet;
	if (Object.ReferenceEquals(verseset, null)) {
		return;
	}
	var versesetId = verseset.onlineId;
	if (versesetId != null) {
		var options : Hashtable = new Hashtable({"errorHandler":null});
		var arguments : Hashtable = new Hashtable({"verseset_id":versesetId});
		ApiManager.GetInstance().CallApi("verseset/record_play", arguments);
	}
	needToRecordPlay = false;
}

public static function GetInstance() : GameManager {
	return GameObject.FindObjectOfType(GameManager);
}

function Start() {
	if (needToRecordPlay) {
		RecordPlay();
	}
	SetupWalls();
	SetupUI();	
	DidRanOutOfTime = false;

	while (!VerseManager.loaded) {
		yield WaitForSeconds(0.1);
	}
	Debug.Log("VerseManager.loaded, GameManager starting");
	
	var verse : Verse = VerseManager.GetCurrentVerse();
	panelReferenceLabel.text = verse.reference;
	
	difficulty = verseManager.GetCurrentDifficulty();
	
	if (needToSelectDifficulty) { 
	   if (verseManager.GetCurrentDifficultyAllowed() == Difficulty.Easy) {
			verseManager.SetDifficulty(Difficulty.Easy);
			BeginGame();
		} else {
			ShowDifficultyOptions();
		}
	} else {
		verseManager.SetDifficulty(difficulty);
		BeginGame();
	}
	needToSelectDifficulty = true;
	
}

function SetVerseReference (reference : String, version : String) {
	var diffString = verseManager.DifficultyToString(verseManager.GetCurrentDifficulty());
	var label : String = reference;
	
	if (version != null) {
		label += String.Format(" ({0})", version.ToLower());
	}
	
	introReferenceLabel.text = label;
	panelReferenceLabel.text = label;
	difficultyLabel.text = diffString;
}


function SplitVerse(verse : String) : List.<String> {
	var langConfig : Hashtable = new Hashtable({'en':new List.<int>([20,10,5]),
								  				'zh':new List.<int>([10,6,3]),
								  				'ko':new List.<int>([11,6,3]),
								  				'ja':new List.<int>([11,6,3])});
	var language : String = VerseManager.GetVerseLanguage();
	var isChinese : boolean = VerseManager.IsLanguageChinese(language);
	
	var phraseLengths : List.<int> = langConfig['en'];
	
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
	var clauseArray : List.<String> = new List.<String>();
	var phraseArray : List.<String> = new List.<String>();
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
		if (clauseArray.Count > 0) {
			// combine with previous clause if too small
			var previousClause : String = clauseArray[clauseArray.Count-1];
			//Debug.Log("phraseLength = " + phraseLength + " clause length = " + clause.Length + " prev clause length = " + previousClause.Length);
			
			// if clause length is 2 or less just glob it on
			if (clause.Length <= 2) {
				clauseArray[clauseArray.Count-1] += clause;
				combined = true;
			}	
		}
		if (!combined) {
			clauseArray.Add(clause);
		}
	};
	
	var i = 0;
	var languageIsWestern : boolean = VerseManager.IsLanguageWestern(language);
	
	var isSeparator : Function = function(s : String, c : char, n : char ) {
		
		if (s[0] != c) return false;
		
		if (languageIsWestern) {
			// make sure space is after separator
			return (n == " ");
		} else {
			return true;
		}
	};
	
	var numSeps : int = 0;
	var numSpaces : int = 0;
	
	for (var c : char in verse) {	
		
		clause = clause + c;
		var n : char = " "[0];
		if (i < (verse.Length-1)) {
			n = verse[i+1];
		}
		for (var s : String in separators) {
			if (isSeparator(s,c,n)	) {
				if ((clause != "") && (clause != " ")) {
					//Debug.Log("process " + clause);
					processClause(clause);
				}
				clause = "";
				numSeps += 1;
			}
		}
		
		if (c == " "[0]) {
			numSpaces += 1;
		}
		
		i += 1;
	}
	
	var spaceSepRatio : float = (numSeps+1.0f)/(numSpaces+1.0f);
	
	if ((clause != "") && (clause != " ") && (clause != "  ")) {
		processClause(clause);
	}
	
		
	var phrase : String = "";
	var newPhrase : String = "";
	var phraseLengthForClause : int;
	var isCharacterBased = verseManager.IsCharacterBased(language) && (spaceSepRatio > 1.5f);
	
	var phraseHasPunctuation = function(phrase : String) {
		for (var sc in separators) {
			if (phrase.Contains(sc)) {
				return true;
			}
		}
		return false;
	};
	
	//Debug.Log("clause array = " + clauseArray);
	
	for (clause in clauseArray) {
		// check for special '\' marker which we cannot split on
		var nobreakMarkers : Array = new Array();
		var numPhrase : float = Mathf.RoundToInt((clause.Length + 0.0f)/phraseLength);
		if (numPhrase == 0) numPhrase = 1;
		var breakLength : int = Mathf.RoundToInt((clause.Length + 0.0f)/numPhrase);
		//Debug.Log("break length = " + breakLength);
		
		for (i=0;i<clause.Length;i++) {
			if ((clause[i] == "／"[0]) || (clause[i] == "/"[0]) || (clause[i] == " "[0])) {
				nobreakMarkers.Add(i);
			} else if ((i % breakLength == 0) && isCharacterBased) {
				nobreakMarkers.Add(i);
			}
		}
		
		nobreakMarkers.Add(clause.Length-1);
		//Debug.Log("nobreak markers = " + nobreakMarkers);
		
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
								
				// glob onto the closest no break marker
				if (nobreakMarkers.length > 0) {
					var best = 100;
					var bestIndex = -1;
					for (var index : int in nobreakMarkers) {
						var diff = Mathf.Abs(index - (phraseLengthForClause + l));
						if ((diff < best) && (index >= l)) {
							bestIndex = index;
							best = diff;
							//Debug.Log("best index = " + index + " best diff = " +  best);
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
					phraseArray.Add(phrase);
					
				}
			}	
		} else {
			// filter out no break markers
			clause = clause.Replace("／","");
			clause = clause.Replace("/","");
			if (isChinese) {clause = clause.Replace(" ","");}
			phraseArray.Add(clause);
		}
		
		// combine phrases for long laundry lists
		if (phraseArray.Count > 1) {
			l = phraseArray.Count;
			var curPhrase : String = phraseArray[l-1];
			var prevPhrase : String = phraseArray[l-2];
			
			var curWords = curPhrase.Trim().Split(" "[0]).Length;
			var prevWords = prevPhrase.Trim().Split(" "[0]).Length;
			
			// try to handle laundry lists, be more generous
			var hasCommas : boolean = ((curPhrase.EndsWith(",") || curPhrase.EndsWith("、")) && (curWords < 2) &&
			 (prevPhrase.EndsWith(",") || curPhrase.EndsWith("、")) && (prevWords < 2));
			 
			if ((difficulty != difficulty.Hard) && hasCommas && ((curPhrase.Length + prevPhrase.Length - 2) < phraseLength*2.0f)) {
			 Debug.Log("COMBINE(" + prevPhrase + " | " + curPhrase + ")");
			 	var lastPhrase : String = phraseArray[phraseArray.Count-1];
			 	phraseArray.RemoveAt(phraseArray.Count-1);
			 
				prevPhrase += " " + lastPhrase;
				phraseArray[l-2] = prevPhrase;
			}
		}
	}
	Debug.Log("# blocks = " + phraseArray.Count);
	return phraseArray;

}

function Cleanup () {
	var wObject : WordLabel;
	for (wObject in wordLabels) {
		Destroy(wObject.gameObject);
	}
	activeWordLabels.Clear();
	wordLabels.Clear();
	scrambledWordLabels.Clear();
	needToRecordPlay = true;
}

function BeginGame() {
	line = 0;
	wordLabelContainer.Reset();
	skyManager.ZoomOut();
	skyManager.LookAtTerrain();
	skyManager.HideRainbow();
	
	SetupVerse();
	
	introReferenceLabel.enabled = false;
	var diffString : String = verseManager.DifficultyToString(difficulty);
	var diffSpoken : String = TextManager.GetText(diffString);
	
	if (lastDiffSpoken != diffSpoken) {
		verseManager.SpeakUtterance(diffSpoken);
		lastDiffSpoken = diffSpoken;
	}
	HandleProgress();
	
	AnimateIntro();
}

function GetMaxActiveWordIndex() : int {
	var maxActiveWords : int = GetMaxWordsActive();
	var maxWords : int = scrambledWordLabels.Count;
	if ((wordIndex + maxActiveWords) < maxWords) {
		maxWords = wordIndex + maxActiveWords;
	}
	return maxWords;
}

function UpdateGravityScale() : float {
	
	var fellDownEnough : float = 0.0;
	
	if (wordIndex <= 0) return;
	if (activeWordLabels.Count == 0) return;
	if (wordIndex >= wordLabels.Count) return;
	
	var currWordLabel : WordLabel = wordLabels[wordIndex];
	
	for (var wordLabel : WordLabel in activeWordLabels) {
		fellDownEnough += wordLabel.GetPercentFell();
	}
	var f :float = currWordLabel.GetPercentFell();
	
			
	if (fellDownEnough == 0) {
		fellDownEnough = .1;
	}
	
	var pct : float = 1.0f;
	
	pct = fellDownEnough / (1.0f*activeWordLabels.Count);

	if (f < pct) {
		pct = 0.5f*f + 0.5f*pct;
	}
	if (pct < .1f) {
		pct = .1f;
	}
	var gravity : float = 0.1 / (pct*pct);
	//Debug.Log(" pct = " + pct + " gravity = " + gravity);
	for (var wordLabel : WordLabel in activeWordLabels) {
		wordLabel.rigidbody2D.gravityScale = gravity;
	}
	
}

function GetMaxWordsActive() {
	
	switch(difficulty) {
		case Difficulty.Easy:
			return 4;
		case Difficulty.Medium:
			return 7;
		case Difficulty.Hard:
			return 12;
	}
	return 10;
}

function SwapWords(index1:int, index2:int) {
	Debug.Log("Swap " + index1 + " with " + index2);
	var word1 : WordLabel = wordLabels[index1];
	var word2 : WordLabel = wordLabels[index2];
	
	word1.wordIndex = index2;
	word2.wordIndex = index1;
	
	wordLabels[index1] = word2;
	wordLabels[index2] = word1;
}

function OrderedIndexOfWord(wordLabel : WordLabel) : int {
	return wordLabels.LastIndexOf(wordLabel);	
}

function scrambleWordLabels() {
	scrambledWordLabels = new List.<WordLabel>();
	for (var i : int=0;i<wordLabels.Count;i++) {
		scrambledWordLabels.Add(wordLabels[i]);
	}
	var maxWordsActive = GetMaxWordsActive();
	var g = Mathf.RoundToInt(GetGroupSize() * 1.25);
	if (g >= (maxWordsActive-1)) g = (maxWordsActive-1);
	
	var currentIndex : int = scrambledWordLabels.Count;
	var temporaryValue : WordLabel;
	var randomIndex : int;

  	// While there remain elements to shuffle...
  	while (0 != currentIndex) {
    	// Pick a remaining element...
    	randomIndex = (currentIndex - g) + Mathf.Floor(Random.RandomRange(0,1.0f) * g);
    	if (randomIndex < 0) randomIndex = 0;
    	currentIndex -= 1;
		var realIndex : int = OrderedIndexOfWord(scrambledWordLabels[currentIndex]);
		// don't let words get too far away
		if (Mathf.Abs(realIndex - currentIndex) > g*2) {
			Debug.Log("skip swap, real index: " + realIndex + " curIndex: " + currentIndex);
			continue;
		}

    	// And swap it with the current element.
    	temporaryValue = scrambledWordLabels[currentIndex];
    	scrambledWordLabels[currentIndex] = scrambledWordLabels[randomIndex];
    	scrambledWordLabels[randomIndex] = temporaryValue;
  	}
  	
}

function AdjustWordScale() {
	WordLabel.ResetVersePosition();
	var minY = screenBounds.y - screenBounds.height;
	var maxX = screenBounds.x + screenBounds.width;
	Debug.Log("minY = " + minY);
	
	var h : float = 0.0f;
	for (var i=0;i<wordLabels.Count;i++) {
		var wordLabel : WordLabel = wordLabels[i];
		wordLabel.CalculateVersePosition();
		wordLabel.isLastInLine = false;
		wordLabel.isFirstInLine = false;
		h = wordLabel.nonEdgeSize.y;
        //Debug.Log("verse position = " + wordLabel.versePosition);
	}
	var wordY : float = (WordLabel.versePosition.y - h);
	
    Debug.Log("wordY = " + wordY);
	
	if ((wordY) < minY) {
		wordScale -= 0.025f;
		Debug.Log("adjust word scale to " + wordScale);
		for (i=0;i<wordLabels.Count;i++) {
			wordLabel = wordLabels[i];
			wordLabel.SyncFontSize();
		}
		AdjustWordScale();
		return;
	}
	
	var screenBounds = GameManager.screenBounds;
	WordLabel.ResetVersePosition();
}

function SetupVerse() {
	SyncSetProgressLabel();
	VerseManager.AddOnlineVerseSetToHistory(verseManager.GetCurrentVerseSet());

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
	SetVerseReference(verse.reference, verse.version);
	verseMetadata = verse.GetMetadata();
	//Debug.Log("verse difficulty is " + verseMetadata["difficulty"]);	
	if (verseMetadata["difficulty"] != null) {
		//difficulty = GetDifficultyFromInt(verseMetadata["difficulty"]);
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
		wordLabels.Add(clone);
		clone.transform.SetParent(wordLabelContainer.transform);
		
		var w = clone.totalSize.x;
		var h = clone.totalSize.y;
		var x = Random.Range(screenBounds.x+w*0.5,screenBounds.x+screenBounds.width-w*0.5);
		var y = screenBounds.y+screenBounds.height+h*2;
		clone.transform.position = new Vector3(x,y,0);
		clone.rigidbody2D.isKinematic = true;
		i += 1;
	}
	
	//AdjustWordScale();
	
	scrambleWordLabels();
	
	yield WaitForSeconds(2.5f);
	
	numWordsReleased = 0;	
	var groupSize = GetGroupSize();

	var dt = 0.1f;
	
	while (numWordsReleased < wordLabels.Count) {
		// don't allow more than maxWordsActive words on screen at the same time
		while (activeWordLabels.Count >= maxWordsActive) {
			yield WaitForSeconds(1.0f);
			
		}		
		if (showingSolution || finished) {
			break;
		}
		numWordsReleased = ReleaseWords(numWordsReleased, 1);
		
		yield WaitForSeconds(dt);

	}

	numWordsReleased = wordLabels.Count;
	
}

function StartGame() {
	gameStarted = true;
	scoreManager.resetTime();
}

function GetWordLabelAt(index : int) : WordLabel {
	if (index < 0) return null;
	if (index >= wordLabels.Count) return null;
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

function IndexOfActiveWord(wordLabel:WordLabel) : int {
	var index : int = 0;
	var found : boolean = false;
	for (var wLabel : WordLabel in activeWordLabels) {
		if (wLabel == wordLabel) {
			found = true;
			break;
		}
		index += 1;
	}
	if (found) {
		return index;
	}
	return -1;
}

function HandleWordInactive(wordLabel:WordLabel) {
	var index : int = IndexOfActiveWord(wordLabel);
	if (index >= 0) {
		//Debug.Log("remove " + wordLabel.word);
		activeWordLabels.RemoveAt(index);
	}
}

function ReleaseWords(index: int, numWords : int) {
 	//Debug.Log("release words index = " + index);
 
	var c : int  = 0;
	
	for (var i : int=index;i<scrambledWordLabels.Count;i++) {
		var wordObject : WordLabel = scrambledWordLabels[i];
		var h = wordObject.boxCollider2D().size.y;
		wordObject.transform.position.y = screenBounds.y+h*2;
		wordObject.rigidbody2D.isKinematic = false;
		activeWordLabels.Add(wordObject);
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
	HandleProgress();
}

function ShowHintFromButton() {
	if (finished) return;
	ShowHint();
	scoreManager.HandleWordWrong();
	audio.PlayOneShot(sndSuccess1, 0.5f);
}

function ShowHint() {
	wordHinted = true;	
	if ((wordIndex <= 0) || (wordIndex >= wordLabels.Count)) return;
	var wObject : WordLabel = wordLabels[wordIndex];
	if ((wObject.word == currentWord) && !wObject.returnedToVerse && !wObject.gotoVerse) {
		wObject.HintAt();
	}
	
}

function Update () {
	var timeSinceLastWord : float = Time.time - lastWordTime;
	
	if (!wordHinted && !finished && (timeSinceLastWord > timeUntilHint)) {
		ShowHint();
	}
	refreshButton.active = CanShowSolution() || (finished && !GetChallengeModeEnabled());
	hintButton.active = !GetChallengeModeEnabled();
	
	updateCount += 1;
	
	if (!finished && gameStarted && (updateCount % 10 == 0)) {
		UpdateGravityScale();
	}
}

static function StartChallenge() {
	var vm : VerseManager = GameObject.FindObjectOfType(VerseManager);
	vm.verseIndex = 0;
	vm.Save();
	SetChallengeModeEnabled(true);
	
	Application.LoadLevel("scramble");
}