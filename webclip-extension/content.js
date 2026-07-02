(function () {
  const HOST_ID = '__webclip_frag_host__';

  // Clicking the toolbar icon again while the overlay is open just closes it.
  const already = document.getElementById(HOST_ID);
  if (already) {
    already.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const prevOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';

  const scissorsSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/>' +
    '<line x1="8.5" y1="7.5" x2="20" y2="19"/><line x1="8.5" y1="16.5" x2="20" y2="5"/></svg>';

  const undoSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M7 10h9a4 4 0 0 1 0 8h-2"/><path d="M10 6l-4 4 4 4"/></svg>';

  const closeSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
    '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647;';
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .overlay {
        position: fixed;
        inset: 0;
        font-family: 'PingFang SC', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .frag-canvas { position: fixed; inset: 0; }
      .toolbar {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        background: #FFFFFF;
        border-radius: 22px;
        padding: 14px 18px 16px;
        box-shadow: 0 16px 40px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        min-width: 300px;
      }
      .hint { font-size: 12.5px; color: rgba(74,63,61,0.65); text-align: center; }
      .row { display: flex; gap: 8px; align-items: center; justify-content: center; }
      .mode-btn {
        padding: 6px 16px;
        border-radius: 16px;
        border: 1.5px solid #FFE3EA;
        background: #fff;
        color: rgba(74,63,61,0.65);
        font-size: 12.5px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .mode-btn.active { background: linear-gradient(135deg, #FF8FA8, #FF6F92); color: #fff; border-color: transparent; }
      .color-dot {
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid rgba(74,63,61,0.12);
        padding: 0; cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.08);
      }
      .color-dot.active { border-color: #FF6F92; transform: scale(1.15); }
      .actions { display: flex; gap: 8px; margin-top: 2px; }
      .btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        padding: 9px 18px;
        border-radius: 20px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
      }
      .btn svg { width: 14px; height: 14px; }
      .btn.primary { background: linear-gradient(135deg, #FF8FA8, #FF6F92); color: #fff; }
      .btn.secondary { background: #F4F0EE; color: #4A3F3D; }
      .icon-btn {
        width: 30px; height: 30px; border-radius: 50%;
        border: none; background: #F4F0EE; color: #4A3F3D;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
      }
      .icon-btn svg { width: 15px; height: 15px; }
      .close-corner {
        position: fixed; top: 20px; right: 20px;
        width: 36px; height: 36px; border-radius: 50%;
        border: none; background: #fff; color: #4A3F3D;
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      }
      .close-corner svg { width: 16px; height: 16px; }
      .error-banner {
        display: none;
        font-size: 12px; color: #C0392B; background: #FDEDEC;
        border-radius: 10px; padding: 6px 10px; text-align: center;
      }
      .error-banner.show { display: block; }
    </style>
    <div class="overlay">
      <canvas class="frag-canvas"></canvas>
      <button class="close-corner" id="closeCorner" title="退出剪刀模式">${closeSvg}</button>
      <div class="toolbar">
        <div class="hint">依次点击网页上想要的边缘，剪出你要的形状</div>
        <div class="error-banner" id="errorBanner"></div>
        <div class="row">
          <button class="mode-btn active" data-mode="straight">直线</button>
          <button class="mode-btn" data-mode="curve">曲线</button>
        </div>
        <div class="row" id="colorPicker">
          <button class="color-dot active" data-color="#ffffff" style="background:#ffffff"></button>
          <button class="color-dot" data-color="#FF8FA8" style="background:#FF8FA8"></button>
          <button class="color-dot" data-color="#BDEFDD" style="background:#BDEFDD"></button>
          <button class="color-dot" data-color="#FFE08A" style="background:#FFE08A"></button>
          <button class="color-dot" data-color="#E4DBFB" style="background:#E4DBFB"></button>
          <button class="color-dot" data-color="#4A3F3D" style="background:#4A3F3D"></button>
        </div>
        <div class="actions">
          <button class="icon-btn" id="undoBtn" title="撤销上一个点">${undoSvg}</button>
          <button class="btn secondary" id="cancelBtn">取消</button>
          <button class="btn primary" id="cutBtn">${scissorsSvg}剪下并下载</button>
        </div>
      </div>
    </div>
  `;

  const overlay = root.querySelector('.overlay');
  const canvas = root.querySelector('.frag-canvas');
  const ctx = canvas.getContext('2d');
  const cutBtn = root.querySelector('#cutBtn');
  const cancelBtn = root.querySelector('#cancelBtn');
  const undoBtn = root.querySelector('#undoBtn');
  const closeCorner = root.querySelector('#closeCorner');

  // Custom scissors cursor so the pointer clearly signals "cutting mode"
  // instead of relying on the platform's flat emoji rendering.
  const cursorSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">' +
    '<g fill="none" stroke="#4A3F3D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="7" cy="7" r="2.6" fill="#fff"/><circle cx="7" cy="20" r="2.6" fill="#fff"/>' +
    '<line x1="9.8" y1="8.8" x2="24" y2="23"/><line x1="9.8" y1="18.2" x2="24" y2="4"/></g></svg>';
  overlay.style.cursor = 'url("data:image/svg+xml,' + encodeURIComponent(cursorSvg) + '") 4 4, crosshair';

  let lasso = [];
  let curveMode = false;
  let borderColor = '#ffffff';

  function sizeCanvas() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPreview();
  }

  // Chaikin corner-cutting rounds off the path automatically in curve mode.
  function chaikinSmooth(points, iterations, closed) {
    let pts = points;
    for (let it = 0; it < iterations; it++) {
      const n = pts.length;
      if (n < 3) break;
      const out = [];
      if (!closed) out.push(pts[0]);
      const segments = closed ? n : n - 1;
      for (let i = 0; i < segments; i++) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % n];
        out.push({ x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 });
        out.push({ x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 });
      }
      if (!closed) out.push(pts[n - 1]);
      pts = out;
    }
    return pts;
  }

  function tracePath(context, points, mapPoint, closed) {
    if (points.length < 2) return;
    const pts = curveMode ? chaikinSmooth(points, 2, closed) : points;
    const mapped = pts.map(mapPoint);
    context.moveTo(mapped[0].x, mapped[0].y);
    for (let i = 1; i < mapped.length; i++) context.lineTo(mapped[i].x, mapped[i].y);
    if (closed) context.closePath();
  }

  const identity = p => p;

  function drawPreview() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Dim everything outside the selection once it's a real shape, like a
    // spotlight, so it's obvious what will get cut out of a busy page.
    if (lasso.length >= 3) {
      ctx.save();
      ctx.fillStyle = 'rgba(20,16,14,0.42)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      tracePath(ctx, lasso, identity, true);
      ctx.fill();
      ctx.restore();
    }

    if (lasso.length > 1) {
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      tracePath(ctx, lasso, identity, false);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      tracePath(ctx, lasso, identity, false);
      ctx.setLineDash([8, 5]);
      ctx.lineDashOffset = -(Date.now() / 30);
      ctx.strokeStyle = '#FF6F92';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    lasso.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === 0 ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#FF6F92' : '#ffffff';
      ctx.strokeStyle = i === 0 ? '#ffffff' : '#FF6F92';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });
  }

  let animId = null;
  function startAnim() {
    if (animId) return;
    const loop = () => {
      drawPreview();
      if (lasso.length > 1) {
        animId = requestAnimationFrame(loop);
      } else {
        animId = null;
      }
    };
    animId = requestAnimationFrame(loop);
  }

  function addPoint(p) {
    lasso.push(p);
    drawPreview();
    startAnim();
  }

  overlay.addEventListener('click', e => {
    if (e.target.closest('.toolbar') || e.target.closest('.close-corner')) return;
    addPoint({ x: e.clientX, y: e.clientY });
  });
  overlay.addEventListener(
    'touchend',
    e => {
      if (e.target.closest('.toolbar') || e.target.closest('.close-corner')) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      addPoint({ x: t.clientX, y: t.clientY });
    },
    { passive: false }
  );

  root.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      curveMode = btn.dataset.mode === 'curve';
      drawPreview();
    });
  });

  root.querySelectorAll('.color-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      borderColor = btn.dataset.color;
    });
  });

  undoBtn.addEventListener('click', () => {
    lasso.pop();
    drawPreview();
  });

  function showError(msg) {
    const banner = root.querySelector('#errorBanner');
    banner.textContent = msg;
    banner.classList.add('show');
  }

  function cleanup() {
    window.removeEventListener('resize', sizeCanvas);
    window.removeEventListener('keydown', onKeydown, true);
    document.documentElement.style.overflow = prevOverflow;
    host.remove();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') cleanup();
  }
  window.addEventListener('keydown', onKeydown, true);
  window.addEventListener('resize', sizeCanvas);

  cancelBtn.addEventListener('click', cleanup);
  closeCorner.addEventListener('click', cleanup);

  cutBtn.addEventListener('click', () => {
    if (lasso.length < 3) {
      showError('至少点 3 个点才能围出一个形状');
      return;
    }
    cutBtn.disabled = true;
    overlay.style.visibility = 'hidden';

    // Let the page repaint without our overlay before the screenshot.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' }, res => {
          overlay.style.visibility = 'visible';
          cutBtn.disabled = false;
          if (chrome.runtime.lastError || !res || res.error) {
            showError('截取失败，这个页面可能不支持被扩展捕获');
            return;
          }
          finishCut(res.dataUrl);
        });
      });
    });
  });

  function finishCut(screenshotDataUrl) {
    const img = new Image();
    img.onload = () => {
      const scale = img.width / window.innerWidth; // actual capture DPR, robust to rounding

      const xs = lasso.map(p => p.x), ys = lasso.map(p => p.y);
      const minX = Math.max(0, Math.min(...xs) - 10);
      const minY = Math.max(0, Math.min(...ys) - 10);
      const maxX = Math.min(window.innerWidth, Math.max(...xs) + 10);
      const maxY = Math.min(window.innerHeight, Math.max(...ys) + 10);
      const w = maxX - minX, h = maxY - minY;
      if (w < 5 || h < 5) {
        cleanup();
        return;
      }

      const pad = 20;
      const off = document.createElement('canvas');
      off.width = Math.round((w + pad * 2) * scale);
      off.height = Math.round((h + pad * 2) * scale);
      const octx = off.getContext('2d');
      const mapPoint = p => ({ x: (p.x - minX + pad) * scale, y: (p.y - minY + pad) * scale });

      octx.save();
      octx.beginPath();
      tracePath(octx, lasso, mapPoint, true);
      octx.clip();
      octx.drawImage(img, (pad - minX) * scale, (pad - minY) * scale);
      octx.restore();

      octx.save();
      octx.strokeStyle = borderColor;
      octx.lineWidth = 10 * scale;
      octx.lineJoin = 'round';
      octx.lineCap = 'round';
      octx.beginPath();
      tracePath(octx, lasso, mapPoint, true);
      octx.stroke();
      octx.restore();

      const dataUrl = off.toDataURL('image/png');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_IMAGE', dataUrl, filename: `webclip-${stamp}.png` }, () => {
        cleanup();
      });
    };
    img.src = screenshotDataUrl;
  }

  sizeCanvas();
})();
