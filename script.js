const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const scoreEls = {
  X: document.getElementById('score-x'),
  O: document.getElementById('score-o'),
  draw: document.getElementById('score-draw'),
};

const score = { X: 0, O: 0, draw: 0 };
let board, current, gameOver;
let gameId = 0; // bumped on reset so a pending computer move is discarded

const cells = Array.from({ length: 9 }, (_, i) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cell';
  btn.addEventListener('click', () => handleMove(i));
  boardEl.appendChild(btn);
  return btn;
});

function vsComputer() {
  return document.querySelector('input[name="mode"]:checked').value === 'cpu';
}

// Returns { winner: 'X'|'O', line } , { winner: 'draw' }, or null if still in play.
function checkWinner(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line };
  }
  return b.every(Boolean) ? { winner: 'draw' } : null;
}

function render() {
  cells.forEach((cell, i) => {
    cell.textContent = board[i] || '';
    cell.className = 'cell' + (board[i] ? ' ' + board[i].toLowerCase() : '');
    cell.disabled = gameOver || Boolean(board[i]);
    const row = Math.floor(i / 3) + 1;
    const col = (i % 3) + 1;
    cell.setAttribute('aria-label', `Row ${row}, column ${col}: ${board[i] || 'empty'}`);
  });
}

function handleMove(i) {
  if (gameOver || board[i]) return;
  if (vsComputer() && current === 'O') return; // computer's turn
  play(i);
  if (!gameOver && vsComputer()) {
    setBoardLocked(true);
    const id = gameId;
    setTimeout(() => {
      if (id !== gameId) return;
      play(bestMove(board, 'O'));
      setBoardLocked(false);
    }, 300);
  }
}

function setBoardLocked(locked) {
  cells.forEach((cell, i) => { cell.disabled = locked || gameOver || Boolean(board[i]); });
}

function play(i) {
  board[i] = current;
  const result = checkWinner(board);
  if (result) {
    gameOver = true;
    score[result.winner]++;
    scoreEls[result.winner].textContent = score[result.winner];
    statusEl.textContent = result.winner === 'draw' ? "It's a draw!" : `${result.winner} wins!`;
    render();
    if (result.line) result.line.forEach((j) => cells[j].classList.add('win'));
    return;
  }
  current = current === 'X' ? 'O' : 'X';
  statusEl.textContent = `${current}'s turn`;
  render();
}

// Minimax: score from the perspective of `player` (+1 win, -1 loss, 0 draw).
function minimax(b, player) {
  const result = checkWinner(b);
  if (result) {
    if (result.winner === 'draw') return 0;
    return result.winner === player ? 1 : -1;
  }
  const opponent = player === 'X' ? 'O' : 'X';
  let best = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    best = Math.max(best, -minimax(b, opponent));
    b[i] = null;
  }
  return best;
}

function bestMove(b, player) {
  const opponent = player === 'X' ? 'O' : 'X';
  let best = -Infinity;
  let moves = [];
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = player;
    const s = -minimax(b, opponent);
    b[i] = null;
    if (s > best) { best = s; moves = [i]; }
    else if (s === best) moves.push(i);
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

function newGame() {
  gameId++;
  board = Array(9).fill(null);
  current = 'X';
  gameOver = false;
  statusEl.textContent = "X's turn";
  render();
}

resetBtn.addEventListener('click', newGame);
document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', newGame));

newGame();
