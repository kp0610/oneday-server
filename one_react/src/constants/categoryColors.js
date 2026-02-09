export const PREDEFINED_COLORS = [
    '#FFC0CB', '#FFD700', '#ADD8E6', '#90EE90', '#FFB6C1',
    '#FFDAB9', '#E6E6FA', '#FFFACD', '#E0FFFF', '#F0FFF0',
    '#FFE4E1', '#D3D3D3', '#B0E0E6', '#FFDEAD', '#F5DEB3'
];

export const BASE_CATEGORY_NAMES = ['공부', '운동', '취미', '알바'];

export const BASE_CATEGORY_COLORS_MAP = BASE_CATEGORY_NAMES.reduce((acc, name, index) => {
    acc[name] = PREDEFINED_COLORS[index];
    return acc;
}, {});
