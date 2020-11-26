module.exports = {
  secret: process.env.SECRETKEY,
  database: `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASS}@realm-shard-00-00.ruzmf.mongodb.net:27017,realm-shard-00-01.ruzmf.mongodb.net:27017,realm-shard-00-02.ruzmf.mongodb.net:27017/realm?ssl=true&replicaSet=atlas-1nxqi7-shard-0&authSource=admin&retryWrites=true&w=majority`,
  // 'database': `mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@realm.ruzmf.mongodb.net/realm?retryWrites=true&w=majority`,
  port: process.env.PORT || 3000,
};
