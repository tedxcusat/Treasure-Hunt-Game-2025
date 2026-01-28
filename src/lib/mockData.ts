// Fallback Data when Supabase is not connected
export const DUMMY_CODE = "1234"; // Universal Unlock Code for Reviewiers

export const MOCK_ZONES = [
    {
        id: 1,
        name: 'Administrative Office (ADM)',
        lat: 10.04304061894997,
        lng: 76.32450554205566,
        code: DUMMY_CODE,
        question: "What geometric shape is the main entrance circle effectively?",
        answer: "Circle",
        options: ["Circle", "Triangle", "Square", "Hexagon"],
        clue: "The heart of the campus power structure. Go to the coordinates near the main entrance circle."
    },
    {
        id: 2,
        name: 'University Library',
        lat: 10.04466182710918,
        lng: 76.3250271941694,
        code: DUMMY_CODE,
        question: "The library stands as a repository of knowledge opposite which major building?",
        answer: "SMS",
        options: ["SMS", "CITTIC", "Amenity", "ADM"],
        clue: "A silent guardian of wisdom, standing directly opposite the School of Management Studies."
    },
    {
        id: 3,
        name: 'Butterfly Park',
        lat: 10.043480971912379,
        lng: 76.32533335184156,
        code: DUMMY_CODE,
        question: "This park is located near which scientific department?",
        answer: "Applied Chemistry",
        options: ["Applied Chemistry", "Physics", "Maths", "Biology"],
        clue: "Nature's winged beauty thrives here. Seek the green space near the Dept. of Applied Chemistry."
    },
    {
        id: 4,
        name: 'School of Mgmt. Studies (SMS)',
        lat: 10.043320778723304,
        lng: 76.32738279602225,
        code: DUMMY_CODE,
        question: "This building is located next to which major landmark?",
        answer: "Main Circle",
        options: ["Main Circle", "Library", "Canteen", "Hostel"],
        clue: "Where future leaders are forged. It stands proud next to the Main Circle."
    },
    {
        id: 5,
        name: 'Amenity Centre',
        lat: 10.042797743518628,
        lng: 76.32852206718607,
        code: DUMMY_CODE,
        question: "The Amenity Centre is located near the shops on which road?",
        answer: "University Road",
        options: ["University Road", "Highway", "Main Ave", "Back Lane"],
        clue: "A place for goods and gathering. Find it near the University Road shops."
    },
    {
        id: 6,
        name: 'CITTIC',
        lat: 10.041249144581949,
        lng: 76.32815209602218,
        code: DUMMY_CODE,
        question: "CITTIC is the center for?",
        answer: "Innovation",
        options: ["Innovation", "Administration", "Recreation", "Examination"],
        clue: "Where ideas are born and startups rise. Located near the Guest House."
    },
];
