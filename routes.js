const routes = {
    '#/main': { path: 'html/main.html', name: 'Главная' },
    '#/dicom': { path: 'html/dicom.html', name: 'Коллекция' },
	'#/books': { path: 'html/books.html', name: 'Книги' },
};


// DOM-элементы
const menuDiv = document.getElementById("menu");
const contentDiv = document.getElementById("content");
const footerDiv = document.getElementById("footer");

if (!menuDiv || !contentDiv || !footerDiv) {
    console.error("Ошибка: не найден элемент с id 'menu', 'content' или 'footer'.");
}

// Хранилище подключённых стилей
const loadedStyles = new Set();

/**
 * Создаёт статическое меню.
 */
function createStaticMenu() {
    menuDiv.innerHTML = `
        <img id="logo" src="img/logo.jpg" alt="Логотип сайта">
        <nav>
            <ul class="nav-menu">
                <li class="dropdown" id="sections-dropdown">
                    <a href="#" class="dropdown-toggle">Sections</a>
                    <ul class="dropdown-menu">
                        ${Object.keys(routes).map(path => `
                            <li><a href="${path}">${routes[path].name}</a></li>
                        `).join('')}
                    </ul>
                </li>
            </ul>
        </nav>
        <div class="fake">
            <div id="rad">RADIOGRAPHIA</div>
        </div>
    `;
}

/**
 * Инициализирует поведение выпадающего меню.
 */
function initDropdown() {
    const dropdown = document.getElementById('sections-dropdown');
    if (!dropdown) return;

    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    let isOpen = false;
    let closeTimeout = null;

    function showMenu() {
        clearTimeout(closeTimeout);

        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        menu.style.left = '0';
        menu.style.right = 'auto';

        const menuWidth = menu.offsetWidth;
        const dropdownRect = dropdown.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const wouldBeRight = dropdownRect.left + menuWidth;

        if (wouldBeRight > viewportWidth) {
            menu.style.left = 'auto';
            menu.style.right = '0';
        } else {
            menu.style.left = '0';
            menu.style.right = 'auto';
        }

        menu.style.visibility = 'visible';
        menu.style.display = 'block';
        isOpen = true;
    }

    function hideMenu() {
        closeTimeout = setTimeout(() => {
            menu.style.display = 'none';
            isOpen = false;
        }, 150);
    }

    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (isOpen) {
            hideMenu();
        } else {
            showMenu();
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            hideMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (isOpen) {
            showMenu();
        }
    });
}

/**
 * Создаёт статический футер.
 */
function createStaticFooter() {
    footerDiv.innerHTML = `
        <p>&copy; 2025 Radiographia. Все права защищены.</p>
    `;
}

/**
 * Обновляет активный пункт меню.
 */
function generateMenu(activePath) {
    menuDiv.querySelectorAll('a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === activePath);
    });
}

/**
 * Удаляет старые динамические стили и скрипты.
 */
function cleanupDynamicAssets() {
    // Удаляем старые динамические стили (кроме защищённых)
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (
            href &&
            !href.includes('general.css') &&
            !href.includes('highlight.js') &&
            !link.hasAttribute('data-keep')
        ) {
            link.remove();
            loadedStyles.delete(href);
        }
    });

    // Удаляем динамически добавленные скрипты
    document.querySelectorAll('script[data-dynamic]').forEach(script => {
        script.remove();
    });
}

/**
 * Подключает новые стили из переданного контейнера.
 */
function addStyles(tempDiv) {
    const promises = Array.from(tempDiv.querySelectorAll('link[rel="stylesheet"]')).map(link => {
        const href = link.getAttribute('href');
        if (href && !loadedStyles.has(href)) {
            const styleLink = document.createElement('link');
            styleLink.rel = 'stylesheet';
            styleLink.href = href;
            styleLink.setAttribute('data-dynamic', 'true');

            document.head.appendChild(styleLink);
            loadedStyles.add(href);

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.warn(`Таймаут загрузки стиля: ${href}`);
                    resolve(href); // не ломаем загрузку при медленной сети
                }, 5000);

                styleLink.onload = () => {
                    clearTimeout(timeout);
                    resolve(href);
                };
                styleLink.onerror = () => {
                    clearTimeout(timeout);
                    reject(`Ошибка загрузки стиля: ${href}`);
                };
            });
        }
        return Promise.resolve();
    });
    return Promise.all(promises);
}

/**
 * Скрывает контент.
 */
function hideContent() {
    contentDiv.style.display = 'none';
}

/**
 * Показывает контент.
 */
function showContent() {
    contentDiv.style.display = ''; // возвращает значение по умолчанию
}

/**
 * Загружает и отображает контент по маршруту.
 */
async function loadContent(path) {
    const route = routes[path];
    if (route && route.path) {
        try {
            hideContent();
            footerDiv.style.display = 'none';

            const delay = path === '#/blog' ? 2000 : 0;

            const response = await fetch(route.path);
            if (!response.ok) throw new Error(`Ошибка загрузки: ${route.path}`);

            const html = await response.text();

            // Создаём временный контейнер для анализа
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Очищаем старые динамические ресурсы
            cleanupDynamicAssets();

            // Загружаем стили ДО вставки контента в DOM
            await addStyles(tempDiv);

            // Вставляем контент ТОЛЬКО после загрузки стилей
            contentDiv.innerHTML = html;

            // Подключаем скрипты
            tempDiv.querySelectorAll('script').forEach(script => {
                const newScript = document.createElement('script');
                newScript.setAttribute('data-dynamic', 'true');
                if (script.src) {
                    newScript.type = 'module';
                    newScript.src = script.src;
                } else {
                    newScript.type = 'module';
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });

            // Подсветка синтаксиса
            await new Promise(resolve => setTimeout(resolve, delay));
            if (typeof hljs !== 'undefined') {
                hljs.highlightAll();
            }

            showContent();
            footerDiv.style.display = 'block';
        } catch (error) {
            console.error(error);
            contentDiv.innerHTML = "<h1>Ошибка загрузки страницы</h1>";
            showContent();
            footerDiv.style.display = 'block';
        }
    } else {
        contentDiv.innerHTML = "<h1>Страница не найдена</h1>";
        showContent();
        footerDiv.style.display = 'block';
    }
}

/**
 * Обрабатывает изменение хеша в адресной строке.
 */
function handleHashChange() {
    const path = window.location.hash || '#/main';
    generateMenu(path);
    loadContent(path);
}

/**
 * Инициализация.
 */
window.addEventListener('DOMContentLoaded', () => {
    createStaticMenu();
    initDropdown();
    createStaticFooter();
    handleHashChange();
});

window.addEventListener('hashchange', handleHashChange);
