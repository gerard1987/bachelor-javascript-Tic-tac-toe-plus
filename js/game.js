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

    this.addEventListeners();
  }

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
  }

  parseInputValue(value) {
    return parseInt(value, 10);
  }

  newGame() {
    this.game = new Game(
      new Board(
        this.boardElement,
        this.boardHeight,
        this.boardWidth,
      ),
      this.players
    )

    this.game.init();
  }
}

class Player {
  constructor(type) {
    this.type = type;
  }
}

class Game {
  constructor(board, players) {
    this.board = board
    this.players = players;
    this.setCurrentPlayer(
      this.setStartingPlayer()
    );
    console.log(`Initialized game board with ${this.board.rowCount} rows and ${this.board.colCount} cols`);
    console.log(`Current player is ${this.currentPlayer.type}`);
  }

  init() {
    this.board.clear();
    this.board.render();
  }

  setStartingPlayer() {
    return this.players[Math.floor(Math.random() * this.players.length)];
  }

  setCurrentPlayer(player) {
    this.currentPlayer = player;
    let header = document.getElementById('current_player');
    if (header == null){
      header = document.createElement('h1');
      header.id = 'current_player';
    }

    header.innerHTML = `Player ${this.currentPlayer.type} turn`;

    const gameEl = this.board.boardElement.parentElement;
    gameEl.appendChild(header);
  }
}

class Board {
  constructor(boardElement, rowCount, colCount) {
    this.boardElement = boardElement;
    this.rowCount = rowCount;
    this.colCount = colCount;
  }

  clear() {
    this.boardElement.innerHTML = "";
  }

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
    }
  }
}

class Row {
  constructor(id) {
    this.id = id;
    this.cellCount = 0;
    this.cells = [];
  }

  generateHtml() {
    const row = document.createElement("div");
    row.classList.add('row');
    row.id = `row_${this.id}`;
    return row;
  }

  addCell() {
    const cell = new Cell(this.id, this.cellCount++);
    this.cells.push(cell);
  }

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
  }

  generateHtml() {
    const row = document.getElementById(`row_${this.row}`);
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.id = `cell_${this.col}`;
    cell.dataset.row = this.row;
    cell.dataset.col = this.col;
    cell.textContent = "";
    cell.addEventListener("click", (event) => this.setCellValue(event));
    row.appendChild(cell);
  }

  setCellValue(event) {
    const cell = event.target;
    if (!cell.classList.contains('o') && !cell.classList.contains('o')) {
      cell.classList.add('o');
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Initialize 
  const ticTacToe = new TicTacToe();
  ticTacToe.newGame();
});