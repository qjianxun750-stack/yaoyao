/**
 * enhance.js v1.1 - 适配现有代码结构
 * 三个增强功能：陀螺仪摇一摇 + 触感反馈 + 悬念感
 * 使用方式：在 index.html 末尾 app.js 之后引入
 * <script src="js/enhance.js?v=1.1"></script>
 */

const Enhance = (() => {

  // ============================================================
  // 1. 触感反馈 (Haptic Feedback)
  // ============================================================
  const Haptic = {
    // 是否支持
    supported: typeof navigator.vibrate === 'function',

    // 骰子滚动中 - 轻微持续震动
    rolling() {
      if (!this.supported) return;
      // 多段短震，模拟骰子滚动质感
      navigator.vibrate([8, 60, 8, 60, 8, 60, 8]);
    },

    // 骰子落地 - 重震+弹跳感
    land() {
      if (!this.supported) return;
      // 重震·停·轻弹·停·微弹，模拟骰子碰桌弹跳
      navigator.vibrate([25, 30, 12, 20, 6]);
    },

    // 结果揭晓 - 清脆单震
    reveal() {
      if (!this.supported) return;
      navigator.vibrate([15]);
    },

    // 点击按钮 - 极轻反馈
    tap() {
      if (!this.supported) return;
      navigator.vibrate([6]);
    }
  };

  // ============================================================
  // 2. 悬念感 (Suspense Effect)
  // 在骰子落地前加 0.4s 的「即将揭晓」状态
  // ============================================================
  const Suspense = {
    overlay: null,
    timeoutId: null,

    // 初始化悬念遮罩
    init() {
      const el = document.createElement('div');
      el.id = 'suspense-overlay';
      el.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0);
        z-index: 500;
        pointer-events: none;
        transition: background 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const text = document.createElement('div');
      text.id = 'suspense-text';
      text.style.cssText = `
        font-family: 'ZCOOL XiaoWei', 'Noto Serif SC', serif;
        font-size: 22px;
        color: rgba(255,255,255,0);
        letter-spacing: 0.2em;
        transition: color 0.3s ease;
        user-select: none;
      `;
      text.textContent = '天机即将揭晓…';
      el.appendChild(text);
      document.body.appendChild(el);
      this.overlay = el;
    },

    // 显示悬念状态
    show(callback, delay = 400) {
      if (!this.overlay) this.init();
      const overlay = this.overlay;
      const text = document.getElementById('suspense-text');

      // 轻微暗化屏幕
      overlay.style.background = 'rgba(0,0,0,0.45)';
      overlay.style.pointerEvents = 'auto';
      if (text) text.style.color = 'rgba(255,255,255,0.7)';

      // delay后触发回调（结果揭晓）
      this.timeoutId = setTimeout(() => {
        this.hide();
        if (typeof callback === 'function') callback();
      }, delay);
    },

    // 隐藏悬念状态
    hide() {
      if (!this.overlay) return;
      const text = document.getElementById('suspense-text');
      this.overlay.style.background = 'rgba(0,0,0,0)';
      this.overlay.style.pointerEvents = 'none';
      if (text) text.style.color = 'rgba(255,255,255,0)';
      clearTimeout(this.timeoutId);
    }
  };

  // ============================================================
  // 3. 陀螺仪摇一摇 (Gyroscope Shake Detection)
  // ============================================================
  const Gyro = {
    enabled: false,
    lastShake: 0,
    cooldown: 2500,        // 摇完冷却时间 ms，防止重复触发
    threshold: 18,         // 加速度阈值，调大=更难触发
    listening: false,
    onShake: null,         // 摇动时的回调函数

    // 检测是否支持
    isSupported() {
      return typeof DeviceMotionEvent !== 'undefined';
    },

    // iOS 13+ 需要用户授权
    async requestPermission() {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const result = await DeviceMotionEvent.requestPermission();
          return result === 'granted';
        } catch (e) {
          console.warn('陀螺仪授权失败:', e);
          return false;
        }
      }
      // Android 或旧版 iOS 不需要授权
      return true;
    },

    // 处理运动事件
    _handleMotion(e) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const now = Date.now();
      if (now - Gyro.lastShake < Gyro.cooldown) return;

      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);

      if (total > Gyro.threshold) {
        Gyro.lastShake = now;
        if (typeof Gyro.onShake === 'function') {
          Gyro.onShake();
        }
      }
    },

    // 开始监听
    start(callback) {
      if (!this.isSupported() || this.listening) return;
      this.onShake = callback;
      window.addEventListener('devicemotion', this._handleMotion, { passive: true });
      this.listening = true;
      this.enabled = true;
      console.log('✅ 陀螺仪监听已开启');
    },

    // 停止监听
    stop() {
      window.removeEventListener('devicemotion', this._handleMotion);
      this.listening = false;
      this.enabled = false;
    }
  };

  // ============================================================
  // 4. 授权引导 UI
  // 第一次进入时显示「开启摇一摇」引导
  // ============================================================
  const GyroGuide = {
    shown: false,

    show(onEnable, onSkip) {
      if (this.shown) return;
      if (!Gyro.isSupported()) {
        // 不支持就直接跳过
        if (typeof onSkip === 'function') onSkip();
        return;
      }

      // 检查是否已授权过
      const granted = localStorage.getItem('gyro_granted');
      if (granted === 'true') {
        // 已授权，直接开启
        Gyro.start(onEnable);
        return;
      }
      if (granted === 'false') {
        // 之前拒绝过，不再提示
        if (typeof onSkip === 'function') onSkip();
        return;
      }

      this.shown = true;

      // 创建引导弹窗
      const modal = document.createElement('div');
      modal.id = 'gyro-guide';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.75);
        z-index: 2000;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 40px;
        animation: fadeIn 0.3s ease;
        backdrop-filter: blur(8px);
      `;

      modal.innerHTML = `
        <style>
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp {
            from { transform: translateY(40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          #gyro-card {
            background: #1a1530;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 28px 24px 24px;
            width: calc(100% - 48px);
            max-width: 380px;
            text-align: center;
            animation: slideUp 0.35s cubic-bezier(0.34,1.4,0.64,1);
          }
          #gyro-icon {
            font-size: 48px;
            margin-bottom: 14px;
            display: block;
            animation: shake-demo 1.5s ease-in-out infinite;
          }
          @keyframes shake-demo {
            0%,100% { transform: rotate(0deg); }
            20% { transform: rotate(-15deg); }
            40% { transform: rotate(15deg); }
            60% { transform: rotate(-10deg); }
            80% { transform: rotate(10deg); }
          }
          #gyro-title {
            font-family: 'ZCOOL XiaoWei', 'Noto Serif SC', serif;
            font-size: 22px;
            color: #fff;
            margin-bottom: 8px;
            letter-spacing: 0.05em;
          }
          #gyro-desc {
            font-size: 13px;
            color: rgba(255,255,255,0.45);
            line-height: 1.7;
            margin-bottom: 24px;
          }
          #gyro-enable-btn {
            width: 100%;
            padding: 14px;
            border-radius: 12px;
            border: none;
            background: var(--tc, #FF6B6B);
            color: #000;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            margin-bottom: 10px;
            letter-spacing: 0.03em;
          }
          #gyro-skip-btn {
            width: 100%;
            padding: 10px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            background: transparent;
            color: rgba(255,255,255,0.35);
            font-size: 13px;
            cursor: pointer;
            font-family: inherit;
          }
        </style>
        <div id="gyro-card">
          <span id="gyro-icon">📱</span>
          <div id="gyro-title">开启摇一摇</div>
          <div id="gyro-desc">
            晃动手机即可摇卦<br>
            求签仪式感翻倍
          </div>
          <button id="gyro-enable-btn">✨ 开启摇一摇</button>
          <button id="gyro-skip-btn">暂时不用，点击摇</button>
        </div>
      `;

      document.body.appendChild(modal);

      // 开启按钮
      document.getElementById('gyro-enable-btn').addEventListener('click', async () => {
        const granted = await Gyro.requestPermission();
        localStorage.setItem('gyro_granted', granted ? 'true' : 'false');
        modal.remove();
        if (granted) {
          Gyro.start(onEnable);
          showToast('✅ 摇一摇已开启，晃动手机摇卦');
        } else {
          showToast('⚠️ 未获得权限，请点击按钮摇卦');
          if (typeof onSkip === 'function') onSkip();
        }
      });

      // 跳过按钮
      document.getElementById('gyro-skip-btn').addEventListener('click', () => {
        localStorage.setItem('gyro_granted', 'false');
        modal.remove();
        if (typeof onSkip === 'function') onSkip();
      });
    }
  };

  // ============================================================
  // 5. Toast 工具（独立，不依赖主程序）
  // ============================================================
  function showToast(msg, duration = 2500) {
    // 优先用主程序的 toast
    if (typeof window.toast === 'function') {
      window.toast(msg);
      return;
    }
    // 降级自建
    let el = document.getElementById('enhance-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'enhance-toast';
      el.style.cssText = `
        position: fixed;
        bottom: 36px;
        left: 50%;
        transform: translateX(-50%) translateY(16px);
        background: rgba(255,255,255,0.09);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.12);
        color: #fff;
        padding: 9px 18px;
        border-radius: 18px;
        font-size: 12px;
        opacity: 0;
        transition: all 0.25s;
        pointer-events: none;
        z-index: 3000;
        white-space: nowrap;
      `;
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(16px)';
    }, duration);
  }

  // ============================================================
  // 6. 整合注入 - 适配现有代码结构
  // ============================================================
  function injectEnhancements() {

    // ── 6.1 单骰模式触感反馈 ─────────────────────────────────
    // 适配：使用 #diceScene .dice-3d 选择器
    const singleDiceEl = document.querySelector('#diceScene .dice-3d');
    if (singleDiceEl) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            const cls = singleDiceEl.className;
            if (cls.includes('rolling')) {
              Haptic.rolling();
            } else if (cls.includes('landing')) {
              Haptic.land();
            } else if (!cls.includes('rolling') && !cls.includes('landing') && cls.includes('flat')) {
              // 落地变平，结果揭晓
              setTimeout(() => Haptic.reveal(), 200);
            }
          }
        });
      });
      observer.observe(singleDiceEl, { attributes: true });
      console.log('✅ 单骰触感反馈已注入');
    }

    // ── 6.2 一卦模式触感反馈 ─────────────────────────────────
    // 适配：使用 #diceScene-0, #diceScene-1, #diceScene-2 选择器
    [0, 1, 2].forEach(i => {
      const el = document.querySelector(`#diceScene-${i} .dice-3d`);
      if (!el) return;
      const obs = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            const cls = el.className;
            if (cls.includes('rolling') && i === 0) Haptic.rolling();
            if (cls.includes('landing')) {
              setTimeout(() => Haptic.land(), i * 50);
            }
            if (cls.includes('flat') && i === 2) {
              // 最后一个骰子落地，结果揭晓
              setTimeout(() => Haptic.reveal(), 200);
            }
          }
        });
      });
      obs.observe(el, { attributes: true });
    });
    console.log('✅ 一卦模式触感反馈已注入');

    // ── 6.3 按钮点击触感 ─────────────────────────────────────
    // 适配：包含 #yaoButton (组合模式的起卦按钮)
    document.querySelectorAll('.roll-btn, #yaoButton, .chip, .tab').forEach(btn => {
      btn.addEventListener('touchstart', () => Haptic.tap(), { passive: true });
    });

    // ── 6.4 单骰悬念感 ───────────────────────────────────────
    // 在单骰 landing 时触发悬念效果
    if (singleDiceEl) {
      let suspenseObserver = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          if (m.type === 'attributes' && m.attributeName === 'class') {
            if (singleDiceEl.className.includes('landing')) {
              // 触发悬念：轻微暗化0.4秒
              Suspense.show(() => {}, 400);
            }
          }
        });
      });
      suspenseObserver.observe(singleDiceEl, { attributes: true });
      console.log('✅ 单骰悬念感已注入');
    }

    // ── 6.5 陀螺仪摇一摇 ─────────────────────────────────────
    // 手机端：晃动 = 点击摇骰子按钮
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      // 延迟2秒后显示引导，让用户先看到页面
      setTimeout(() => {
        GyroGuide.show(
          // 授权成功，绑定摇动回调
          () => {
            Gyro.onShake = () => {
              // 判断当前在哪个模式
              const singlePanel = document.getElementById('single-panel');
              const comboPanel = document.getElementById('combo-panel');

              const isSingleMode = singlePanel && singlePanel.style.display !== 'none';
              const isComboMode = comboPanel && comboPanel.style.display !== 'none';

              if (isComboMode) {
                // 一卦模式：点击 yaoButton
                const comboBtn = document.getElementById('yaoButton');
                if (comboBtn && !comboBtn.disabled) {
                  Haptic.tap();
                  comboBtn.click();
                }
              } else if (isSingleMode) {
                // 单骰模式：点击 rollBtn
                const btn = document.getElementById('rollBtn');
                if (btn && !btn.disabled) {
                  Haptic.tap();
                  btn.click();
                }
              }
            };
          },
          // 跳过
          () => {}
        );
      }, 2000);
    }

    console.log('✅ Enhance.js 已注入：触感反馈 + 悬念感 + 陀螺仪');
  }

  // ============================================================
  // 7. 初始化
  // ============================================================
  function init() {
    // 等主程序初始化完成后再注入
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectEnhancements, 500);
      });
    } else {
      setTimeout(injectEnhancements, 500);
    }
  }

  // 自动初始化
  init();

  // 暴露公共接口（方便调试）
  return { Haptic, Suspense, Gyro, GyroGuide };

})();
