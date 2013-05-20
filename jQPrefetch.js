/* *
/*@@*
*
* @ name        jQPrefetch - Javascript Caching
* @ description jQuery plugin for AJAX-interactions, browser object-mapping/-caching, prefetching/perloading
* @ location    www.prefetchjs.de
* @ license     GPL or MIT
* @ version     0.9.2.3.1
* @ date        May 19th, 2013
* @ references  https://github.com/DanielFloeter/jQPrefetch/wiki/References
* @ documentation https://github.com/DanielFloeter/jQPrefetch/wiki
* @ repository  https://github.com/DanielFloeter/jQPrefetch
*
/* *
/*@@*/

(function ($) {
    $.fn.jQPrefetch = function (settings) {
        settings = jQuery.extend({
            ajaxAnchor: 'a',
            ajaxHref: 'href',            
            ajaxContainer: '.sknContainer',  // use a class and not a id!
            exclude: '.donotpreload',
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
            // temporarly disabled: config.supportsWebStorage = (typeof(Storage) !=="undefined") ? true : false;
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

            // TODO: convert images with getDataURL()

            if(config.supportsWebStorage)
            {
                localStorage[location.toLowerCase()] = $(settings.ajaxContainer).outerHTML().html();
            }
            else{
                cache[nIndex]['$HTML'] = $(settings.ajaxContainer).outerHTML();
            }            
            
            // TODO: rename Monitor-Trigger, e.g. iPreLoadedLinksMonitor
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
                    // TODO: rename Monitor-Trigger, e.g. iAllPoadedLinksMonitor
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
            
            var nLoadedImgCount = 0;            

            //$.get(strIdName + ".html", function (data) {            
            $.get(strIdName + ".html", function(){})
            .done(function(data){
                
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

                /*
                if(config.supportsWebStorage)
                {
                    localStorage[strIdName] = data.html();
                }
                else{
                    cache[nIndex]['$HTML'] = data;
                }
                */

                // TODO: rename Monitor-Trigger, e.g. iPreLoadedLinksMonitor
                $(document).trigger('preLoadedLinks', strIdName);

                if (showAfterLoad) {
                    showPreLoaded(strIdName); // .ajax() is asynchronous: Show after load content
                } else {
                    data.find('img').each(function () {
                        nLoadedImgCount++;
                    });

                    if(nLoadedImgCount > 0){
                        data.find('img').each(function(){
                            nLoadedImgCount--;
                            loadImage($(this).attr('src'), data, nIndex);                        
                        });
                    }else{ // html has no images
                        cache[nIndex]['$HTML'] = data;  // TODO: refactor, as own function, with array-cache and WebStorage
                    }
                    /*
                    data.find('img').on('load', function (e, data) {
                        nLoadedImgCount--;

                        convetImgToDataUrl(this, $(this).attr('src'));

                        if (nLoadedImgCount == 0) {
                            $(document).trigger('loadNext');
                        }
                    });
                    */
                    data.find('img').error(function () {
                        nLoadedImgCount--;
                    })
                    if (nLoadedImgCount == 0) { // loadNext anyway, e.g when the loaded HTML has no images
                        $(document).trigger('loadNext');
                    };
                }                    
            });
        };

        function loadImage(URL, data, nIndex) {

            var dataURL,
                img;
          
            img = new Image();
            img.src = URL;
            img.onload = convetImgToDataUrl(img, data, nIndex);
        }

        // Tested with:
        // Win 7:           Chrome 26, IE 9, FF 21, Opera 12
        // Mobile devices:  "Samsung Wave S8500", "Asus Nexus 7"            
        function convetImgToDataUrl(img, data, nIndex){

            canvas = document.createElement("canvas");
            canvas.width =img.width;
            canvas.height =img.height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            // dataURL = canvas.toDataURL("image/png");
            dataURL = canvas.toDataURL();

            var strHtml = cache[nIndex]['$HTML'];
            if(strHtml == undefined)
                strHtml = data.html();  // for first image
            else
                strHtml = strHtml.html();  // all other images, with replaced images before

            var aa = strHtml.replace($(img).attr('src'), dataURL);
            // localStorage[strIdName] = aa;
            cache[nIndex]['$HTML'] = $(aa).outerHTML();
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

                /*
                var strHtml = cache[cache.indexOf(strIdName)]['$HTML'];
                $(strHtml).find(settings.ajaxContainer).addClass(strIdName.toLowerCase());
                settings.jContainer.replaceWith(strHtml);
                */

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

            /*
            ...
            $('#menu a').removeClass('active');

            if (strIdName == 'index') {
                $('#menu a#index').addClass('active');

            } 
            ...
            */

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

