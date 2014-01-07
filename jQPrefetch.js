
/**
* Name jQPrefetch - Javascript Caching
* A jQuery plugin for ajax interactions
* Description AJAX-interactions, browser object-mapping/-caching, prefetching/perloading
* Aproach The user should not intercepted with network circles and loading time
* @filename jQPrefetch.js
* @author Daniel Flöter  http://www.kometschuh.de
* @version 0.9.2.3.4
* @date 6th January 2014
* @example Visit http://www.kometschuh.de/References.html
* @demo http://www.prefetchjs.de/demopage/index.html
* @documentation http://www.prefetchjs.de/
* @GitHub https://github.com/DanielFloeter/jQPrefetch
*/

(function ($) {

    $.fn.jQPrefetch = function (settings) {
        // Settings to configure the jQuery lightBox plugin how you like
        settings = jQuery.extend({
            // (Html Element ettribute: string)
            ajaxAnchor: 'a',
            // (Html element attribute: string)
            ajaxURL: 'href',
            // (jQuery selector: string) 
            // use a class and not a strId
            // a parent element have to exist, which have no other elements inside (below) except ajaxContainers
            ajaxContainer: '.container',
            // (string)
            currentContainer: document.location.href,
            // (jQuery selector: string)
            exclude: '.donotpreload',
            // (nothing, .php, .html, .aspx, ...: string)
            pageExtension: '.html'
        }, settings);

        var
            IntervalRight,
            States = ['Link', 'loading', 'preLoaded'];

        // HTML cache
        var cache = new Array();

        $(window).on('load', function () {
            _findLoop();
        });

        // fill array with all anchors
        _findLoop = function ()
        {

            // sign current #Content
            var location = document.location.href.split('/');
            location = location[location.length - 1].split('.')[0];

            if (location == '') { // if browser address www.domain.de/ and no index.html selected
                location = 'index';
            }

            $(settings.ajaxContainer).addClass(location.toLowerCase());
            // sign current #Link
            var nIndex = cache.length;
            cache[nIndex];
            cache.GetMultiArray(nIndex);
            cache[nIndex]['LinkName'] = location.toLowerCase();
            cache[nIndex]['PreLoadState'] = 'preLoaded';

            _scanHTML();

            window.setTimeout(function () { _prelaolLoop(); }, 0);
        }

        _scanHTML = function ()
        {
            $(settings.ajaxAnchor).not(settings.exclude).each(function ()
            {
                if ($(this).attr(settings.ajaxURL) != null)
                {
                    var anchor = $(this).attr(settings.ajaxURL).split('/');
                    anchor = anchor[anchor.length - 1].split('.')[0];
                    if (!cache.contains(anchor))
                    {
                        var nIndex = cache.length;
                        cache.GetMultiArray(nIndex);
                        cache[nIndex]['LinkName'] = anchor.toLowerCase();
                        cache[nIndex]['PreLoadState'] = 'Link';
                    }
                }
            });
        }        

        _prelaolLoop = function () {
            var nIndex = 0,
                load = 'true';

            do {
                if (nIndex >= (cache.length)) {
                    load = 'false';
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
                _prelaodContent(cache[nIndex]['LinkName']);
            }
        }

        _prelaodContent = function (strId, showAfterLoad)
        {
            var imgCounter = 0;

            $("<div>").load(strId + ".html " + settings.ajaxContainer, function () {
                var location = document.location.href.split('/');
                location = location[location.length - 1].split('.')[0];

                if (location == '') { // if browser address www.domain.de/ and no index.html selected
                    location = 'index';
                }

                $(this).find('img').each(function () {
                    imgCounter++;
                });
                $(this).find('img').on('load', function () {
                    imgCounter--;
                    if (imgCounter == 0) {

                        if (showAfterLoad) { // .load() is asynchronous: Show after load content
                            _showContent(strId);
                        }

                        window.setTimeout(function () { _prelaolLoop(); }, 0);
                    }
                });
                $(this).find('img').error(function () {
                    imgCounter--;
                })
                if (imgCounter == 0) { // _prelaolLoop anyway if loaded this have no img
                    window.setTimeout(function () { _prelaolLoop(); }, 0);
                };
                $( this ).find( settings.ajaxContainer ).addClass( strId.toLowerCase() );
                $( '.' + location.toLowerCase() ).parent().append( $(this).html() );
                $( "." + strId.toLowerCase() ).css( "display", "none" );
                cache[ cache.indexOf( strId ) ][ 'PreLoadState' ] = "preLoaded";
                _addClick( this, strId );
            });
        };

        _addClick = function ( _this, strId ) {
            $("." + strId.toLowerCase() + " " + settings.ajaxAnchor).not(settings.exclude).click(function () {
                _Click(this);
                return false;
            });
        }

        _Click = function ( _this ) {
            var link = $( _this ).attr(settings.ajaxURL).split('/');
            link = link[link.length - 1].split('.')[0];

            _tryShowContent(link.toLowerCase());

            history.pushState('', '', link + settings.pageExtension);
        }

        $(settings.ajaxAnchor).not(settings.exclude).on('click', function () {
            _Click( this );
            return false;
        });

        window.onpopstate = function(event) {
            if (window.history.state == null){ // page was loaded
                return;
            }
            var link = document.location.href.split('/');
            link = link[link.length - 1].split('.')[0];

            _tryShowContent(link.toLowerCase());
        };

        _getState = function (strId) {
            var classes = cache[cache.indexOf(strId)]['PreLoadState'];

            for (var state in States) {
                var regexState = new RegExp( States[state] );
                if (classes.match(regexState)) {
                    return States[state];
                }
            }           
        }

        _tryShowContent = function (strId) {
            var state = _getState(strId);
            switch( state ){
                case States[0]:
                    cache[cache.indexOf(strId)]['PreLoadState'] = "loading";
                    _prelaodContent(strId, 'true');
                    break;
                case States[1]:
                    window.setTimeout(function () {
                        _tryShowContent(strId);
                    }, 100);
                    break;
                case States[2]:
                    _showContent(strId);
                    break;
            }
        }

        _showContent = function (strId) {
            $(settings.ajaxContainer).css('display', 'none');
            $("." + strId).css("display", "block");

            /** Additionals: Do not use with other sites */
            switch ( strId ) {
                case 'sat-nam-rasayan':
                case 'workshops-massage-kurse-gong-meditation':
                case 'yoga-shakti-dance-nobember-2013':
                case 'sat-nam-rasayan':
                case 'kundalini-yogalehrerausbildung-stufe-1-infoabende':
                case 'cleaning-the-subconcious':
                case 'cleaning-the-subconcious-2014':
                case 'erkenne-deine-wahre-bestimmung':
                case 'hormonyoga-im-kundaliniyoga-2014':
                    Slider.initialize();
                    break;
                case 'yoga-workshops-veranstaltungen':
                case 'workshops':
                    Slider.initialize();
                    
                    window.setTimeout(function() {
                        $( '.Teaser' ).children( 'li' ).addClass( 'viewport' );
                    }, 100);                    
                    break; 
                default:
                    $( '.Teaser' ).children( 'li' ).removeClass( 'viewport' );
            }

            // openstreet map
            if (strId == 'kontakt') {
                if (!$('#map').is('.olMap')) {
                    drawmap();
                }
            }
        }
    };

    // extend Array object for the cache
    Array.prototype.GetMultiArray = function (index)
    {
        this[index] = new Array();
    }

    Array.prototype.append = function (index)
    {
        this[index] = new Array();
    }

    Array.prototype.indexOf = function (name)
    {
        for (var i = 0; i < this.length; i++)
        {
            if (name.toLowerCase() == this[i]['LinkName'])
            {
                return i;
            }
        }
    }

    Array.prototype.contains = function (obj)
    {
        var i = this.length;
        while (i--)
        {
            if (this[i])
            {
                if (this[i]['LinkName'] === obj.toLowerCase())
                {
                    return true;
                }
            }
        }
        return false;
    }

})(jQuery);







