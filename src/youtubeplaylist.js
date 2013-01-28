(function ( $, window, document, undefined ) {

  // Create the defaults once
  var defaults = {
      videoWidth: 853,
      videoHeight: 480,
      autoPlay: false,
      autoNext: true,
      repeatAll: true,
      listStyle: '{{thumb}}{{title}}',
      thumbs: true,
      largeThumbs: false,
      playlistControls: true,
      videoControls: true
    };

  var PLAYER_STATES = {
    '-1': 'unstarted',
    '0': 'ended',
    '1': 'playing',
    '2': 'paused',
    '3': 'buffering',
    '4': 'video-cued'
  };

  // The actual plugin constructor
  function YoutubePlaylist( element, options ) {

    /**
     * The element that was used to create the playlist.
     * @type {Element}
     */
    this.element = element;

    /**
     * Plugin options
     * @type {Object}
     */
    this.options = $.extend( {}, defaults, options);
    this._defaults = defaults;

    /**
     * Wrapper element for playlist
     * @type {Element}
     * @private
     */
    this._wrapper = null;

    /**
     * YT player instance
     * @type {Object}
     * @private
     */
    this._player = null;


    this._activeVideo = 1;

    var self = this;
    self.init();
  }


  /**
   * Get video ID from link href
   *
   * @param url {String} Url to search.
   * @return {null|String} Id or null if no match.
   */

  YoutubePlaylist.prototype.getVideoId = function(url) {

    var id = null;
    if (url.indexOf('//www.youtube.com') !== -1) {
      id = url.match("[\\?&]v=([^&#]*)")[1];
    }
    else if (url.indexOf('//youtu.be') !== -1){
      id = url.substr(url.lastIndexOf("/") + 1);
    }
    return id;

  };


  /**
   * Get thumbnail for specific video id
   *
   * @param id {String} Video ID.
   * @param large {Boolean} Large or not?
   * @return {String}
   * @private
   */

  YoutubePlaylist.prototype._getVideoThumb = function(id, large) {

    return '<img src="http://img.youtube.com/vi/' + id + '/' + (large ? '2' : '0') + '.jpg"/>';

  }


  /**
   * Build individual list Item
   *
   * @param id {String} YouTube ID.
   * @param text {String} Text for new link
   * @return {HTMLElement}
   * @private
   */

  YoutubePlaylist.prototype._buildListItem = function(id, text) {

    var listItem = document.createElement('li');
    var listLink = document.createElement('a');
    var html = this.options.listStyle;
    if(!text) { text = ''; }
    html = html.replace('{{thumb}}', this._getVideoThumb(id, true));
    html = html.replace('{{title}}', text);
    listLink.innerHTML = html;
    listLink.href = 'http://youtu.be/' + id;
    listLink.setAttribute('data-id', id);
    listItem.appendChild(listLink);

    return listItem;

  };


  /**
   * Get Array of items from initial markup
   *
   * @return {Array}
   * @private
   */

  YoutubePlaylist.prototype._getPlaylistContents = function() {

    var self = this;
    var items = [];
    var id;

    $(this.element).find('a').each(function(i) {
      id = self.getVideoId($(this).attr('href'));
      if(id) {
        items.push({'id': id, 'text': $(this).text()});
      }
    });

    return items;

  };


  /**
   * Build markup required by plugin
   *
   * @private
   */

  YoutubePlaylist.prototype._buildMarkup = function() {

    if(this._items.lengh === 0) {
      throw new Error('No youtube IDs were found');
    }
    var self = this;

    this._wrapper = document.createElement('div');
    this._wrapper.className = 'yt-playlist-main';

    this._playerWrapper = document.createElement('div');
    this._playerWrapper.className = 'yt-playlist-player';
    this._wrapper.appendChild(this._playerWrapper);

    this._playlistsWrapper = document.createElement('div');
    this._playlistsWrapper.className = 'yt-playlists-list-wrapper';

    this._playlistsList = document.createElement('ul')
    this._playlistsList.className = 'yt-playlist-list';

    for (var i = 0; i < this._items.length; i++) {
      this._playlistsList.appendChild(this._buildListItem(this._items[i]['id'], this._items[i]['text']));
    }

    $(this._playlistsList).on('click', 'a', function(event){
      self._handleListClick($(this));
      return false;
    });

    this._playlistsWrapper.appendChild(this._playlistsList);
    if(this.options.playlistControls) {
      this._buildControls();
      this._wrapper.appendChild(this._controlsWrapper);
      this._playPauseButton = $(this._controlsWrapper).find('#yt-playpause');
    }
    this._wrapper.appendChild(this._playlistsWrapper);
    this._$playLists = $(this._playlistsWrapper);

    $(this.element).replaceWith(this._wrapper);

  };


  /**
   * Build controls for playlist navigation
   *
   * @private
   */

  YoutubePlaylist.prototype._buildControls = function() {
    var self = this;
    this._controlsWrapper = document.createElement('div');
    this._controlsWrapper.className = 'yt-playlist-controls';
    this._controlsWrapper.innerHTML = ['<a href="#" id="yt-back">Back</a>',
      '<a href="#" id="yt-next">Next</a>',
      '<a href="#" id="yt-playpause">Play</a>'
    ].join('');
    $(this._controlsWrapper).on('click', 'a', function(e) {
      e.preventDefault();
      switch (this.id) {
        case 'yt-back':
          self.previousVideo();
          break;
        case 'yt-next':
          self.nextVideo();
          break;
        case 'yt-playpause':
          self.togglePlayPause();
          break;
      }
    });
  }


  /**
   * Handle link click on list item
   *
   * @param $link
   * @private
   */

  YoutubePlaylist.prototype._handleListClick = function($link) {

    this._$playLists.find('.yt-playlist-active').removeClass('yt-playlist-active');
    this._$activeLink = $link;
    $link.addClass('yt-playlist-active');
    this._player.loadVideoById($link.data('id'));

  };


  /**
   * Move to next video in list
   */

  YoutubePlaylist.prototype.togglePlayPause = function() {
    var currentState = this._player.getPlayerState();
    if(currentState > 1) {
      this._player.playVideo();
    }
    else if(currentState === 1) {
      this._player.pauseVideo();
    };
  };

  /**
   * Move to next video in list
   */

  YoutubePlaylist.prototype.nextVideo = function() {

    var $next = this._$activeLink.parent().next();
    console.log('next', $next);
    if($next.length > 0) {
      return this._handleListClick($next.find('a:first'));
    }
    if(this.options.repeatAll) {
      return this._handleListClick(this._$playLists.find('a:first'));
    }

  };


  /**
   * Move to previous video in list
   */

  YoutubePlaylist.prototype.previousVideo = function() {

    var $back = this._$activeLink.parent().prev();
    console.log('back', $back);
    if($back.length > 0) {
      return this._handleListClick($back.find('a:first'));
    }
    if(this.options.repeatAll) {
      return this._handleListClick(this._$playLists.find('a:last'));
    }

  };


  /**
   * Callback for youtube API onReady
   *
   * @private
   */

  YoutubePlaylist.prototype._onAPIReady = function() {

    console.log('API READY');
    var self = this;
    this._player = new YT.Player(self._playerWrapper, {
      height: self.options.videoHeight,
      width: self.options.videoWidth,
      videoId: self._items[0]['id'],
      playerVars: {
        controls: self.options.videoControls ? 1 : 0
      },
      events: {
        'onReady': function(e) {
          console.log('player ready', self);
          self._onPlayerReady(e);
        },
        'onStateChange': function(e) {
          console.log('player state changed', e);
          self._onPlayerStateChange(e);
        }
      }
    });

  };


  /**
   * Callback for when player is ready.
   *
   * @private
   */

  YoutubePlaylist.prototype._onPlayerReady = function() {

    console.log('player ready', arguments);
    var firstLink = this._$playLists.find('a').eq(0);
    this._handleListClick(firstLink);
    if(this.options.autoPlay === false) {
      this._player.pauseVideo();
    }


  };


  YoutubePlaylist.prototype._updateButtons = function(state) {
    var playingClass = '';
    var playBtnText = 'Play';
    if(state === 1) {
      playingClass = ' playing';
      playBtnText = 'Pause';
    }
    console.log(this._playPauseButton);
    this._playPauseButton[0].className = 'yt-playpause ' + PLAYER_STATES[state] + playingClass;
    this._playPauseButton[0].textContent = playBtnText;
  }

  /**
   * Callback for player state changes.
   *
   * @param e
   * @private
   */

  YoutubePlaylist.prototype._onPlayerStateChange = function(e) {

    // Video ended
    if(e.data === 0) {
      if(this.options.autoNext) {
        this.nextVideo();
      }
    }
    this._updateButtons(e.data);
    console.log('state changed', e);

  };


  /**
   * Initialiase Playlist
   */

  YoutubePlaylist.prototype.init = function () {

    // Get array of items
    this._items = this._getPlaylistContents();

    // create replacement markup
    this._buildMarkup();

    var self = this;

     // Callback for when youtube iframe is ready
    window.onYouTubeIframeAPIReady = function() {
      self._onAPIReady();
    };

    // Load the IFrame Player API code asynchronously.
    var tag = document.createElement('script');
    tag.src = "//www.youtube.com/iframe_api";
    document.body.appendChild(tag);

  };

  $.fn['youtubeplaylist'] = function ( options ) {
    return this.each(function () {
      if (!$.data(this, 'plugin_youtubeplaylist')) {
        $.data(this, 'plugin_youtubeplaylist',
          new YoutubePlaylist( this, options ));
      }
    });
  }

})( jQuery, window, document );