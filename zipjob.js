var kue = require('kue')
  , queue = kue.createQueue();

var exec = require('child_process').exec;
var rimraf = require('rimraf');
var fs = require('fs');

queue.process('zip', (job, done) => {
  let input_filenames = `${job.data.save_path}/\*.csv`; // job.data.original_serials.map( serial => `${job.data.save_path}/${serial}.csv` ).join(' ');
  let output_filename = `${job.data.save_path}/${job.data.zipfilename}`;

  // -j = --junk-paths, makes it so the zipped files are flattened to the root of the zip
  let cmd = `zip -j ${output_filename} ${input_filenames}`;
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      done(error);
    }
    else{
      // clean up after yourself, delete everything in save_path that is not a .zip file      
      let error = null;
      fs.readdirSync(`${job.data.save_path}`).forEach( (filename) => {      
        if(filename.indexOf(".zip") < 0){
          rimraf(`${job.data.save_path}/${filename}`, (err) => {
            error = err;
          });
        }          
      });

      if(error){
        done(error);
      }
      else{
        try{
          let job2 = queue.create('email', {
            title: 'Emailing user ' + job.data.email
            , save_path: job.data.save_path
            , original_serials: job.data.original_serials.slice()
            , original_url: job.data.original_url
            , serials: job.data.serials.slice()
            , user_id: job.data.user_id
            , email: job.data.email
            , zipfilename: job.data.zipfilename
          })
          .priority('high')
          .attempts(1)
          .save();

          done();
        } 
        catch(e){
          done(e);
        }
      }
    }
  });
});

process.once( 'uncaughtException', function(err){
  console.error( 'Something bad happened: ', err );
  queue.shutdown( 1000, function(err2){
    console.error( 'Kue shutdown result: ', err2 || 'OK' );
    process.exit( 0 );
  });
});

