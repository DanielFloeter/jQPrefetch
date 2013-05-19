# jQPrefetch
Caching at the client-side with jQuery

* Preload HTML content and enhance page loading and changing.
* The Javascript is unobtrusive, if JS is not available the website is working anyway with the common doing.
* Minimize disturbing page load or image render effects.
* The page ready time for content, images, etc. should decreas to a minimum.
* The user should not intercepted with network circles and load time.

##Abstract: 
The network circle time should overlayed with the watch and read time.

The waiting time (for the network circle) should decrease approximately to a view milliseconds by preloading content to the client.
If the DOM tree is loaded, preloading starts for available anchors, while the user read or use the current content.
After img, content, thumbs are loaded the Javascript and CSS performance time is done in minor milliseconds.
The layout build has no flickering and is not disturbed.

##Approach:
1. It search for all anchors
2. It load HTML content for the found anchors
3. Site changing is fast only client-side with JS/CSS without network cycles



##Wiki (New Features, Bugfixes, Changes, Roadmap): 
[https://github.com/DanielFloeter/jQPrefetch/wiki] (https://github.com/DanielFloeter/jQPrefetch/wiki)

##More Stuff: 
[http://www.prefetchjs.de] (http://www.prefetchjs.de)

##Who's use SkinJS:
[www.prefetchjs.de/demopage/index.html] (http://www.prefetchjs.de/demopage/index.html)

[http://www.kometschuh.de/References.html] (http://www.kometschuh.de/References.html)

##License

This plugin is licensed under GPL or MIT License

Copyright (c) 2012 [Daniel Floeter](http://kometschuh.de)

Copyright retained for jQuery (c) 2012 [jQuery](http://jquery.com)
