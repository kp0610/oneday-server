const express = require('express');
const router = express.Router();

// In-memory food database
const foodDatabase = [
    // 밥/죽/면 (Grains/Porridge/Noodles)
    { name: '흰 쌀밥', calories: 313, carbs: 68.7, protein: 5.9, fat: 0.5 },
    { name: '현미밥', calories: 321, carbs: 71.0, protein: 6.5, fat: 1.0 },
    { name: '보리밥', calories: 294, carbs: 64.2, protein: 8.3, fat: 1.0 },
    { name: '잡곡밥', calories: 304, carbs: 66.0, protein: 7.2, fat: 1.5 },
    { name: '귀리밥', calories: 310, carbs: 56.0, protein: 11.0, fat: 5.0 },
    { name: '김밥 (야채)', calories: 485, carbs: 65.0, protein: 15.0, fat: 18.0 },
    { name: '김밥 (참치)', calories: 570, carbs: 60.0, protein: 20.0, fat: 28.0 },
    { name: '김치볶음밥', calories: 605, carbs: 75.0, protein: 18.0, fat: 25.0 },
    { name: '새우볶음밥', calories: 550, carbs: 80.0, protein: 20.0, fat: 15.0 },
    { name: '주먹밥 (참치마요)', calories: 320, carbs: 40.0, protein: 10.0, fat: 13.0 },
    { name: '비빔밥', calories: 599, carbs: 90.0, protein: 25.0, fat: 18.0 },
    { name: '쌀죽', calories: 150, carbs: 30.0, protein: 3.0, fat: 1.0 },
    { name: '전복죽', calories: 200, carbs: 35.0, protein: 10.0, fat: 2.0 },
    { name: '호박죽', calories: 220, carbs: 50.0, protein: 5.0, fat: 1.0 },
    { name: '라면 (일반)', calories: 500, carbs: 65.0, protein: 10.0, fat: 22.0 },
    { name: '신라면', calories: 505, carbs: 68.0, protein: 9.0, fat: 21.0 },
    { name: '짜장면', calories: 797, carbs: 136.0, protein: 23.0, fat: 17.0 },
    { name: '짬뽕', calories: 788, carbs: 95.0, protein: 36.0, fat: 30.0 },
    { name: '냉면 (물)', calories: 450, carbs: 85.0, protein: 15.0, fat: 4.0 },
    { name: '냉면 (비빔)', calories: 580, carbs: 100.0, protein: 18.0, fat: 10.0 },
    { name: '비빔국수', calories: 425, carbs: 75.0, protein: 12.0, fat: 8.0 },
    { name: '잔치국수', calories: 380, carbs: 70.0, protein: 14.0, fat: 5.0 },
    { name: '칼국수', calories: 470, carbs: 80.0, protein: 15.0, fat: 9.0 },
    { name: '떡볶이', calories: 300, carbs: 60.0, protein: 8.0, fat: 4.0 },
    { name: '라볶이', calories: 550, carbs: 90.0, protein: 12.0, fat: 15.0 },
    { name: '우동', calories: 570, carbs: 95.0, protein: 15.0, fat: 15.0 },
    { name: '토마토 스파게티', calories: 650, carbs: 80.0, protein: 25.0, fat: 25.0 },
    { name: '크림 파스타', calories: 800, carbs: 70.0, protein: 20.0, fat: 45.0 },
    { name: '알리오 올리오', calories: 550, carbs: 60.0, protein: 15.0, fat: 28.0 },
    { name: '수제비', calories: 450, carbs: 85.0, protein: 10.0, fat: 5.0 },

    // 국/찌개/탕 (Soups/Stews)
    { name: '김치찌개', calories: 463, carbs: 9.3, protein: 20.1, fat: 34.6 },
    { name: '된장찌개', calories: 202, carbs: 12.0, protein: 14.5, fat: 9.2 },
    { name: '순두부찌개', calories: 250, carbs: 8.0, protein: 18.0, fat: 15.0 },
    { name: '부대찌개', calories: 700, carbs: 30.0, protein: 35.0, fat: 50.0 },
    { name: '청국장', calories: 250, carbs: 15.0, protein: 20.0, fat: 12.0 },
    { name: '동태찌개', calories: 300, carbs: 10.0, protein: 30.0, fat: 15.0 },
    { name: '미역국', calories: 93, carbs: 7.0, protein: 5.0, fat: 5.0 },
    { name: '소고기무국', calories: 150, carbs: 5.0, protein: 15.0, fat: 7.0 },
    { name: '갈비탕', calories: 550, carbs: 10.0, protein: 40.0, fat: 38.0 },
    { name: '설렁탕', calories: 400, carbs: 5.0, protein: 35.0, fat: 25.0 },
    { name: '삼계탕', calories: 900, carbs: 15.0, protein: 60.0, fat: 65.0 },
    { name: '추어탕', calories: 450, carbs: 20.0, protein: 30.0, fat: 28.0 },
    { name: '육개장', calories: 450, carbs: 15.0, protein: 25.0, fat: 30.0 },
    { name: '감자탕', calories: 600, carbs: 25.0, protein: 50.0, fat: 35.0 },
    
    // 구이/찜/볶음/전 (Grilled/Steamed/Stir-fried/Pancakes)
    { name: '불고기', calories: 471, carbs: 20.0, protein: 35.0, fat: 28.0 },
    { name: '제육볶음', calories: 550, carbs: 25.0, protein: 40.0, fat: 35.0 },
    { name: '오징어볶음', calories: 350, carbs: 15.0, protein: 30.0, fat: 18.0 },
    { name: '닭갈비', calories: 600, carbs: 40.0, protein: 50.0, fat: 25.0 },
    { name: '갈비찜', calories: 580, carbs: 30.0, protein: 45.0, fat: 30.0 },
    { name: '안동찜닭', calories: 750, carbs: 50.0, protein: 60.0, fat: 35.0 },
    { name: '아귀찜', calories: 500, carbs: 30.0, protein: 60.0, fat: 15.0 },
    { name: '삼겹살 구이 (200g)', calories: 660, carbs: 0, protein: 34.0, fat: 58.0 },
    { name: '목살 구이 (200g)', calories: 500, carbs: 0, protein: 40.0, fat: 38.0 },
    { name: '소갈비 구이 (200g)', calories: 600, carbs: 5.0, protein: 45.0, fat: 45.0 },
    { name: '장어구이', calories: 450, carbs: 10.0, protein: 35.0, fat: 30.0 },
    { name: '고등어 구이', calories: 350, carbs: 1.0, protein: 40.0, fat: 20.0 },
    { name: '갈치구이', calories: 280, carbs: 1.0, protein: 30.0, fat: 18.0 },
    { name: '계란찜', calories: 120, carbs: 3.0, protein: 10.0, fat: 8.0 },
    { name: '계란후라이', calories: 90, carbs: 0.5, protein: 6.0, fat: 7.0 },
    { name: '삶은 계란', calories: 77, carbs: 0.6, protein: 6.3, fat: 5.3 },
    { name: '계란말이', calories: 150, carbs: 2.0, protein: 12.0, fat: 10.0 },
    { name: '두부김치', calories: 400, carbs: 20.0, protein: 25.0, fat: 25.0 },
    { name: '잡채', calories: 291, carbs: 35.0, protein: 8.0, fat: 12.0 },
    { name: '파전', calories: 400, carbs: 40.0, protein: 15.0, fat: 20.0 },
    { name: '김치전', calories: 350, carbs: 35.0, protein: 10.0, fat: 18.0 },
    { name: '감자전', calories: 300, carbs: 45.0, protein: 5.0, fat: 12.0 },

    // 반찬 (Side Dishes)
    { name: '배추김치', calories: 29, carbs: 4.0, protein: 2.0, fat: 0.5 },
    { name: '깍두기', calories: 30, carbs: 5.0, protein: 1.5, fat: 0.3 },
    { name: '열무김치', calories: 25, carbs: 3.5, protein: 1.8, fat: 0.4 },
    { name: '오이무침', calories: 40, carbs: 6.0, protein: 1.0, fat: 1.5 },
    { name: '콩나물무침', calories: 50, carbs: 5.0, protein: 4.0, fat: 2.0 },
    { name: '시금치나물', calories: 60, carbs: 7.0, protein: 3.0, fat: 2.5 },
    { name: '멸치볶음', calories: 150, carbs: 10.0, protein: 15.0, fat: 5.0 },
    { name: '진미채볶음', calories: 250, carbs: 25.0, protein: 20.0, fat: 8.0 },
    { name: '장조림 (소고기)', calories: 210, carbs: 10.0, protein: 25.0, fat: 8.0 },
    { name: '두부조림', calories: 180, carbs: 10.0, protein: 15.0, fat: 9.0 },

    // 양식 (Western)
    { name: '피자 (페퍼로니, 1조각)', calories: 285, carbs: 36.0, protein: 12.0, fat: 10.0 },
    { name: '피자 (치즈, 1조각)', calories: 270, carbs: 35.0, protein: 13.0, fat: 9.0 },
    { name: '치즈버거', calories: 303, carbs: 28.0, protein: 15.0, fat: 15.0 },
    { name: '더블 불고기 버거', calories: 583, carbs: 45.0, protein: 29.0, fat: 33.0 },
    { name: '감자튀김 (M)', calories: 380, carbs: 48.0, protein: 4.0, fat: 20.0 },
    { name: '양파링', calories: 450, carbs: 50.0, protein: 5.0, fat: 25.0 },
    { name: '시저 샐러드', calories: 481, carbs: 15.0, protein: 20.0, fat: 40.0 },
    { name: '콥 샐러드', calories: 550, carbs: 20.0, protein: 30.0, fat: 40.0 },
    { name: '스테이크 (등심, 200g)', calories: 500, carbs: 0, protein: 50.0, fat: 35.0 },
    { name: '돈까스', calories: 576, carbs: 40.0, protein: 25.0, fat: 35.0 },
    { name: '샌드위치 (클럽)', calories: 500, carbs: 40.0, protein: 30.0, fat: 25.0 },
    { name: '후라이드 치킨 (1조각)', calories: 290, carbs: 12, protein: 20, fat: 17 },
    { name: '양념 치킨 (1조각)', calories: 350, carbs: 20, protein: 22, fat: 20 },
    { name: '핫도그', calories: 300, carbs: 25.0, protein: 10.0, fat: 18.0 },
    
    // 과일 (Fruits)
    { name: '사과', calories: 95, carbs: 25, protein: 0.5, fat: 0.3 },
    { name: '바나나', calories: 105, carbs: 27, protein: 1.3, fat: 0.4 },
    { name: '오렌지', calories: 62, carbs: 15, protein: 1.2, fat: 0.2 },
    { name: '딸기 (100g)', calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3 },
    { name: '블루베리 (100g)', calories: 57, carbs: 14.5, protein: 0.7, fat: 0.3 },
    { name: '포도 (100g)', calories: 69, carbs: 18.1, protein: 0.6, fat: 0.2 },
    { name: '수박 (100g)', calories: 30, carbs: 7.6, protein: 0.6, fat: 0.2 },
    { name: '참외', calories: 31, carbs: 7.5, protein: 0.9, fat: 0.2 },
    { name: '토마토', calories: 22, carbs: 4.8, protein: 1.1, fat: 0.2 },
    { name: '방울토마토 (10개)', calories: 30, carbs: 6.0, protein: 1.5, fat: 0.3 },
    { name: '배', calories: 100, carbs: 26.0, protein: 0.6, fat: 0.2 },
    { name: '복숭아', calories: 59, carbs: 14.0, protein: 1.4, fat: 0.4 },
    { name: '자두', calories: 46, carbs: 11.0, protein: 0.7, fat: 0.3 },
    { name: '키위', calories: 61, carbs: 14.7, protein: 1.1, fat: 0.5 },
    { name: '파인애플 (100g)', calories: 50, carbs: 13.1, protein: 0.5, fat: 0.1 },
    { name: '망고', calories: 135, carbs: 35.0, protein: 1.0, fat: 0.5 },
    
    // 채소 (Vegetables)
    { name: '오이', calories: 15, carbs: 3.6, protein: 0.7, fat: 0.1 },
    { name: '당근', calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2 },
    { name: '양상추', calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2 },
    { name: '파프리카', calories: 31, carbs: 6.0, protein: 1.0, fat: 0.3 },
    { name: '브로콜리', calories: 55, carbs: 11.2, protein: 3.7, fat: 0.6 },
    { name: '콜리플라워', calories: 25, carbs: 5.0, protein: 1.9, fat: 0.3 },
    { name: '양파', calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1 },
    { name: '마늘', calories: 149, carbs: 33.1, protein: 6.4, fat: 0.5 },
    { name: '시금치', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4 },
    { name: '상추', calories: 5, carbs: 1.0, protein: 0.5, fat: 0.1 },
    { name: '깻잎', calories: 29, carbs: 4.0, protein: 2.9, fat: 0.8 },
    { name: '고구마', calories: 86, carbs: 20.1, protein: 1.6, fat: 0.1 },
    { name: '감자', calories: 77, carbs: 17.5, protein: 2.0, fat: 0.1 },
    { name: '단호박', calories: 66, carbs: 16.0, protein: 1.2, fat: 0.1 },
    { name: '애호박', calories: 17, carbs: 3.1, protein: 1.2, fat: 0.3 },
    { name: '가지', calories: 25, carbs: 5.9, protein: 1.0, fat: 0.2 },

    // 음료 (Beverages)
    { name: '물', calories: 0, carbs: 0, protein: 0, fat: 0 },
    { name: '아메리카노', calories: 5, carbs: 0, protein: 0.5, fat: 0 },
    { name: '카페 라떼', calories: 180, carbs: 15.0, protein: 10.0, fat: 9.0 },
    { name: '카푸치노', calories: 120, carbs: 10.0, protein: 8.0, fat: 6.0 },
    { name: '콜라', calories: 140, carbs: 38.0, protein: 0, fat: 0 },
    { name: '제로 콜라', calories: 0, carbs: 0, protein: 0, fat: 0 },
    { name: '사이다', calories: 104, carbs: 26.0, protein: 0, fat: 0 },
    { name: '오렌지 주스', calories: 112, carbs: 26.0, protein: 1.7, fat: 0.3 },
    { name: '녹차', calories: 0, carbs: 0, protein: 0, fat: 0 },
    { name: '우유', calories: 122, carbs: 11.0, protein: 8.0, fat: 5.0 },
    { name: '저지방 우유', calories: 83, carbs: 12.0, protein: 8.0, fat: 0.1 },
    { name: '두유', calories: 80, carbs: 8.0, protein: 6.0, fat: 4.0 },
    { name: '이온 음료', calories: 60, carbs: 15.0, protein: 0, fat: 0 },

    // 간식 (Snacks)
    { name: '감자칩', calories: 536, carbs: 50.0, protein: 6.0, fat: 35.0 },
    { name: '새우깡', calories: 450, carbs: 70.0, protein: 6.0, fat: 17.0 },
    { name: '초코파이', calories: 171, carbs: 25.0, protein: 1.5, fat: 7.0 },
    { name: '초콜릿', calories: 546, carbs: 60.0, protein: 5.0, fat: 30.0 },
    { name: '아이스크림 (바닐라)', calories: 207, carbs: 25.0, protein: 3.0, fat: 10.0 },
    { name: '프로틴바', calories: 200, carbs: 20.0, protein: 20.0, fat: 8.0 },
    { name: '도넛', calories: 250, carbs: 30.0, protein: 3.0, fat: 13.0 },
    { name: '치즈케이크', calories: 321, carbs: 23.0, protein: 6.0, fat: 23.0 },
    { name: '쿠키', calories: 80, carbs: 10.0, protein: 1.0, fat: 4.0 },
    { name: '팝콘 (소금맛)', calories: 350, carbs: 40.0, protein: 5.0, fat: 20.0 },
    { name: '붕어빵', calories: 200, carbs: 35.0, protein: 6.0, fat: 4.0 },
    { name: '호떡', calories: 230, carbs: 45.0, protein: 4.0, fat: 5.0 },
    { name: '군고구마', calories: 180, carbs: 41.0, protein: 2.0, fat: 0.2 },
    { name: '떡', calories: 230, carbs: 50.0, protein: 4.0, fat: 1.0 },
    { name: '에너지 드링크', calories: 110, carbs: 27.0, protein: 0, fat: 0 }
];

/**
 * @param {string} search - The search query.
 */
router.get('/', (req, res) => {
    const { search } = req.query;

    if (!search) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        const matches = foodDatabase.filter(food => 
            food.name.toLowerCase().includes(search.toLowerCase())
        );
        console.log(`Found ${matches.length} matches for "${search}".`);
        console.log('Returning the first 15 matches.');
        res.json(matches.slice(0, 15)); // Return top 15 matches
    } catch (error) {
        console.error('Error searching foods:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
