// Конфигурация
const CONFIG = {
    GITHUB: {
        OWNER: "HorriDX",
        REPO: "repos",
        TOKEN: "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",
        BRANCH: "main",
        BASE_URL: "https://api.github.com/repos"
    },
    PATHS: {
        IMAGES: "assets/images",
        FILES: "assets/files",
        POSTS: "posts"
    }
};

// Проверка существования папки
async function checkFolderExists(path) {
    try {
        const response = await fetch(
            `${CONFIG.GITHUB.BASE_URL}/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/contents/${path}`,
            {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        return response.status === 200;
    } catch (error) {
        console.error("Ошибка проверки папки:", error);
        return false;
    }
}

// Создание папки (если не существует)
async function createFolder(path) {
    const exists = await checkFolderExists(path);
    if (!exists) {
        try {
            await fetch(
                `${CONFIG.GITHUB.BASE_URL}/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/contents/${path}/.gitkeep`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Create ${path} folder`,
                        content: btoa(""),
                        branch: CONFIG.GITHUB.BRANCH
                    })
                }
            );
            console.log(`Папка ${path} создана`);
        } catch (error) {
            console.error("Ошибка создания папки:", error);
        }
    }
}

// Загрузка файла в GitHub
async function uploadFile(path, file, message) {
    const content = await toBase64(file);
    const response = await fetch(
        `${CONFIG.GITHUB.BASE_URL}/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/contents/${path}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                content: content,
                branch: CONFIG.GITHUB.BRANCH
            })
        }
    );
    
    if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    
    return await response.json();
}

// Конвертация в Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// Инициализация папок при загрузке
async function initFolders() {
    await createFolder(CONFIG.PATHS.IMAGES);
    await createFolder(CONFIG.PATHS.FILES);
    await createFolder(CONFIG.PATHS.POSTS);
}

// Обработка формы
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const text = document.getElementById('postText').value;
    const imageFile = document.getElementById('postImage').files[0];
    const fileFile = document.getElementById('postFile').files[0];

    try {
        // 1. Загружаем изображение
        let imageUrl = '';
        if (imageFile) {
            const imagePath = `${CONFIG.PATHS.IMAGES}/${Date.now()}_${imageFile.name}`;
            await uploadFile(imagePath, imageFile, `Upload image: ${imageFile.name}`);
            imageUrl = `https://raw.githubusercontent.com/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/${CONFIG.GITHUB.BRANCH}/${imagePath}`;
        }

        // 2. Загружаем файл
        let fileUrl = '';
        let fileName = '';
        if (fileFile) {
            const filePath = `${CONFIG.PATHS.FILES}/${Date.now()}_${fileFile.name}`;
            await uploadFile(filePath, fileFile, `Upload file: ${fileFile.name}`);
            fileUrl = `https://raw.githubusercontent.com/${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}/${CONFIG.GITHUB.BRANCH}/${filePath}`;
            fileName = fileFile.name;
        }

        // 3. Сохраняем пост
        const postData = {
            title,
            text,
            imageUrl,
            fileUrl,
            fileName,
            createdAt: new Date().toISOString()
        };
        
        const postPath = `${CONFIG.PATHS.POSTS}/${Date.now()}.json`;
        const content = btoa(JSON.stringify(postData));
        await uploadFile(postPath, { name: 'post.json', content }, `New post: ${title}`);

        alert('Пост успешно опубликован!');
        e.target.reset();
        
    } catch (error) {
        console.error("Ошибка:", error);
        alert(`Ошибка: ${error.message}`);
    }
});

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', initFolders);
