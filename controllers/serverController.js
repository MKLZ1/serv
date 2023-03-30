const ServerManager = require('../ServerManager');


module.exports.create = async (req, res, next) => {
    if(res.locals.user==null){
        next();
        return;
    }

   const serverManager =  ServerManager.getInstance();
   serverManager.addServer(res.locals.user.username);
    res.status(200).json({ servers: JSON.stringify(serverManager.servers)});
}
module.exports.getAll = async (req, res, next) => {
    if(res.locals.user==null){
        next();
        return;
    }
    res.status(200).json({ servers:JSON.stringify(ServerManager.getInstance().servers) });

}