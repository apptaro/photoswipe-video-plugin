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

    this._registerUI();
  }

  _registerUI() {
    const { lightbox, options: cfg } = this;

    const onAppend = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      e.preventDefault();

      if (content._videoElm) {
        const video = content._videoElm;
        content.element = video;
        const container = content.slide?.container?.querySelector('.pswp__content') || content.slide?.container;
        if (container && video.parentNode !== container) container.appendChild(video);
        const slide = content.slide;
        if (slide) {
          const w = Math.round(slide.width * slide.currZoomLevel);
          const h = Math.round(slide.height * slide.currZoomLevel);
          this._applySizePx(content, w, h, { active: !!slide.isActive });
        }
      } else {

        const poster = this._getPosterSrc(content);

        const img = document.createElement('img');
        if (poster) img.src = poster;
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        this._applyBaseMediaStyle(img.style);

        content.element = img;

        const container = content.slide?.container?.querySelector('.pswp__content') || content.slide?.container;
        if (container && !container.contains(img)) container.appendChild(img);

        if (content.slide) {
          const slide = content.slide;
          const w = Math.round(slide.width * slide.currZoomLevel);
          const h = Math.round(slide.height * slide.currZoomLevel);
          this._applySizePx(content, w, h, { active: !!slide.isActive });
        }

        img.onload = () => {
          const slide = content.slide;
          if (!slide) return;
          const w = Math.round(slide.width * slide.currZoomLevel);
          const h = Math.round(slide.height * slide.currZoomLevel);
          this._applySizePx(content, w, h, { active: !!slide.isActive });
        };
      }
    };

    const onActivate = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;

      if (content.element && content.element.tagName === 'VIDEO') {
        const video = content.element;
        const slide = content.slide;
        if (slide) {
          const w = Math.round(slide.width * slide.currZoomLevel);
          const h = Math.round(slide.height * slide.currZoomLevel);
          this._applySizePx(content, w, h, { active: true });
        }
        if (this.options.autoplay) {
          try { if (video.paused) video.play(); } catch {}
        }
      } else {

        const video = document.createElement('video');
        video.toggleAttribute('muted', cfg.muted);
        video.toggleAttribute('controls', cfg.controls);
        video.toggleAttribute('loop', cfg.loop);
        video.setAttribute('controlslist', cfg.controlslist);
        video.toggleAttribute('disablepictureinpicture', cfg.disablepictureinpicture);
        video.toggleAttribute('playsinline', cfg.playsinline);
        video.preload = 'metadata';
        this._applyBaseMediaStyle(video.style);

        let sources = content.data?.videoSources;
        if ((!sources || !sources.length) && content.data?.element?.dataset?.pswpVideoSources) {
          try { sources = JSON.parse(content.data.element.dataset.pswpVideoSources); } catch {}
        }
        if (Array.isArray(sources) && sources.length) {
          sources.forEach((source) => {
            if (!source || !source.src) return;
            const elm = document.createElement('source');
            elm.src = source.src;
            if (source.type) elm.type = source.type;
            video.appendChild(elm);
          });
        } else if (content.data?.videoSrc) {
          video.src = content.data.videoSrc;
        }

        const old = content.element;
        const container = content.slide?.container?.querySelector('.pswp__content') || content.slide?.container;
        if (video.parentNode !== container) {
          if (old && old.parentNode) old.parentNode.replaceChild(video, old);
          else if (container) container.appendChild(video);
        }
        content.element = video;
        content._videoElm = video;

        const slide = content.slide;
        if (slide) {
          const w = Math.round(slide.width * slide.currZoomLevel);
          const h = Math.round(slide.height * slide.currZoomLevel);
          this._applySizePx(content, w, h, { active: true });
        }

        if (cfg.autoplay) {
          if (!video.muted) video.muted = true;
          const promise = video.play?.();
          if (promise?.catch) promise.catch(() => {});
        }
      }
    };

    const onResize = (e) => {
      const content = e.content;
      if (!this._isVideoContent(content)) return;
      this._applySizePx(content, e.width, e.height, { active: !!content.slide?.isActive });
    };

    lightbox.addFilter('domItemData', (itemData, elm, linkEl) => {
      const data = linkEl?.dataset || {};
      const isVideo = data.pswpType === 'video' || this._byExtIsVideo(linkEl?.href) || !!data.pswpVideoSrc;
      if (isVideo) {
        itemData.type = 'video';
        itemData.videoSrc = data.pswpVideoSrc || linkEl?.href || itemData.src || '';
        if (data.pswpMsrc) itemData.msrc = data.pswpMsrc;
        const w = parseInt(data.pswpWidth || data.width, 10);
        const h = parseInt(data.pswpHeight || data.height, 10);
        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
          itemData.w = w; itemData.h = h;
          itemData.width = w; itemData.height = h;
        }
      }
      return itemData;
    });

    lightbox.addFilter('useContentPlaceholder', (value, content) => {
      return (this._isVideoContent(content) ? true : value); // keep placeholder enabled for layout stability
    });

    lightbox.addFilter('isContentZoomable', (value, content) => {
      return (this._isVideoContent(content) ? false : value);
    });

    lightbox.on('contentAppend', onAppend);
    lightbox.on('contentActivate', onActivate);
    lightbox.on('contentResize', onResize);

    lightbox.on('init', () => {
      const pswp = lightbox.pswp;
      if (!pswp) return;

      pswp.on('calcSlideSize', (e) => {
        const slide = e.slide;
        if (this._isVideoSlide(slide) && slide.content) {
          const w = Math.round((e.width || slide.width) * slide.currZoomLevel);
          const h = Math.round((e.height || slide.height) * slide.currZoomLevel);
          this._applySizePx(slide.content, w, h, { active: !!slide.isActive });
        }
      });
    });

    lightbox.on('contentDeactivate', (e) => {
      const elm = e.content?.element;
      if (elm && elm.tagName === 'VIDEO') {
        try { elm.pause(); } catch {}
      }
    });

    lightbox.on('contentDestroy', (e) => {
      const elm = e.content?.element;
      if (elm && elm.tagName === 'VIDEO') {
        try {
          elm.pause();
          // workaround for safari
          elm.removeAttribute('src');
          while (elm.firstChild) elm.removeChild(elm.firstChild);
          elm.load();
        } catch {}
      }
      if (e.content) e.content._videoElm = null;
    });
  }

  _isVideoContent(content) {
    return content?.data?.type === 'video';
  }

  _isVideoSlide(slide) {
    const data = slide?.data;
    const elm = data?.element;
    return !!(
      data?.type === 'video' ||
      data?.videoSrc ||
      elm?.dataset?.pswpVideoSrc ||
      this._byExtIsVideo(data?.src || elm?.href)
    );
  }

  _getPosterSrc(content) {
    const elm = content?.data?.element;
    const data = elm?.dataset || {};
    return (
      data.pswpMsrc ||
      content?.data?.msrc ||
      data.pswpSrc ||
      elm?.getAttribute?.('href') ||
      elm?.querySelector?.('img')?.getAttribute?.('src') ||
      ''
    );
  }

  _applyBaseMediaStyle(style) {
    Object.assign(style, {
      position: 'absolute',
      left: '0',
      top: '0',
      objectFit: 'contain',
      maxWidth: 'none'
    });
  }

  _byExtIsVideo(href) {
    return /\.(mp4|webm|ogv?)(\?.*)?$/i.test(href || '');
  }

  _applySizePx(content, width, height, { active } = { active: false }) {
    if (content?.element) {
      const style = content.element.style;
      style.width = Math.round(width) + 'px';
      style.height = Math.round(height) + 'px';
      this._applyBaseMediaStyle(style);
    }
    if (content?.slide?.placeholder?.element) {
      const style = content.slide.placeholder.element.style;
      style.left = '0';
      style.top = '0';
      style.position = 'absolute';
      style.width = Math.round(width) + 'px';
      style.height = Math.round(height) + 'px';
    }
  }
}
