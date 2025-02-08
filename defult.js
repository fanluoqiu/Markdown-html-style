document.addEventListener("DOMContentLoaded", function() {
    /***********************
     * 动态资源加载系统
     ***********************/
    (function() {
        const ResourceLoader = {
            // 资源加载配置（在此处添加新的三方库）
            resources: [
                {
                    type: 'js',  // 资源类型
                    url: 'https://cdn.jsdelivr.net/gh/fanluoqiu/Markdown-html-style/highlight.js',
                    check: () => typeof hljs !== 'undefined', // 存在性检查
                    onload: () => {
                        const initScript = document.createElement('script');
                        initScript.innerHTML = 'hljs.initHighlightingOnLoad();';
                        document.body.appendChild(initScript);
                    }
                },
                
                {
                    type: 'js',
                    url: 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js',
                    check: () => typeof mermaid !== 'undefined',
                    onload: () => {
                        // 转换所有language-mermaid代码块为mermaid专用div
                        document.querySelectorAll('code.language-mermaid').forEach(code => {
                            const div = document.createElement('div');
                            div.className = 'mermaid';
                            div.textContent = code.textContent;
                            code.replaceWith(div);
                        });

                        // 初始化Mermaid
                        mermaid.initialize({
                            startOnLoad: true,
                            securityLevel: 'loose'
                        });
                        mermaid.init(); // 手动触发渲染
                    }
                },
                {
                    type: 'js',
                    url:'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js',
                    check: () => typeof MathJax !== 'undefined',
                }
            ],
            createResourceElement(resource) {
                let element;
                if (resource.type === 'js') {
                    element = document.createElement('script');
                    element.src = resource.url;
                    element.async = false;
                } else if (resource.type === 'css') {
                    element = document.createElement('link');
                    element.rel = 'stylesheet';
                    element.href = resource.url;
                }
                return element;
            },
            loadResource(resource) {
                return new Promise((resolve, reject) => {
                    if (resource.check && resource.check()) {
                        console.log(`[ResourceLoader] ${resource.url} 已存在，跳过加载`);
                        return resolve();
                    }

                    const element = this.createResourceElement(resource);
                    element.onload = () => {
                        console.log(`[ResourceLoader] ${resource.url} 加载成功`);
                        if (resource.onload) resource.onload();
                        resolve();
                    };
                    element.onerror = (err) => {
                        console.error(`[ResourceLoader] ${resource.url} 加载失败`, err);
                        reject(err);
                    };

                    document.head.appendChild(element);
                });
            },

            async init() {
                try {
                    await Promise.all(this.resources.map(res => this.loadResource(res)));
                    console.log('[ResourceLoader] 所有资源加载完成');
                } catch (error) {
                    console.error('[ResourceLoader] 资源加载过程中发生错误:', error);
                }
            }
        };



    /***********************
         * 目录生成模块
         ***********************/
    function initTOC() {
        const toc = document.createElement("div");
        toc.id = "toc";
        document.body.insertBefore(toc, document.body.firstChild);

        const headers = document.querySelectorAll("h2, h3, h4, h5, h6");
        let tocContent = "";
        let numbering = [0, 0, 0, 0, 0];
        let lastLevel = 1;
        let tocItems = [];

        headers.forEach(header => {
            const level = parseInt(header.tagName.substring(1));
            
            // 更新编号逻辑
            if (level > lastLevel) {
                numbering[level - 1]++;
            } else {
                numbering[level - 1]++;
                for (let i = level; i < numbering.length; i++) {
                    numbering[i] = 0;
                }
            }
            lastLevel = level;

            const num = numbering.slice(0, level).filter(n => n > 0).join(".");
            const id = `toc-${num.replace(/\./g, "-")}`;
            header.id = id;

            tocItems.push({
                level: level,
                num: num,
                text: header.textContent,
                id: id
            });
        });

        // 生成目录内容
        tocItems.forEach((item, index) => {
            const nextItem = tocItems[index + 1];
            const hasChildren = nextItem && nextItem.level > item.level;
            const toggleSymbol = hasChildren ? "▷" : "◦";

            tocContent += `
                <div class="toc-item toc-level-${item.level}" 
                    style="display: ${item.level === 2 ? 'block' : 'none'}">
                    <span class="toc-toggle">${toggleSymbol}</span>
                    <a href="#${item.id}">${item.num} ${item.text}</a>
                    <div class="toc-children"></div>
                </div>
            `;
        });

        toc.innerHTML += tocContent;

        // 目录交互逻辑
        document.querySelectorAll(".toc-toggle").forEach(toggle => {
            toggle.addEventListener("click", function() {
                const parentItem = this.closest('.toc-item');
                const currentLevel = parseInt(parentItem.className.match(/toc-level-(\d)/)[1]);
                const currentNum = this.nextElementSibling.textContent.split(" ")[0];
                        // 查找所有子级目录项
                        document.querySelectorAll('.toc-item').forEach(item => {
                            const itemLevel = parseInt(item.className.match(/toc-level-(\d)/)[1]);
                            const itemNum = item.querySelector('a').textContent.split(" ")[0];

                            if (itemNum.startsWith(currentNum) && itemLevel === currentLevel + 1) {
                                item.style.display = item.style.display === 'none' ? 'block' : 'none';
                            }
                        });

                        // 更新切换符号
                        this.textContent = this.textContent === '▷' ? '▽' : '▷';
                    });
                });
            }

    /***********************
     * 图片模态框模块
     ***********************/
    function initImageModal() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('click', function() {
                openModal(this);
            });
            img.draggable = false; // 禁用图片的拖动
        });
    
        let modalOverlay, modalImage, closeButton;
        let scale = 1;
        let originX = 0, originY = 0;
        let isDragging = false;
        let lastX = 0, lastY = 0;
    
        function openModal(img) {
        createModalElements();
        modalImage.src = img.src;
        resetImage();
        document.body.appendChild(modalOverlay);
        document.body.style.overflow = 'hidden'; // 防止页面滚动
        if (isMobileDevice()) {
            // 移动端事件
            addMobileEvents();
        } else {
            // 电脑端事件
            addDesktopEvents();
        }
        }
    
        function createModalElements() {
            // 创建模态框遮罩层
            modalOverlay = document.createElement('div');
            modalOverlay.classList.add('image-modal-overlay');
                                    
            // 创建图片容器
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('image-container');
            
            // 创建图片元素
            modalImage = document.createElement('img');
            modalImage.classList.add('image-modal-img');

            modalImage.draggable = false; // 禁用拖拽
            
            // 将图片添加到容器
            imageContainer.appendChild(modalImage);  
            
            // 将图片容器添加到模态框遮罩层
            modalOverlay.appendChild(imageContainer);
            

            // 创建关闭按钮
            closeButton = document.createElement('div');
            closeButton.classList.add('image-modal-close');

            // 将关闭按钮添加到模态框遮罩层
            modalOverlay.appendChild(closeButton);
            
            // 关闭模态框事件
            closeButton.addEventListener('click', closeModal);
            
            // 防止点击图片时关闭模态框
            modalImage.addEventListener('click', function(e) {
                e.stopPropagation(); 
            });

            // **添加双击事件监听器，双击图片时重置为正常显示状态**
            modalImage.addEventListener('dblclick', function() {
                resetImage();
            });
            
            document.addEventListener('keydown', handleKeyDown);
            }
            
            function handleKeyDown(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
            }
            
            function closeModal() {
            if (modalOverlay && modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
            document.removeEventListener('keydown', handleKeyDown);
            removeDesktopEvents();
            removeMobileEvents();
            document.body.style.overflow = 'visible'; // 重新开启页面滚动
        }
    
        function resetImage() {
            scale = 1;
            originX = 0;
            originY = 0;

            // **添加过渡效果**
            modalImage.style.transition = 'transform 0.3s ease';
            updateTransform();
            modalImage.style.cursor = 'default';
        }
    
        function updateTransform() {
        modalImage.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
        }
    
        // 电脑端事件处理
        function addDesktopEvents() {
        modalImage.addEventListener('wheel', zoomImage);
        modalImage.addEventListener('mousedown', startDrag);
        modalImage.addEventListener('mouseup', endDrag);
        modalImage.addEventListener('mousemove', dragImage);
        modalImage.addEventListener('mouseleave', endDrag);
        // 阻止默认的鼠标事件
        modalImage.addEventListener('dragstart', function(e) {
            e.preventDefault();
        });
        }
    
        function removeDesktopEvents() {
        modalImage.removeEventListener('wheel', zoomImage);
        modalImage.removeEventListener('mousedown', startDrag);
        modalImage.removeEventListener('mouseup', endDrag);
        modalImage.removeEventListener('mousemove', dragImage);
        modalImage.removeEventListener('mouseleave', endDrag);
        }
    
        function zoomImage(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const prevScale = scale;
            scale = Math.min(Math.max(scale + delta, 1), 5); // 限制缩放范围
            // 调整原点，以鼠标位置为中心缩放
            const rect = modalImage.getBoundingClientRect();
            const imgX = e.clientX - rect.left;
            const imgY = e.clientY - rect.top;
            originX -= (imgX - originX) * (scale / prevScale - 1);
            originY -= (imgY - originY) * (scale / prevScale - 1);

            // **添加平滑过渡效果**
            modalImage.style.transition = 'transform 0.3s ease';

            updateTransform();
            updateCursor();
        }
    
        function startDrag(e) {
            if (scale <= 1) return;
            e.preventDefault();
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            modalImage.style.cursor = 'grabbing';

            // **移除过渡效果，确保拖动时即时响应**
            modalImage.style.transition = 'none';
        }
    
        function dragImage(e) {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            originX += dx;
            originY += dy;
            updateTransform();
            lastX = e.clientX;
            lastY = e.clientY;
        }
    
        function endDrag() {
            isDragging = false;
            updateCursor();

            // **重新添加过渡效果**
            modalImage.style.transition = 'transform 0.3s ease'
        }
    
        function updateCursor() {
            if (scale > 1) {
                modalImage.style.cursor = 'grab';
            } else {
                modalImage.style.cursor = 'default';
                if (scale === 1) {
                resetImage();
                }
            }

        }
    
        // 移动端事件处理
        function addMobileEvents() {
        modalImage.addEventListener('touchstart', handleTouchStart, { passive: false });
        modalImage.addEventListener('touchmove', handleTouchMove, { passive: false });
        modalImage.addEventListener('touchend', handleTouchEnd);
        modalImage.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止点击图片时关闭模态框
        });
        }
    
        function removeMobileEvents() {
        modalImage.removeEventListener('touchstart', handleTouchStart);
        modalImage.removeEventListener('touchmove', handleTouchMove);
        modalImage.removeEventListener('touchend', handleTouchEnd);
        }
    
        let initialDistance = null;
        let lastTouchX = null, lastTouchY = null;
        let isDoubleTap = false;
        let tapTimeout = null;
    
        function handleTouchStart(e) {
        if (e.touches.length === 1) {
            if (tapTimeout) {
            clearTimeout(tapTimeout);
            tapTimeout = null;
            isDoubleTap = true;
            } else {
            isDoubleTap = false;
            tapTimeout = setTimeout(() => {
                tapTimeout = null;
            }, 300);
            }
            if (scale > 1) {
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            }
        } else if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches[0], e.touches[1]);
        }
        }
    
        function handleTouchMove(e) {
        if (e.touches.length === 1 && scale > 1) {
            e.preventDefault();
            const dx = e.touches[0].clientX - lastTouchX;
            const dy = e.touches[0].clientY - lastTouchY;
            originX += dx;
            originY += dy;
            updateTransform();
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const currentDistance = getDistance(e.touches[0], e.touches[1]);
            const deltaDistance = currentDistance - initialDistance;
            const deltaScale = deltaDistance / 200;
            const prevScale = scale;
            scale = Math.min(Math.max(scale + deltaScale, 1), 5);
            // 调整原点，以两指中心为缩放中心
            const rect = modalImage.getBoundingClientRect();
            const touchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const touchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
            originX -= (touchCenterX - originX) * (scale / prevScale - 1);
            originY -= (touchCenterY - originY) * (scale / prevScale - 1);
            updateTransform();
            initialDistance = currentDistance;
        }
        }
    
        function handleTouchEnd(e) {
        if (isDoubleTap) {
            closeModal();
            isDoubleTap = false;
        } else if (scale <= 1) {
            resetImage();
        }
        }
    
        function getDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.hypot(dx, dy);
        }
    
        // 判断是否为移动设备
        function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        }

    }

    /***********************
     * 表格样式调整模块
     ***********************/
    function InitTable(){
        document.querySelectorAll('table').forEach(function(table) {
            // 创建容器
            var wrapper = document.createElement('div');
            wrapper.className = 'table-container';
            // 将容器插入到 table 之前
            table.parentNode.insertBefore(wrapper, table);
            // 将 table 移入容器中
            wrapper.appendChild(table);
        });        
    }

    
    /***********************
     * 页面流跳转至顶部模块
     ***********************/


    const shortcutConfig = {
        key: '1',
        altKey: true,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false // 对于 Mac 的 Command 键
    };

    function scrollToTopWithAnimation() {
        // 检查是否已经绑定过监听器
        if (!scrollToTopWithAnimation.isListenerAdded) {
            // 添加键盘事件监听器
            window.addEventListener('keydown', function(event) {
                // 检测是否按下了 快捷键
                if (
                    event.key === shortcutConfig.key &&
                    event.altKey === shortcutConfig.altKey &&
                    event.ctrlKey === shortcutConfig.ctrlKey &&
                    event.shiftKey === shortcutConfig.shiftKey &&
                    event.metaKey === shortcutConfig.metaKey
                ) {
                    event.preventDefault();
                    scrollToTopWithAnimation();
                }
            });
            scrollToTopWithAnimation.isListenerAdded = true; // 修正了拼写错误
        }
    
        // 以下是滚动动画的实现
        const scrollingElement = document.scrollingElement || document.documentElement;
        const startPosition = scrollingElement.scrollTop || 0;
        const duration = 300; // 动画时长（0.3s）
        const startTime = performance.now(); // 记录动画开始时间
    
        function animate(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1); // 进度值 (0~1)
    
            // 采用 easeOutCubic 缓动效果
            const easedProgress = easeOutCubic(progress);
    
            // 平滑滚动
            scrollingElement.scrollTop = startPosition * (1 - easedProgress);
    
            // 继续动画，直到进度达到 1
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
    
        requestAnimationFrame(animate);
    }
    
    // 缓动函数（easeOutCubic）
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    

        /***********************
         * 主初始化流程
         ***********************/
        ResourceLoader.init().then(() => {
            initTOC();
            initImageModal();
            InitTable();
            scrollToTopWithAnimation();
            console.log('所有模块初始化完成');
        }).catch(error => {
            console.error('初始化失败:', error);
        });
    })();
});