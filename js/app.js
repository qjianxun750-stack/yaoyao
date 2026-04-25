// ========== 主应用控制器 ==========
const App = {
    // 状态
    state: {
        mode: 'single',        // single | combo
        currentDice: 0,        // 当前选中的骰子索引
        currentCombo: 0,       // 当前选中的组合索引
        currentYao: 0,         // 当前起到的爻数
        comboResults: [],      // 组合模式的结果
        isRolling: false
    },

    // 初始化
    init() {
        console.log('情绪骰子 v2.0 初始化...');

        // 初始化统计系统
        if (typeof GlobalStatsController !== 'undefined') {
            GlobalStatsController.init();
        }

        // 初始化音效系统
        if (typeof AudioController !== 'undefined') {
            AudioController.init();
        }

        // 加载保存的状态
        this.loadState();

        // 初始化UI
        this.initUI();

        // 初始化组合骰子
        this.initComboDice();

        // 绑定事件
        this.bindEvents();

        console.log('情绪骰子 v2.0 初始化完成');
    },

    // 初始化UI
    initUI() {
        // 渲染单骰主题选择器
        this.renderThemeSelector();

        // 渲染组合选择器
        this.renderComboSelector();

        // 初始化骰子
        this.initSingleDice();

        // 初始化组合骰子区域
        this.initComboDice();

        // 延迟应用主题，确保DOM已加载
        setTimeout(() => {
            this.applyTheme(DICE_CONFIG[this.state.currentDice].color);
        }, 100);

        // 显示当前模式
        this.switchMode(this.state.mode);
    },

    // 渲染单骰主题选择器
    renderThemeSelector() {
        const container = document.getElementById('themeChips');
        if (!container) return;

        // 只显示单骰子
        const singleDice = DICE_CONFIG.filter(dice => dice.type !== 'combo');

        const html = singleDice.map((dice, index) => {
            const originalIndex = DICE_CONFIG.findIndex(d => d.id === dice.id);
            return `
                <button class="chip ${originalIndex === this.state.currentDice ? 'active' : ''}"
                        data-dice-index="${originalIndex}"
                        onclick="App.selectDice(${originalIndex})">
                    ${dice.name}
                </button>
            `;
        }).join('');

        container.innerHTML = html;
    },

    // 渲染组合选择器
    renderComboSelector() {
        const container = document.getElementById('comboSelector');
        if (!container) return;

        const html = COMBO_CONFIG.map((combo, index) => `
            <button class="chip ${index === this.state.currentCombo ? 'active' : ''}"
                    data-combo-index="${index}"
                    onclick="App.selectCombo(${index})">
                ${combo.name}
            </button>
        `).join('');

        container.innerHTML = html;
    },

    // 初始化单骰子
    initSingleDice() {
        const diceContainer = document.getElementById('diceScene');
        if (!diceContainer) return;

        // 确保容器有正确的类
        diceContainer.classList.add('dice-scene');

        if (typeof DiceController !== 'undefined') {
            const diceEl = DiceController.initDice(diceContainer);
            // 初始也刷新一下文案
            const diceConfig = DICE_CONFIG[this.state.currentDice];
            DiceController.refreshDiceFaces(diceEl, diceConfig);
        }
    },

    // 初始化组合骰子
    initComboDice() {
        const comboContainer = document.getElementById('comboDiceContainer');
        if (!comboContainer) return;

        if (typeof DiceController !== 'undefined') {
            this.state.comboDiceElements = DiceController.initMultiDice(comboContainer, 3);
            
            // 初始也给每个骰子随机填充一些面，确保 3D 立体感
            const combo = COMBO_CONFIG[this.state.currentCombo];
            this.state.comboDiceElements.forEach((dice, i) => {
                DiceController.refreshDiceFaces(dice, combo.yaos[i]);
            });
        }
    },

    // 更新爻位卡片显示
    updateYaoCards() {
        const combo = COMBO_CONFIG[this.state.currentCombo];
        const container = document.getElementById('yaoCardsContainer');
        if (!container) return;

        const html = combo.yaos.map((yao, index) => {
            const result = this.state.comboResults[index];
            const isRevealed = index < this.state.currentYao;
            const isActive = index === this.state.currentYao;

            return `
                <div class="yao-row ${isRevealed ? 'revealed' : ''} ${isActive ? 'active' : ''}">
                    <div class="yao-badge">${index + 1}</div>
                    <div class="yao-box">
                        ${isRevealed ? `
                            <span class="yao-emoji">${result.emoji}</span>
                            <div class="yao-info">
                                <div class="yao-name">${yao.name}</div>
                                <div class="yao-word">${result.word}</div>
                            </div>
                        ` : `
                            <span class="yao-placeholder">待揭晓</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // 更新起卦按钮
        this.updateYaoButton();
    },

    // ========== 事件绑定 ==========

    bindEvents() {
        // 模式切换
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.switchMode(mode);
            });
        });

        // 音效开关
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                if (typeof AudioController !== 'undefined') {
                    const isEnabled = AudioController.toggle();
                    soundToggle.textContent = isEnabled ? '🔊' : '🔇';
                }
            });
        }

        // 单骰摇动按钮
        const rollButton = document.getElementById('rollBtn');
        if (rollButton) {
            rollButton.addEventListener('click', () => {
                this.rollSingleDice();
            });
        }

        // 组合模式起卦按钮
        const yaoButton = document.getElementById('yaoButton');
        if (yaoButton) {
            yaoButton.addEventListener('click', () => {
                this.rollComboDice();
            });
        }

        // 组合模式重置按钮
        const resetComboBtn = document.getElementById('resetComboBtn');
        if (resetComboBtn) {
            resetComboBtn.addEventListener('click', () => {
                this.resetCombo();
            });
        }

        // 骰子点击（也可触发摇动）
        const diceScene = document.getElementById('diceScene');
        if (diceScene) {
            diceScene.addEventListener('click', () => {
                if (!this.state.isRolling && this.state.mode === 'single') {
                    this.rollSingleDice();
                }
            });
        }

        // 分享弹窗关闭
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeShare();
                }
            });
        }

        const closeBtn = document.getElementById('shareModalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeShare();
            });
        }

        const closeShareBtn = document.getElementById('closeShareBtn');
        if (closeShareBtn) {
            closeShareBtn.addEventListener('click', () => {
                this.closeShare();
            });
        }
    },

    // ========== 模式切换 ==========

    switchMode(mode) {
        this.state.mode = mode;
        this.saveState();

        // 更新Tab样式
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // 切换面板
        const singlePanel = document.getElementById('single-panel');
        const comboPanel = document.getElementById('combo-panel');
        
        if (singlePanel) singlePanel.style.display = mode === 'single' ? 'block' : 'none';
        if (comboPanel) comboPanel.style.display = mode === 'combo' ? 'block' : 'none';

        // 播放切换音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playThemeSwitchSound();
        }
    },

    // ========== 单骰模式 ==========

    selectDice(index) {
        if (this.state.isRolling) return;

        this.state.currentDice = index;
        this.saveState();

        // 更新UI
        document.querySelectorAll('#themeChips .chip').forEach((chip) => {
            const chipIndex = parseInt(chip.dataset.diceIndex);
            chip.classList.toggle('active', chipIndex === index);
        });

        // 应用主题
        const diceConfig = DICE_CONFIG[index];
        this.applyTheme(diceConfig.color);

        // 更新骰子面文案
        const diceEl = document.querySelector('#diceScene .dice-3d');
        if (diceEl && typeof DiceController !== 'undefined') {
            DiceController.refreshDiceFaces(diceEl, diceConfig);
        }

        // 播放切换音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playThemeSwitchSound();
        }

        // 重置结果卡
        this.hideResultCard();
    },

    applyTheme(color) {
        // 更新CSS变量
        document.documentElement.style.setProperty('--tc', color);
        document.documentElement.style.setProperty('--tc-glow', color + '55');

        // 更新骰子面的背景色
        const diceFaces = document.querySelectorAll('.face');
        diceFaces.forEach(face => {
            // 设置半透明的主题色背景
            face.style.background = `linear-gradient(145deg, ${color}38, ${color}22)`;
            face.style.borderColor = color;
        });

        // 更新环境光背景
        const ambient = document.querySelector('.ambient');
        if (ambient) {
            ambient.style.background = `
                radial-gradient(ellipse 60% 50% at 50% 0%, ${color}33 0%, transparent 70%),
                radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0,0,0,0.13) 0%, transparent 60%)
            `;
        }

        // 更新摇骰按钮颜色
        const rollButton = document.getElementById('rollBtn');
        if (rollButton) {
            rollButton.style.background = `linear-gradient(135deg, ${color}, ${this.adjustColor(color, -30)})`;
            rollButton.style.boxShadow = `0 8px 25px ${color}55`;
        }
    },

    // 调整颜色亮度的辅助方法
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
    },

    rollSingleDice() {
        if (this.state.isRolling) return;

        this.state.isRolling = true;
        const dice = DICE_CONFIG[this.state.currentDice];

        // 隐藏旧结果
        this.hideResultCard();

        if (typeof DiceController !== 'undefined') {
            DiceController.rollSingleDice(dice, (result) => {
                this.state.lastResult = result; // 保存结果供分享使用
                this.showResultCard(result);
                this.state.isRolling = false;
                this.saveState();
            });
        } else {
            // 降级方案
            const randomIndex = Math.floor(Math.random() * dice.faces.length);
            const result = dice.faces[randomIndex];
            setTimeout(() => {
                this.state.lastResult = result;
                this.showResultCard(result);
                this.state.isRolling = false;
            }, 1000);
        }
    },

    showResultCard(result) {
        const resultCard = document.getElementById('resultCard');
        if (!resultCard) return;

        // 填充内容而非重写 HTML
        const emojiEl = document.getElementById('resultEmoji');
        const wordEl = document.getElementById('resultWord');
        const descEl = document.getElementById('resultDesc');
        const dateEl = document.getElementById('resultDate');
        const qrEl = document.getElementById('resultQRCode');

        if (emojiEl) emojiEl.textContent = result.emoji;
        if (wordEl) wordEl.textContent = result.word;
        if (descEl) descEl.textContent = result.desc;
        
        const today = new Date();
        const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        if (dateEl) dateEl.textContent = dateStr;

        // 生成二维码
        if (qrEl && typeof QRCode !== 'undefined') {
            qrEl.innerHTML = '';
            new QRCode(qrEl, {
                text: window.location.href,
                width: 80,
                height: 80
            });
        }

        resultCard.classList.add('visible');

        // 自动平滑滚动到结果卡片，确保用户能立即看到
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    },

    hideResultCard() {
        const resultCard = document.getElementById('resultCard');
        if (resultCard) {
            resultCard.classList.remove('visible');
        }
    },

    // ========== 组合模式 ==========

    selectCombo(index) {
        if (this.state.isRolling) return;

        this.state.currentCombo = index;
        this.resetComboState();
        this.saveState();

        // 更新UI
        document.querySelectorAll('#comboSelector .chip').forEach((chip, i) => {
            chip.classList.toggle('active', i === index);
        });

        // 应用主题
        const combo = COMBO_CONFIG[index];
        this.applyTheme(combo.color);

        // 重置三个骰子的内容为各面的文字，确保 3D 立体感
        if (this.state.comboDiceElements && typeof DiceController !== 'undefined') {
            this.state.comboDiceElements.forEach((dice, i) => {
                DiceController.refreshDiceFaces(dice, combo.yaos[i]);
            });
        }

        // 隐藏结果卡片
        const resultCard = document.getElementById('comboResultCard');
        if (resultCard) resultCard.classList.remove('visible');

        // 播放切换音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playThemeSwitchSound();
        }
    },

    rollComboDice() {
        if (this.state.isRolling) return;

        const combo = COMBO_CONFIG[this.state.currentCombo];
        
        // 随机产生三个结果
        const results = combo.yaos.map(yao => {
            const idx = Math.floor(Math.random() * yao.faces.length);
            return yao.faces[idx];
        });

        this.state.isRolling = true;
        this.state.comboResults = results;

        // 隐藏结果卡片
        const resultCard = document.getElementById('comboResultCard');
        if (resultCard) resultCard.classList.remove('visible');

        if (typeof DiceController !== 'undefined' && this.state.comboDiceElements) {
            DiceController.rollMultiDice(this.state.comboDiceElements, combo, results, () => {
                this.state.isRolling = false;
                this.showComboResult();
                this.saveState();
            });
        }
    },

    showComboResult() {
        const combo = COMBO_CONFIG[this.state.currentCombo];
        const comboResult = this.generateComboResult(combo, this.state.comboResults);

        // 显示结果卡片
        const resultCard = document.getElementById('comboResultCard');
        if (resultCard) {
            resultCard.classList.add('visible');

            // 自动平滑滚动到结果卡片
            setTimeout(() => {
                resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

            // 填充日期
            const dateEl = document.getElementById('comboResultDate');
            if (dateEl) dateEl.textContent = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

            // 填充三个结果项
            const groupEl = document.getElementById('comboResultGroup');
            if (groupEl) {
                groupEl.innerHTML = this.state.comboResults.map((res, i) => `
                    <div class="combo-result-item">
                        <div class="combo-result-label">${combo.yaos[i].name}</div>
                        <div class="combo-result-emoji">${res.emoji}</div>
                        <div class="combo-result-word">${res.word}</div>
                    </div>
                `).join('');
            }

            // 填充总评描述
            const descEl = document.getElementById('comboResultDesc');
            if (descEl) descEl.textContent = comboResult.desc;

            // 生成二维码
            const qrEl = document.getElementById('comboResultQRCode');
            if (qrEl && typeof QRCode !== 'undefined') {
                qrEl.innerHTML = '';
                new QRCode(qrEl, {
                    text: window.location.href,
                    width: 80,
                    height: 80
                });
            }
        }
    },

    generateComboResult(combo, results) {
        let desc = '';
        if (combo.id === 'today-cause') {
            desc = `今日之卦：${results[0].word}的处境，${results[1].word}的面对，最终${results[2].word}。`;
        } else if (combo.id === 'three-questions') {
            desc = `三爻问心：此刻${results[0].word}，身处${results[1].word}，心里压着${results[2].word}。`;
        } else if (combo.id === 'find-direction') {
            desc = `摇个方向：${results[0].word}，但卡在${results[1].word}，建议${results[2].word}。`;
        } else if (combo.id === 'bubble-relationship') {
            desc = `泡沫关系：${results[0].word}，我${results[1].word}，建议${results[2].word}。`;
        }
        return { desc };
    },

    resetComboState() {
        this.state.comboResults = [];
    },

    resetCombo() {
        this.resetComboState();
        
        // 重置三个骰子的内容为各面的文字，确保 3D 立体感
        const combo = COMBO_CONFIG[this.state.currentCombo];
        if (this.state.comboDiceElements && typeof DiceController !== 'undefined') {
            this.state.comboDiceElements.forEach((dice, i) => {
                DiceController.refreshDiceFaces(dice, combo.yaos[i]);
            });
        }

        const resultCard = document.getElementById('comboResultCard');
        if (resultCard) resultCard.classList.remove('visible');
    },

    // ========== 分享功能 ==========

    shareResult() {
        if (typeof ShareController !== 'undefined') {
            const config = this.state.mode === 'single' ? 
                DICE_CONFIG[this.state.currentDice] : 
                COMBO_CONFIG[this.state.currentCombo];
            
            const result = this.state.mode === 'single' ?
                this.state.lastResult :
                { word: '今日之卦', emoji: '☯️', desc: this.generateComboResult(config, this.state.comboResults).desc };

            const extra = this.state.mode === 'combo' ? 
                { yaosResults: this.state.comboResults } : {};

            ShareController.show(config, result, extra);
        }
    },

    closeShare() {
        if (typeof ShareController !== 'undefined') {
            ShareController.closeShareModal();
        }
    },

    // ========== 状态管理 ==========

    saveState() {
        localStorage.setItem('diceAppState', JSON.stringify({
            mode: this.state.mode,
            currentDice: this.state.currentDice,
            currentCombo: this.state.currentCombo
        }));
    },

    loadState() {
        const saved = localStorage.getItem('diceAppState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.warn('加载状态失败:', e);
            }
        }
    }
};

// ========== 页面加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// 导出到全局
window.App = App;
