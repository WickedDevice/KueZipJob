var kue = require('kue')
  , queue = kue.createQueue();

var exec = require('child_process').exec;

queue.process('zip', (job, done) => {
  let input_filenames = job.data.serials.map( serial => `${job.data.save_path}/${serial}.csv` ).join(' ');
  let output_filename = `${job.data.save_path}/${job.data.zipfilename}`;

  let cmd = `zip ${output_filename} ${input_filenames}`;
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      done(error);
    }
    else{
      done();
    }
});

process.once( 'uncaughtException', function(err){
  console.error( 'Something bad happened: ', err );
  queue.shutdown( 1000, function(err2){
    console.error( 'Kue shutdown result: ', err2 || 'OK' );
    process.exit( 0 );
  });
});

