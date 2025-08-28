document.addEventListener('DOMContentLoaded', () => {
    // MODALS AND SCREENS
    const startScreen = document.getElementById('start-screen');
    const successModal = document.getElementById('success-modal');
    const gameContainer = document.querySelector('.container');

    // GAME ELEMENTS
    const gridElement = document.getElementById('crossword-grid');
    const numberBankElement = document.getElementById('number-bank');
    
    // BUTTONS
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const resetBtn = document.getElementById('reset-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    let currentDifficulty = 'easy';
    let selectedValue = null;
    let selectedElement = null;

    // 'B' signifies a blank, non-interactive cell
    const B = 'B'; 

    const puzzles = {
        easy: {
            //  1 + [3] = 4
            //  +   B   +
            // [2] + 4 = [6]
            //  =   B   =
            //  3 + [7] = 10
            grid: [
                [1,   '+', B,   '=', 4],
                ['+', B,   '+', B,   B],
                [B,   '+', 4,   '=', B],
                ['=', B,   '=', B,   B],
                [3,   '+', B,   '=', 10]
            ],
            // Values in empty cells are stored here as objects with their coords
            emptyCells: [ 
                { r: 0, c: 2, value: 3 },
                { r: 2, c: 0, value: 2 },
                { r: 2, c: 4, value: 6 },
                { r: 4, c: 2, value: 7 },
            ],
            numbers: [3, 2, 6, 7]
        },
        medium: {
            // [9] +  8  = 17
            //  +    B    +
            //  4  + [5] = [9]
            //  =    B    =
            // [13] + 13 = 26
            grid: [
                [B, '+', 8, '=', 17],
                ['+', B, '+', B, B],
                [4, '+', B, '=', B],
                ['=', B, '=', B, B],
                [B, '+', 13, '=', 26]
            ],
            emptyCells: [
                { r: 0, c: 0, value: 9 },
                { r: 2, c: 2, value: 5 },
                { r: 2, c: 4, value: 9 },
                { r: 4, c: 0, value: 13 },
            ],
            numbers: [9, 5, 9, 13]
        },
        hard: {
            //  2  + 17  = [19]
            //  +    B    +
            // [9] +  5  = [14]
            //  =    B    =
            //  11 + [22] = 33
            grid: [
                [2, '+', 17, '=', B],
                ['+', B, '+', B, B],
                [B, '+', 5, '=', B],
                ['=', B, '=', B, B],
                [11, '+', B, '=', 33]
            ],
            emptyCells: [
                { r: 0, c: 4, value: 19 },
                { r: 2, c: 0, value: 9 },
                { r: 2, c: 4, value: 14 },
                { r: 4, c: 2, value: 22 },
            ],
            numbers: [19, 9, 14, 22]
        }
    };

    function startGame(difficulty) {
        currentDifficulty = difficulty;
        generatePuzzle(difficulty);
        startScreen.classList.remove('visible');
        gameContainer.style.display = 'block';
    }

    function generatePuzzle(difficulty) {
        const puzzle = puzzles[difficulty];
        const layout = puzzle.grid;
        gridElement.innerHTML = '';
        numberBankElement.innerHTML = '';
        gridElement.style.gridTemplateColumns = `repeat(${layout[0].length}, 50px)`;

        layout.forEach((row, r) => {
            row.forEach((content, c) => {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (puzzle.emptyCells.some(ec => ec.r === r && ec.c === c)) {
                    cell.classList.add('empty');
                    cell.addEventListener('click', () => onCellClick(cell));
                } else if (content === B) {
                    cell.classList.add('blank');
                } else {
                    cell.textContent = content;
                    cell.classList.add('static');
                }
                gridElement.appendChild(cell);
            });
        });

        puzzle.numbers.sort((a, b) => a - b).forEach((num, index) => {
            const numItem = document.createElement('div');
            numItem.classList.add('number-item');
            numItem.textContent = num;
            numItem.dataset.id = `bank-${index}`;
            numItem.addEventListener('click', () => selectNumberFromBank(num, numItem));
            numberBankElement.appendChild(numItem);
        });
        
        clearSelection();
    }

    function onCellClick(cell) {
        if (selectedValue !== null) { // Place a selected number
            placeNumber(cell);
        } else if (cell.textContent !== '') { // Pick up a number from the grid
            pickupNumberFromGrid(cell);
        }
    }

    function selectNumberFromBank(num, element) {
        if (element.classList.contains('used')) return;
        if (selectedElement === element) {
            clearSelection();
            return;
        }
        clearSelection();
        selectedValue = num;
        selectedElement = element;
        element.classList.add('selected');
    }

    function pickupNumberFromGrid(cell) {
        const num = parseInt(cell.textContent);
        const correspondingBankItem = Array.from(numberBankElement.children).find(
            el => parseInt(el.textContent) === num && el.classList.contains('used')
        );
        if (correspondingBankItem) {
            correspondingBankItem.classList.remove('used');
        }
        cell.textContent = '';
        cell.classList.remove('correct', 'incorrect');
        validateEquations(); // Re-validate after removing a number
    }

    function placeNumber(targetCell) {
        if (targetCell.textContent !== '') { // If cell is already filled
            pickupNumberFromGrid(targetCell); // Pick up the existing number first
        }
        targetCell.textContent = selectedValue;
        selectedElement.classList.add('used');
        clearSelection();
        validateEquations();
    }
    
    function clearSelection() {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedValue = null;
        selectedElement = null;
    }

    function validateEquations() {
        const gridCells = gridElement.querySelectorAll('.cell');
        gridCells.forEach(c => c.classList.remove('correct', 'incorrect'));
        
        const equations = findEquations();
        let allEquationsCorrect = true;
        let allEmptyCellsFilled = true;

        puzzles[currentDifficulty].emptyCells.forEach(ec => {
            const cell = gridElement.querySelector(`[data-row='${ec.r}'][data-col='${ec.c}']`);
            if (!cell.textContent) {
                allEmptyCellsFilled = false;
            }
        });

        equations.forEach(eq => {
            const cell1 = gridElement.querySelector(`[data-row='${eq.r1}'][data-col='${eq.c1}']`);
            const cell2 = gridElement.querySelector(`[data-row='${eq.r2}'][data-col='${eq.c2}']`);
            const resultCell = gridElement.querySelector(`[data-row='${eq.rr}'][data-col='${eq.cr}']`);

            const val1 = parseInt(cell1.textContent);
            const val2 = parseInt(cell2.textContent);
            const resultVal = parseInt(resultCell.textContent);

            if (!isNaN(val1) && !isNaN(val2) && !isNaN(resultVal)) {
                const isCorrect = (val1 + val2 === resultVal);
                const classToAdd = isCorrect ? 'correct' : 'incorrect';
                
                if (!cell1.classList.contains('static')) cell1.classList.add(classToAdd);
                if (!cell2.classList.contains('static')) cell2.classList.add(classToAdd);
                if (!resultCell.classList.contains('static')) resultCell.classList.add(classToAdd);

                if (!isCorrect) allEquationsCorrect = false;
            } else {
                allEquationsCorrect = false;
            }
        });

        if (allEmptyCellsFilled && allEquationsCorrect) {
            successModal.classList.add('visible');
        }
    }

    function findEquations() {
        const puzzle = puzzles[currentDifficulty];
        const grid = puzzle.grid;
        const equations = [];
        // Find horizontal equations
        for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[r].length - 4; c++) {
                if (grid[r][c+1] === '+' && grid[r][c+3] === '=') {
                    equations.push({r1: r, c1: c, r2: r, c2: c + 2, rr: r, cr: c + 4});
                }
            }
        }
        // Find vertical equations
        for (let r = 0; r < grid.length - 4; r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r+1][c] === '+' && grid[r+3][c] === '=') {
                    equations.push({r1: r, c1: c, r2: r + 2, c2: c, rr: r + 4, cr: c});
                }
            }
        }
        return equations;
    }

    // --- Event Listeners ---
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => startGame(btn.id.replace('-btn', '')));
    });

    resetBtn.addEventListener('click', () => generatePuzzle(currentDifficulty));
    
    playAgainBtn.addEventListener('click', () => {
        successModal.classList.remove('visible');
        generatePuzzle(currentDifficulty);
    });

    nextLevelBtn.addEventListener('click', () => {
        successModal.classList.remove('visible');
        const difficulties = Object.keys(puzzles);
        const currentIndex = difficulties.indexOf(currentDifficulty);
        const nextIndex = (currentIndex + 1) % difficulties.length;
        startGame(difficulties[nextIndex]);
    });
});