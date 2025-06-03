// ====================== Конфигурация ======================
// Firebase
const firebaseConfig = {
    databaseURL: "https://sitik-1fea0-default-rtdb.firebaseio.com/"
};

// GitHub
const GITHUB = {
    owner: "HorriDX",
    repo: "repos",
    token: "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", // С правами repo
    branch: "main",
    paths: {
        images: "assets/images",
        files: "assets/files"
    }
};

// ====================== Инициализация ======================
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ====================== Работа с GitHub API ======================
async function uploadToGitHub(path, content, message) {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${path}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                content: btoa(content),
                branch: GITHUB.branch
            })
        }
    );
    return await response.json();
}

// ====================== Логика приложения ======================
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Подготовка данных
    const title = document.getElementById('postTitle').value;
    const text = document.getElementById('postText').value;
    const imageFile = document.getElementById('postImage').files[0];
    const fileFile = document.getElementById('postFile').files[0];

    try {
        // 2. Загрузка изображения (если есть)
        let imageUrl = '';
        if (imageFile) {
            const imagePath = `${GITHUB.paths.images}/${Date.now()}_${imageFile.name}`;
            await uploadToGitHub(imagePath, await readFileAsBinary(imageFile), `Добавлено фото: ${imageFile.name}`);
            imageUrl = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${imagePath}`;
        }

        // 3. Загрузка файла (если есть)
        let fileUrl = '';
        let fileName = '';
        if (fileFile) {
            const filePath = `${GITHUB.paths.files}/${Date.now()}_${fileFile.name}`;
            await uploadToGitHub(filePath, await readFileAsBinary(fileFile), `Добавлен файл: ${fileFile.name}`);
            fileUrl = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${filePath}`;
            fileName = fileFile.name;
        }

        // 4. Сохранение поста в Firebase
        const postRef = database.ref('posts').push();
        await postRef.set({
            title,
            text,
            imageUrl,
            fileUrl,
            fileName,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });

        // 5. Очистка формы
        e.target.reset();
        document.getElementById('postModal').style.display = 'none';
        
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось опубликовать пост");
    }
});

// ====================== Вспомогательные функции ======================
function readFileAsBinary(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onload = () => resolve(reader.result);
    });
}

// Загрузка и отображение постов
database.ref('posts').on('value', (snapshot) => {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';
    
    const posts = snapshot.val() || {};
    Object.entries(posts).forEach(([id, post]) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.text}</p>
            ${post.imageUrl ? `<img src="${post.imageUrl}">` : ''}
            ${post.fileUrl ? `<a href="${post.fileUrl}" download="${post.fileName}">Скачать файл</a>` : ''}
        `;
        postsContainer.appendChild(postElement);
    });
});

// Управление модальным окном
document.getElementById('newPostBtn').addEventListener('click', () => {
    document.getElementById('postModal').style.display = 'block';
});

document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('postModal').style.display = 'none';
});