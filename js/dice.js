// ========== 3D骰子动画控制器 ==========
const DiceController = {
    currentDice: null,
    currentResult: null,
    isRolling: false,

    // 六个面的最终朝向（在1800度基础上叠加）
    finalRotations: [
        { rx: 1800, ry: 1800 },   // face 0 (前)
        { rx: 1800, ry: 1980 },   // face 1 (后)
        { rx: 1800, ry: 1890 },   // face 2 (左)
        { rx: 1800, ry: 1710 },   // face 3 (右)
        { rx: 1890, ry: 1800 },   // face 4 (上) - 修正：rotateX(90) 显示顶部面
        { rx: 1710, ry: 1800 }    // face 5 (下) - 修正：rotateX(-90) 显示底部面
    ],

    // 初始化骰子DOM
    initDice(diceContainer) {
        const diceHTML = `
            <div class="dice-glow"></div>
            <div class="dice-3d idle">
                <div class="face face-front" data-face="0">
                    <span class="face-emoji">🎲</span>
                    <span class="face-word">?</span>
                </div>
                <div class="face face-back" data-face="1">
                    <span class="face-emoji">🎲</span>
                    <span class="face-word">?</span>
                </div>
                <div class="face face-left" data-face="2">
                    <span class="face-emoji">🎲</span>
                    <span class="face-word">?</span>
                </div>
                <div class="face face-right" data-face="3">
                    <span class="face-emoji">🎲</span>
                    <span class="face-word">?</span>
                </div>
                <div class="face face-top" data-face="4">
                    <span class="face-emoji">🎲</span>
                    <span class="face-word">?</span>
                </div>
                <div class="face face-bottom" data-face="5">
                    <span class="face-emoji">🎲</span>
                    <span class="face-word">?</span>
                </div>
            </div>
        `;

        diceContainer.innerHTML = diceHTML;

        // 确保骰子容器有正确的类
        diceContainer.classList.add('dice-scene');

        return diceContainer.querySelector('.dice-3d');
    },

    // 更新骰子面的内容
    updateDiceFaces(dice, diceConfig, result, targetFaceIndex) {
        const faces = dice.querySelectorAll('.face');
        faces.forEach((face, index) => {
            const emojiEl = face.querySelector('.face-emoji');
            const wordEl = face.querySelector('.face-word');

            if (index === targetFaceIndex) {
                // 这个面是最终要展示给用户的，必须精准匹配结果
                emojiEl.textContent = result.emoji;
                wordEl.textContent = result.word;
            } else {
                // 其他面随机填充，增加真实感
                const randomFace = diceConfig.faces[Math.floor(Math.random() * diceConfig.faces.length)];
                emojiEl.textContent = randomFace.emoji;
                wordEl.textContent = randomFace.word;
            }
        });
    },

    // 仅刷新骰子面内容（用于切换主题时）
    refreshDiceFaces(dice, diceConfig) {
        if (!dice || !diceConfig || !diceConfig.faces) return;

        const faces = dice.querySelectorAll('.face');
        faces.forEach((face, index) => {
            // 如果配置的faces少于6个，循环使用
            const faceData = diceConfig.faces[index % diceConfig.faces.length];
            const emojiEl = face.querySelector('.face-emoji');
            const wordEl = face.querySelector('.face-word');

            if (emojiEl) emojiEl.textContent = faceData.emoji;
            if (wordEl) wordEl.textContent = faceData.word;
        });
    },

    // 摇骰子（单骰模式）
    async rollSingleDice(diceConfig, callback) {
        if (this.isRolling) return;

        this.isRolling = true;
        const diceScene = document.getElementById('diceScene');
        if (!diceScene) {
            this.isRolling = false;
            return;
        }
        const dice = diceScene.querySelector('.dice-3d');
        if (!dice) {
            this.isRolling = false;
            return;
        }

        // 随机选择结果
        const resultIndex = Math.floor(Math.random() * diceConfig.faces.length);
        const result = diceConfig.faces[resultIndex];

        // 确定展示的面（物理索引 0-5）
        const targetFaceIndex = resultIndex % 6;

        // 更新骰子内容
        this.updateDiceFaces(dice, diceConfig, result, targetFaceIndex);

        // 播放摇骰音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playRollSound();
        }

        // 移除状态
        dice.classList.remove('idle', 'landing');

        // 设置最终旋转角度（与 targetFaceIndex 对应）
        const finalRotation = this.finalRotations[targetFaceIndex];
        dice.style.setProperty('--rx', `${finalRotation.rx}deg`);
        dice.style.setProperty('--ry', `${finalRotation.ry}deg`);

        // 执行rolling动画
        dice.classList.add('rolling');

        // 等待动画完成（3秒）
        setTimeout(() => {
            // 添加landing动画
            dice.classList.remove('rolling');
            dice.classList.add('landing');

            // landing完成后（0.5秒）
            setTimeout(() => {
                dice.classList.add('idle');

                // 播放揭晓音效
                if (typeof AudioController !== 'undefined') {
                    AudioController.playRevealSound(0);
                }

                // 触发粒子效果
                this.createParticles(diceScene, diceConfig.color);

                // 记录统计
                if (typeof GlobalStatsController !== 'undefined') {
                    GlobalStatsController.recordRoll(diceConfig.name, diceConfig.id, result);
                }

                this.isRolling = false;

                // 回调
                if (callback) callback(result);
            }, 500);
        }, 3000);
    },

    // ========== 一卦模式骰子 ==========

    // 初始化多个骰子（用于一卦模式）
    initMultiDice(container, count = 3) {
        container.innerHTML = '';
        const diceElements = [];
        
        for (let i = 0; i < count; i++) {
            const diceScene = document.createElement('div');
            diceScene.className = 'dice-scene';
            diceScene.id = `diceScene-${i}`;
            
            const diceHTML = `
                <div class="dice-glow"></div>
                <div class="dice-3d idle">
                    <div class="face face-front" data-face="0"><span class="face-emoji">🎲</span><span class="face-word">?</span></div>
                    <div class="face face-back" data-face="1"><span class="face-emoji">🎲</span><span class="face-word">?</span></div>
                    <div class="face face-left" data-face="2"><span class="face-emoji">🎲</span><span class="face-word">?</span></div>
                    <div class="face face-right" data-face="3"><span class="face-emoji">🎲</span><span class="face-word">?</span></div>
                    <div class="face face-top" data-face="4"><span class="face-emoji">🎲</span><span class="face-word">?</span></div>
                    <div class="face face-bottom" data-face="5"><span class="face-emoji">🎲</span><span class="face-word">?</span></div>
                </div>
            `;
            diceScene.innerHTML = diceHTML;
            container.appendChild(diceScene);
            diceElements.push(diceScene.querySelector('.dice-3d'));
        }
        
        return diceElements;
    },

    // 同时摇多个骰子
    async rollMultiDice(diceElements, comboConfig, results, callback) {
        if (this.isRolling) return;
        this.isRolling = true;

        // 播放摇骰音效
        if (typeof AudioController !== 'undefined') {
            AudioController.playRollSound();
        }

        diceElements.forEach((dice, i) => {
            const result = results[i];
            const resultIndex = Math.floor(Math.random() * 6); // 物理位置随机
            
            // 更新该骰子的内容
            this.updateDiceFaces(dice, comboConfig.yaos[i], result, resultIndex);

            // 移除状态
            dice.classList.remove('idle', 'landing');

            // 设置旋转
            const finalRotation = this.finalRotations[resultIndex];
            dice.style.setProperty('--rx', `${finalRotation.rx}deg`);
            dice.style.setProperty('--ry', `${finalRotation.ry}deg`);

            // 启动动画
            dice.classList.add('rolling');
        });

        // 等待所有骰子动画完成
        setTimeout(() => {
            diceElements.forEach((dice, i) => {
                dice.classList.remove('rolling');
                dice.classList.add('landing');
                
                setTimeout(() => {
                    dice.classList.add('idle');
                    
                    // 最后一个骰子落地后触发后续
                    if (i === diceElements.length - 1) {
                        if (typeof AudioController !== 'undefined') {
                            AudioController.playRevealSound(0);
                        }
                        this.isRolling = false;
                        if (callback) callback();
                    }
                }, 500);
            });
        }, 3000);
    },

    // ========== 粒子效果 ==========
    createParticles(diceScene, color) {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const rect = diceScene.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 主粒子（8个）
        for (let i = 0; i < 8; i++) {
            this.createParticle(particlesContainer, centerX, centerY, {
                size: 8 + Math.random() * 6,
                color: color,
                distance: 120 + Math.random() * 80,
                duration: 0.8 + Math.random() * 0.2
            });
        }

        // 星星粒子（6个）
        for (let i = 0; i < 6; i++) {
            this.createParticle(particlesContainer, centerX, centerY, {
                size: 6 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#FFFFFF' : '#FFD700',
                distance: 60 + Math.random() * 60,
                duration: 0.8 + Math.random() * 0.2,
                isStar: true
            });
        }

        // 碎屑粒子（8个）
        for (let i = 0; i < 8; i++) {
            const colors = ['#FFFFFF', '#FFD700', color];
            this.createParticle(particlesContainer, centerX, centerY, {
                size: 2 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                distance: 40 + Math.random() * 60,
                duration: 0.5 + Math.random() * 0.2
            });
        }
    },

    createParticle(container, x, y, options) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = options.size || 10;
        const angle = Math.random() * Math.PI * 2;
        const distance = options.distance || 100;

        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${options.color};
            border-radius: ${options.isStar ? '0' : '50%'};
            ${options.isStar ? 'clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);' : ''}
        `;

        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        particle.style.animationDuration = `${options.duration}s`;

        container.appendChild(particle);

        // 动画结束后移除
        setTimeout(() => {
            particle.remove();
        }, options.duration * 1000);
    },

    // ========== Confetti效果（完卦时）==========
    createConfetti(color) {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const colors = [color, '#FFFFFF', '#FFD700'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'particle';

            const x = Math.random() * window.innerWidth;
            const size = 2 + Math.random() * 4;

            confetti.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: -20px;
                width: ${size * 3}px;
                height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 2px;
                animation: confetti-fall ${1.5 + Math.random()}s ease-out forwards;
            `;

            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

            particlesContainer.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, 2500);
        }
    }
};

// 导出到全局
window.DiceController = DiceController;
