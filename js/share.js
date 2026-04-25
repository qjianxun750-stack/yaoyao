// ========== 分享图生成控制器（Canvas绘制）==========
const ShareController = {
    // 生成单骰分享图
    generateSingleShare(diceName, result, themeColor) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置尺寸（750×1000px，3:4竖版）
        canvas.width = 750;
        canvas.height = 1000;

        // 背景渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, themeColor);
        gradient.addColorStop(1, this.adjustColor(themeColor, -30));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加噪点纹理
        this.drawNoise(ctx, canvas.width, canvas.height);

        // 顶部信息
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = '18px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
        ctx.fillText(dateStr, canvas.width / 2, 80);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '16px -apple-system, sans-serif';
        ctx.fillText(diceName, canvas.width / 2, 110);

        // 中部核心区
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 50;

        // 超大emoji
        ctx.font = '120px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(result.emoji, centerX, centerY - 80);

        // 结果词
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 56px -apple-system, "PingFang SC", sans-serif';
        ctx.fillText(result.word, centerX, centerY + 50);

        // 分割线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, centerY + 120);
        ctx.lineTo(centerX + 100, centerY + 120);
        ctx.stroke();

        // 底部解读
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '22px -apple-system, sans-serif';
        this.wrapText(ctx, result.desc, centerX, centerY + 180, 600, 32);

        // 底部品牌
        const footerY = canvas.height - 100;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '18px -apple-system, sans-serif';
        ctx.fillText('🎲 情绪骰子', centerX, footerY);
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('emotion-dice.vercel.app', centerX, footerY + 30);

        return canvas.toDataURL('image/png');
    },

    // 生成一卦分享图
    generateComboShare(comboName, yaosResults, guaText, themeColor) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 750;
        canvas.height = 1000;

        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, themeColor);
        gradient.addColorStop(1, this.adjustColor(themeColor, -30));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 噪点纹理
        this.drawNoise(ctx, canvas.width, canvas.height);

        // 顶部标题
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 28px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText(comboName, canvas.width / 2, 80);

        // 三爻位（纵向排列）
        let currentY = 150;
        const yaoLabels = ['因', '态', '果'];

        yaosResults.forEach((yao, index) => {
            // 爻位卡片背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            const cardY = currentY;
            const cardHeight = 100;
            this.roundRect(ctx, 50, cardY, 650, cardHeight, 16);
            ctx.fill();

            // 边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // 标签
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '16px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(yaoLabels[index], 80, cardY + cardHeight / 2);

            // Emoji
            ctx.font = '48px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(yao.emoji, canvas.width / 2, cardY + cardHeight / 2);

            // 结果词
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 32px "Noto Serif SC", serif';
            ctx.textAlign = 'right';
            ctx.fillText(yao.word, 670, cardY + cardHeight / 2);

            currentY += cardHeight + 25;
        });

        // 卦辞
        const guaY = currentY + 40;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        this.roundRect(ctx, 50, guaY, 650, 120, 16);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        this.wrapText(ctx, guaText, canvas.width / 2, guaY + 40, 600, 32);

        // 底部品牌
        const footerY = canvas.height - 80;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '18px -apple-system, sans-serif';
        ctx.fillText('🎲 情绪骰子', canvas.width / 2, footerY);
        ctx.font = '14px -apple-system, sans-serif';
        ctx.fillText('emotion-dice.vercel.app', canvas.width / 2, footerY + 30);

        return canvas.toDataURL('image/png');
    },

    // ========== 辅助方法 ==========

    // 绘制噪点纹理
    drawNoise(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 20;
            data[i] += noise;
            data[i + 1] += noise;
            data[i + 2] += noise;
        }

        ctx.putImageData(imageData, 0, 0);
    },

    // 调整颜色亮度
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    },

    // 绘制圆角矩形
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    // 文字换行
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i];
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    },

    // 统一显示入口
    show(config, result, extra = {}) {
        let imageDataUrl;
        if (config.type === 'combo') {
            imageDataUrl = this.generateComboShare(
                config.name, 
                extra.yaosResults || [], 
                result.desc, 
                config.color
            );
        } else {
            imageDataUrl = this.generateSingleShare(config.name, result, config.color);
        }
        
        if (imageDataUrl) {
            this.showShareModal(imageDataUrl);
        }
    },

    // 显示分享弹窗
    showShareModal(imageDataUrl) {
        const modal = document.getElementById('shareModal');
        const preview = document.getElementById('sharePreview');

        if (preview) {
            preview.innerHTML = `<img src="${imageDataUrl}" style="width: 100%; display: block;" />`;
        }
        if (modal) {
            modal.classList.add('visible');
        }
    },

    // 关闭分享弹窗
    closeShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.classList.remove('visible');
        }
    },

    // 下载图片
    downloadImage(imageDataUrl, filename = 'emotion-dice-share.png') {
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = filename;
        link.click();
    },

    // 复制图片到剪贴板
    async copyImage(imageDataUrl) {
        try {
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            this.showToast('图片已复制到剪贴板');
        } catch (error) {
            console.error('复制图片失败:', error);
            this.showToast('复制失败，请长按图片保存');
        }
    },

    // 显示Toast提示
    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

// 导出到全局
window.ShareController = ShareController;
