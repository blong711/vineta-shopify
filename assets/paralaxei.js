/*! Copyright (c) 2016 THE ULTRASOFT (http://theultrasoft.com)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Project: Parallaxie
 * Version: 0.5 (Performance Optimized)
 *
 * Requires: jQuery 1.9+
 */

(function( $ ){

    // Performance optimization utilities
    const ParallaxUtils = {
        // Throttle function for scroll events
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // RequestAnimationFrame wrapper
        raf: function(callback) {
            return requestAnimationFrame ? requestAnimationFrame(callback) : setTimeout(callback, 16);
        }
    };

    // Global scroll handler for all parallax elements
    let parallaxElements = [];
    let scrollHandler = null;

    function initScrollHandler() {
        if (scrollHandler) return;

        scrollHandler = ParallaxUtils.throttle(function() {
            ParallaxUtils.raf(() => {
                parallaxElements.forEach(function(item) {
                    try {
                        parallax_scroll(item.$el, item.options);
                    } catch (error) {
                        console.warn('Parallax scroll error:', error);
                    }
                });
            });
        }, 16); // ~60fps

        // Use passive scroll listener for better performance
        $(window).on('scroll', scrollHandler);
    }

    $.fn.parallaxie = function( options ){

        options = $.extend({
            speed: 0.2,
            repeat: 'no-repeat',
            size: 'cover',
            pos_x: 'center',
            offset: 0,
        }, options );

        this.each(function(){

            var $el = $(this);
            var local_options = $el.data('parallaxie');
            if( typeof local_options !== 'object' ) local_options = {};
            local_options = $.extend( {}, options, local_options );

            var image_url = $el.data('image');
            if( typeof image_url === 'undefined' ){
                image_url = $el.css('background-image');
                if( !image_url ) return;

                // APPLY DEFAULT CSS
                var pos_y =  local_options.offset + ($el.offset().top - $(window).scrollTop()) * (1 - local_options.speed );
                $el.css({
                    'background-image': image_url,
                    'background-size': local_options.size,
                    'background-repeat': local_options.repeat,
                    'background-attachment': 'fixed',
                    'background-position': local_options.pos_x + ' ' + pos_y + 'px',
                });

                // Call by default for the first time on initialization.
                parallax_scroll( $el, local_options );

                // Add to global parallax elements array
                parallaxElements.push({
                    $el: $el,
                    options: local_options
                });

                // Initialize scroll handler if not already done
                initScrollHandler();

            }
        });

        return this;
    };

    function parallax_scroll( $el, local_options ){
        var pos_y =  local_options.offset + ($el.offset().top - $(window).scrollTop()) * (1 - local_options.speed );
        $el.data( 'pos_y', pos_y );
        $el.css( 'background-position', local_options.pos_x + ' ' + pos_y + 'px' );
    }

    // Cleanup function for removing parallax elements
    $.fn.parallaxie.destroy = function($el) {
        if ($el) {
            parallaxElements = parallaxElements.filter(item => item.$el[0] !== $el[0]);
        } else {
            parallaxElements = [];
            if (scrollHandler) {
                $(window).off('scroll', scrollHandler);
                scrollHandler = null;
            }
        }
    };

}( jQuery ));