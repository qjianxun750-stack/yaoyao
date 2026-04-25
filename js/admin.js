// ========== 数据分析中心控制器 ==========

// 全局图表实例
let charts = {};

// 工具函数：格式化数字
function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

// 工具函数：格式化时间
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN');
}

// 工具函数：判断是否是今天
function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

// 工具函数：判断是否是本周
function isThisWeek(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo;
}

// 工具函数：获取时段名称
function getTimePeriodName(hour) {
    if (hour >= 5 && hour < 9) return '早晨';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚上';
    return '深夜';
}

// Chart.js 全局配置
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
Chart.defaults.color = '#666';
Chart.defaults.plugins.legend.display = false;

// ========== 核心指标 ==========

async function updateMetrics() {
    try {
        const stats = await GlobalStatsController.getStats();
        const overview = await GlobalStatsController.getOverview();

        // 今日摇骰次数
        const todayRolls = stats.diceRolls ? Object.values(stats.diceRolls).reduce((sum, val) => {
            if (typeof val === 'object') return sum + (val.count || 0);
            return sum + val;
        }, 0) : 0;

        document.getElementById('todayRolls').textContent = formatNumber(todayRolls);
        document.getElementById('totalRollsChange').textContent = `总计: ${formatNumber(overview.totalRolls || 0)}`;

        // 今日分享次数
        const todayShares = await getTodayShares();
        document.getElementById('todayShares').textContent = formatNumber(todayShares);
        document.getElementById('totalSharesChange').textContent = `总计: ${formatNumber(overview.totalShares || 0)}`;

        // 独立访客数
        document.getElementById('uniqueVisitors').textContent = formatNumber(overview.uniqueVisitors || 0);

        // 分享转化率
        const shareRate = overview.shareRate || 0;
        document.getElementById('shareRate').textContent = shareRate + '%';

    } catch (error) {
        console.error('更新核心指标失败:', error);
    }
}

async function getTodayShares() {
    try {
        const shares = await SupabaseClient.select('shares');
        if (!shares) return 0;
        return shares.filter(s => isToday(s.created_at)).length;
    } catch (error) {
        return 0;
    }
}

// ========== 图表：近7天趋势 ==========

async function updateTrendChart() {
    try {
        const rolls = await SupabaseClient.select('dice_rolls');
        const shares = await SupabaseClient.select('shares');

        if (!rolls || !shares) return;

        // 生成近7天的日期
        const days = [];
        const rollCounts = [];
        const shareCounts = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));

            const dayRolls = rolls.filter(r => r.created_at && r.created_at.startsWith(dateStr));
            const dayShares = shares.filter(s => s.created_at && s.created_at.startsWith(dateStr));

            rollCounts.push(dayRolls.length);
            shareCounts.push(dayShares.length);
        }

        const ctx = document.getElementById('trendChart').getContext('2d');

        if (charts.trend) charts.trend.destroy();

        charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: '摇骰次数',
                        data: rollCounts,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '分享次数',
                        data: shareCounts,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新趋势图失败:', error);
    }
}

// ========== 图表：单骰 vs 一卦 ==========

async function updateModeChart() {
    try {
        const comparison = await GlobalStatsController.getModeComparison();

        const ctx = document.getElementById('modeChart').getContext('2d');

        if (charts.mode) charts.mode.destroy();

        charts.mode = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['单骰模式', '一卦模式'],
                datasets: [{
                    data: [comparison.single || 0, comparison.combo || 0],
                    backgroundColor: ['#667eea', '#764ba2'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${formatNumber(value)} 次 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新模式图失败:', error);
    }
}

// ========== 图表：8个一卦模式排名 ==========

async function updateComboChart() {
    try {
        const comboStats = await GlobalStatsController.getComboModeStats();
        const comboNames = Object.keys(comboStats);
        const comboValues = comboNames.map(name => comboStats[name].count || 0);

        const ctx = document.getElementById('comboChart').getContext('2d');

        if (charts.combo) charts.combo.destroy();

        charts.combo = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: comboNames,
                datasets: [{
                    data: comboValues,
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新一卦模式图失败:', error);
    }
}

// ========== 图表：24小时热力分布 ==========

async function updateHourlyChart() {
    try {
        const timeStats = await GlobalStatsController.getTimePeriodStats();

        if (!timeStats || !timeStats.hourly) return;

        const hours = timeStats.hourly.map(h => `${h.hour}:00`);
        const counts = timeStats.hourly.map(h => h.count);

        const ctx = document.getElementById('hourlyChart').getContext('2d');

        if (charts.hourly) charts.hourly.destroy();

        charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: hours,
                datasets: [{
                    data: counts,
                    backgroundColor: '#667eea',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新24小时图失败:', error);
    }
}

// ========== 转化漏斗 ==========

async function updateFunnel() {
    try {
        const funnel = await GlobalStatsController.getConversionFunnel();

        const container = document.getElementById('funnelContainer');
        container.innerHTML = `
            <div class="funnel-step">
                <div class="funnel-number">${formatNumber(funnel.visitors || 0)}</div>
                <div class="funnel-label">👥 访问</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
                <div class="funnel-number">${formatNumber(funnel.rolls || 0)}</div>
                <div class="funnel-label">🎲 摇骰</div>
                <div class="funnel-rate">${funnel.visitToRollRate}%</div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-step">
                <div class="funnel-number">${formatNumber(funnel.shares || 0)}</div>
                <div class="funnel-label">📤 分享</div>
                <div class="funnel-rate">${funnel.rollToShareRate}%</div>
            </div>
        `;

    } catch (error) {
        console.error('更新转化漏斗失败:', error);
    }
}

// ========== 图表：时段分布 ==========

async function updateTimePeriodChart() {
    try {
        const timeStats = await GlobalStatsController.getTimePeriodStats();

        if (!timeStats || !timeStats.timePeriods) return;

        const periods = timeStats.timePeriods.map(p => p.hour);
        const counts = timeStats.timePeriods.map(p => p.count);

        const ctx = document.getElementById('timePeriodChart').getContext('2d');

        if (charts.timePeriod) charts.timePeriod.destroy();

        charts.timePeriod = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: periods,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#fee140', '#43e97b', '#4facfe',
                        '#667eea', '#764ba2', '#f093fb'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新时段图失败:', error);
    }
}

// ========== 图表：工作日 vs 周末 ==========

async function updateWeekendChart() {
    try {
        const weekendStats = await GlobalStatsController.getWeekendStats();

        const ctx = document.getElementById('weekendChart').getContext('2d');

        if (charts.weekend) charts.weekend.destroy();

        charts.weekend = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['工作日', '周末'],
                datasets: [{
                    data: [weekendStats.weekday || 0, weekendStats.weekend || 0],
                    backgroundColor: ['#667eea', '#28a745'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${formatNumber(value)} 次 (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新周末图失败:', error);
    }
}

// ========== 图表：TOP10 热门签文 ==========

async function updateTopResultsChart() {
    try {
        const topResults = await GlobalStatsController.getTopResults(10);

        if (!topResults || topResults.length === 0) return;

        const labels = topResults.map(r => `${r.emoji} ${r.word}`);
        const counts = topResults.map(r => r.count);

        const ctx = document.getElementById('topResultsChart').getContext('2d');

        if (charts.topResults) charts.topResults.destroy();

        charts.topResults = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: '#667eea',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('更新热门签文图失败:', error);
    }
}

// ========== 最新记录表格 ==========

async function updateRecentRolls() {
    try {
        const rolls = await SupabaseClient.select('dice_rolls');

        if (!rolls || rolls.length === 0) {
            document.getElementById('recentRollsTable').innerHTML =
                '<tr><td colspan="5" class="empty">暂无数据</td></tr>';
            return;
        }

        const recentRolls = rolls.slice(0, 50);
        const tbody = document.getElementById('recentRollsTable');

        tbody.innerHTML = recentRolls.map(roll => {
            const modeType = roll.mode_type || 'single';
            const modeBadge = modeType === 'combo'
                ? '<span class="badge badge-combo">一卦</span>'
                : '<span class="badge badge-single">单骰</span>';

            const themeName = modeType === 'combo'
                ? (roll.combo_name || '-')
                : (roll.dice_name || '-');

            let resultText = '';
            if (modeType === 'single' && roll.results && roll.results[0]) {
                resultText = `${roll.results[0].result_emoji || ''} ${roll.results[0].result_word || ''}`;
            } else if (modeType === 'combo' && roll.results) {
                const results = roll.results.map(r => r.result_word).join(' → ');
                resultText = results;
            }

            const hour = roll.hour !== undefined ? roll.hour : new Date(roll.created_at).getHours();
            const timePeriod = getTimePeriodName(hour);

            return `
                <tr>
                    <td>${formatTime(roll.created_at)}</td>
                    <td>${modeBadge}</td>
                    <td>${themeName}</td>
                    <td>${resultText}</td>
                    <td>${timePeriod}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('更新最新记录失败:', error);
        document.getElementById('recentRollsTable').innerHTML =
            '<tr><td colspan="5" class="error">加载失败</td></tr>';
    }
}

// ========== 会话统计 ==========

async function updateSessionStats() {
    try {
        const sessionStats = await GlobalStatsController.getSessionStats();

        const container = document.getElementById('sessionStats');

        container.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">平均每会话摇骰次数</div>
                <div class="stat-value">${sessionStats.avgRollsPerSession || 0}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">平均页面停留时间</div>
                <div class="stat-value">${sessionStats.avgTimeOnPage || 0}秒</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">平均摇骰间隔</div>
                <div class="stat-value">${sessionStats.avgTimeBetweenRolls || 0}秒</div>
            </div>
        `;

    } catch (error) {
        console.error('更新会话统计失败:', error);
    }
}

// ========== 导出CSV ==========

async function exportToCSV() {
    try {
        const rolls = await SupabaseClient.select('dice_rolls');

        if (!rolls || rolls.length === 0) {
            alert('暂无数据可导出');
            return;
        }

        // 构建CSV内容
        const headers = ['时间', '模式', '主题', '结果', '时段', '是否周末', '是否工作时间'];
        const rows = rolls.map(roll => {
            const modeType = roll.mode_type || 'single';
            const themeName = modeType === 'combo'
                ? (roll.combo_name || '-')
                : (roll.dice_name || '-');

            let resultText = '';
            if (modeType === 'single' && roll.results && roll.results[0]) {
                resultText = `${roll.results[0].result_emoji || ''} ${roll.results[0].result_word || ''}`;
            } else if (modeType === 'combo' && roll.results) {
                resultText = roll.results.map(r => r.result_word).join(' → ');
            }

            const hour = roll.hour !== undefined ? roll.hour : new Date(roll.created_at).getHours();
            const timePeriod = getTimePeriodName(hour);

            return [
                roll.created_at || '',
                modeType === 'combo' ? '一卦' : '单骰',
                themeName,
                resultText,
                timePeriod,
                roll.is_weekend ? '是' : '否',
                roll.is_working_hour ? '是' : '否'
            ].map(field => `"${field}"`).join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');

        // 下载文件
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `emotion-dice-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        alert(`已导出 ${rolls.length} 条数据`);

    } catch (error) {
        console.error('导出CSV失败:', error);
        alert('导出失败，请重试');
    }
}

// ========== 刷新所有数据 ==========

async function refreshData() {
    console.log('🔄 刷新数据...');

    try {
        await Promise.all([
            updateMetrics(),
            updateTrendChart(),
            updateModeChart(),
            updateComboChart(),
            updateHourlyChart(),
            updateFunnel(),
            updateTimePeriodChart(),
            updateWeekendChart(),
            updateTopResultsChart(),
            updateRecentRolls(),
            updateSessionStats()
        ]);

        console.log('✅ 数据刷新完成');
    } catch (error) {
        console.error('❌ 数据刷新失败:', error);
    }
}

// ========== 初始化 ==========

document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 数据分析中心初始化...');

    // 等待 GlobalStatsController 加载
    setTimeout(() => {
        refreshData();
    }, 500);
});
