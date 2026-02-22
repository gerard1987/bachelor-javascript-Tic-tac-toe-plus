class TicTacToe {
  constructor() {
    this.playElement = document.getElementById('btn-start');
    this.resetElement = document.getElementById('btn-rest');
    this.widthElement = document.getElementById('input-width');
    this.heightElement = document.getElementById('input-height');
    this.winConditionElement = document.getElementById('input-win-condition');
    this.boardElement = document.getElementById('board');
    this.scoreXElement = document.getElementById('score-x');
    this.scoreOElement = document.getElementById('score-o');

    this.boardWidth = this.parseInputValue(this.widthElement.value);
    this.boardHeight = this.parseInputValue(this.heightElement.value);
    this.winCondition = this.parseInputValue(this.winConditionElement.value);

    this.players = [];
    this.players.push(new Player('x'));
    this.players.push(new Player('o'));

    this.score = new Scores();

    this.addEventListeners();
  }

  /**
   * Adds the needed event listeners to the app for the game to function
   */
  addEventListeners() {
    this.widthElement.addEventListener('change', (event) => {
      this.boardWidth = this.parseInputValue(event.target.value);
      this.newGame();
    });

    this.heightElement.addEventListener('change', (event) => {
      this.boardHeight = this.parseInputValue(event.target.value);
      this.newGame();
    });

    this.winConditionElement.addEventListener('change', (event) => {
      this.winCondition = this.parseInputValue(event.target.value);
      this.newGame();
    });

    this.playElement.addEventListener('click', (event) => {
      this.newGame();
    });

    this.resetElement.addEventListener('click', (event) => {
      this.score.clear();
      this.newGame();
    });
  }

  /**
   * Sets the diagonal cell count as the maximum win condition limit. With a maximum of 6
   */
  setWinConditionRange() {
    const diagonalCellCount = Math.min(this.boardWidth, this.boardHeight);
    const maxValue = diagonalCellCount > 6 ? 6 : diagonalCellCount;
    this.winConditionElement.max = maxValue;
    this.winConditionElement.nextElementSibling.value = this.winConditionElement.value;
  }

  /**
   * Renders the current score in the app.
   */
  renderScore() {
    const scores = this.score.getScore();
    this.scoreXElement.textContent = scores['x'] ?? 0;
    this.scoreOElement.textContent = scores['o'] ?? 0;
  }

  /**
   * Parses a input value to an integer in base 10
   * 
   * @param {string}
   * @returns {number}
   */
  parseInputValue(value) {
    return parseInt(value, 10);
  }

  /**
   * Initializes a new TicTacToe game within the app context.
   * 
   * @returns {void}
   */
  newGame() {
    this.setWinConditionRange();
    this.renderScore();

    this.game = new Game(
      this, // app reference
      new Board(
        this.boardElement,
        this.boardHeight,
        this.boardWidth,
      ),
      this.players,
      this.winCondition
    )

    this.game.init();
  }
}

class Player {
  constructor(type) {
    this.type = type;
  }
}

class Scores {
  constructor() {
    this.x = 0;
    this.o = 0;
    localStorage.setItem('scores', JSON.stringify(this))
  }

  /**
   * Returns and parses the current score from localstorage
   * 
   * @returns {object}
   */
  getScore() {
    let scores = JSON.parse(localStorage.getItem('scores'));
    if (scores == null) {
      localStorage.setItem('scores', JSON.stringify(this));
      scores = this.score;
    }

    return scores;
  }

  /**
   * Increment a player's score
   *  
   * @param {string} playerType 
   * @returns {void}
   */
  addScore(playerType) {
    this[playerType]++;
    localStorage.setItem('scores', JSON.stringify(this))
  }

  /**
   * Clears the current score.
   * 
   * @returns {void}
   */
  clear() {
    this.x = 0;
    this.o = 0;
    localStorage.setItem('scores', JSON.stringify(this))
  }
}

class Game {
  constructor(app, board, players, winCondition) {
    this.app = app;
    this.board = board;
    this.players = players;
    this.currentPlayer = this.getStartingPlayer();
    this.winCondition = winCondition;
  }

  /**
   * Initializes the game and renders the board
   * 
   * @returns {void}
   */
  init() {
    this.board.render();
    this.setEventListeners();
  }

  /**
   * Returns a random selected player from the players.
   * 
   * @returns {Player}
   */
  getStartingPlayer() {
    return this.players[Math.floor(Math.random() * this.players.length)];
  }

  /**
   * Sets the current player 
   * 
   * @returns {void}
   */
  setCurrentPlayer() {
    this.currentPlayer = this.players.find(player => player.type !== this.currentPlayer.type);
    this.showCurrentPlayer();
  }

  /**
   * Renders the current player message
   * 
   * @returns {void}
   */
  showCurrentPlayer() {
    let header = document.getElementById('current_player');
    if (header == null) {
      header = document.createElement('h1');
      header.id = 'current_player';
    }

    header.innerHTML = `Player ${this.currentPlayer.type} turn`;

    const gameEl = this.board.boardElement.parentElement;
    gameEl.appendChild(header);
  }

  /**
   * Sets game logic by adding event listener for every cell
   * Processes move 
   * 
   * @returns {void}
   */
  setEventListeners() {
    this.board.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        cell.element.addEventListener('click', async (event) => {
          await cell.setValue(this.currentPlayer.type)
            .then(() => {
              this.processMove(row, cell);
              this.setCurrentPlayer();
            })
            .catch((error) => {
              console.error(error);
              alert(error);
            })
        })
      });
    })
  }

  /**
   * Processes game logic for a move using n-in-row direction relative to the element.
   * If a wincondition sequence is found for the current player, it will finish the game
   * Checks if game resulted in a draw if wincondition is not met
   * 
   * @param {Row} row 
   * @param {Cell} cell 
   * @returns {void}
   */
  processMove(row, cell) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diag down-right
      [1, -1]   // diag down-left
    ];

    const rowCount = this.board.rowCount;
    const colCount = this.board.colCount;

    let won = false;

    for (let i = 0; i < directions.length; i++) {
      const dr = directions[i][0];
      const dc = directions[i][1];

      let count = 1;

      // Forward direction
      let r = row.id + dr;
      let c = cell.col + dc;

      while (
        r >= 0 && r < rowCount &&
        c >= 0 && c < colCount &&
        this.board.rows[r].cells[c].element.getAttribute('data-value') === this.currentPlayer.type
      ) {
        count++;
        r += dr;
        c += dc;
      }

      // Backward direction
      r = row.id - dr;
      c = cell.col - dc;

      while (
        r >= 0 && r < rowCount &&
        c >= 0 && c < colCount &&
        this.board.rows[r].cells[c].element.getAttribute('data-value') === this.currentPlayer.type
      ) {
        count++;
        r -= dr;
        c -= dc;
      }

      if (count >= this.winCondition) {
        won = true;
      }
    }

    if (won) {
      this.finishGame();
    }
    else if (this.isDraw()) {
      this.finishGame(true);
    }
  }

  /**
   * Returns whether game resulted in a draw
   * 
   * @returns {boolean}
   */
  isDraw() {
    return this.board.allCellsHaveValue()
  }

  /**
   * Finishes the game by updating the score, displaying a message and starting a new game.
   * 
   * @param {boolean} draw 
   * @returns {void}
   */
  finishGame(draw = false) {
    const currentPlayerType = this.currentPlayer.type;
    const msg = !draw ? `Player ${currentPlayerType} has won the game!` : `It's a draw!`;

    if (!draw) {
      this.app.score.addScore(currentPlayerType);
    }

    alert(msg);
    this.app.newGame();
  }
}

class Board {
  constructor(boardElement, rowCount, colCount) {
    this.boardElement = boardElement;
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.rows = [];
    this.clear();
  }

  /**
   * Clears the board element
   */
  clear() {
    this.boardElement.innerHTML = "";
  }

  /**
   * Returns the total grid count
   * 
   * @returns {number}
   */
  getTotalCells() {
    return this.rowCount * this.colCount;
  }

  /**
   * Checks if all the cells on the board have a value
   * 
   * @returns {boolean}
   */
  allCellsHaveValue() {
    const totalCells = this.getTotalCells();
    const filledCells = document.querySelectorAll('.cell[data-value]').length;

    if (filledCells >= totalCells) {
      return true;
    }

    return false;
  }

  /**
   * Renders the board as HTML 
   * 
   * @returns {void}
   */
  render() {
    // Generate board rows
    for (let i = 0; i < this.rowCount; i++) {

      const row = new Row(i);
      const htmlRow = row.generateHtml();
      this.boardElement.appendChild(htmlRow);

      // Initialize row cols
      for (let col = 0; col < this.colCount; col++) {
        row.addCell()
      }

      row.generateCells();
      this.rows.push(row);
    }
  }
}

class Row {
  constructor(id) {
    this.id = id;
    this.cellCount = 0;
    this.cells = [];
  }

  /**
   * Generates the row's HTML element.
   * 
   * @returns {HTMLDivElement} row
   */
  generateHtml() {
    const row = document.createElement("div");
    row.classList.add('row');
    row.id = `row_${this.id}`;
    return row;
  }

  /**
   * Adds a new cell to the Row
   * 
   * @returns {void}
   */
  addCell() {
    const cell = new Cell(this.id, this.cellCount++);
    this.cells.push(cell);
  }

  /**
   * Generates all the cells on the board
   * 
   * @returns {void}
   */
  generateCells() {
    this.cells.forEach(cell => {
      cell.generateHtml();
    });
  }
}

class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.element = null;
  }

  /**
   * Generates the cell's HTML element.
   * 
   * @returns {void}
   */
  generateHtml() {
    const row = document.getElementById(`row_${this.row}`);
    this.element = document.createElement("div");
    this.element.classList.add("cell");
    this.element.id = `cell_${this.col}`;
    this.element.dataset.row = this.row;
    this.element.dataset.col = this.col;
    this.element.textContent = "";
    row.appendChild(this.element);
  }

  /**
   * Sets the parameter to the cell's value
   * Waits for 2 frames before resolving the promise, to avoid logic finishing before paint.
   * Rejects or resolves the promise based on whether the element has value.
   * 
   * @param {string} value 
   * @returns {Promise}
   */
  async setValue(value) {
    return new Promise(async (resolve, reject) => {
      if (
        this.element.classList.contains('o') ||
        this.element.classList.contains('x') ||
        this.element.hasAttribute('data-value')
      ) {
        reject('Cell already has value!')
      }

      this.element.dataset.value = value;
      this.element.classList.add(value);
      this.element.style.pointerEvents = "none";

      // Wait for 2 frames to have the DOM visible updated before resolving
      await waitForRender();

      resolve(true);

    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Initialize the app
  const ticTacToe = new TicTacToe();
  ticTacToe.newGame();
});

async function waitForRender() {
  await waitForFrame();
  await waitForFrame();
}

function waitForFrame() {
  return new Promise(requestAnimationFrame);
}