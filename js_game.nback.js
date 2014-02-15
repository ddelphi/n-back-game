
/*
	@2013-12-21
*/

/*
	There are 4 pages for the game. Only the page GamePage utilize the sprites to create
	elements. 
*/
$(document).ready(function() {
// start

// game object, to hold pages, to switch pages, and keep the status object
var Game = {
	params: {},
	status: {},
	pages: {},

	init: function(objects) {
		this.timer = objects.timer;
		this.input = objects.input;
		this.drawer = objects.drawer;
		
		this.inputInfo = null;
		this.timeInfo = null;

		// extend the global options
		$.extend(SYS_options, objects.params);

		this.initEvent();
		this.initStatus();
		this.initPage(objects);
	},
	initEvent: function() {
		var that = this;
		SYS_eventSystem.register("status", function(data) {
			that.updateStatus(data);
		});
		SYS_eventSystem.register("pages", function(data) {
			that.changePage(data);
		});
		SYS_eventSystem.register("reset", function(data) {
			that.initStatus();
		});
		SYS_eventSystem.register("image/onload", function(data) {
			if (data.done) {
				that.imageLoadedStatus(true);
				that.run();
			}
		});
	},
	initStatus: function() {
		this.status["totalImages"] = SYS_options.nback.length;
		this.status["currentImagePos"] = 0;
		this.status["judgment"] = {
			"right": 0,
			"wrong": 0
		};
	},
	imageLoadedStatus: function(flag) {
		this.status["imageLoaded"] = flag;
	},
	getStatus: function() {
		return this.status;
	},
	updateStatus: function(datas) {
		// type, data
		var type = datas.type,
			data = datas.data,
			that = this;
		
		if (type === "reset") {
			this.initStatus();
		}
		else if (type === "currentImagePos") {
			this.status.currentImagePos = typeof data === "undefined" ? 1 : data + 1;
		}
		else if (type === "judgment") {
			if (data) {
				this.status.judgment.right += 1;
			} else {
				this.status.judgment.wrong += 1;
			}
		}

		SYS_eventSystem.trigger("spriteStatus", {
			"type": "update",
			"data": that.status
		});
	},
	initPage: function(objects) {
		this.pages["currentPage"] = objects.firstPage;
		this.pages["lastPage"] = null;		
	},
	addPage: function(pages) {
		for (var k in pages) {
			if (!pages.hasOwnProperty(k)) continue;
			this.pages[k] = pages[k];
		}
	},
	changePage: function(datas) {
		var type = datas.type,
			data = datas.data,
			temp;

		if (this.pages.hasOwnProperty(type)) {
			temp = this.pages.lastPage;
			this.pages.lastPage = this.pages.currentPage;
			this.pages.currentPage = type === "lastPage" ? temp : this.pages[type];
			this.pages.lastPage.hide();
			this.pages.currentPage.show();
		}
	},
	showLoadingPage: function() {
		// blank page
	},
	run: function() {
		if (!this.status["imageLoaded"]) {
			this.showLoadingPage();
		} else {
			this.pages.currentPage.show();	
		}
	}
};

// action manager object, just like collision manager
// holding action objects for collision check
var ActionManager = {
	actionObject: {},
	grid: [],
	
	init: function() {
		this.initStatus();
		this.initEvent();

	},
	initStatus: function() {
		this.pressedList = [];
	},
	initEvent: function() {
		var that = this;
		SYS_eventSystem.register("reset", function(data) {
			that.initStatus();
		});
	},
	// create an action object, and it to be hold by action manager
	newActionObject: function(actionObject) {
		var newObject = {
			"name": actionObject.name,
			"target": actionObject.target,
			"centerX": actionObject.x - actionObject.width / 2,
			"centerY": actionObject.y - actionObject.height / 2,
			"collider": actionObject.collider,
			"collidee": actionObject.collidee,
			"callback": actionObject.callback
		};
		if (this.actionObject.hasOwnProperty(actionObject.name)) {
			throw new Error("action object %n has exist.".replace("%n", actionObject.name));
		}
		this.actionObject[actionObject.name] = newObject;
		
		return newObject;
	},
	// update the action objects' values
	update: function(name, collider) {
		for (var key in collider) {
			if (!collider.hasOwnProperty(key)) continue;
			this.actionObject[name][key] = collider[key];
		}
	},
	// action_1() is a method for checking the collision of key and image
	action_1: function() {
		var actObject = this.actionObject;
		var currentImagePos = actObject.player.currentImagePos;
		var currentImageId = actObject.player.currentImageId;
		
		if (!this.pressedList[currentImagePos]) {

			// when key or judgment button pressed
			if (input.keyList["space"] || actObject.spriteButton.isClicked) {
				// set a sign when button pressed
				this.pressedList[currentImagePos] = true;
				// console.log("#1, pressedList", this.pressedList);
				if (currentImageId === actObject.player.imageList[currentImagePos - SYS_options.nback.nback]) {
					SYS_eventSystem.trigger("status", {
						"type": "judgment",
						"data": true
					});
					actObject.spriteFlag.callback(true);
					// console.log("#2, show right flag.");
				} else {
					SYS_eventSystem.trigger("status", {
						"type": "judgment",
						"data": false
					});
					actObject.spriteFlag.callback(false);
					// console.log("#3, show wrong flag.")
				}
			}
		}
		
		// when fliping image, check previous image and nback distance image
		if (actObject.player.lastImagePos != currentImagePos && currentImagePos > SYS_options.nback.nback) {
			actObject.player.lastImagePos = currentImagePos;
			
			// when previous image position without key pressed
			if (!this.pressedList[currentImagePos - 1] && !this.pressedList[currentImagePos]) {
				// do
				var previousImageId = actObject.player.imageList[currentImagePos - 1],
					previousNbackImageId = actObject.player.imageList[currentImagePos - 1 - SYS_options.nback.nback];
				
				if (previousImageId === previousNbackImageId) {
					SYS_eventSystem.trigger("status", {
						"type": "judgment",
						"data": false
					});
					actObject.spriteFlag.callback(false);
					// console.log("#4, show wrong flag.");
				} else {
					// do nothing
					// console.log("#5, do nothing.");
				}
			}
		}

		SYS_eventSystem.trigger("status", {
			"type": "currentImagePos",
			"data": currentImagePos
		});
	},
	checkAction: function() {
		this.action_1();
	}
};


// create an Input object with the key list you wanted to monitor
var Input = {
	/*
		keyMap
			num: key

		keyList
			key: num
	*/
	keyList: {},
	keyMap: {},
	
	init: function(keyMap) {
		this.keyMap = keyMap;
		
		for (var k in keyMap) {
			if (!keyMap.hasOwnProperty(k)) continue;
			this.keyList[keyMap[k]] = false;
		}
		this.listenInput();
	},
	getInput: function(key) {
		var result;
		
		if (key) {
			result = this.keyList.hasOwnProperty(key) ? this.keyList[key] : false;
		} else {
			result = this.keyList;
		}
		return result;
	},
	setInput: function(key, boolean) {
		if (this.keyList.hasOwnProperty(key)) {
			this.keyList[key] = boolean ? true : false;
			return true;
		}
		return false;
	},
	convertKey: function(keycode) {
		var result;
		if (this.keyMap.hasOwnProperty(keycode)) {
			result = this.keyMap[keycode];
		} else {
			result = false;
		}
		return result;
	},
	listenInput: function() {
		var that = this;
		$(document).bind("keydown keyup", function(evt) {
			// evt.preventDefault();
			var key = String.fromCharCode(evt.which);
			
			if (!key.trim()) {
				key = that.convertKey(evt.which);
			}
			if (that.keyList.hasOwnProperty(key)) {
				that.keyList[key] = (evt.type === "keydown" ? true : false);
			}
		});
	}
};

// the timer object, for providing time info
var GTimer = {
	timeInfo: {
		lastTime: 0,
		startTime: 0,
		elapseTime: 0,
		rate: 0,
		currentFrame: 0,
		frame: 30
	},
	
	init: function(frame) {
		this.timeInfo.frame = frame ? frame : 30;
		this.timeInfo.startTime = Date.now();
	},
	getInfo: function() {
		var t = this.timeInfo;
		t.lastTime = Date.now();
		t.elapseTime = t.lastTime - t.startTime;
		t.startTime = t.lastTime;
		
		t.currentFrame = 1000 / t.elepaseTime;
		t.rate = t.frame / t.currentFrame;
		
		return t;
	}
};




var Sprite = {
	init: function() {},
	update: function(timerInfo) {},
	draw: function(drawer) {}
};

// @inherit Sprite
var Player = {
	init: function(Dimage, pos) {
		this.image = Dimage;
		this.imageList = this.image.imageList;

		this.initStatus();

		// create an collider object
		var that = this;
		SYS_actionManager.newActionObject({
			"name": "player",
			"target": that,
			"x": 0,
			"y": 0,
			"width": 0,
			"height": 0,
			"collider": null,
			"collidee": null,
			"callback": null
		});
	},
	initStatus: function() {
		// create the random image id list
		var status = SYS_options.nback;
		this.randomImageList = this.nbackShuffle(status.rate, status.nback, this.imageList.length, status.length);
		
		this.currentImageId = null;
		this.currentImagePos = -1;
			
		this.elapseTime = 0;
		this.changeTime = SYS_options.changeTime;
		this.toDrawFlag = false;
	},
	// it will return true after specify seconds, then repeat
	checkTime: function(timer) {
		this.elapseTime += timer.elapseTime;
		if (this.elapseTime >= this.changeTime) {
			this.elapseTime = 0;
			return true;
		}
		return false;
	},
	update: function(timer) {
		// update the image after every xx seconds
		if (this.checkTime(timer)) {
			this.updateImage();
			this.toDrawFlag = true;

			SYS_actionManager.update("player", {
				"imageList": this.randomImageList,
				"currentImageId": this.currentImageId,
				"currentImagePos": this.currentImagePos
			});

			// when finish showing the images in random image list, end the game
			if (this.currentImagePos >= this.randomImageList.length) {
				SYS_eventSystem.trigger("game", {
					"type": "end"
				});
				return;
			}
		}
	},
	updateImage: function() {
		// choose an image from the random image list
		this.currentImagePos += 1;
		this.currentImageId = this.randomImageList[this.currentImagePos];
		this.image.changeTo(this.currentImageId);
	},
	draw: function(drawer) {
		// drawing judgment is in the update() function
		if (this.toDrawFlag) {
			drawer.drawAnimate(this.image);
			this.toDrawFlag = false;
		}
	},
	/*
		@params tLength, is the pics' length
		@params cLength, is the nback's collection length
		@return collection
	*/
	nbackShuffle: function(rate, nback, tLength, cLength) {
		var getRandomInt = function(min, max) {
			return Math.floor(Math.random() * (max - min + 1) + min);
		};
		var isUndefined = function(v) {
			return typeof v === "undefined";
		};

		var def = {
			"rate": 0.5,
			"nback": 2,
			"collectionLength": 10
		};
		rate = 0 < rate < 1 ? rate : def.rate;
		nback = nback > 1 ? nback : def.nback;
		cLength = cLength > 0 ? cLength : def.collectionLength;
		
		var collection = [];
		var numOfPair = Math.floor(cLength * rate / 2);
		
		// placing the pair of number with nback distence, into the collection
		var randomA,
			randomPlace = 0;
		for (var i = 0; i < numOfPair; i++) {
			randomA = getRandomInt(0, tLength - 1);
			randomPlace = getRandomInt(0, cLength - nback - 1);

			while (!isUndefined(collection[randomPlace])
				|| !isUndefined(collection[randomPlace + nback])) {

				randomPlace = getRandomInt(0, cLength - nback - 1);
			}
			collection[randomPlace] = randomA;
			collection[randomPlace + nback] = randomA;
		}
		
		// fill the gap of the collection
		var randomB,
			temp;
		for (var j = 0; j < cLength; j++) {
			if (!isUndefined(collection[j])) {
				continue;
			}
			
			randomB = getRandomInt(0, tLength - 1);
			
			if (j + nback > cLength) {
				temp = j - nback;
			} else {
				temp = j + nback;
			}
			
			if (randomB === collection[temp]) {
				randomB = randomB + 1 === tLength
					? randomB - 1
					: randomB + 1;
			}
			collection[j] = randomB;
		}
		return collection;
	}
};

// the judgment button sprite
var SpriteButton = {
	init: function(dImage) {
		this.image = dImage;
		this.button = dImage.target;
		this.button.html("Judgment");

		this.isClicked = false;
		this.hasDrawOnce = false;

		// listen the button click event
		var that = this;
		this.button.bind("click", function(evt) {
			that.isClicked = true;
		});
		
		SYS_actionManager.newActionObject({
			"name": "spriteButton",
			"target": that,
			"x": 0,
			"y": 0,
			"width": 0,
			"height": 0,
			"collider": null,
			"collidee": null,
			"callback": null
		});
	},
	update: function(timerInfo) {
		var that = this;
		SYS_actionManager.update("spriteButton", {
			"isClicked": that.isClicked
		});
		
		if (this.isClicked) {
			this.isClicked = false;
		}
	},
	draw: function(drawer) {
		// draw once
		if (!this.hasDrawOnce) {
			this.hasDrawOnce = true;
			drawer.draw(this.image);
		}
	}
};

// the right and wrong flags
var SpriteFlag = {
	init: function(dImage) {
		this.image = dImage;
		this.imageList = this.image.imageList;
		this.currentImageId = 0;
		this.isDisplay = false;

		this.image.hide();

		SYS_actionManager.newActionObject({
			"name": "spriteFlag",
			"target": this,
			"x": 0,
			"y": 0,
			"width": 0,
			"height": 0,
			"collider": null,
			"collidee": null,
			"callback": this.callback()
		});
		
	},
	update: function(timerInfo) {
		var that = this;
		SYS_actionManager.update("spriteFlag", {
			"isDisplay": that.isDisplay
		});
	},
	draw: function(drawer) {
		if (this.isDisplay) {
			this.image.show();
			drawer.draw(this.image);
		} else {
			this.image.hide();
		}
	},
	display: function(flag) {
		if (flag) {
			this.currentImageId = 1;
		} else {
			this.currentImageId = 0;
		}
		this.image.changeTo(this.currentImageId);
		this.isDisplay = true;
		
		var that = this;
		setTimeout(function() {
			that.isDisplay = false;
		}, 200);
	},
	callback: function() {
		var that = this;
		return function(da) {
			that.display(da);
		};
	}
};

// the status text
var SpriteStatus = {
	init: function(dImage) {
		// listen the spriteStatus event to update the status static
		var that = this;
		SYS_eventSystem.register("spriteStatus", function() {
			that.updateStatus.apply(that, arguments);
		});

		this.hasDrawOnce = false;
		this.initNodes();
	},
	initNodes: function() {
		this.$bgStatus = $("<div>").css({
			"position": "absolute",
			"top": 20,
			"right": 20,
			"width": 80,
			"height": 50
		});
		this.$imageStatus = $("<div>").css({
			"position": "absolute",
			"top": 10,
			"left": 10,
			"width": "auto",
			"height": 20
		});
		this.$judgmentStatus = $("<div>").css({
			"position": "absolute",
			"top": 30,
			"left": 10,
			"width": "auto",
			"height": 20
		});

		this.$bgStatus.append(this.$imageStatus);
		this.$bgStatus.append(this.$judgmentStatus);
		SYS_options.$parent.append(this.$bgStatus);
	},
	changeImageText: function(status) {
		this.$imageStatus.html(status.currentImagePos + " / " + status.totalImages);
	},
	changeJudgmentText: function(status) {
		this.$judgmentStatus.html("+" + status.judgment.right + " / -" + status.judgment.wrong);
	},
	updateStatus: function(dict) {
		if (dict.type === "update") {
			var status = dict.data;
			this.changeImageText(status);
			this.changeJudgmentText(status);
		}
	},
	update: function(timerInfo) {

	},
	draw: function(drawer) {
	
	}
};

// the background
var Background = {
	init: function(dImage, pos) {
		this.image = dImage;
		this.pos = pos;
		
		this.hasDrawOnce = false;
	},
	update: function(timerInfo) {
		// noop
	},
	draw: function(drawer) {
		// draw once
		if (!this.hasDrawOnce) {
			this.hasDrawOnce = true;
			drawer.draw(this.image);
		}
	}
};

// DHTML image drawer
var ImageDrawer = {
  parent: null,
	
	init: function(parent) {
		this.parent = parent;
		this.isAnimationDict = {"isAnimation": true};
	},
	drawAnimate: function(image, pos, color, rotate, scale) {
		if (!image.isVisiable) {
			image.hide(this.isAnimationDict);
		} else {
			if (pos) {
				image.move(pos);
			}
			image.show(this.isAnimationDict);
		}
	},
	draw: function(image, pos, color, rotate, scale) {
		if (!image.isVisiable) {
			image.hide();
		} else {
			if (pos) {
				image.move(pos);
			}
			image.show();
		}
	},
	drawText: function(text, font, pos, color, rotate, scale) {
		// noop
	}
};

// @using jQuery node object
var DHTMLImage = {
	imageStack: [],
	imageLoadCount: 0,

	init: function(listOfImageParam) {
		this.ImageClass = Image;
	
		this.imageList = this.createImageList(listOfImageParam);
		this.image = this.imageList[0];

		this.currentImagePos = 0;
		this.isVisiable = true;
		this.lastDisplay = this.image.display ? "block" : "none";
		
		this.target = this.createTarget(this.image);
		SYS_options.$parent.append(this.target);

		this.initImageLoader(listOfImageParam);
	},
	initImageLoader: function(imageList) {
		var img;

		var that = this;
		var imgOnloadHandler = function() {
			that.imageLoadCount -= 1;
			if (that.imageLoadCount === 0) {
				SYS_eventSystem.trigger("image/onload", {
					"status": "done",
					"done": true
				});
			}
		};

		if (window.toString.call(imageList).indexOf("Array") === -1) {
			imageList = [imageList];
		}
		for (var i = 0; i < imageList.length; i++) {
			img = new window.Image();
			img.src = imageList[i].url;
			this.imageLoadCount += 1;
			img.onload = imgOnloadHandler;
		}
	},
	createTarget: function(image) {
		var target = $("<div>").css({
			"position": "absolute",
			"display": image.display ? "block" : "none",
			"z-index": image.zindex,
			"left": image.left,
			"top": image.top,
			"width": image.width,
			"height": image.height,
			"background-image": "url(%s)".replace("%s", image.url)
		});
		
		return target;
	},
	createImageList: function(list) {
		if (window.toString.call(list).indexOf("Array") === -1) {
			list = [list];
		}

		var result = [];
		for (var i = 0; i < list.length; i++) {
			result.push(Klass.new(this.ImageClass, list[i]));
		}
		return result;
	},
	appendTo: function($parent) {
		$parent.append(this.target);
	},
	setStyle: function(styleDict) {
		this.target.css(styleDict);
	},
	change: function(image) {
		this.hide();
		this.image = image;
		this.target.css("background-image", "url(%s)".replace("%s", image.url));
	},
	changeTo: function(n) {
		if (typeof n !== "undefined" && 0 <= n < this.imageList.length) {
			this.hide();
			this.image = this.imageList[n];
			this.currentImagePos = n;
			this.target.css("background-image", "url(%s)".replace("%s", this.image.url));
			return true;
		} else {
			return false;
		}
	},
	prev: function(n) {
		if (typeof n === "undefined") { n = 1; }
		return this.changeTo(this.currentImagePos - n);
	},
	next: function(n) {
		if (typeof n === "undefined") { n = 1; }
		return this.changeTo(this.currentImagePos + n);
	},
	move: function(pos) {
		this.target.css({
			"left": pos.x,
			"top": pos.y
		});
	},
	show: function(params) {
		if (this.lastDisplay !== "block") {
			// this.isVisiable = true;
			this.lastDisplay = "block";
			this.image.show();
			if (params && params.isAnimation) {
				this.showAnimation();
			} else {
				this.showStatic();
			}
		}
	},
	hide: function(params) {
		if (this.lastDisplay !== "none") {
			// this.isVisiable = false;
			this.lastDisplay = "none";
			this.image.hide();
			if (params && params.isAnimation) {
				this.hideAnimation();
			} else {
				this.hideStatic();
			}
		}
	},
	showStatic: function() {
		this.target.css("display", "block");
	},
	hideStatic: function() {
		this.target.css("display", "none");
	},
	showAnimation: function() {
		this.target.fadeIn(100);
	},
	hideAnimation: function() {
		this.target.fadeOut(300);
	},

};

var Image = {
	// url
	// rect = {offsetx, offsety, width, height}
	// frame = {width, height, x, y}, the x and y as the left and top
	// width
	// height
	// display
	
	init: function(params) {
		this._set("url", "", params.url);
		this._set("rect", null, params.rect);
		this._set("frame", null, params.frame);
		this._set("top", 0, params.top);
		this._set("left", 0, params.left);
		this._set("width", 0, params.width);
		this._set("height", 0, params.height);
		this._set("display", false, params.display);
		this._set("zindex", 0, params.zindex);

	},
	_set:function(key, def, value) {
		var val = value;
		if (typeof val === "undefined") {
			val = def;
		}
		this[key] = val;
	},
	hide: function() {
		this.display = false;
	},
	show: function() {
		this.display = true;
	}
};



var Page = {
	init: function() {},
	initNode: function() {},
	initEvent: function() {},
	show: function() {},
	hide: function() {}
};

// @inherit Page
var PageStart = {
	init: function() {
		this.initNode();
		this.initEvent();
	},
	initNode: function() {
		this.bg = $("#pageStart");
		this.startButton = this.bg.find(".startButton");
		this.settingButton = this.bg.find(".settingButton");
	},
	initEvent: function() {
		this.startButton.bind("click", function() {
			SYS_eventSystem.trigger("pages", {
				"type": "game",
				"data": null
			});
		});
		this.settingButton.bind("click", function() {
			SYS_eventSystem.trigger("pages", {
				"type": "setting",
				"data": null
			});
		});
	},
	update: function(data) {
	
	},
	draw: function(drawer) {
	
	},
	show: function() {
		this.bg.css({
			"display": "block"
		});
	},
	hide: function() {
		this.bg.css({
			"display": "none"
		});
	}
};

// @inherit Page
var PageSetting = {
	init: function() {
		this.initNode();
		this.initEvent();
	},		
	initNode: function() {
		this.bg = $("#pageSetting");
		this.nback = $("#pageSetting .nback");
		this.length = $("#pageSetting .length");
		this.rate = $("#pageSetting .rate");
		this.submit = $("#pageSetting .submit");
		this.cancel = $("#pageSetting .cancel");
	},
	initEvent: function() {
		var that = this;
		this.submit.bind("click", function() {
			that.updateSetting();
			SYS_eventSystem.trigger("pages", {
				"type": "lastPage"
			});
		});
		this.cancel.bind("click", function() {
			SYS_eventSystem.trigger("pages", {
				"type": "lastPage"
			});
		});
	},
	update: function() {
	
	},
	updateSetting: function() {
		var nback = parseInt(this.nback.val()),
			length = parseInt(this.length.val()),
			rate = parseFloat(this.rate.val());
			
		$.extend(SYS_options, {
			"nback": {
				"nback": nback,
				"length": length,
				"rate": rate
			}
		});
	},
	fillSetting: function() {
		this.nback.val(SYS_options.nback.nback);
		this.length.val(SYS_options.nback.length);
		this.rate.val(SYS_options.nback.rate);
	},
	draw: function(drawer) {
	
	},
	show: function() {
		this.fillSetting();
		this.bg.css({
			"display": "block"
		});
	},
	hide: function() {
		this.bg.css({
			"display": "none"
		});
	}
};

// @inherit Page
var PageEnd = {
	init: function() {
		this.initNode();
		this.initEvent();

		var that = this;
		SYS_eventSystem.register("spriteStatus", function(data) {
			that.updateStatic(data);
		});
	},
	initNode: function() {
		this.bg = $("#pageEnd");
		this.staticBg = this.bg.find(".static");
		this.judgment = this.bg.find(".judgment");
		this.cancelButton = this.bg.find(".cancel");
	},
	initEvent: function() {
		this.cancelButton.bind("click", function() {
			SYS_eventSystem.trigger("pages", {
				"type": "start",
				"data": null
			});
		});

		SYS_eventSystem.register("game", function(data) {
			if (data.type === "end") {
				SYS_eventSystem.trigger("pages", {
					"type": "end"
				});
			}
		});
	},
	update: function() {

	},
	updateStatic: function(datas) {
		if (datas.type === "update") {
			var status = datas.data;
			var jm = status.judgment;
			this.judgment.html("+" + jm.right + " / -" + jm.wrong);
		}
	},
	draw: function() {

	},
	show: function() {
		this.bg.css({
			"display": "block"
		});
	},
	hide: function() {
		this.bg.css({
			"display": "none"
		});
	}
};

// @inherit SpriteBatch, Page
var PageGame = {
	init: function(objects) {
		this.initNode();

		this.timer = objects.timer;
		this.input = objects.input;
		this.drawer = objects.drawer;

		this.process = [];
		this.loopId = null;
		
		if (objects.sprites) {
			this.add(objects.sprites);
		}
	},
	initNode: function() {
		this.bg = $("#pageGame");
	},
	update: function(timer) {
		for (var i = 0; i < this.process.length; i++) {
			this.process[i].update(timer);
		}
	},
	draw: function(drawer) {
		for (var i = 0; i < this.process.length; i++) {
			this.process[i].draw(drawer);
		}
	},
	add: function(sprites) {
		var iSprite = sprites;
		if (!window.toString.call(iSprite).indexOf("Array")) {
			iSprite = [iSprite];
		}
		for (var i = 0; i < iSprite.length; i++) {
			this.process.push(iSprite[i]);
		}
	},
	resetStatus: function() {
		for (var i = 0; i < this.process.length; i++) {
			if (typeof this.process[i].initStatus === "function") {
				this.process[i].initStatus();
			}
		}

		SYS_eventSystem.trigger("reset", null);
	},
	show: function() {
		this.bg.css("display", "block");

		// reset some status
		this.resetStatus();

		// start the game
		var that = this;
		var start = function() {
			var timerInfo = that.timer.getInfo(),
				inputInfo = that.input.getInput();

			that.update(timerInfo);
			SYS_actionManager.checkAction(inputInfo);
			that.draw(that.drawer);

			// that.loopId = setTimeout(start, SYS_options.frameTime);
			that.loopId = that.loopId === -1 ? null : setTimeout(start, SYS_options.frameTime);
		}

		start();
	},
	hide: function() {
		this.bg.css("display", "none");

		window.clearTimeout(this.loopId);
		this.loopId = -1;

	}
};



var Klass = {
	"new": function(cls /*, args*/) {
		function f() {}
		f.prototype = cls;
		f.prototype.contructor = cls;

		var o = new f();
		if (typeof cls["init"] === "function") {
			cls.init.apply(o, [].slice.call(arguments, 1));
		}
		return o;
	},
	"inherit": function(pt, obj) {
		var o = {};
		this.extend(o, pt);
		this.extend(o, obj);
		return this.new(o);
	},
	"extend": function(tar, src) {
		for (var k in src) {
			if (!src.hasOwnProperty(k)) continue;
			tar[k] = src[k];
		}
	}
};



var EventSystem = {
	init: function() {
		this.count = 0;
		this.event = {};
	},
	register: function(name, callback) {
		if (!this.event[name]) {
			this.event[name] = [];
		}
		this.event[name].push(callback);
	},
	trigger: function(name, data) {
		if (!this.event[name]) {
			throw new Error("event not exist. [%s]".replace("%s", name));
		}

		var callbacks = this.event[name],
			len = this.event[name].length;
		for (var i = 0; i < len; i++) {
			callbacks[i](data);
		}
	}
};




/**********************************************
	the main start
**********************************************/


var $ = jQuery;
var SYS_options = {
	frameTime: 200,
	// pic change time
	changeTime: 1500,
	$parent: $("#nback"),
	$frame: $("#nback-game"),
	width: $("#nback-game").width(),
	height: $("#nback-game").height(),
	nback: {
		rate: 0.5,
		nback: 2,
		length: 10
	}
};

var SYS_eventSystem = Klass.new(EventSystem);
var SYS_actionManager = Klass.new(ActionManager);
var gtimer = Klass.new(GTimer);
var input = Klass.new(Input, {
	"32": "space"
});
var drawer = Klass.new(ImageDrawer);	// maybe init with parent node

var pageStart = Klass.new(PageStart),
	pageSetting = Klass.new(PageSetting),
	pageEnd = Klass.new(PageEnd),
	pageGame = Klass.new(PageGame, {
		"timer": gtimer,
		"input": input,
		"drawer": drawer
	});

var game = Klass.new(Game, {
	"timer": gtimer,
	"input": input,
	"drawer": drawer,
	"firstPage": pageStart
});



function main() {
	var btnDimage = Klass.new(DHTMLImage, {
		"url": "",
		"width": "auto",
		"height": "auto",
		"left": 180,
		"top": SYS_options.height - 70
	});
	// set extra style for the button sprite
	btnDimage.setStyle({
		"padding": "10px 30px",
		"border": "solid 1px #72D76F",
		"background-color": "#85F781",
		"color": "#3E663A",
		"font-size": 16,
		"font-weight": "bold",
		"cursor": "pointer"
	});

	var bgDimage = Klass.new(DHTMLImage, {
		"url": "./bg.jpg",
		"width": "100%",
		"height": "100%",
		"left": 0,
		"top": 0,
		"zindex": -5
	});

	var flagDimage = Klass.new(DHTMLImage, [{
		"url": "./flagWrong.png",
		"width": 100,
		"height": 100,
		"left": SYS_options.width - 140,
		"top": 110
	}, {
		"url": "./flagRight.png",
		"width": 100,
		"height": 100,
		"left": SYS_options.width - 140,
		"top": 110
	}]);

	var imageNum = 7,
		playerImage,
		playerImageList = [];
	for (var i = 0; i < imageNum; i++) {
		playerImage = {
			"url": "./player%d.png".replace("%d", i),
			"width": 100,
			"height": 100,
			"left": 190,
			"top": 110,
		};
		playerImageList.push(playerImage);
	}
	var playerDimage = Klass.new(DHTMLImage, playerImageList);
	// set extra style for the player sprite
	playerDimage.setStyle({
			"border": "2px dashed #333"
	});
	
	var player = Klass.new(Player, playerDimage),
		spriteFlag = Klass.new(SpriteFlag, flagDimage),
		spriteButton = Klass.new(SpriteButton, btnDimage),
		spriteStatus = Klass.new(SpriteStatus, null);
		bg = Klass.new(Background, bgDimage);

	// setup the pageGame page, to hold the sprites
	pageGame.add([
		player,
		spriteFlag,
		spriteButton,
		spriteStatus,
		bg
	]);

	// setup game object, to hold the pages
	game.addPage({
		"start": pageStart,
		"setting": pageSetting,
		"game": pageGame,
		"end": pageEnd
	});

	game.run();
}

main();

});


