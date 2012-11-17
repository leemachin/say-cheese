/*
 * Say Cheese!
 * Lee Machin, 2012
 * http://leemach.in, http://new-bamboo.co.uk
 *
 * Minimal javascript library for integrating a webcam and snapshots into your app.
 *
 * Handles starting up the webcam and rendering the element, and also capturing shots
 * in a separate canvas element.
 *
 * Depends on video and canvas, and of course, getUserMedia. It's unlikely to work
 * on anything but the newest browsers.
 */

var SayCheese = (function($) {

  var SayCheese;

  navigator.getUserMedia = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia ||
                            false);

  window.URL = (window.URL ||
                window.webkitURL);

  SayCheese = function SayCheese(element) {
    this.snapshots = [],
    this.canvas = null,
    this.context = null,
    this.video = null,
    this.events = {},
    this.stream = null;

    this.element = document.querySelectorAll(element)[0];
    this.element.style.position = 'relative';

    return this;
  };

  /**
   * Wrap the jQuery stuff so as to minimise the impact of the framework on
   * the rest of the code.
   */
  SayCheese.prototype.on = function on(evt, handler) {
    return $(this).on(evt, handler);
  };

  SayCheese.prototype.off = function off(evt, handler) {
    return $(this).off(evt, handler);
  };

  SayCheese.prototype.trigger = function trigger(evt, data) {
    // bubbling up the DOM makes things go a bit crazy. This assumes
    // preventDefault
    return $(this).triggerHandler(evt, data);
  };

  SayCheese.prototype.getStreamUrl = function getStreamUrl() {
    if (window.URL && window.URL.createObjectURL) {
      return window.URL.createObjectURL(this.stream);
    } else {
      return this.stream;
    }
  };

  SayCheese.prototype.createVideo = function createVideo() {
    var width     = 320,
        height    = 0,
        streaming = false;

    this.video = document.createElement('video');
    this.video.addEventListener('loadedmetadata', this.setupCanvas.bind(this));
    this.video.addEventListener('canplay', function() {
      if (!streaming) {
        height = this.video.videoHeight / (this.video.videoWidth / width);
        this.video.style.width = width;
        this.video.style.height = height;
        streaming = true;
      }
    }.bind(this), false);
  };

  SayCheese.prototype.setupCanvas = function setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.offsetWidth;
    this.canvas.height = this.video.offsetHeight;

    this.canvas.style.position = 'absolute';
    this.canvas.style.top = this.video.offsetTop;
    this.canvas.style.left = this.video.offsetLeft;

    this.context = this.canvas.getContext('2d');
    this.element.appendChild(this.canvas);

    return this.trigger('start');
  };

  SayCheese.prototype.takeSnapshot = function takeSnapshot() {
    var snapshot = document.createElement('canvas'),
        ctx      = snapshot.getContext('2d');

    snapshot.width  = this.video.videoWidth;
    snapshot.height = this.video.videoHeight;

    ctx.drawImage(this.video, 0, 0);

    this.snapshots.push(snapshot);
    this.trigger('snapshot', snapshot);

    ctx = null;
  };

  /* Start up the stream, if possible */
  SayCheese.prototype.start = function start() {

    // fail fast and softly if browser not supported
    if (navigator.getUserMedia === false) {
      this.trigger('error', 'NOT_SUPPORTED');
      return false;
    }

    var success = function success(stream) {
      this.stream = stream;
      this.createVideo();

      if (navigator.mozGetUserMedia) {
        this.video.mozSrcObject = stream;
      } else {
        this.video.src = this.getStreamUrl();
      }

      this.element.appendChild(this.video);
      this.video.play();
    }.bind(this);

    /* error is also called when someone denies access */
    var error = function error(error) {
      this.trigger('error', error);
    }.bind(this);

    return navigator.getUserMedia({ video: true, audio: false }, success, error);
  };

  SayCheese.prototype.stop = function stop() {
    this.stream.stop();

    if (window.URL && window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL(this.video.src);
    }

    return this.trigger('stop');
  };

  return SayCheese;

})(jQuery);
