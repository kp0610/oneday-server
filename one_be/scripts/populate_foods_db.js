import dotenv from 'dotenv';
import db from '../config/db.js';

dotenv.config();

const categories = {
    한식: {
        count: 5000,
        adjectives: ['매콤한', '달콤한', '짭짤한', '시원한', '고소한', '새콤달콤한', '얼큰한', '담백한', '바삭한', '부드러운', '전통', '궁중'],
        bases: ['밥', '국', '찌개', '볶음', '구이', '찜', '전', '무침', '김치', '나물', '면', '죽', '탕'],
        proteins: ['소고기', '돼지고기', '닭고기', '오리고기', '해물', '두부', '계란'],
        vegetables: ['김치', '콩나물', '시금치', '버섯', '파', '양파', '마늘', '배추', '무', '호박'],
        endings: ['덮밥', '정식', '백반', '비빔밥', '국밥', '전골', '볶음밥', '튀김', '조림', '강정', '김밥', '만두', '떡볶이'],
        baseMacros: { calories: 300, carbs: 40, protein: 15, fat: 10 },
        macroVariance: { calories: 150, carbs: 20, protein: 10, fat: 8 }
    },
    양식: {
        count: 500,
        adjectives: ['크리미한', '매콤한', '담백한', '풍성한', '오븐에 구운', '구운', '프리미엄', '수제', '클래식'],
        bases: ['파스타', '스테이크', '피자', '샐러드', '버거', '샌드위치', '수프', '리조또', '오믈렛', '그라탕'],
        proteins: ['소고기', '돼지고기', '닭고기', '새우', '연어', '치즈'],
        vegetables: ['토마토', '양파', '피망', '버섯', '브로콜리', '시금치', '루꼴라'],
        endings: ['앤 칩스', '와인 소스', '크림 소스', '토마토 소스', '버섯 리조또', '베이컨'],
        baseMacros: { calories: 450, carbs: 50, protein: 25, fat: 20 },
        macroVariance: { calories: 200, carbs: 25, protein: 15, fat: 12 }
    },
    중식: {
        count: 500,
        adjectives: ['얼큰한', '매운', '달콤한', '바삭한', '향긋한', '고급', '사천식'],
        bases: ['짜장면', '짬뽕', '볶음밥', '탕수육', '깐풍기', '마파두부', '고추잡채', '만두', '볶음', '찜'],
        proteins: ['돼지고기', '닭고기', '새우', '소고기'],
        vegetables: ['양파', '피망', '청경채', '숙주', '버섯'],
        endings: ['밥', '면', '덮밥', '특선', '정식', '볶음'],
        baseMacros: { calories: 500, carbs: 60, protein: 20, fat: 25 },
        macroVariance: { calories: 250, carbs: 30, protein: 15, fat: 15 }
    },
    일식: {
        count: 500,
        adjectives: ['신선한', '담백한', '바삭한', '특선', '모듬', '달콤짭짤한'],
        bases: ['초밥', '덮밥', '라멘', '우동', '돈까스', '튀김', '정식', '벤또', '야끼', '우동'],
        proteins: ['연어', '참치', '새우', '장어', '돼지고기', '닭고기'],
        vegetables: ['아보카도', '오이', '파', '양파', '김', '와사비'],
        endings: ['정식', '세트', '동', '벤', '소바', '나베'],
        baseMacros: { calories: 400, carbs: 55, protein: 20, fat: 15 },
        macroVariance: { calories: 180, carbs: 25, protein: 10, fat: 10 }
    },
    기타: {
        count: 500,
        adjectives: ['매콤한', '이국적인', '정통', '스파이시', '상큼한', '따뜻한'],
        bases: ['타코', '퀘사디아', '카레', '파에야', '쌀국수', '케밥', '부리또', '수프', '샐러드', '피쉬앤칩스'],
        proteins: ['소고기', '닭고기', '양고기', '해산물', '콩'],
        vegetables: ['고수', '양파', '토마토', '콩', '감자', '피망', '옥수수'],
        endings: ['라이스', '세트', '볼', '플래터'],
        baseMacros: { calories: 350, carbs: 45, protein: 18, fat: 12 },
        macroVariance: { calories: 150, carbs: 20, protein: 10, fat: 8 }
    }
};

const generatedFoodNames = new Set(); // To ensure unique names

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateFoodName(categoryConfig) {
    let name;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop for impossible combinations

    do {
        const parts = [];
        if (Math.random() < 0.6 && categoryConfig.adjectives.length > 0) parts.push(getRandomElement(categoryConfig.adjectives));
        if (Math.random() < 0.7 && categoryConfig.proteins.length > 0) parts.push(getRandomElement(categoryConfig.proteins));
        if (Math.random() < 0.5 && categoryConfig.vegetables.length > 0) parts.push(getRandomElement(categoryConfig.vegetables));
        parts.push(getRandomElement(categoryConfig.bases));
        if (Math.random() < 0.3 && categoryConfig.endings.length > 0) parts.push(getRandomElement(categoryConfig.endings));

        name = parts.join(' ').trim();
        attempts++;
    } while (generatedFoodNames.has(name) && attempts < maxAttempts);

    if (name === "" || generatedFoodNames.has(name)) {
        // Fallback for very simple names or if combinations are exhausted
        name = `${getRandomElement(categoryConfig.adjectives || ['맛있는'])} ${getRandomElement(categoryConfig.bases)} ${Math.random().toString(36).substring(7)}`;
    }
    generatedFoodNames.add(name);
    return name;
}

function generateMacro(base, variance) {
    return (base + (Math.random() * variance * 2) - variance).toFixed(2);
}

async function countFoodsDB() {
    let connection;
    try {
        connection = await db.getConnection();
        const [rows] = await connection.query('SELECT COUNT(*) AS foodCount FROM foods');
        console.log(`Current number of foods in DB: ${rows[0].foodCount}`);
    } catch (error) {
        console.error("Error counting foods in database:", error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
