

#GIFted
Search GIFs from giphy.com in a easy way. 

Built on Vanilla JS. 

#HOW TO START
Set your API KEY in API_KEY in config.js (located under root directory).
Run index.html file in root directory

#CONFIG
1. GIPHY
	1. Set your developer API KEY in CONFIG.GIPHY.API_KEY
2.UTILS
	1. MAX_GIF_SIZE: set size of max gif that should be rendered (use alongwith findAppropriateSize method in utils.js) - defaults to 500KB
	2. DEBOUNCE_TIME: debounce for search query - defaults to 500ms
	3. IDEAL_ASPECT_RATIO: aspect ratio of gifs - defaults to 4/3
	4. TOLERANCE - tolerance in the aspect ratio - defaults to 0.75
	5 ENABLE_CACHING - enable service worker to cache fetch request to giphy.com - defaults to false (Warning: takes up a lot of space).
	6. BASE_HEIGHT - base height of gif item in pixels - defaults to 200px



