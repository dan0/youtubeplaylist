/**
 *  jquery.youtubeplaylist.js
 *
 *  By Dan Drayne
 *  https://github.com/dan0/youtubeplaylist/
 *
 *  Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

(function ( $, window, document, undefined ) {

  var pluginName = 'ytplaylist';
  var defaults = {
        holderId: 'ytvideo',
        playerHeight: 300,
        playerWidth: 450,
        addThumbs: false,
        thumbSize: 'small',
        showInline: false,
        autoPlay: true,
        showRelated: true,
        allowFullScreen: false,
        deepLinks: false,
        onChange: function(){},
        start: 1,
        secure: 'auto' //false|true|'auto'
      };


  /**
   * Get a youtube id from a url
   *
   * @param  {String} url Url to youtube video.
   * @return {String|Null}     Id of video, or null if none found.
   */

  function youtubeid(url) {
    var id = null;
    if (url.indexOf('//www.youtube.com') !== -1) {
      id = url.match("[\\?&]v=([^&#]*)")[1];
    }
    else if (url.indexOf('//youtu.be') !== -1){
      id = url.substr(url.lastIndexOf("/") + 1);
    }
    return id;
  }


  /**
   * Main plugin contstructor
   *
   * @param {Object} element object representing UL element.
   * @param {Object} options Options object.
   */

  function Plugin(element, options ) {
      this.element = element;
      this.options = $.extend( {}, defaults, options) ;
      this._defaults = defaults;
      this._name = pluginName;

      this._protocol = (this.options.secure === 'auto') ? window.location.protocol === 'https:' ? 'https://' : 'http://' :
        this.options.secure ? 'https://' : 'http://';
      this._autoPlay = (this.options.autoPlay) ? '&autoplay=1' : '';
      this._showRelated = (this.options.showRelated) ? '&rel=1' : '';
      this._fullscreen = (this.options.allowFullScreen) ? '&fs=1' : '';
      this.init();
  }


  Plugin.prototype = {

      /**
       * Initialise gallery
       *
       * Loop through <li> elements, setting up click
       * handlers etc.
       */

      init: function() {
        var self = this;
        var initialItem = self.options.deepLinks && window.location.hash.indexOf('#yt-gal-') !== -1 ? window.location.hash : null;
        // Setup initial classification of content
        $(self.element).find('li').each(function(index) {

          var listItem = $(this);
          var listIndex = index + 1;

          listItem.find('a:first').each(function() {

            var link = $(this);
            var ytid = youtubeid(link.attr('href'));
            var replacedText = listItem.text();

            link.data('yt-href', link.attr('href'));
            link.attr('href', '#yt-gal-' + listIndex);

            if (ytid) {

              link.addClass('yt-vid');
              link.data('yt-id', ytid);
              if (self.options.addThumbs) {

                if(self.options.thumbSize == 'small') {
                  thumbUrl = self._protocol + 'img.youtube.com/vi/' + ytid + '/2.jpg';
                }
                else {
                  thumbUrl = self._protocol + 'img.youtube.com/vi/' + ytid + '/0.jpg';
                }
                var thumbHtml = '<img src="' + thumbUrl + '" alt="' + replacedText + '" />';
                link.empty().html(thumbHtml + replacedText).attr('title', replacedText);
              }
            }
            else {
              //must be an image link (naive)
              link.addClass('img-link');
              if (self.options.addThumbs) {
                var $img = $('<img/>').attr('src', link.data('yt-href'));
                link.empty().html($img).attr("title", replacedText);
              }

            }

            if (!self.options.deepLinks) {
              link.click(function(e) {
                e.preventDefault();
                self.handleClick(link, self.options);
                self.options.onChange.call();
              });
            }

          });

          var firstLink = $(listItem.children('a')[0]);
          if (initialItem) {
            if (firstLink.attr('href') === initialItem) {
              self.handleClick(firstLink, self.options);
            }
          }
          else if (listIndex === self.options.start) {
            self.handleClick(firstLink, self.options);
          }

        });

        if (self.options.deepLinks) {
          $(window).bind('hashchange', function(e) {
            var hash = window.location.hash;
            var clicked = $(self.element).find('a[href="' + hash + '"]');
            if (clicked.length > 0) {
              self.handleClick(clicked, self.options);
            }
            else if (hash === '') {
              self.handleClick($(self.element).find('a:first'), self.options);
            }
          });
        }

      },


      /**
       * Get old-style youtube embed code
       *
       * @param  {Object} options Plugin options object.
       * @param  {String} id      ID of youtube video.
       * @return {String}         HTML embed code.
       */

      getOldEmbedCode: function(options, id) {
        //throw a youtube player in
        var html  = '';

        html += '<object height="' + options.playerHeight + '" width="' + options.playerWidth + '">';
        html += '<param name="movie" value="' + this._protocol + 'www.youtube.com/v/' + id + this._autoPlay + this._showRelated + this._fullScreen + '"> </param>';
        html += '<param name="wmode" value="transparent"> </param>';
        if(options.allowFullScreen) {
          html += '<param name="allowfullscreen" value="true"> </param>';
        }
        html += '<embed src="' + this._protocol + 'www.youtube.com/v/' + id + this._autoPlay + this._showRelated + this._fullScreen + '"';
        if(options.allowFullScreen) {
          html += ' allowfullscreen="true" ';
        }
        html += 'type="application/x-shockwave-flash" wmode="transparent"  height="' + options.playerHeight + '" width="' + options.playerWidth + '"></embed>';
        html += '</object>';

        return html;
      },


      /**
       * Get new-style youtube embed code
       *
       * @param  {Object} options Plugin options object.
       * @param  {String} id      ID of youtube video.
       * @return {String}         HTML embed code.
       */

      getNewEmbedCode: function(options, id) {
        var html = '';
        html += '<iframe width="' + options.playerWidth + '" height="' + options.playerHeight + '"';
        html += ' src="' + this._protocol + 'www.youtube.com/embed/' + id + '?wmode=opaque' + this._showRelated + '" frameborder="0"';
        html += ' allowfullscreen></iframe>';

        return html;
      },


      /**
       * Handle clicks on all items
       *
       * @param  {Object} link    jQuery object representing clicked link.
       * @param  {Object} options Plugin options object.
       * @return {Function}       Appropriate handler function.
       */

      handleClick: function(link, options) {
        if (link.hasClass('yt-vid')) {
          return this.handleVideoClick(link, options);
        }
        else {
          return this.handleImageClick(link, options);
        }
      },


      /**
       * Handle clicks on video items
       *
       * @param  {Object} link    jQuery object representing clicked link.
       * @param  {Object} options Plugin options object.
       * @return {Boolean}        False, cancelling click event.
       */

      handleVideoClick: function(link, options) {
        var self = this;
        if(options.showInline) {
          $('li.currentvideo').removeClass('currentvideo');
          link.parent('li').addClass('currentvideo').html(self.getNewEmbedCode(self.options, link.data('yt-id')));
        }
        else {
          var holder = (options.holder ? options.holder : $('#' + options.holderId));
          holder.html(self.getNewEmbedCode(self.options, link.data('yt-id')));
          link.parent().parent('ul').find('li.currentvideo').removeClass('currentvideo');
          link.parent('li').addClass('currentvideo');
        }
        return false;
      },


      /**
       * Handle clicks on image items
       *
       * @param  {Object} link    jQuery object representing clicked link.
       * @param  {Object} options Plugin options object.
       * @return {Boolean}        False, cancelling click event.
       */

      handleImageClick: function(link, options) {
        var thisImage = new Image();
        var $thisImage = $(thisImage);
        var $link = $(link);

        thisImage.onload = function() {
          if ($thisImage.height() < $thisImage.width()) {
            $thisImage.width(options.playerWidth).css('margin-top',parseInt($thisImage.height()/-2, 10)).css({
              height: 'auto'
            });
          }
          else {
            $thisImage.css({
              height: options.playerHeight,
              width: 'auto',
              top: '0px',
              position: 'relative'
            });
          }
          $thisImage.fadeIn();
        };

        $thisImage.attr({src:$link.data('yt-href') })
          .css({
            display: 'none',
            position: 'absolute',
            left: '0px',
            top: '50%'});

        if(options.showInline) {
          $('li.currentvideo').removeClass('currentvideo');
          $link.parent('li').addClass('currentvideo').html($thisImage);
        }
        else {
          var holder = (options.holder ? options.holder : $('#' + options.holderId));
          holder.html($thisImage);
          $link.closest('ul').find('li.currentvideo').removeClass('currentvideo');
          $link.parent('li').addClass('currentvideo');
        }



        return false;
      }
  };

  $.fn[pluginName] = function (options) {
      return this.each(function () {
          if (!$.data(this, 'plugin_' + pluginName)) {
              $.data(this, 'plugin_' + pluginName,
              new Plugin(this, options));
          }
      });
  };

})(jQuery, window, document);