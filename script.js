document.addEventListener('DOMContentLoaded', async () => {
    // MODALS AND SCREENS
    const successModal = document.getElementById('success-modal');
    const startContent = document.getElementById('start-content');
    const gameContent = document.getElementById('game-content');

    // NEW ELEMENTS
    const rulesModal = document.getElementById('rules-modal');
    const welcomeMessage = document.getElementById('welcome-message');
    const playerLevelInfo = document.getElementById('player-level-info');
    const gameInfoList = document.getElementById('game-info');
    const infoBtn = document.getElementById('info-btn');
    const closeRulesBtn = document.getElementById('close-rules-btn');
    const backFromRulesBtn = document.getElementById('back-from-rules-btn');

    // GAME ELEMENTS
    const gridElement = document.getElementById('crossword-grid');
    const numberBankElement = document.getElementById('number-bank');
    const levelDisplay = document.getElementById('level-display');
    const difficultyDisplay = document.getElementById('difficulty-display');

    // BUTTONS
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    const resetBtn = document.getElementById('reset-btn');
    const backBtn = document.getElementById('back-btn');
    const clearBtn = document.getElementById('clear-btn');
    const nextLevelBtn = document.getElementById('next-level-btn');
    const playAgainBtn = document.getElementById('play-again-btn');

    let currentLevel = 1;
    let playerProgress = { highestLevelCompleted: 0 };
    let config = {};
    let levels = [];
    let selectedValue = null;
    let selectedElement = null;
    let placementHistory = [];

    const B = 'B';

    // AUDIO
    const correctSound = new Audio('assets/audio/correct.mp3');
    const incorrectSound = new Audio('assets/audio/incorrect.mp3');
    const completionSound = new Audio('assets/audio/completion.mp3');
    const gameAudio = new Audio('assets/audio/game-audio.mp3');

    // Set volume levels
    correctSound.volume = 0.7;    // 70% volume
    incorrectSound.volume = 0.6;  // 60% volume
    completionSound.volume = 0.8; // 80% volume
    gameAudio.volume = 0.3;       // 40% volume - background music should be softer

    // Set gameAudio to loop
    gameAudio.loop = true;

    // Preload audio files
    function preloadAudio() {
        correctSound.load();
        incorrectSound.load();
        completionSound.load();
        gameAudio.load();
    }

    // Function to play sounds
    function playSound(sound) {
        // Reset the audio to the beginning if it's already playing
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed:", e));
    }

    // Function to start background music
    function startBackgroundMusic() {
        gameAudio.play().catch(e => {
            console.log("Background music failed to start:", e);
        });
    }

    // --- INITIALIZATION ---
    try {
        const response = await fetch('puzzles.json');
        const puzzleData = await response.json();
        config = puzzleData.config;
        levels = puzzleData.levels;
        loadProgress();
        updateStartScreen();
        populateRulesModal();
        preloadAudio(); // Preload audio files
        
        // Start background music when game loads
        startBackgroundMusic();
    } catch (error) {
        console.error("Error loading puzzle data:", error);
        startContent.innerHTML = `<h1>Error</h1><p>Could not load game data. Please try again later.</p>`;
        return;
    }

    // --- PROGRESS MANAGEMENT ---
    function loadProgress() {
        const savedProgress = localStorage.getItem('crossMathPlayerProgress');
        if (savedProgress) {
            playerProgress = JSON.parse(savedProgress);
            console.log("Loaded player progress:", playerProgress);
        }
    }

    function saveProgress() {
        localStorage.setItem('crossMathPlayerProgress', JSON.stringify(playerProgress));
    }

    // --- START SCREEN UPDATES ---
    function updateStartScreen() {
        const { easy, medium, hard } = config.difficulties;

        // Update difficulty buttons
        mediumBtn.disabled = playerProgress.highestLevelCompleted < medium.unlocksAt - 1;
        hardBtn.disabled = playerProgress.highestLevelCompleted < hard.unlocksAt - 1;

        // Update welcome message based on player progress
        if (playerProgress.highestLevelCompleted === 0) {
            welcomeMessage.textContent = "Welcome to CrossMath!";
            playerLevelInfo.innerHTML = "Solve math puzzles by completing the crossword grid.";
        } else {
            const nextLevel = playerProgress.highestLevelCompleted + 1;
            welcomeMessage.textContent = "Welcome back!";

            // Determine which difficulty the player is currently on
            let currentDifficulty = "Easy";
            if (nextLevel >= hard.levelRange[0]) {
                currentDifficulty = "Hard";
            } else if (nextLevel >= medium.levelRange[0]) {
                currentDifficulty = "Medium";
            }

            playerLevelInfo.innerHTML = `You're on <span class="current-level">Level ${nextLevel}</span> (${currentDifficulty})`;
        }
    }

    // --- RULES MODAL FUNCTIONS ---
    function populateRulesModal() {
        // Clear existing content
        gameInfoList.innerHTML = '';

        // Add total levels info
        const totalLevels = levels.length;
        const li1 = document.createElement('li');
        li1.textContent = `Total levels: ${totalLevels}`;
        gameInfoList.appendChild(li1);

        // Add difficulty info
        const { easy, medium, hard } = config.difficulties;

        const li2 = document.createElement('li');
        li2.textContent = `Easy levels: ${easy.levelRange[0]} to ${easy.levelRange[1]}`;
        gameInfoList.appendChild(li2);

        const li3 = document.createElement('li');
        li3.textContent = `Medium levels: ${medium.levelRange[0]} to ${medium.levelRange[1]} (Unlocks after level ${medium.unlocksAt - 1})`;
        gameInfoList.appendChild(li3);

        const li4 = document.createElement('li');
        li4.textContent = `Hard levels: ${hard.levelRange[0]} to ${hard.levelRange[1]} (Unlocks after level ${hard.unlocksAt - 1})`;
        gameInfoList.appendChild(li4);
    }

    function showRulesModal() {
        rulesModal.style.display = 'flex';
        setTimeout(() => {
            rulesModal.classList.add('visible');
        }, 10);
    }

    function hideRulesModal() {
        rulesModal.classList.remove('visible');
        setTimeout(() => {
            rulesModal.style.display = 'none';
        }, 300);
    }

    // --- GAME FLOW ---
    function startGame(levelNumber) {
        currentLevel = levelNumber;
        generatePuzzle(levelNumber);
        startContent.style.display = 'none';
        gameContent.style.display = 'flex';
        
        // Ensure background music is playing when a game starts
        if (gameAudio.paused) {
            startBackgroundMusic();
        }
    }

    function returnToStartScreen() {
        gameContent.style.display = 'none';
        startContent.style.display = 'block';
        updateStartScreen(); // Update the welcome message when returning to start screen
    }

    function onPuzzleComplete() {
        if (currentLevel > playerProgress.highestLevelCompleted) {
            playerProgress.highestLevelCompleted = currentLevel;
            saveProgress();
            updateStartScreen(); // Update the welcome message when progress changes
        }

        // Play completion sound
        playSound(completionSound);

        successModal.style.display = 'flex';
        setTimeout(() => {
            successModal.classList.add('visible');
        }, 10);
    }

    // --- PUZZLE GENERATION ---
    function generatePuzzle(levelNumber) {
        const puzzle = levels.find(l => l.level === levelNumber);
        if (!puzzle) {
            console.error(`Puzzle for level ${levelNumber} not found!`);
            returnToStartScreen();
            return;
        }

        const difficultyKey = Object.keys(config.difficulties).find(key => {
            const diff = config.difficulties[key];
            return levelNumber >= diff.levelRange[0] && levelNumber <= diff.levelRange[1];
        });
        const difficulty = config.difficulties[difficultyKey];

        levelDisplay.textContent = `Level ${puzzle.level}`;
        difficultyDisplay.textContent = difficulty.displayName;

        gridElement.innerHTML = '';
        numberBankElement.innerHTML = '';
        placementHistory = [];
        gridElement.style.gridTemplateColumns = `repeat(${puzzle.grid[0].length}, 50px)`;

        puzzle.grid.forEach((row, r) => {
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
        if (selectedValue !== null) {
            placeNumber(cell);
        } else if (cell.textContent !== '') {
            pickupNumberFromGrid(cell);
        }
    }

    function selectNumberFromBank(num, element) {
        if (element.classList.contains('used')) return;
        if (selectedElement === element) { clearSelection(); return; }
        clearSelection();
        selectedValue = num;
        selectedElement = element;
        element.classList.add('selected');
    }

    function pickupNumberFromGrid(cell) {
        const num = parseInt(cell.textContent);

        const bankItems = Array.from(numberBankElement.children);
        for (let i = 0; i < bankItems.length; i++) {
            if (parseInt(bankItems[i].textContent) === num && bankItems[i].classList.contains('used')) {
                bankItems[i].classList.remove('used');
                break;
            }
        }

        cell.textContent = '';
        cell.classList.remove('correct', 'incorrect');
        placementHistory = placementHistory.filter(item => item.cell !== cell);
        validateEquations();
    }

    function placeNumber(targetCell) {
        if (targetCell.textContent !== '') { pickupNumberFromGrid(targetCell); }

        targetCell.textContent = selectedValue;
        selectedElement.classList.add('used');
        placementHistory.push({ cell: targetCell, bankItem: selectedElement });

        clearSelection();
        validateEquations();
    }

    function clearSelection() {
        if (selectedElement) { selectedElement.classList.remove('selected'); }
        selectedValue = null;
        selectedElement = null;
    }

    function clearLastEntry() {
        if (placementHistory.length > 0) {
            const lastPlacement = placementHistory.pop();
            const lastCell = lastPlacement.cell;
            lastCell.textContent = '';
            lastCell.classList.remove('correct', 'incorrect');
            lastPlacement.bankItem.classList.remove('used');
            validateEquations();
        }
    }

    // --- EQUATION VALIDATION ---
    function validateEquations() {
        const gridCells = gridElement.querySelectorAll('.cell');
        gridCells.forEach(c => c.classList.remove('correct', 'incorrect'));

        const puzzle = levels.find(l => l.level === currentLevel);
        if (!puzzle) return;

        const equations = findEquations();
        let allEquationsCorrect = true;
        let allEmptyCellsFilled = true;
        let hasPlayedIncorrectSound = false; // Flag to ensure we only play the sound once

        puzzle.emptyCells.forEach(ec => {
            const cell = gridElement.querySelector(`[data-row='${ec.r}'][data-col='${ec.c}']`);
            if (!cell || !cell.textContent) {
                allEmptyCellsFilled = false;
            }
        });

        equations.forEach(eq => {
            const cell1 = gridElement.querySelector(`[data-row='${eq.r1}'][data-col='${eq.c1}']`);
            const cell2 = gridElement.querySelector(`[data-row='${eq.r2}'][data-col='${eq.c2}']`);
            const resultCell = gridElement.querySelector(`[data-row='${eq.rr}'][data-col='${eq.cr}']`);

            if (!cell1 || !cell2 || !resultCell) return;

            const val1 = parseInt(cell1.textContent);
            const val2 = parseInt(cell2.textContent);
            const resultVal = parseInt(resultCell.textContent);
            const operator = eq.op;

            if (isNaN(val1) || isNaN(val2) || isNaN(resultVal)) {
                allEquationsCorrect = false;
                return;
            }

            let isCorrect = false;
            switch (operator) {
                case '+': isCorrect = (val1 + val2 === resultVal); break;
                case '-': isCorrect = (val1 - val2 === resultVal); break;
                case '*': isCorrect = (val1 * val2 === resultVal); break;
                case '/': isCorrect = (val1 / val2 === resultVal && val1 % val2 === 0); break;
            }

            if (isCorrect) {
                cell1.classList.add('correct');
                cell2.classList.add('correct');
                resultCell.classList.add('correct');

                // Play correct sound if all cells in this equation have content
                if (resultCell.textContent) {
                    playSound(correctSound);
                }
            } else {
                // Log which equation failed
                console.log(`Equation failed: ${val1} ${operator} ${val2} !== ${resultVal} at [r:${eq.r1},c:${eq.c1}]`);
                cell1.classList.add('incorrect');
                cell2.classList.add('incorrect');
                resultCell.classList.add('incorrect');
                allEquationsCorrect = false;

                // Play incorrect sound only once per validation
                if (!hasPlayedIncorrectSound && resultCell.textContent) {
                    playSound(incorrectSound);
                    hasPlayedIncorrectSound = true;
                }
            }
        });

        // Log validation status
        console.log("Validation check:", {
            allEmptyCellsFilled,
            allEquationsCorrect,
            equationsFound: equations.length
        });

        if (allEmptyCellsFilled && allEquationsCorrect && equations.length > 0) {
            onPuzzleComplete();
        }
    }

    // *** REWRITTEN FUNCTION ***
    // This new function is more reliable as it looks for the '=' sign to define an equation,
    // which matches the structure of your puzzle grid.
    function findEquations() {
        const puzzle = levels.find(l => l.level === currentLevel);
        if (!puzzle) return [];

        const grid = puzzle.grid;
        const equations = [];
        const operators = ['+', '-', '*', '/'];

        // Horizontal equations: check rows 0, 2, and 4
        for (let r = 0; r < grid.length; r += 2) {
            // Check if the row contains an operator and an equals sign in the right places
            if (operators.includes(grid[r][1]) && grid[r][3] === '=') {
                equations.push({ r1: r, c1: 0, op: grid[r][1], r2: r, c2: 2, rr: r, cr: 4 });
            }
        }

        // Vertical equations: check columns 0, 2 but SKIP column 4
        for (let c = 0; c < grid[0].length; c += 2) {
            if (c === 4) { // Explicitly skip the final "results" column
                continue;
            }
            // Check if the column contains an operator and an equals sign
            if (operators.includes(grid[1][c]) && grid[3][c] === '=') {
                equations.push({ r1: 0, c1: c, op: grid[1][c], r2: 2, c2: c, rr: 4, cr: c });
            }
        }

        // *** DEBUGGING: Log the equations that were found ***
        console.log(`Found ${equations.length} equations to validate for Level ${currentLevel}.`);
        return equations;
    }
    // --- Event Listeners ---
    // New event listeners for rules modal
    infoBtn.addEventListener('click', showRulesModal);
    closeRulesBtn.addEventListener('click', hideRulesModal);
    backFromRulesBtn.addEventListener('click', hideRulesModal);

    // Existing event listeners
    backBtn.addEventListener('click', returnToStartScreen);
    clearBtn.addEventListener('click', clearLastEntry);
    resetBtn.addEventListener('click', () => generatePuzzle(currentLevel));

    playAgainBtn.addEventListener('click', () => {
        successModal.classList.remove('visible');
        setTimeout(() => {
            successModal.style.display = 'none';
            generatePuzzle(currentLevel);
        }, 300);
    });

    nextLevelBtn.addEventListener('click', () => {
        successModal.classList.remove('visible');
        const nextLevel = currentLevel + 1;
        if (levels.find(l => l.level === nextLevel)) {
            setTimeout(() => {
                successModal.style.display = 'none';
                startGame(nextLevel);
            }, 300);
        } else {
            setTimeout(() => {
                successModal.style.display = 'none';
                alert("Congratulations! You've completed all levels!");
                returnToStartScreen();
            }, 300);
        }
    });

    easyBtn.addEventListener('click', () => {
        const startLevel = Math.max(config.difficulties.easy.levelRange[0], playerProgress.highestLevelCompleted + 1);
        startGame(startLevel > config.difficulties.easy.levelRange[1] ? config.difficulties.easy.levelRange[0] : startLevel);
    });
    mediumBtn.addEventListener('click', () => {
        const startLevel = Math.max(config.difficulties.medium.levelRange[0], playerProgress.highestLevelCompleted + 1);
        startGame(startLevel > config.difficulties.medium.levelRange[1] ? config.difficulties.medium.levelRange[0] : startLevel);
    });
    hardBtn.addEventListener('click', () => {
        const startLevel = Math.max(config.difficulties.hard.levelRange[0], playerProgress.highestLevelCompleted + 1);
        startGame(startLevel > config.difficulties.hard.levelRange[1] ? config.difficulties.hard.levelRange[0] : startLevel);
    });
});