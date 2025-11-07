# PhotoSwipe Video Plugin

A lightweight **PhotoSwipe v5** plugin that adds video tag support.

> This repository contains the ESM plugin (`photoswipe-video-plugin.esm.js`),  
> a minimal `sample.html` demo, and `package.json` ready for GitHub distribution.

---

## ✨ Features

- HTML5 <video> tag support
- Autoplay, mute, loop, controls, and inline playback supported
- Zero dependency, safe for repeated init/destroy
- Fully compatible with **PhotoSwipe v5.4.4**

---

## 📂 File Structure

```
.
├── photoswipe-video-plugin.esm.js
├── sample.html
├── package.json
├── README.md
└── LICENSE
```

---

## 🚀 Sample Demo

1. Open `sample.html` using any static server  
   (e.g. `python3 -m http.server`)
2. Ensure internet access to load PhotoSwipe from UNPKG CDN.
3. Click the arrows to see the animated looping transition.

---

## 💡 Usage (ESM)

```html
<link rel="stylesheet" href="https://unpkg.com/photoswipe@5/dist/photoswipe.css">
<div id="gallery">
  <a href="video.mp4" data-pswp-type="video" data-pswp-width="1600" data-pswp-height="1067" data-pswp-msrc="image.jpg">
    <img src="small.jpg" alt="">
  </a>
  <!-- ... -->
</div>

<script type="module">
  import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.js';
  import PhotoSwipeVideoPlugin from './photoswipe-video-plugin.esm.js';

  const lightbox = new PhotoSwipeLightbox({
    gallery: '#gallery',
    children: 'a',
    pswpModule: () => import('https://unpkg.com/photoswipe@5/dist/photoswipe.esm.js'),
    loop: true
  });

  // Initialize plugin
  new PhotoSwipeVideoPlugin(lightbox);

  lightbox.init();
</script>
```

---

## ⚙️ Options

| Option | Type | Default | Description |
|---|---|---|---|
| `autoplay` | boolean | `true` | Automatically play the video when activated. |
| `muted` | boolean | `true` | Mute video by default (required for autoplay). |
| `controls` | boolean | `true` | Show native video controls. |
| `loop` | boolean | `true` | Loop playback when the video ends. |
| `controlslist` | string | `'nodownload noplaybackrate'` | Restrict download/playback options. |
| `disablepictureinpicture` | boolean | `true` | Disable Picture-in-Picture mode. |
| `playsinline` | boolean | `true` | Allow inline playback on mobile Safari. |

---

## 🧩 Data Attributes

You can use any of these to define video slides:

| Attribute | Example | Description |
|---|---|---|
| `data-pswp-type="video"` | – | Explicitly mark an item as video. |
| `data-pswp-video-src` | `data-pswp-video-src="movie.mp4"` | Alternate to `href` for video URL. |
| `data-pswp-video-sources` | `[{"src":"movie.mp4","type":"video/mp4"}]` | JSON array of multiple sources. |
| `data-pswp-msrc` | `thumb.jpg` | Thumbnail (poster) for the video slide. |
| `data-pswp-width/height` | `1280 / 720` | Required for correct aspect ratio. |

---

## 🧠 Behavior Details

- The plugin creates a poster `<img>` first, then swaps to `<video>` when activated.
- When leaving a video slide, playback pauses automatically.
- Returning to the same slide **reuses** the same `<video>` element (no reload).
- On destroy, video elements are fully released to prevent memory leaks, even on Safari.

---

## 🛠 Development

No build step is required.  
The plugin is a single **ES module** file.  
If you plan to publish to npm, update the `name`, `version`, and `exports` fields in `package.json`.

---

## 📄 License

MIT
Copyright (c) 2025 [apptaro](https://github.com/apptaro)
