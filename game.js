// ── Game State ──────────────────────────────────────────────
const state = {
    lives: 3,
    score: 0,
    keys: 0,
    hintUsed: false
};

// ── Transition overlay ───────────────────────────────────────
const overlay = document.createElement('div');
overlay.id = 'transition-overlay';
document.body.appendChild(overlay);

// ── Helpers ──────────────────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    clearAllFeedback();
}

function clearAllFeedback() {
    document.querySelectorAll('.feedback').forEach(el => {
        el.textContent = '';
        el.className = 'feedback';
    });
}

function setFeedback(id, message, type) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = `feedback ${type}`;
}

function updateHUD() {
    const hearts = ['', '❤️', '❤️❤️', '❤️❤️❤️'];
    document.getElementById('lives').textContent = hearts[state.lives] || '💀';
    document.getElementById('score-value').textContent = state.score;
    document.getElementById('keys-value').textContent = state.keys;
}

function transitionTo(screenId, emoji, delay = 1400) {
    overlay.textContent = emoji;
    overlay.classList.add('show');
    setTimeout(() => {
        overlay.classList.remove('show');
        showScreen(screenId);
    }, delay);
}

function loseLife(feedbackId, message) {
    state.lives--;
    updateHUD();
    setFeedback(feedbackId, message, 'error');
    if (state.lives <= 0) {
        setTimeout(() => gameOver(), 1200);
    }
}

function collectKey() {
    state.keys++;
    updateHUD();
}

function addScore(points) {
    state.score += points;
    updateHUD();
}

function gameOver() {
    document.getElementById('gameover-score').textContent = state.score;
    transitionTo('screen-gameover', '💀');
}

// ── Start / Restart ──────────────────────────────────────────
function startGame() {
    state.lives = 3;
    state.score = 0;
    state.keys  = 0;
    state.hintUsed = false;
    updateHUD();
    transitionTo('screen-level1', '🔐', 800);
}

function restartGame() {
    startGame();
}

// ── LEVEL 1 – Keypad ─────────────────────────────────────────
// 3x + 5 = 20  →  x = 5
function checkLevel1(answer) {
    const buttons = document.querySelectorAll('.keypad-btn');
    const clicked = [...buttons].find(b => +b.textContent === answer);

    if (answer === 5) {
        clicked.classList.add('correct');
        addScore(10);
        collectKey();
        setFeedback('feedback-level1', '✅ Correct! The door creaks open... 🗝️ Key collected!', 'success');
        disableButtons('.keypad-btn');
        setTimeout(() => transitionTo('screen-level2', '🚪'), 1600);
    } else {
        clicked.classList.add('wrong');
        setTimeout(() => clicked.classList.remove('wrong'), 600);

        if (!state.hintUsed) {
            state.hintUsed = true;
            setFeedback('feedback-level1', '💡 Hint: Subtract 5 from both sides first, then divide by 3.', 'hint');
        } else {
            loseLife('feedback-level1', '❌ Wrong again! Check your subtraction first. (-1 life)');
        }
    }
}

// ── LEVEL 2 – Choose the Door ────────────────────────────────
// Door A: 2x+6=18 → x=6  |  Door B: 5x-10=15 → x=5 ✅  |  Door C: 4x+8=24 → x=4
function checkLevel2(door) {
    const doors = document.querySelectorAll('.door');
    const doorMap = { A: 0, B: 1, C: 2 };
    const clicked = doors[doorMap[door]];

    if (door === 'B') {
        clicked.classList.add('correct');
        addScore(10);
        collectKey();
        setFeedback('feedback-level2', '✅ Door B opens! 5×5 − 10 = 15 ✓ 🗝️ Key collected!', 'success');
        disableButtons('.door');
        setTimeout(() => transitionTo('screen-level3', '🎁'), 1800);
    } else {
        clicked.classList.add('wrong');
        setTimeout(() => clicked.classList.remove('wrong'), 600);

        const hints = {
            A: '💡 Door A: 2x+6=18 → x=6. Not 5!',
            C: '💡 Door C: 4x+8=24 → x=4. Not 5!'
        };

        if (!state.hintUsed) {
            state.hintUsed = true;
            setFeedback('feedback-level2', hints[door], 'hint');
        } else {
            loseLife('feedback-level2', `❌ ${hints[door].replace('💡 ', '')} (-1 life)`);
        }
    }
}

// ── LEVEL 3 – Treasure Box ───────────────────────────────────
// 4x + 7 = 31  →  x = 6
function checkLevel3() {
    const input = document.getElementById('treasure-input');
    const answer = parseInt(input.value, 10);

    if (isNaN(answer)) {
        setFeedback('feedback-level3', '⚠️ Please enter a number.', 'hint');
        return;
    }

    if (answer === 6) {
        document.getElementById('treasure-art').textContent = '🎉';
        addScore(10);
        collectKey();
        setFeedback('feedback-level3', '✅ The treasure box opens! 4×6 + 7 = 31 ✓ 🗝️ Key collected!', 'success');
        input.disabled = true;
        document.querySelector('#screen-level3 .btn-primary').disabled = true;
        setTimeout(() => transitionTo('screen-level4', '🔐'), 1800);
    } else {
        if (!state.hintUsed) {
            state.hintUsed = true;
            addScore(0);
            setFeedback('feedback-level3', '💡 Hint: Write it as 4x + 7 = 31. Subtract 7 first, then divide by 4.', 'hint');
        } else {
            loseLife('feedback-level3', '❌ Incorrect! Try again. (-1 life)');
        }
        input.value = '';
        input.focus();
    }
}

// Allow Enter key on treasure input
document.getElementById('treasure-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkLevel3();
});

// ── LEVEL 4 – Final Password ─────────────────────────────────
// ① x+8=15 → 7  ② 2x=18 → 9  ③ x-4=3 → 7  ④ 3x=24 → 8
const ANSWERS = [7, 9, 7, 8];

function checkLevel4() {
    const inputs = [
        document.getElementById('eq1'),
        document.getElementById('eq2'),
        document.getElementById('eq3'),
        document.getElementById('eq4')
    ];

    const values = inputs.map(i => parseInt(i.value, 10));

    if (values.some(isNaN)) {
        setFeedback('feedback-level4', '⚠️ Please fill in all 4 answers.', 'hint');
        return;
    }

    const wrong = [];
    values.forEach((val, i) => {
        if (val !== ANSWERS[i]) wrong.push(i + 1);
    });

    if (wrong.length === 0) {
        addScore(10);
        collectKey();
        setFeedback('feedback-level4', '✅ Password accepted! 7 – 9 – 7 – 8 🗝️ Final key collected!', 'success');
        inputs.forEach(i => i.disabled = true);
        document.querySelector('#screen-level4 .btn-primary').disabled = true;
        setTimeout(() => showWinScreen(), 1800);
    } else {
        const hints = {
            1: 'Eq①: x+8=15 → subtract 8',
            2: 'Eq②: 2x=18 → divide by 2',
            3: 'Eq③: x−4=3 → add 4',
            4: 'Eq④: 3x=24 → divide by 3'
        };

        if (!state.hintUsed) {
            state.hintUsed = true;
            const hintText = wrong.map(n => hints[n]).join(' | ');
            setFeedback('feedback-level4', `💡 Check: ${hintText}`, 'hint');
        } else {
            loseLife('feedback-level4', `❌ Equations ${wrong.join(', ')} are wrong. Go back and check! (-1 life)`);
            wrong.forEach(n => {
                inputs[n - 1].value = '';
                inputs[n - 1].focus();
            });
        }
    }
}

// ── Win Screen ───────────────────────────────────────────────
function showWinScreen() {
    document.getElementById('final-score').textContent = state.score;

    const stars = state.score >= 40 ? '⭐⭐⭐' :
                  state.score >= 25 ? '⭐⭐' : '⭐';
    document.getElementById('win-stars').textContent = stars;

    transitionTo('screen-win', '🏆');
}

// ── Utility ──────────────────────────────────────────────────
function disableButtons(selector) {
    document.querySelectorAll(selector).forEach(b => b.style.pointerEvents = 'none');
}

// Reset hint flag on each new level transition
const originalTransitionTo = transitionTo;
function transitionTo(screenId, emoji, delay = 1400) {
    state.hintUsed = false;
    overlay.textContent = emoji;
    overlay.classList.add('show');
    setTimeout(() => {
        overlay.classList.remove('show');
        showScreen(screenId);
        // Re-enable interactive elements when entering a new screen
        document.querySelectorAll('.keypad-btn, .door').forEach(b => b.style.pointerEvents = '');
    }, delay);
}

// Init HUD on page load
updateHUD();
