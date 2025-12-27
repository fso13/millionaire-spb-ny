const fs = require('fs');
const path = require('path');

// Шаблоны вопросов для разных категорий
const questionTemplates = {
  'new-year': {
    easy: [
      { q: 'Какой месяц следует после декабря?', a: 'Январь' },
      { q: 'Какой праздник отмечают 1 января?', a: 'Новый год' },
      { q: 'Как называется новогоднее дерево?', a: 'Ёлка' },
      { q: 'Кто приносит подарки на Новый год?', a: 'Дед Мороз' },
      { q: 'Как называется новогодний салют?', a: 'Фейерверк' }
    ],
    medium: [
      { q: 'В какой стране Новый год отмечают дважды?', a: 'Россия' },
      { q: 'Как называется новогодний напиток?', a: 'Шампанское' },
      { q: 'Какой фильм традиционно показывают на Новый год?', a: 'Ирония судьбы' },
      { q: 'Где находится резиденция Деда Мороза?', a: 'Великий Устюг' },
      { q: 'Как называется новогодний салат?', a: 'Оливье' }
    ],
    hard: [
      { q: 'В каком году в России стали отмечать Новый год 1 января?', a: '1700' },
      { q: 'Как называется новогодний праздник в Китае?', a: 'Чуньцзе' },
      { q: 'Кто написал музыку к фильму "Ирония судьбы"?', a: 'Микаэл Таривердиев' },
      { q: 'Как называется новогодний праздник в Японии?', a: 'О-сёгацу' },
      { q: 'В каком году впервые показали "Иронию судьбы"?', a: '1975' }
    ]
  },
  'spb': {
    easy: [
      { q: 'На какой реке стоит Санкт-Петербург?', a: 'Нева' },
      { q: 'Как называется главная улица города?', a: 'Невский проспект' },
      { q: 'Какой музей находится в Зимнем дворце?', a: 'Эрмитаж' },
      { q: 'Как называется крепость в центре города?', a: 'Петропавловская крепость' },
      { q: 'Какой собор находится на Невском проспекте?', a: 'Казанский собор' }
    ],
    medium: [
      { q: 'Как называется мост с конями?', a: 'Аничков мост' },
      { q: 'На какой площади стоит Исаакиевский собор?', a: 'Исаакиевская площадь' },
      { q: 'Как называется остров с ЦПКиО?', a: 'Елагин остров' },
      { q: 'Кто спроектировал Исаакиевский собор?', a: 'Огюст Монферран' },
      { q: 'Как называется разводной мост через Неву?', a: 'Дворцовый мост' }
    ],
    hard: [
      { q: 'Как называется самый высокий небоскреб?', a: 'Лахта Центр' },
      { q: 'На каком острове находится Крестовский стадион?', a: 'Крестовский остров' },
      { q: 'Как называется сад, созданный Петром I?', a: 'Летний сад' },
      { q: 'Кто спроектировал Казанский собор?', a: 'Воронихин' },
      { q: 'Как называется музей-корабль?', a: 'Аврора' }
    ]
  },
  'cats': {
    easy: [
      { q: 'Какой звук издают коты?', a: 'Мяуканье' },
      { q: 'Сколько жизней у кота по легенде?', a: 'Девять' },
      { q: 'Как называется детеныш кота?', a: 'Котенок' },
      { q: 'Какое животное является предком кошки?', a: 'Дикая кошка' },
      { q: 'Как называется порода без шерсти?', a: 'Сфинкс' }
    ],
    medium: [
      { q: 'Сколько пальцев на передних лапах у кота?', a: 'Пять' },
      { q: 'Какая самая популярная порода кошек?', a: 'Персидская' },
      { q: 'Сколько часов в сутки спят коты?', a: '12-16 часов' },
      { q: 'Как называется способность приземляться на лапы?', a: 'Право-рефлекс' },
      { q: 'В какой стране коты священны?', a: 'Египет' }
    ],
    hard: [
      { q: 'Какая самая редкая порода кошек?', a: 'Ашера' },
      { q: 'Сколько мышц в ухе кота?', a: '32' },
      { q: 'Какая самая старая порода кошек?', a: 'Египетская мау' },
      { q: 'С какой скоростью может бежать кот?', a: '48 км/ч' },
      { q: 'Когда коты были одомашнены?', a: 'Около 9500 лет назад' }
    ]
  }
};

// Функция для расширения вопросов категории
function expandCategoryQuestions(categoryId, categoryName, difficulty, existingQuestions) {
  const questions = [...existingQuestions];
  const pointsLevels = [100, 200, 300, 400, 500];
  const questionsPerLevel = 20;
  
  // Получаем шаблоны для категории
  const templates = questionTemplates[categoryId]?.[difficulty] || [];
  
  pointsLevels.forEach((points, levelIndex) => {
    const existingForLevel = questions.filter(q => q.points === points).length;
    const needed = questionsPerLevel - existingForLevel;
    
    for (let i = existingForLevel + 1; i <= questionsPerLevel; i++) {
      const templateIndex = (i - 1) % templates.length;
      const template = templates[templateIndex] || { q: `${categoryName} - вопрос ${i}`, a: `Ответ ${i}` };
      
      const questionId = `${categoryId}-${difficulty}-${points}-${i}`;
      questions.push({
        id: questionId,
        question: template.q || `${categoryName} - вопрос ${i} (${points} очков)`,
        answer: template.a || `Ответ на вопрос ${i}`,
        points: points
      });
    }
  });
  
  return questions;
}

// Функция для расширения файла
function expandFile(filePath) {
  console.log(`Обработка файла: ${filePath}`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  ['easy', 'medium', 'hard'].forEach(difficulty => {
    if (data[difficulty] && data[difficulty].themes) {
      data[difficulty].themes.forEach(theme => {
        const originalCount = theme.questions.length;
        theme.questions = expandCategoryQuestions(
          theme.id,
          theme.name,
          difficulty,
          theme.questions
        );
        console.log(`  ${theme.name} (${difficulty}): ${originalCount} -> ${theme.questions.length} вопросов`);
      });
    }
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Файл обновлен: ${filePath}\n`);
}

// Расширяем все файлы
const files = [
  'src/data/yourGameQuestions.json',
  'src/data/yourGameQuestionsRegular.json',
  'src/data/yourGameQuestionsIT.json'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    expandFile(fullPath);
  } else {
    console.log(`⚠ Файл не найден: ${fullPath}`);
  }
});

console.log('Генерация завершена!');

