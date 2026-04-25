// ========== 兼容性补丁和降级方案 ==========

// 1. Polyfill: String.prototype.startsWith()
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

// 2. Polyfill: String.prototype.includes()
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// 3. Polyfill: Array.prototype.find()
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

// 4. Polyfill: Array.prototype.filter()
if (!Array.prototype.filter) {
    Array.prototype.filter = function(fun/*, thisArg*/) {
        'use strict';

        if (this === void 0 || this === null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var res = [];
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];
                if (fun.call(thisArg, val, i, t)) {
                    res.push(val);
                }
            }
        }

        return res;
    };
}

// 5. Polyfill: requestAnimationFrame
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.oRequestAnimationFrame ||
               window.msRequestAnimationFrame ||
               function(callback, element) {
                   window.setTimeout(callback, 1000 / 60);
               };
    })();
}

// 6. 降级方案：fetch API
if (typeof fetch === 'undefined') {
    window.fetch = function(url, options) {
        options = options || {};
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', url, true);

            // 设置请求头
            if (options.headers) {
                for (var key in options.headers) {
                    if (options.headers.hasOwnProperty(key)) {
                        xhr.setRequestHeader(key, options.headers[key]);
                    }
                }
            }

            xhr.onload = function() {
                var response = {
                    ok: xhr.status >= 200 && xhr.status < 300,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    json: function() {
                        return Promise.parse(JSON.parse(xhr.responseText));
                    },
                    text: function() {
                        return Promise.resolve(xhr.responseText);
                    }
                };
                resolve(response);
            };

            xhr.onerror = function() {
                reject(new TypeError('Network request failed'));
            };

            xhr.send(options.body);
        });
    };
}

// 7. Promise polyfill for older browsers
if (typeof Promise === 'undefined') {
    // 简单的 Promise 实现
    window.Promise = function(executor) {
        var self = this;
        self._state = 'pending';
        self._value = undefined;
        self._handlers = [];

        function resolve(value) {
            if (self._state !== 'pending') return;
            self._state = 'fulfilled';
            self._value = value;
            self._notify();
        }

        function reject(reason) {
            if (self._state !== 'pending') return;
            self._state = 'rejected';
            self._value = reason;
            self._notify();
        }

        self._notify = function() {
            setTimeout(function() {
                self._handlers.forEach(function(handler) {
                    var handlerPromise;
                    if (self._state === 'fulfilled') {
                        if (handler.onFulfilled) {
                            handlerPromise = handler.onFulfilled(self._value);
                        }
                    } else {
                        if (handler.onRejected) {
                            handlerPromise = handler.onRejected(self._value);
                        }
                    }

                    if (handlerPromise && typeof handlerPromise.then === 'function') {
                        handlerPromise.then(handler.resolve, handler.reject);
                    } else {
                        handler.resolve(handlerPromise);
                    }
                });
            }, 0);
        };

        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    };

    Promise.prototype.then = function(onFulfilled, onRejected) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._handlers.push({
                onFulfilled: onFulfilled,
                onRejected: onRejected,
                resolve: resolve,
                reject: reject
            });
        });
    };

    Promise.catch = function(onRejected) {
        return this.then(null, onRejected);
    };

    Promise.resolve = function(value) {
        return new Promise(function(resolve) {
            resolve(value);
        });
    };

    Promise.reject = function(reason) {
        return new Promise(function(resolve, reject) {
            reject(reason);
        });
    };
}

// 8. 检测和控制台输出
if (!window.console) {
    window.console = {
        log: function() {},
        warn: function() {},
        error: function() {},
        info: function() {}
    };
}

// 9. 设备检测优化
window.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
window.isWeChat = /MicroMessenger/i.test(navigator.userAgent);
window.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// 10. 网络状态检测
if (navigator.onLine !== undefined) {
    window.addEventListener('offline', function() {
        console.warn('网络连接已断开');
    });

    window.addEventListener('online', function() {
        console.log('网络连接已恢复');
    });
}

// 11. 检测关键资源加载失败
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'SCRIPT') {
        console.error('脚本加载失败:', e.target.src);

        // 如果是关键脚本失败，显示友好提示
        if (e.target.src.includes('config.js')) {
            document.body.innerHTML = '<div style="padding:20px;text-align:center;">⚠️ 资源加载失败，请检查网络连接或刷新页面重试</div>';
        }
    }
}, true);

// 12. 时间戳兼容
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

// 13. localStorage 安全访问
window.safeLocalStorage = {
    getItem: function(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('localStorage 不可用:', e);
            return null;
        }
    },
    setItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('localStorage 不可用:', e);
        }
    },
    removeItem: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('localStorage 不可用:', e);
        }
    }
};

console.log('✅ 兼容性补丁加载完成');
