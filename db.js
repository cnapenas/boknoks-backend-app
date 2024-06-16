  // To connect with your mongoDB database
  const mongoose = require('mongoose');
 
//    mongoose.connect(process.env.DB_CONNECTION_STRING, { 
//   //mongoose.connect('mongodb://boknoks:Welcome123@ap-southeast-1.aws.services.cloud.mongodb.com:27020/?authMechanism=PLAIN&authSource=%24external&ssl=true&appName=boknoks-nxsiy:boknoks-server:local-userpass', {    
//       dbName: process.env.DB_NAME,
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useFindAndModify: false
//   }, err => err ? console.log(err) : 
//       console.log('Connected to ' + process.env.DB_NAME +' 00database'));

mongoose.connect(`${process.env.DB_CONNECTION_STRING}${process.env.DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() =>  console.log('Connected to database:', mongoose.connection.db.databaseName)
  .catch(err => console.error('Error:', err));

  module.exports = mongoose;

  