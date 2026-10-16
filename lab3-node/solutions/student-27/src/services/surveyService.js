// Хранилище опросов и состояний пользователей (в памяти, сбрасывается при перезапуске)
const surveys = new Map();
const userStates = new Map(); // Ключ: `${platform}_${userId}`, Значение: { state, data }

let nextId = 1;

// Генерирует случайный код для голосования
const generateCode = () => {
  const random = Math.random().toString(36).slice(2, 8);
  return random.toUpperCase();
};

export const createSurvey = (topic, questions) => {
  const id = nextId++;
  const code = generateCode();
  const survey = { id, code, topic, questions, votes: {} };
  surveys.set(id, survey);
  return { id, code };
};

export const getSurveyByCode = (code) => {
  return Array.from(surveys.values()).find((s) => s.code === code);
};

export const getSurveyById = (id) => surveys.get(Number(id));

export const saveVote = (surveyId, userId, answers) => {
  const survey = surveys.get(Number(surveyId));
  if (!survey) return false;

  // Инициализируем голосование для пользователя
  if (!survey.votes[userId]) {
    survey.votes[userId] = answers;
    return true;
  }
  return false; // Пользователь уже голосовал
};

export const getResults = (surveyId) => {
  const survey = surveys.get(Number(surveyId));
  if (!survey) return null;

  const total = Object.keys(survey.votes).length;
  const distribution = {};

  // Подсчет голосов по каждому вопросу
  survey.questions.forEach((q, qIndex) => {
    distribution[qIndex] = {};
    q.options.forEach((opt) => {
      distribution[qIndex][opt] = 0;
    });
  });

  Object.values(survey.votes).forEach((userAnswers) => {
    userAnswers.forEach((answer, qIndex) => {
      if (distribution[qIndex] && distribution[qIndex][answer] !== undefined) {
        distribution[qIndex][answer]++;
      }
    });
  });

  // Перевод в проценты
  const distributionPercent = {};
  Object.keys(distribution).forEach((qIndex) => {
    distributionPercent[qIndex] = {};
    Object.keys(distribution[qIndex]).forEach((opt) => {
      const count = distribution[qIndex][opt];
      distributionPercent[qIndex][opt] = total > 0 ? Math.round((count / total) * 100) : 0;
    });
  });

  return { total, distribution: distributionPercent };
};

// Управление состояниями пользователя (FSM)
export const getUserState = (platform, userId) => {
  return userStates.get(`${platform}_${userId}`) || { state: 'IDLE', data: {} };
};

export const setUserState = (platform, userId, state, data = {}) => {
  userStates.set(`${platform}_${userId}`, { state, data });
};

export const clearUserState = (platform, userId) => {
  userStates.delete(`${platform}_${userId}`);
};

// Для тестов (сброс состояния)
export const _resetStore = () => {
  surveys.clear();
  userStates.clear();
  nextId = 1;
};