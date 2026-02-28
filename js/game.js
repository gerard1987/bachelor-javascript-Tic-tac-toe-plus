class TicTacToe {
  constructor() {
    this.playElement = document.getElementById('btn-start');
    this.resetElement = document.getElementById('btn-rest');
    this.widthElement = document.getElementById('input-width');
    this.heightElement = document.getElementById('input-height');
    this.winConditionElement = document.getElementById('input-win-condition');
    this.boardElement = document.getElementById('board');

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
   * 
   * @returns {void}
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
   * 
   * @returns {void}
   */
  setWinConditionRange() {
    const diagonalCellCount = Math.min(this.boardWidth, this.boardHeight);
    const maxValue = diagonalCellCount > 6 ? 6 : diagonalCellCount;
    this.winConditionElement.max = maxValue;
    this.winConditionElement.nextElementSibling.value = this.winConditionElement.value;
    this.winCondition = this.winConditionElement.value;
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
    this.score.renderScores();

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
    }

    // Set the properties
    Object.assign(this, scores);

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
    localStorage.setItem('scores', JSON.stringify(this));

    this.renderScore(playerType);

    const scoreEl = document.getElementById(`score-${playerType}`).parentElement;
    scoreEl.style = "background-color: #55f37e; transition: background-color .4s ease;"
    pulseElement(scoreEl);
  }

  /**
   * Renders the current score
   * 
   * @param {string} type
   * @returns {void}
   */
  renderScore(type) {
    const scoreValueElement = document.getElementById(`score-${type}`);
    scoreValueElement.textContent = this[type];
  }

  /**
   * Renders the current score in the app.
   * 
   * @returns {void}
   */
  renderScores() {
    const scores = this.getScore();

    for (const score in scores) {
      this.renderScore(score);

      // Reset parent styles
      document.getElementById(`score-${score}`).parentElement.style.backgroundColor = "";
    }
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
    this.board.boardElement.style.pointerEvents = "initial";
    this.board.render();
    this.board.showPlayerMessage(`Game has started it's player: ${this.currentPlayer.type} turn`);
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
    const playerMessage = `Player ${this.currentPlayer.type} turn`;
    this.board.showPlayerMessage(playerMessage);
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
            await cell.setValue(this.currentPlayer.type);
            this.processMove(row, cell);
        })
      });
    })
  }

  /**
   * Checks if the move has created a winning condition sequence.
   * Finishes the game if true, 
   * Will check if game resulted in a draw if false
   * 
   * @param {Row} row 
   * @param {Cell} cell 
   * @returns {void}
   */
  processMove(row, cell) {
    const result = this.winConditionSequenceReached(row, cell);

    if (result) {
      this.finishGame();
    }
    else if (this.isDraw()) {
      this.finishGame(true);
    }
    else {
      this.setCurrentPlayer();
    }
  }

  /**
  * Checks if the current cell has a winCondition sequence in N direction
  * Scans the board from the cell index while there is a matching types untill sequence has been found
  * Returns a promise with a boolean if sequence matches winCondition and animates the sequence
  * 
  * @param {Row} row 
  * @param {Cell} cell 
  * @returns {Promise}
  */
  winConditionSequenceReached(row, cell) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diag down-right
      [1, -1]   // diag down-left
    ];

    const rowCount = this.board.rowCount;
    const colCount = this.board.colCount;

    for (let i = 0; i < directions.length; i++) {
      const dr = directions[i][0];
      const dc = directions[i][1];
      let sequenceElements = [
        cell.element
      ];

      let count = 1;

      // Get the cell neighbor in positive direction
      let r = row.id + dr;
      let c = cell.col + dc;

      while (
        r >= 0 && r < rowCount &&
        c >= 0 && c < colCount &&
        this.board.rows[r].cells[c].element.getAttribute('data-value') === this.currentPlayer.type
      ) {
        // increment sequence counter and cell offset
        sequenceElements.push(this.board.rows[r].cells[c].element);
        count++;
        r += dr;
        c += dc;
      }

      // Get the cell neighbor in negative direction
      r = row.id - dr;
      c = cell.col - dc;

      while (
        r >= 0 && r < rowCount &&
        c >= 0 && c < colCount &&
        this.board.rows[r].cells[c].element.getAttribute('data-value') === this.currentPlayer.type
      ) {
        // increment sequence counter and cell offset
        sequenceElements.push(this.board.rows[r].cells[c].element);
        count++;
        r -= dr;
        c -= dc;
      }

      // Sequence has reached win condition! We can break out the function
      if (count >= this.winCondition) {
        this.animateSequence(sequenceElements);
        return true;
      }
    }

    return false;
  }

  animateSequence(sequenceElements) {
    const totalAnimationTime = 1500;
    const stepTime = totalAnimationTime / sequenceElements.length;
    const colorStep = 100 / sequenceElements.length;

    sequenceElements.forEach((el, i) => {
      const light = (33 + colorStep * (i + 1));
      const saturation = light < 100 ? light : 100;

      setTimeout(() => {
        el.style.transition = "background-color .4s ease";
        el.style.backgroundColor = `hsl(120, ${saturation}%, 90%)`;
        pulseElement(el);
      }, i * stepTime);
    });
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
    else {
      const cells = document.getElementsByClassName('cell');

      for (const el of cells) {
        el.style.transition = "transition: border-color .4s ease;"
        el.style.border = "1px solid #5b5b9c";
        pulseElement(el);
      }
    }

    this.board.showPlayerMessage(msg);
    this.board.boardElement.style.pointerEvents = "none";
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

  /**
   * Renders the player message
   * 
   * @returns {void}
   */
  showPlayerMessage(msg) {

    let msgElement = document.getElementById('current_player');
    if (msgElement == null) {
      msgElement = document.createElement('h1');
      msgElement.id = 'current_player';
    }

    msgElement.textContent = msg;

    const gameEl = this.boardElement.parentElement;
    gameEl.appendChild(msgElement);
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
  setValue(value) {
    if (
      this.element.classList.contains('o') ||
      this.element.classList.contains('x') ||
      this.element.hasAttribute('data-value')
    ) {
      alert('Cell already has value!')
    }

    this.element.dataset.value = value;
    this.element.classList.add(value);
    this.element.style.pointerEvents = "none";
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Initialize the app
  const ticTacToe = new TicTacToe();
  ticTacToe.newGame();
});

function pulseElement(el) {
  return el.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.15)" },
      { transform: "scale(1)" }
    ],
    {
      duration: 300,
      easing: "ease"
    }
  ).finished;
}