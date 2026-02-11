class TicTacToe {
  constructor(size) {
    this.size = size;
    console.log(this.size);
    console.log(size.cells);
  }

  init() {
  }

  render() {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.textContent = this.board[row][col] || "";
        cell.addEventListener("click", () => this.handleMove(row, col));
        this.boardElement.appendChild(cell);
      }
    }
  }
}

class BoardSize {
    constructor (width, height){
        this.width = width;
        this.height = height;
        this.cells = this.calculateTotalCells();
    }

    calculateTotalCells(){
        return this.width * this.height;
    }
}

let game;

const playElement = document.getElementById('btn-start');
const resetElement = document.getElementById('btn-rest');
const widthElement = document.getElementById('input-width');
const heightElement = document.getElementById('input-height');
const winConditionElement = document.getElementById('input-win-condition');

playElement.addEventListener("click", () => {
  const width = parseInt(widthElement.value, 10);
  const height = parseInt(heightElement.value, 10);
  let size = new BoardSize(width, height);
  game = new TicTacToe(size);
});
