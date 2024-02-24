  // To connect with your mongoDB database
  const mongoose = require('mongoose');
   mongoose.connect('mongodb+srv://boknoks:Welcome123@cluster0.6kdqgbm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { 
  //mongoose.connect('mongodb://boknoks:Welcome123@ap-southeast-1.aws.services.cloud.mongodb.com:27020/?authMechanism=PLAIN&authSource=%24external&ssl=true&appName=boknoks-nxsiy:boknoks-server:local-userpass', { 
    
    
      dbName: 'boknoks_pos_system',
      useNewUrlParser: true,
      useUnifiedTopology: true
  }, err => err ? console.log(err) : 
      console.log('Connected to yourDB-name database'));

  module.exports = mongoose;

  