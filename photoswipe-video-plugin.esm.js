/**
 * photoswipe-video-plugin.esm.js
 * ----------------------------------------
 * PhotoSwipe v5.x plugin that adds video tag support. (Tested with v5.4.4)
 * Inspired by https://github.com/dimsemenov/photoswipe-video-plugin
 * but this is a complete rewrite.
 *
 * Usage:
 *   import PhotoSwipeVideoPlugin from './photoswipe-video-plugin.esm.js';
 *   const video = new PhotoSwipeVideoPlugin(lightbox, { options });
 *
 * Author: apptaro
 * License: MIT
 * Repository: https://github.com/apptaro/photoswipe-video-plugin
 */

export default class PhotoSwipeVideoPlugin {
  /**
   * @param {PhotoSwipeLightbox} lightbox - PhotoSwipe lightbox instance
   * @param {Object} [options={}] - configuration options
   */
  constructor(lightbox, options = {}) {
    this.lightbox = lightbox;
    this.options = {
      autoplay: options?.autoplay ?? true,
      muted: options?.muted ?? true,
      controls: options?.controls ?? true,
      loop: options?.loop ?? true,
      controlslist: options?.controlslist ?? 'nodownload noplaybackrate',
      disablepictureinpicture: options?.disablepictureinpicture ?? true,
      playsinline: options?.playsinline ?? true,
    };

    this._videoCache = new Map();

    this._registerUI();
  }

  _registerUI() {
    const { lightbox, options: cfg } = this;

    const onContentInit = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      content._videoPlugin = {};
    };

    const onContentDestroy = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      content._videoPlugin = null;
    };

    const onContentAppend = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      e.preventDefault();

      const index = content.index ?? content.slide?.index ?? content.data?.index;
      let video = this._videoCache.get(index);

      if (!video) {
        video = document.createElement('video');
        video.toggleAttribute('muted', cfg.muted);
        video.toggleAttribute('controls', cfg.controls);
        video.toggleAttribute('loop', cfg.loop);
        video.setAttribute('controlslist', cfg.controlslist);
        video.toggleAttribute('disablepictureinpicture', cfg.disablepictureinpicture);
        video.toggleAttribute('playsinline', cfg.playsinline);
        video.preload = 'metadata';

        let sources = content.data?.videoSources;
        if (Array.isArray(sources) && sources.length) {
          sources.forEach((source) => {
            if (source && source.src) {
              const elm = document.createElement('source');
              elm.src = source.src;
              if (source.type) elm.type = source.type;
              video.appendChild(elm);
            }
          });
        } else if (content.data?.videoSrc) {
          video.src = content.data.videoSrc;
        }

        this._videoCache.set(index, video);
      }

      content.element = video;

      const container = content.slide?.container?.querySelector('.pswp__content') || content.slide?.container;
      if (video.parentNode !== container) {
        container.appendChild(video);
      }

      if (content._videoPlugin.lastResizeWidth) {
        this._applySizePx(content, content._videoPlugin.lastResizeWidth, content._videoPlugin.lastResizeHeight);
        content._videoPlugin.lastResizeWidth = undefined;
        content._videoPlugin.lastResizeHeight = undefined;
      } else {
        this._applySizePx(content);
      }

      if (cfg.autoplay && content._videoPlugin.active && !content._videoPlugin.opening) {
        this._handleAutoPlay(content);
      }
    };

    const onContentRemove = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      e.preventDefault();

      if (content.element instanceof HTMLVideoElement) {
        const video = content.element;
        try { video.pause(); } catch {} // just in case
        video.remove();
        content.element = null;
      }
    };

    const onContentActivate = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      if (content.element instanceof HTMLVideoElement) {
        this._applySizePx(content);
        if (cfg.autoplay && !content._videoPlugin.opening) {
          this._handleAutoPlay(content);
        }
      }
      content._videoPlugin.active = true;
    };

    const onContentDeactivate = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      if (content.element instanceof HTMLVideoElement) {
        this._handlePause(content);
      }
      content._videoPlugin.active = false;
    };

    const onContentResize = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      if (content.element instanceof HTMLVideoElement) {
        this._applySizePx(content, e.width, e.height);
      } else {
        // save width/height for next onContentAppend
        content._videoPlugin.lastResizeWidth = e.width;
        content._videoPlugin.lastResizeHeight = e.height;
      }
    };

    const onOpeningAnimationStart = () => {
      const content = lightbox.pswp.currSlide.content;
      if (!this._isVideoContent(content)) return;

      if (content.element instanceof HTMLVideoElement) {
        // nothing to do
      }
      content._videoPlugin.opening = true;
    };

    const onOpeningAnimationEnd = () => {
      const content = lightbox.pswp.currSlide.content;
      if (!this._isVideoContent(content)) return;

      if (content.element instanceof HTMLVideoElement) {
        if (cfg.autoplay) {
          this._handleAutoPlay(content);
        }
      }
      content._videoPlugin.opening = false;
    };

    lightbox.addFilter('domItemData', (itemData, elm, linkEl) => {
      const data = linkEl?.dataset || {};
      const isVideo = (data.pswpType === 'video') || this._byExtIsVideo(linkEl?.href) || !!data.pswpVideoSources || !!data.pswpVideoSrc;
      if (isVideo) {
        itemData.type = 'video';
        if (data.pswpVideoSources) {
          try { itemData.videoSources = JSON.parse(data.pswpVideoSources); } catch {}
        }
        itemData.videoSrc = data.pswpVideoSrc || linkEl?.href || itemData.src || '';
        if (data.pswpMsrc) itemData.msrc = data.pswpMsrc;
      }
      return itemData;
    });

    lightbox.addFilter('useContentPlaceholder', (value, content) => {
      return (this._isVideoContent(content) ? true : value); // we need this to make opening zoom animation to work
    });

    lightbox.addFilter('isContentZoomable', (value, content) => {
      return (this._isVideoContent(content) ? false : value); // disable zooming for video
    });

    lightbox.on('contentInit', onContentInit);
    lightbox.on('contentDestroy', onContentDestroy);
    lightbox.on('contentAppend', onContentAppend);
    lightbox.on('contentRemove', onContentRemove);
    lightbox.on('contentActivate', onContentActivate);
    lightbox.on('contentDeactivate', onContentDeactivate);
    lightbox.on('contentResize', onContentResize);
    lightbox.on('openingAnimationStart', onOpeningAnimationStart);
    lightbox.on('openingAnimationEnd', onOpeningAnimationEnd);
    lightbox.on('init', () => {
      const pswp = lightbox.pswp;
      pswp.on('destroy', () => {
        this._videoCache.clear();
      });
    });
  }

  _isVideoContent(content) {
    return (content?.data?.type === 'video');
  }

  _byExtIsVideo(href) {
    return /\.(mp4|webm|ogv)(\?.*)?$/i.test(href || '');
  }

  _applySizePx(content, width, height) {
    if (typeof width === 'undefined') {
      const slide = content?.slide;
      if (slide) {
        width = Math.round(slide.width * slide.currZoomLevel);
        height = Math.round(slide.height * slide.currZoomLevel);
      }
    }

    if (!Number.isFinite(width) || !Number.isFinite(height)) return;

    const style = content.element.style;
    style.width = Math.round(width) + 'px';
    style.height = Math.round(height) + 'px';
    style.position = 'absolute';
    style.left = '0px';
    style.top = '0px';
    style.objectFit = 'contain';
    style.maxWidth = 'none';
  }

  _handleAutoPlay(content) {
    const video = content.element;
    const promise = video.play?.();
    if (promise?.catch) promise.catch(() => {});
  }

  _handlePause(content) {
    const video = content.element;
    try { video.pause(); } catch {}
  }
}
