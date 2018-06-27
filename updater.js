var exec = require('child_process').exec;
var githubhook = require('githubhook');
var github = githubhook({
    'port': 1337,
    'path': '/webhook',
    'secret': process.env.SCOOTBOT_WEBHOOK_SECRET
});
var deploy = require('./docker.js').deploy;

github.listen();

github.on('push:scootbot2.0:refs/heads/master', function (event, repo, ref, data) {
    console.log('updating');
    exec('git pull', function(error, stdout, stderr) {
        console.log('updating dependencies');
        exec('npm install', function(error, stdout, stderr) {
            console.log('restarting');
            exec('forever restart app.js', function(error, stdout, stderr) {
                console.log('restarted');
            })
        });

    });
});

var reggie_opts = {cwd: '/home/scootbot/reggie'};
github.on('push:reggie:refs/heads/master', function (event, repo, ref, data) {
    console.log('pulling reggie');
    exec('git pull', reggie_opts, function(error, stdout, stderr) {
        console.log('building reggie');
        exec('docker build -t reggie:latest .', reggie_opts, function(error, stdout, stderr) {
            console.log('redeploying reggie');
            deploy('tritz', 'reggie', 'reggie:latest', console.log);
        });
    });
});
