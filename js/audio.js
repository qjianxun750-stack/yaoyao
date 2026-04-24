// ========== 音效控制器（Web Audio API）==========
const AudioController = {
    audioContext: null,
    isEnabled: true,
    isInitialized: false,

    // 初始化AudioContext
    init() {
        if (this.isInitialized) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.isInitialized = true;

            // 从localStorage读取音效开关状态
            const savedState = localStorage.getItem('soundEnabled');
            if (savedState !== null) {
                this.isEnabled = savedState === 'true';
            }

            console.log('音效系统初始化成功');
        } catch (error) {
            console.warn('Web Audio API不支持:', error);
            this.isEnabled = false;
        }
    },

    // 确保AudioContext已恢复（解决浏览器自动播放限制）
    async resume() {
        if (!this.isInitialized) {
            this.init();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    },

    // 切换音效开关
    toggle() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('soundEnabled', this.isEnabled);
        return this.isEnabled;
    },

    // ========== 生成白噪音缓冲 ==========
    createNoiseBuffer(duration = 0.06) {
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return buffer;
    },

    // ========== 摇骰子音效 ==========
    playRollSound() {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            this.resume();

            const now = this.audioContext.currentTime;

            // 生成8次短促爆发，间隔180ms
            for (let i = 0; i < 8; i++) {
                const startTime = now + (i * 0.18);

                // 创建白噪音源
                const noiseBuffer = this.createNoiseBuffer(0.06);
                const noiseSource = this.audioContext.createBufferSource();
                noiseSource.buffer = noiseBuffer;

                // 创建带通滤波器（800-2000Hz，随机偏移）
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.value = 1.5;
                const baseFreq = 800 + Math.random() * 1200;
                filter.frequency.setValueAtTime(baseFreq, startTime);

                // 创建增益节点（指数衰减）
                const gainNode = this.audioContext.createGain();
                gainNode.gain.setValueAtTime(0.12, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

                // 连接节点
                noiseSource.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                // 播放
                noiseSource.start(startTime);
                noiseSource.stop(startTime + 0.06);
            }
        } catch (error) {
            console.warn('播放摇骰音效失败:', error);
        }
    },

    // ========== 单爻揭晓音效 ==========
    playRevealSound(yaoIndex = 0) {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            this.resume();

            const now = this.audioContext.currentTime;

            // 三种音高：C5(523Hz) → E5(659Hz) → G5(784Hz)
            const frequencies = [523, 659, 784];
            const mainFreq = frequencies[yaoIndex] || frequencies[0];

            // 主振荡器（sine波）
            const mainOsc = this.audioContext.createOscillator();
            mainOsc.type = 'sine';
            mainOsc.frequency.setValueAtTime(mainFreq, now);

            // 泛音层（主频×2，制造"铜"的质感）
            const harmonicOsc = this.audioContext.createOscillator();
            harmonicOsc.type = 'sine';
            harmonicOsc.frequency.setValueAtTime(mainFreq * 2, now);

            // 主增益节点
            const mainGain = this.audioContext.createGain();
            mainGain.gain.setValueAtTime(0.2, now);
            mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            // 泛音增益（较小音量）
            const harmonicGain = this.audioContext.createGain();
            harmonicGain.gain.setValueAtTime(0.06, now);
            harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            // 混响模拟（延迟效果）
            const delayNode = this.audioContext.createDelay(0.08);
            delayNode.delayTime.value = 0.08;

            const feedbackGain = this.audioContext.createGain();
            feedbackGain.gain.value = 0.3;

            // 连接节点
            mainOsc.connect(mainGain);
            mainGain.connect(this.audioContext.destination);
            mainGain.connect(delayNode);
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode);
            delayNode.connect(this.audioContext.destination);

            harmonicOsc.connect(harmonicGain);
            harmonicGain.connect(this.audioContext.destination);

            // 播放
            mainOsc.start(now);
            mainOsc.stop(now + 0.6);
            harmonicOsc.start(now);
            harmonicOsc.stop(now + 0.6);
        } catch (error) {
            console.warn('播放揭晓音效失败:', error);
        }
    },

    // ========== 完卦终鸣音效 ==========
    async playCompleteSound() {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            await this.resume();

            const now = this.audioContext.currentTime;

            // 三度和弦：C4(261Hz) + E4(329Hz) + G4(392Hz)
            const frequencies = [261, 329, 392];
            const harmonicFreqs = frequencies.map(f => f * 2);

            // 第一击（主音）
            frequencies.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

                osc.connect(gain);
                gain.connect(this.audioContext.destination);

                osc.start(now);
                osc.stop(now + 0.4);
            });

            // 余韵层（泛音）
            setTimeout(() => {
                if (!this.audioContext) return;

                const now2 = this.audioContext.currentTime;

                harmonicFreqs.forEach(freq => {
                    const osc = this.audioContext.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now2);

                    const gain = this.audioContext.createGain();
                    gain.gain.setValueAtTime(0.05, now2);
                    gain.gain.exponentialRampToValueAtTime(0.001, now2 + 1.2);

                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);

                    osc.start(now2);
                    osc.stop(now2 + 1.2);
                });
            }, 400);
        } catch (error) {
            console.warn('播放完卦音效失败:', error);
        }
    },

    // ========== 切换主题音效 ==========
    playThemeSwitchSound() {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            this.resume();

            const now = this.audioContext.currentTime;

            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (error) {
            console.warn('播放切换音效失败:', error);
        }
    }
};

// 导出到全局
window.AudioController = AudioController;
