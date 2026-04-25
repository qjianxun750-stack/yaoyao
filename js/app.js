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
        const container = document.getElementById('themeSelector');
        if (!container) return;

        // 只显示单骰子（过滤掉type为combo的）
        const singleDice = DICE_CONFIG.filter(dice => dice.type !== 'combo');

        const html = singleDice.map((dice, index) => {
            // 获取原始索引
            const originalIndex = DICE_CONFIG.findIndex(d => d.id === dice.id);
            return `
                <button class="theme-capsule ${originalIndex === this.state.currentDice ? 'active' : ''}"
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
            <button class="theme-capsule ${index === this.state.currentCombo ? 'active' : ''}"
                    data-combo-index="${index}"
                    onclick="App.selectCombo(${index})">
                ${combo.name}
            </button>
        `).join('');

        container.innerHTML = html;
    },

    // 初始化单骰子
    initSingleDice() {
        const diceContainer = document.getElementById('singleDiceContainer');
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

    // 初始化组合骰子区域
    initComboDice() {
        // 初始化爻位卡片
        this.updateYaoCards();

        // 初始化一卦模式的骰子场景
        const comboDiceContainer = document.getElementById('comboDiceContainer');
        if (comboDiceContainer && typeof DiceController !== 'undefined') {
            DiceController.initDice(comboDiceContainer);
            comboDiceContainer.style.display = ''; // 显示骰子场景
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

            return `
                <div class="yao-card ${isRevealed ? 'revealed' : ''}">
                    <div class="yao-label">${yao.name}</div>
                    <div class="yao-content">
                        ${isRevealed ? `
                            <span class="yao-emoji">${result.emoji}</span>
                            <span class="yao-word">${result.word}</span>
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

    // 更新起卦按钮
    updateYaoButton() {
        const combo = COMBO_CONFIG[this.state.currentCombo];
        const button = document.getElementById('yaoButton');
        if (!button) return;

        if (this.state.currentYao >= 3) {
            // 完卦状态
            button.textContent = '✨ 完卦 · 生成分享';
            button.onclick = () => this.finishCombo();
        } else {
            const yao = combo.yaos[this.state.currentYao];
            button.textContent = `🎲 起${yao.name}爻`;
            button.onclick = () => this.rollYao();
        }
    },

    // ========== 事件绑定 ==========

    bindEvents() {
        // 模式切换
        document.querySelectorAll('.mode-tab').forEach(tab => {
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
        const rollButton = document.getElementById('rollButton');
        if (rollButton) {
            rollButton.addEventListener('click', () => {
                this.rollSingleDice();
            });
        }

        // 骰子点击（也可触发摇动）
        const diceScene = document.querySelector('.dice-scene');
        if (diceScene) {
            diceScene.addEventListener('click', () => {
                if (!this.state.isRolling) {
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
    },

    // ========== 模式切换 ==========

    switchMode(mode) {
        this.state.mode = mode;
        this.saveState();

        // 更新Tab样式
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        // 切换面板
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });

        if (mode === 'single') {
            document.getElementById('singlePanel').classList.add('active');
        } else {
            document.getElementById('comboPanel').classList.add('active');
        }

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

        // 更新UI - 注意要使用原始索引来查找active元素
        document.querySelectorAll('#themeSelector .theme-capsule').forEach((capsule) => {
            const capsuleIndex = parseInt(capsule.dataset.diceIndex);
            capsule.classList.toggle('active', capsuleIndex === index);
        });

        // 应用主题
        const diceConfig = DICE_CONFIG[index];
        this.applyTheme(diceConfig.color);

        // 更新骰子面文案
        const diceEl = document.querySelector('#singleDiceContainer .dice-3d');
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
        const diceFaces = document.querySelectorAll('.dice-face');
        diceFaces.forEach(face => {
            // 设置半透明的主题色背景
            face.style.background = `linear-gradient(145deg, ${color}38, ${color}22)`;
            face.style.borderColor = color;
        });

        // 更新环境光背景
        const ambient = document.querySelector('.ambient-light');
        if (ambient) {
            ambient.style.background = `
                radial-gradient(ellipse 60% 50% at 50% 0%, ${color}33 0%, transparent 70%),
                radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0,0,0,0.13) 0%, transparent 60%)
            `;
        }

        // 更新摇骰按钮颜色
        const rollButton = document.getElementById('rollButton');
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
                this.showResultCard(result);
                this.state.isRolling = false;
            });
        } else {
            // 降级方案：直接显示结果
            const randomIndex = Math.floor(Math.random() * dice.faces.length);
            const result = dice.faces[randomIndex];
            setTimeout(() => {
                this.showResultCard(result);
                this.state.isRolling = false;
            }, 1000);
        }
    },

    showResultCard(result) {
        const resultCard = document.getElementById('resultCard');
        if (!resultCard) return;

        const dice = DICE_CONFIG[this.state.currentDice];

        resultCard.innerHTML = `
            <div class="result-header">🎲 ${dice.name}</div>
            <div class="result-main">
                <div class="result-emoji flip-in">${result.emoji}</div>
                <div class="result-word pulse">${result.word}</div>
            </div>
            <div class="result-desc">${result.desc}</div>
            <button class="generate-share-btn" onclick="App.generateShare()">
                📸 生成分享图
            </button>
        `;

        resultCard.classList.add('show');
    },

    hideResultCard() {
        const resultCard = document.getElementById('resultCard');
        if (resultCard) {
            resultCard.classList.remove('show');
        }
    },

    // ========== 组合模式 ==========

    selectCombo(index) {
        if (this.state.isRolling) return;

        this.state.currentCombo = index;
        this.state.currentYao = 0;
        this.state.comboResults = [];
        this.saveState();

        // 更新UI
        document.querySelectorAll('#comboSelector .theme-capsule').forEach((capsule, i) => {
            capsule.classList.toggle('active', i === index);
        });

        // 应用主题
        const combo = COMBO_CONFIG[index];
        this.applyTheme(combo.color);

        // 更新爻位卡片
        this.updateYaoCards();

        // 清空卦辞
        const guaText = document.getElementById('guaText');
        if (guaText) {
            guaText.innerHTML = '';
        }

        // 播放切换音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playThemeSwitchSound();
        }
    },

    rollYao() {
        if (this.state.isRolling) return;

        this.state.isRolling = true;
        const combo = COMBO_CONFIG[this.state.currentCombo];
        const yaoIndex = this.state.currentYao;

        // 显示骰子场景
        const comboDiceScene = document.querySelector('.combo-dice-scene');
        if (comboDiceScene) {
            comboDiceScene.style.display = 'block';
            comboDiceScene.style.opacity = '1';
            comboDiceScene.style.pointerEvents = 'auto';
        }

        if (typeof DiceController !== 'undefined') {
            DiceController.rollYao(combo, yaoIndex, (result, yaoConfig) => {
                this.state.comboResults.push(result);
                this.state.currentYao++;
                this.state.isRolling = false;
                this.saveState();

                // 更新爻位卡片
                this.updateYaoCards();

                // 更新卦辞
                this.updateGuaText();
            });
        } else {
            // 降级方案：直接显示结果
            const yao = combo.yaos[yaoIndex];
            const randomIndex = Math.floor(Math.random() * yao.faces.length);
            const result = yao.faces[randomIndex];

            setTimeout(() => {
                this.state.comboResults.push(result);
                this.state.currentYao++;
                this.state.isRolling = false;
                this.saveState();

                this.updateYaoCards();
                this.updateGuaText();

                // 隐藏骰子场景
                if (comboDiceScene) {
                    comboDiceScene.style.display = 'none';
                }
            }, 1000);
        }
    },

    updateGuaText() {
        const container = document.getElementById('guaText');
        if (!container) return;

        const combo = COMBO_CONFIG[this.state.currentCombo];
        const results = this.state.comboResults;

        if (combo.id === 'today-cause') {
            // 因态果
            const texts = results.map(r => r.word);
            container.innerHTML = `
                <div class="gua-line">因：${texts[0]}的处境</div>
                <div class="gua-line">态：${texts[1]}的面对</div>
                <div class="gua-line">果：${texts[2]}的结局</div>
            `;
        } else if (combo.id === 'life-destiny') {
            // 天人地
            const texts = results.map(r => r.word);
            container.innerHTML = `
                <div class="gua-line">天：${texts[0]}</div>
                <div class="gua-line">人：${texts[1]}</div>
                <div class="gua-line">地：${texts[2]}</div>
            `;
        }
    },

    finishCombo() {
        const combo = COMBO_CONFIG[this.state.currentCombo];

        // 播放完卦音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playCompleteSound();
        }

        // 触发confetti效果
        if (typeof DiceController !== 'undefined') {
            DiceController.createConfetti(combo.color);
        }

        // 生成卦辞总结
        const guaText = this.generateGuaSummary();

        // 更新卦辞显示
        const guaTextContainer = document.getElementById('guaText');
        if (guaTextContainer) {
            guaTextContainer.innerHTML = `<div class="gua-final">${guaText}</div>`;
        }

        // 延迟显示分享
        setTimeout(() => {
            this.generateComboShare();
        }, 1500);
    },

    generateGuaSummary() {
        const combo = COMBO_CONFIG[this.state.currentCombo];
        const results = this.state.comboResults;

        if (combo.id === 'today-cause') {
            return `今日之卦：${results[0].word}的处境，${results[1].word}的面对，最终${results[2].word}。`;
        } else if (combo.id === 'life-destiny') {
            return `人生一卦：天赐${results[0].word}，人谋${results[1].word}，地利${results[2].word}。`;
        }

        return '';
    },

    // ========== 分享功能 ==========

    generateShare() {
        const dice = DICE_CONFIG[this.state.currentDice];
        const resultCard = document.getElementById('resultCard');

        if (resultCard) {
            const emoji = resultCard.querySelector('.result-emoji').textContent;
            const word = resultCard.querySelector('.result-word').textContent;
            const desc = resultCard.querySelector('.result-desc').textContent;

            const result = { emoji, word, desc };

            if (typeof ShareController !== 'undefined') {
                const imageData = ShareController.generateSingleShare(
                    dice.name,
                    result,
                    dice.color
                );
                ShareController.showShareModal(imageData);
            }
        }
    },

    generateComboShare() {
        const combo = COMBO_CONFIG[this.state.currentCombo];
        const guaText = this.generateGuaSummary();

        if (typeof ShareController !== 'undefined') {
            const imageData = ShareController.generateComboShare(
                combo.name,
                this.state.comboResults,
                guaText,
                combo.color
            );
            ShareController.showShareModal(imageData);
        }

        // 记录分享统计
        if (typeof GlobalStatsController !== 'undefined') {
            GlobalStatsController.recordShare('image', combo.name, null);
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
