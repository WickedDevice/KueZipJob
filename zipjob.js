var kue = require('kue')
  , queue = kue.createQueue();

queue.process('zip', (job, done) => {

  done();
});

process.once( 'uncaughtException', function(err){
  console.error( 'Something bad happened: ', err );
  queue.shutdown( 1000, function(err2){
    console.error( 'Kue shutdown result: ', err2 || 'OK' );
    process.exit( 0 );
  });
});

