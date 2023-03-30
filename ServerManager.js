class ServerManager {
  static instance;
  servers = new Map();
  users = new Map();
  setUser(user) {
    this.users.set(user.username, user);
  }
  deleteUser(user) {
    this.users.delete(user.username);
    this.servers.delete(user.username);
  }
  getServers() {
    return Array.from(this.servers, ([name, value]) => value);
  }
  getUsers() {
    return Array.from(this.users, ([name, value]) => value);
  }
  setServer(creatorUser) {
    if (this.servers.has(creatorUser.username)) {
      return;
    }
    this.servers.set(creatorUser.username, new Server(creatorUser.username));
  }

  // Método estático que devuelve la instancia Singleton
  static getInstance() {
    if (!ServerManager.instance) {
      ServerManager.instance = new ServerManager();
    }
    return ServerManager.instance;
  }
}

class Server {
  creatorUsername;
  connectionMap = new Map();
  constructor(creatorUsername) {
    this.creatorUsername = creatorUsername;
  }
  resetConnection(friendUsername) {
    is.connectionMap.set(friendUsername, {});
  }
  getConnection(friendUsername) {
    let connectionData = this.connectionMap.get(friendUsername);
    if (connectionData == null) {
      connectionData = {};
      this.connectionMap.set(friendUsername, connectionData);
    }
    return connectionData;
  }

  setCandidateOffer(friendUsername, candidateOffer) {
    let connectionData = this.getConnection(friendUsername);
    connectionData.candidateOffer = candidateOffer;
  }

  getCandidateOffer(friendUsername) {
    let connectionData = this.getConnection(friendUsername);

    return connectionData.candidateOffer;
  }

}

module.exports = ServerManager;
