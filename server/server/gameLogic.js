class GameLogic {
    constructor() {
        if (!GameLogic.instance) {
            this.clients = new Map();
            this.lobbys = new Map();
            GameLogic.instance = this;
        }
        return GameLogic.instance;
    }

    addClient(id, socket) {
        this.clients.set(id, { socket });
        return this.clients.get(id);
    }

    removeClient(id) {
        this.clients.delete(id);
    }

    generateLobbyCode() {
        let code;
        do {
            code = Math.floor(100000 + Math.random() * 900000).toString();
        } while (this.lobbys.has(code));
        return code;
    }

    createLobby() {
        const lobbyId = this.generateLobbyCode();
        this.lobbys.set(lobbyId, {
            teams: {
                blue: new Set(),
                purple: new Set(),
                red: new Set(),
                yellow: new Set(),
            },
            objects: {
                projectiles: new Set(),
                gold: new Set(),
            }
        });
        return lobbyId;
    }

    addClientToLobby(lobbyId, clientId) {
        if (this.lobbys.has(lobbyId)) {
            const lobby = this.lobbys.get(lobbyId);
            const teams = Object.values(lobby.teams);
            
            let teamWithLeastPlayers = teams[0];
            for (let team of teams) {
                if (team.size < teamWithLeastPlayers.size) {
                    teamWithLeastPlayers = team;
                }
            }

            teamWithLeastPlayers.add(clientId);

            const position = this.assignInitialPosition(clientId);
            const client = this.clients.get(clientId);
            client.position = position;
        }
    }

    assignInitialPosition(clientId) {
        const x = Math.floor(Math.random() * 500);
        const y = Math.floor(Math.random() * 500);
        return { x, y };
    }

    createProjectile(team, x, y, direction) {
        const projectile = { team, x, y, direction };
        this.lobbys.forEach(lobby => {
            lobby.objects.projectiles.add(projectile);
        });
    }

    createGold(x, y) {
        const gold = { x, y };
        this.lobbys.forEach(lobby => {
            lobby.objects.gold.add(gold);
        });
    }

    getLobbyClients(lobbyId) {
        return this.lobbys.get(lobbyId) || new Set();
    }

    updateGame(fps) {
        //console.log("Se actualiza el juego");
    }

    getGameState(lobbyId) {
        const lobby = this.lobbys.get(lobbyId);
        if (!lobby) return {}; 

        return {
            players: Array.from(lobby.teams.blue)
                .concat(Array.from(lobby.teams.purple))
                .concat(Array.from(lobby.teams.red))
                .concat(Array.from(lobby.teams.yellow)),
            projectiles: Array.from(lobby.objects.projectiles),
            gold: Array.from(lobby.objects.gold),
        };
    }

    handleMessage(id, msg, socket) {
        try {
            let obj = JSON.parse(msg);
            if (!obj.type) return;
            console.log("Mensaje de tipo: " + obj.type + " recibido de " + socket)
            switch (obj.type) {
                case "launchProjectile":
                    const { direction, team } = obj;
                    const client = this.clients.get(id);
                    if (client) {
                        const { x, y } = client.position;
                        this.createProjectile(team, x, y, direction);
                    }
                    break;
                case "collectGold":
                    const { goldX, goldY } = obj;
                    this.lobbys.forEach(lobby => {
                        lobby.objects.gold.forEach(gold => {
                            if (gold.x === goldX && gold.y === goldY) {
                                // Aquí deberías manejar la recolección del oro (por ejemplo, eliminándolo)
                                lobby.objects.gold.delete(gold);
                            }
                        });
                    });
                    break;
                default:
                    break;
            }
        } catch (error) {}
    }
}

const instance = new GameLogic();
Object.freeze(instance);
module.exports = instance;
