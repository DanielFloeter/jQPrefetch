/* *
/*@@*
*
* @ name        SkinJS - Javascript Caching
* @ description jQuery plugin for ajax interactions, browser object-mapping/-caching, prefetching/perloading
* @ location    www.skinjs.de
* @ license     GPL or MIT
* @ version     0.9.2.3
* @ date        December 10th, 2012
* @ references  https://github.com/DanielFloeter/SkinJS/wiki/References
* @ documentation https://github.com/DanielFloeter/SkinJS/wiki
* @ repository  https://github.com/DanielFloeter/SkinJS
*
/* *
/*@@*/


(function ($) {
    $.fn.skin = function (settings) {
        settings = jQuery.extend({
            // (string)
            ajaxAnchor: 'a',
            // (string)
            ajaxHref: 'href',
            // (string, use a class and not a id) 
            ajaxContainer: '.sknContainer',
            // (string)
            exclude: '.donotpreload',
            // (object)
            jContainer: $(this)
        }, settings);

        config = {
            // localStorage and sessionStorage
            supportsWebStorage: false
        };

        // HTML cache         
        var cache = new Array();

        // first startpoint for preloading, starts after window is loaded
        $(window).on('load', function () {
            config.supportsWebStorage = (typeof(Storage) !=="undefined") ? true : false;
            scanPages();
        });

        // handler after window.load
        $(document).on('setActive', function () {
            // user interaction
            $(settings.ajaxAnchor).not(settings.exclude).click(function (event) {
                event.preventDefault();     // cancel the default action (navigation) of the click.
                var link = $(this).attr(settings.ajaxHref).split('/');
                link = link[link.length - 1].split('.')[0];
                switchPageStates(link.toLowerCase());
            });
        });

        // setup for current page
        function scanPages() {
            // Start: add current page to array
            var location = document.location.href.split('/');
            location = location[location.length - 1].split('.')[0];
            if (location == '') { // if browser address www.domain.de/ and no index.html selected
                location = 'index';
            }
            var nIndex = cache.length;
            cache.append(nIndex);
            cache[nIndex]['LinkName'] = location.toLowerCase();
            cache[nIndex]['PreLoadState'] = 'preLoaded';
            if(config.supportsWebStorage)
            {
                localStorage[location.toLowerCase()] = $(settings.ajaxContainer).outerHTML().html();
            }
            else{
                cache[nIndex]['$HTML'] = $(settings.ajaxContainer).outerHTML();
            }            
            
            $(document).trigger('preLoadedLinks', location);
            // End: add current page to array

            // search for links in Html
            scanHTML();

            // set skin-click-event active, prevent default click-event
            $(document).trigger('setActive');
            // search for links in array
            $(document).trigger('loadNext');
        }

        // fill array with all anchors
        function scanHTML() {
            $(settings.ajaxAnchor).not(settings.exclude).each(function () {
                if ($(this).attr(settings.ajaxHref) != null) {
                    var anchor = $(this).attr(settings.ajaxHref).split('/');
                    anchor = anchor[anchor.length - 1].split('.')[0];
                    if (!cache.contains(anchor)) {
                        var nIndex = cache.length;
                        cache.append(nIndex);
                        cache[nIndex]['LinkName'] = anchor.toLowerCase();
                        cache[nIndex]['PreLoadState'] = 'Link';
                        nIndex++;
                    }
                }
            });
        }

        $(document).on('loadNext', function () {
            var nIndex = 0;
            var load = 'true';
            do {
                if (nIndex >= (cache.length)) {
                    load = 'false';
                    $(document).trigger('allPreLoaded');
                    break;
                } else {
                    if (cache[nIndex]['PreLoadState'] == 'Link') {
                        cache[nIndex]['PreLoadState'] = 'loading';
                        break;
                    }
                }
                nIndex++;
            } while (cache.length >= nIndex);
            if (load == 'true') {
                preload(cache[nIndex]['LinkName']);
            }
        });

        function preload(strIdName, showAfterLoad) {
            // TODO: use own prelaod-function and own loadedImgCount for comming from switchPageStates() with /Link/. loadedImgCount-counting is overlapping and can not trigger if loadedImgCount==0 correct
            var loadedImgCount = 0;
            $.get(strIdName + ".html", function (data) {

                if ($(data).find(settings.ajaxContainer).parent().length == 0) {    // parent is body element                    
                    data = $(data).closest(settings.ajaxContainer).outerHTML();
                } else {    // parent is not body element                    
                    data = $(data).find(settings.ajaxContainer).outerHTML();
                }

                var location = document.location.href.split('/');
                location = location[location.length - 1].split('.')[0];
                if (location == '') { // if browser address www.domain.de/ and no index.html selected
                    location = 'index';
                }

                // TODO: scanHTML();
                var nIndex = cache.indexOf(strIdName);                
                cache[nIndex]['PreLoadState'] = "preLoaded"; // not all images are loaded
                if(config.supportsWebStorage)
                {
                    localStorage[strIdName] = data.html();
                }
                else{
                    cache[nIndex]['$HTML'] = data;
                }
                
                $(document).trigger('preLoadedLinks', strIdName);

                if (showAfterLoad) {
                    showPreLoaded(strIdName); // .ajax() is asynchronous: Show after load content
                } else {
                    data.find('img').each(function () {
                        loadedImgCount++;
                    });
                    data.find('img').on('load', function () {
                        loadedImgCount--;
                        if (loadedImgCount == 0) {
                            $(document).trigger('loadNext');
                        }
                    });
                    data.find('img').error(function () {
                        loadedImgCount--;
                    })
                    if (loadedImgCount == 0) { // loadNext anyway if loaded this have no img
                        $(document).trigger('loadNext');
                    };

                }
            });
        };

        // switch page states
        function switchPageStates(strIdName) {
            var classes = cache[cache.indexOf(strIdName)]['PreLoadState'];
            if (classes.match(/Link/)) {
                // TODO: refactor as hook
                $('.progress').css('display', 'block');
                cache[cache.indexOf(strIdName)]['PreLoadState'] = "loading";
                preload(strIdName, 'true');
            } else if (classes.match(/loading/)) {
                // TODO: refactor as hook
                $('.progress').css('display', 'block');
                window.setTimeout(function () { switchPageStates(strIdName); }, 100);
            } else if (classes.match(/preLoaded/)) {
                showPreLoaded(strIdName);
            }
        }

        function showPreLoaded(strIdName) {
            // TODO: refactor as hook
            $('.progress').css('display', 'none');
            if(config.supportsWebStorage)
            {
                var strHtml = localStorage[strIdName];
                $(strHtml).find(settings.ajaxContainer).addClass(strIdName.toLowerCase());
                settings.jContainer.replaceWith(strHtml);
            }
            else{
                cache[cache.indexOf(strIdName)]['$HTML'].find(settings.ajaxContainer).addClass(strIdName.toLowerCase());
                settings.jContainer.replaceWith(cache[cache.indexOf(strIdName)]['$HTML'].html());
            }         
            
            // init new Container
            settings.jContainer = $(settings.ajaxContainer);

            // user interaction
            $(settings.ajaxAnchor).not(settings.exclude).click(function (event) {
                event.preventDefault();     // cancel the default action (navigation) of the click.
                var link = $(this).attr(settings.ajaxHref).split('/');
                link = link[link.length - 1].split('.')[0];
                switchPageStates(link.toLowerCase());
            });

            // Start:Additionals after content is loaded and displayed
            // ...

            $('#menu a').removeClass('active');

            if (strIdName == 'index') {
                $('#menu a#index').addClass('active');

            } 

            // ...
            // End:Additionals after content is loaded and displayed

            // TODO: offer an additional hook ( -> Decision: As settings or public function?) for 'additionals'
        }
    };
        
    // extend Array object for the mapper    
    Array.prototype.append = function (index) {
        this[index] = new Array();
    }        
    
    Array.prototype.indexOf = function (name) {
    for (var i = 0; i < this.length; i++) {
            if (name.toLowerCase() == this[i]['LinkName']) {
                return i;
            }
        }
    }        
    
    Array.prototype.contains = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i]) {
                if (this[i]['LinkName'] === obj.toLowerCase()) {
                    return true;
                }
            }
        }
        return false;
    }    

    // missing function in jQuery
    $.fn.outerHTML = function () {
        return $(this).clone().wrap('<div>').parent();
    }

})(jQuery);

