// Fallback Data when Supabase is not connected
export const DUMMY_CODE = "1234"; // Universal Unlock Code for Reviewiers

export const MOCK_ZONES = [
    {
        id: 1,
        name: 'TedX Origin',
        lat: 12.9716,
        lng: 77.5946,
        code: DUMMY_CODE,
        question: "What year was the first TEDx event held at this campus?",
        answer: "2015",
        options: ["2012", "2015", "2018", "2020"],
        clues: ["It started a decade ago.", "Look for the plaque near existing auditorium.", "The year implies a mid-decade start."]
    },
    {
        id: 2,
        name: 'Innovation Hub',
        lat: 12.9720,
        lng: 77.5950,
        code: DUMMY_CODE,
        question: "Which famous alumni inaugurated the Innovation Hub?",
        answer: "Dr. Rao",
        options: ["Dr. Rao", "Elon Musk", "Sundar Pichai", "Unknown"],
        clues: ["A medical visionary.", "His name is on the building.", "Dr. R..."]
    },
    {
        id: 3,
        name: 'Main Gate',
        lat: 12.9730,
        lng: 77.5960,
        code: DUMMY_CODE,
        question: "How many pillars support the Main Gate arch?",
        answer: "4",
        options: ["2", "4", "6", "8"],
        clues: ["Count the corners.", "Even number.", "Less than 5."]
    },
    {
        id: 4,
        name: 'Library',
        lat: 12.9740,
        lng: 77.5970,
        code: DUMMY_CODE,
        question: "What color is the library roof?",
        answer: "Red",
        options: ["Blue", "Green", "Red", "Yellow"],
        clues: ["Look up.", "Color of passion.", "Same as this app."]
    },
    {
        id: 5,
        name: 'Canteen',
        lat: 12.9750,
        lng: 77.5980,
        code: DUMMY_CODE,
        question: "The canteen is named after which flower?",
        answer: "Lotus",
        options: ["Rose", "Lotus", "Lily", "Tulip"],
        clues: ["Grows in water.", "National flower.", "Pink petals."]
    },
    {
        id: 6,
        name: 'Deans Office',
        lat: 12.9760,
        lng: 77.5990,
        code: DUMMY_CODE,
        question: "Final Question: Who is the Dean?",
        answer: "Smith",
        options: ["Smith", "Doe", "Jones", "Brown"],
        clues: ["Mr. S.", "Has a generic name.", "Agent ..."]
    },
];
