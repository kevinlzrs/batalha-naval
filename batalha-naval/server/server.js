const WebSocket = require('ws');

// Criar o servidor WebSocket na porta 3000
const wss = new WebSocket.Server({ port: 3000 });

let players = [];
let currentTurn = 0; // Para controlar o turno dos jogadores

// Função para enviar mensagem a um cliente específico
function sendTo(connection, message) {
    connection.send(JSON.stringify(message));
}

// Função para enviar mensagem de broadcast para todos os jogadores
function broadcast(message) {
    players.forEach(player => {
        if (player.connection.readyState === WebSocket.OPEN) {
            sendTo(player.connection, message);
        }
    });
}

// Quando um cliente se conecta
wss.on('connection', (ws) => {
    // Limite de dois jogadores no jogo
    if (players.length >= 2) {
        sendTo(ws, { type: "error", message: "O jogo já está em andamento." });
        ws.close();
        return;
    }

    // Adicionar o jogador à lista
    let player = { id: players.length + 1, connection: ws, board: [], hits: 0 };
    players.push(player);

    // Notificar o jogador sobre sua entrada no jogo
    sendTo(ws, { type: "info", message: "Você entrou no jogo como Jogador " + player.id });

    // Quando dois jogadores estão conectados, o jogo começa
    if (players.length === 2) {
        broadcast({ type: "start", message: "O jogo começou!" });
        sendTo(players[currentTurn].connection, { type: "turn", message: "Sua vez de jogar!" });
    }

    // Quando o servidor recebe uma mensagem de um jogador
    ws.on('message', (message) => {
        let data = JSON.parse(message);

        // Verifica se é um movimento de ataque
        if (data.type === "move") {
            if (players[currentTurn].connection !== ws) {
                sendTo(ws, { type: "error", message: "Não é seu turno!" });
                return;
            }

            let opponent = players[1 - currentTurn];
            let { x, y } = data;

            // Verifica se o ataque acertou um navio
            if (opponent.board[y][x] === 1) {
                opponent.board[y][x] = 2; // 2 significa navio atingido
                players[currentTurn].hits++;
                broadcast({ type: "hit", x, y, player: currentTurn + 1 });

                // Verifica se o jogador atual venceu o jogo
                if (players[currentTurn].hits === 5) { // Altere '5' para o número necessário de acertos
                    broadcast({ type: "win", message: "Jogador " + (currentTurn + 1) + " venceu!" });
                }
            } else {
                // O jogador errou o ataque
                broadcast({ type: "miss", x, y, player: currentTurn + 1 });
                currentTurn = 1 - currentTurn; // Troca o turno
                sendTo(players[currentTurn].connection, { type: "turn", message: "Sua vez de jogar!" });
            }
        }

        // Verifica se o jogador está configurando o tabuleiro
        if (data.type === "setBoard") {
            players.find(p => p.connection === ws).board = data.board;
        }
    });

    // Quando o jogador se desconecta
    ws.on('close', () => {
        players = players.filter(p => p.connection !== ws);
        broadcast({ type: "info", message: "Jogador desconectado. Jogo finalizado." });
    });
});

console.log("Servidor WebSocket rodando na porta 3000");
