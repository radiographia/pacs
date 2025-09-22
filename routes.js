const routes = {
    '#/main': { path: 'main.html', name: 'Главная' },
    '#/dicom': { path: 'dicom.html', name: 'Коллекция' },
	'#/code.html': { path: 'code.html', name: 'Code' },
};

// DOM-элементы
const menuDiv = document.getElementById("menu");
const contentDiv = document.getElementById("content");
const footerDiv = document.getElementById("footer");

if (!menuDiv || !contentDiv || !footerDiv) {
    console.error("Ошибка: не найден элемент с id 'menu', 'content' или 'footer'.");
}

let isHighlightLoaded = false;



// Хранилище подключённых стилей
const loadedStyles = new Set();

/**
 * Создает статическое меню.
 */
function createStaticMenu() {
    menuDiv.innerHTML = `
        <img id="logo" src="img/logo.jpg" alt="Логотип сайта">
        <nav>
            <ul>
                ${Object.keys(routes).map(path => `
                    <li><a href="${path}">${routes[path].name}</a></li>
                `).join('')}
            </ul>
        </nav>
        <div class="fake"></div>
    `;
}

/**
 * Создает статический футер.
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

function removeOldStyles() {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (
            href &&
            !href.includes('general.css') && // Сохраняем general.css
            !href.includes('highlight.js') && // Сохраняем стили Highlight.js
            !link.hasAttribute('data-keep') // Сохраняем стили с атрибутом data-keep
        ) {
            link.remove();
            loadedStyles.delete(href);
        }
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

            document.head.appendChild(styleLink);
            loadedStyles.add(href);

            return new Promise((resolve, reject) => {
                styleLink.onload = () => resolve(href);
                styleLink.onerror = () => reject(`Ошибка загрузки стиля: ${href}`);
            });
        }
        return Promise.resolve();
    });
    return Promise.all(promises);
}

/**
 * Загружает и отображает контент по маршруту.
 */
function hideContent() {
    contentDiv.style.visibility = 'hidden';
    contentDiv.style.position = 'absolute';
}

/**
 * Показывает контент.
 */
function showContent() {
    contentDiv.style.visibility = 'visible';
    contentDiv.style.position = 'relative';
}
/*
 * Загружает и отображает контент по маршруту.
 */
async function loadContent(path) {
    const route = routes[path];
    if (route && route.path) {
        try {
            hideContent();
            footerDiv.style.display = 'none';

            // Проверяем, нужно ли добавить задержку для подсветки (только для /blog)
            const delay = path === '#/blog' ? 2000 : 0; // Задержка 1 секунда только для '/blog'

            // Задержка перед показом контента, если это 'blog'
            //await new Promise(resolve => setTimeout(resolve, delay));

            const response = await fetch(route.path);
            if (!response.ok) throw new Error(`Ошибка загрузки: ${route.path}`);

            const html = await response.text();
            contentDiv.innerHTML = html;
            removeOldStyles();

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            await addStyles(tempDiv);

            // Подключаем все скрипты, если есть
            tempDiv.querySelectorAll('script').forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.type = 'module';
                    newScript.src = script.src;
                } else {
                    newScript.type = 'module';
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });

            // Загружаем Highlight.js при необходимости
            //await loadHighlightJS();
			//hljs.highlightAll();
            // Применяем подсветку после задержки (только для '/blog')
//if (path === '#/blog') {
    await new Promise(resolve => setTimeout(resolve, delay)); // Ожидание перед подсветкой
    hljs.highlightAll();  // Подсветка для страницы blog
//} else {
//    hljs.highlightAll();  // Подсветка для других страниц без задержки
//}
//hljs.highlightAll();

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
    createStaticFooter();
    handleHashChange();
});
window.addEventListener('hashchange', handleHashChange);



