module.exports = {
  secret: process.env.SECRETKEY,
  database: `mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@realm.ruzmf.mongodb.net/realm?retryWrites=true&w=majority`,
  port: process.env.PORT || 3000,
};
