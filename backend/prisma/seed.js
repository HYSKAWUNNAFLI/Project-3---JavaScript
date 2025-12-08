"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const topics = [
    {
        name: 'Đếm số & so sánh',
        gradeLevel: 1,
        description: 'Đếm, so sánh số tự nhiên nhỏ hơn 100.',
        questions: [
            {
                prompt: 'Số nào lớn hơn: 42 hay 24?',
                choices: ['42', '24', 'Bằng nhau', 'Không xác định'],
                answerIndex: 0,
                difficulty: client_1.Difficulty.EASY
            },
            {
                prompt: 'Điền số còn thiếu: 19, 20, __, 22',
                choices: ['19', '20', '21', '23'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.EASY
            },
            {
                prompt: 'Số lớn nhất có 1 chữ số là gì?',
                choices: ['8', '9', '10', '11'],
                answerIndex: 1,
                difficulty: client_1.Difficulty.MEDIUM
            }
        ]
    },
    {
        name: 'Cộng trừ trong phạm vi 100',
        gradeLevel: 2,
        description: 'Cộng trừ số có hai chữ số.',
        questions: [
            {
                prompt: '35 + 27 = ?',
                choices: ['52', '60', '62', '64'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.MEDIUM
            },
            {
                prompt: '90 - 45 = ?',
                choices: ['35', '40', '45', '55'],
                answerIndex: 1,
                difficulty: client_1.Difficulty.MEDIUM
            },
            {
                prompt: '17 + 8 = ?',
                choices: ['23', '25', '26', '27'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.EASY
            }
        ]
    },
    {
        name: 'Nhân chia cơ bản',
        gradeLevel: 3,
        description: 'Bảng cửu chương và chia đơn giản.',
        questions: [
            {
                prompt: '7 x 8 = ?',
                choices: ['54', '56', '58', '64'],
                answerIndex: 1,
                difficulty: client_1.Difficulty.MEDIUM
            },
            {
                prompt: '36 : 6 = ?',
                choices: ['5', '6', '7', '8'],
                answerIndex: 1,
                difficulty: client_1.Difficulty.MEDIUM
            },
            {
                prompt: '9 x 9 = ?',
                choices: ['72', '80', '81', '90'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.HARD
            }
        ]
    },
    {
        name: 'Phân số cơ bản',
        gradeLevel: 4,
        description: 'Đọc, so sánh và rút gọn phân số đơn giản.',
        questions: [
            {
                prompt: 'Phân số nào lớn hơn: 1/2 hay 2/3?',
                choices: ['1/2', '2/3', 'Bằng nhau', 'Không xác định'],
                answerIndex: 1,
                difficulty: client_1.Difficulty.MEDIUM
            },
            {
                prompt: 'Rút gọn phân số 4/8 thành:',
                choices: ['1/2', '2/4', '3/6', '2/3'],
                answerIndex: 0,
                difficulty: client_1.Difficulty.EASY
            },
            {
                prompt: 'Giá trị của 3/5 + 1/5 là:',
                choices: ['4/10', '3/10', '4/5', '1/1'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.MEDIUM
            }
        ]
    },
    {
        name: 'Hình học cơ bản',
        gradeLevel: 5,
        description: 'Chu vi, diện tích hình tam giác, chữ nhật.',
        questions: [
            {
                prompt: 'Chu vi hình chữ nhật có chiều dài 10cm và chiều rộng 4cm là:',
                choices: ['14cm', '20cm', '24cm', '28cm'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.MEDIUM
            },
            {
                prompt: 'Diện tích hình tam giác đáy 12cm, chiều cao 5cm là:',
                choices: ['25cm²', '30cm²', '32cm²', '60cm²'],
                answerIndex: 1,
                difficulty: client_1.Difficulty.HARD
            },
            {
                prompt: 'Một hình vuông có cạnh 7cm. Chu vi là:',
                choices: ['14cm', '21cm', '28cm', '49cm'],
                answerIndex: 2,
                difficulty: client_1.Difficulty.EASY
            }
        ]
    }
];
async function main() {
    for (const topic of topics) {
        const topicRecord = await prisma.topic.upsert({
            where: { name_gradeLevel: { name: topic.name, gradeLevel: topic.gradeLevel } },
            update: { description: topic.description },
            create: {
                name: topic.name,
                gradeLevel: topic.gradeLevel,
                description: topic.description
            }
        });
        await prisma.question.deleteMany({ where: { topicId: topicRecord.id } });
        await prisma.question.createMany({
            data: topic.questions.map((q) => ({
                topicId: topicRecord.id,
                prompt: q.prompt,
                choices: q.choices,
                answerIndex: q.answerIndex,
                difficulty: q.difficulty,
                explanation: ''
            }))
        });
    }
    console.log('Seed data loaded.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
