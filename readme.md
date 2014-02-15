# N-back Game

## Overview
This is simple N-Back game coded in javascript. Using DHTML for graphic display.

## Structure of codes
The codes are including these objects:
	Game
	Timer
	Input
	ActionManager
	Sprite
		Player
		Flag
		...
	Page
		StartPage
		SettingPage
		...

	Drawer
	DHTMLImage
	
	(helper object)
	Klass
	EventSystem

The main concept of the game structure is in a game loop inside the page gamePage. The game loop has three main actions:
	main game loop:
		sprites.update(timerInfo)
		SYS_actionManager.checkAction()
		sprites.draw(drawer)

The Page object is the base object for pages in the game. There are 4 pages of the game, each represent a scene of the game:
	pages:
		start page
		setting page
		end page
		game page

the game page is the main game page. it holds the timer object, the sprite objects and main game loop.
