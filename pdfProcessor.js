// pdfProcessor.js

const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Extract text from PDF and convert it to flashcard questions and answers.
 * @param {string} pdfPath - The path to the PDF file.
 * @returns {Promise<Array<{ question: string, answer: string }>>} - Array of flashcard objects.
 */
async function extractFlashcards(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);

    const flashcards = [];
    const lines = data.text.split('\n');

    lines.forEach((line, index) => {
        if (line.trim() !== '') {
            const questionAnswer = line.split('?');
            if (questionAnswer.length === 2) {
                flashcards.push({ question: questionAnswer[0] + '?', answer: questionAnswer[1].trim() });
            }
        }
    });

    return flashcards;
}

module.exports = {
    extractFlashcards,
};