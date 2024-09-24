const ws = new WebSocket("ws://localhost:3000");

let playerBoard = createBoard("player-board");
let opponentBoard = createBoard("opponent-board", true);

// Função para exibir a mensagem na área de mensagens
function displayMessage(message) {
    const messageArea = document.getElementById('message-area');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageArea.appendChild(messageElement);
}

// Evento de mensagem do WebSocket (quando o servidor envia uma mensagem)
ws.addEventListener('message', function(event) {
    const data = JSON.parse(event.data);

    // Verifique se o tipo de mensagem é 'broadcast'
    if (data.type === 'broadcast') {
        displayMessage(data.message);  // Exibe a mensagem na UI
    }
});

let selectedShipType = null;
let selectedShipElement = null;  // Referência ao navio que está sendo arrastado

// Botões
const startGameButton = document.getElementById('start-game');
const confirmShipsButton = document.getElementById('confirm-ships');
const fireButton = document.getElementById('fire-button');

// Desabilitar os botões no início
confirmShipsButton.disabled = true;
fireButton.disabled = true;

// Evento para iniciar o jogo
startGameButton.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: "start" }));
    document.getElementById('message').textContent = "Jogo iniciado! Posicione seus navios.";
    startGameButton.disabled = true;
});

// Evento para confirmar o posicionamento dos navios
confirmShipsButton.addEventListener('click', () => {
    if (shipsPlaced) {
        ws.send(JSON.stringify({ type: "confirm-ships" }));
        confirmShipsButton.disabled = true;
        fireButton.disabled = false;  // Habilita o botão de disparo
        document.getElementById('message').textContent = "Navios posicionados. Aguarde sua vez para atacar!";
    }
});

// Função para criar os tabuleiros
function createBoard(boardId, isOpponent = false) {
    const boardElement = document.getElementById(boardId);
    let board = [];

    for (let y = 0; y < 10; y++) {
        let row = [];
        for (let x = 0; x < 10; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (!isOpponent) {
                // Permitir o drop apenas no tabuleiro do jogador
                cell.addEventListener("dragover", (e) => e.preventDefault());
                cell.addEventListener("drop", (e) => handleDrop(e, x, y));
            }

            boardElement.appendChild(cell);
            row.push(0);  // Representa células vazias inicialmente
        }
        board.push(row);
    }
    return board;
}

// Função para lidar com o posicionamento do navio
function handleDrop(event, x, y) {
    event.preventDefault();  // Previne o comportamento padrão do navegador
    if (selectedShipType && selectedShipElement) {
        const shipLength = getShipLength(selectedShipType);
        for (let i = 0; i < shipLength; i++) {
            if (y + i < 5) {  // Garante que o navio caiba no tabuleiro
                playerBoard[y + i][x] = 1;  // Marca o navio no tabuleiro
                const cell = document.querySelector(`#player-board .cell[data-x="${x}"][data-y="${y + i}"]`);
                cell.classList.add("ship");
            }
        }

        // Volta a mostrar o navio na lista, se necessário
        selectedShipElement.classList.add('hidden');  // Esconde o navio após posicioná-lo
        selectedShipType = null;
        selectedShipElement = null;  // Resetar as variáveis

        checkAllShipsPlaced();  // Verifica se todos os navios foram colocados
    }
}

// Função para verificar se todos os navios foram colocados no tabuleiro
function checkAllShipsPlaced() {
    // Verifica se todos os navios foram arrastados e escondidos (colocados no tabuleiro)
    const ships = document.querySelectorAll('.ship');
    const allShipsPlaced = Array.from(ships).every(ship => ship.classList.contains('hidden')); // Verifica se todos os navios estão escondidos
    if (allShipsPlaced) {
        shipsPlaced = true;
        confirmShipsButton.disabled = false;  // Habilita o botão de confirmar navios
        document.getElementById('message').textContent = "Todos os navios posicionados. Confirme para começar a batalha.";
    }
}

// Evento para confirmar o posicionamento dos navios
confirmShipsButton.addEventListener('click', () => {
    if (shipsPlaced) {
        ws.send(JSON.stringify({ type: "confirm-ships" }));
        confirmShipsButton.disabled = true;  // Desabilita o botão após confirmação
        fireButton.disabled = false;  // Habilita o botão de disparo
        document.getElementById('message').textContent = "Navios posicionados. Aguarde sua vez para atacar!";
    }
});

// Função para manipular o "drop" e posicionar o navio no tabuleiro
function handleDrop(event, x, y) {
    event.preventDefault();
    if (selectedShipType && selectedShipElement) {
        const shipLength = getShipLength(selectedShipType);
        for (let i = 0; i < shipLength; i++) {
            if (y + i < 5) {  // Garante que o navio não ultrapasse os limites
                playerBoard[y + i][x] = 1;  // Marca o navio no tabuleiro
                const cell = document.querySelector(`#player-board .cell[data-x="${x}"][data-y="${y + i}"]`);
                cell.classList.add("ship");
            }
        }

        // Esconder o navio após posicioná-lo
        selectedShipElement.classList.add('hidden');  // Marca o navio como "escondido" ao ser colocado
        selectedShipType = null;
        selectedShipElement = null;  // Limpa as seleções

        checkAllShipsPlaced();  // Verifica se todos os navios foram colocados
    }
}


// Função para selecionar o navio
document.querySelectorAll('.ship').forEach(ship => {
    ship.addEventListener("dragstart", (event) => {
        selectedShipType = event.target.dataset.shipType;
        selectedShipElement = event.target;
    });
});

// Função para obter o tamanho do navio com base no tipo
function getShipLength(shipType) {
    switch (shipType) {
        case "submarine":
            return 1;
        case "destroyer":
            return 2;
        case "cruiser":
            return 3;
        case "battleship":
            return 4;
        case "carrier":
            return 5;
        default:
            return 0;
    }
}