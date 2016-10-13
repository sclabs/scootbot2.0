var exec = require('child_process').exec;
var githubhook = require('githubhook');
var github = githubhook({
    'port': 1337,
    'path': '/webhook',
    'secret': process.env.SCOOTBOT_WEBHOOK_SECRET
});

github.listen();

github.on('push:scootbot2.0:refs/heads/master', function (event, repo, ref, data) {
    console.log('updating');
    exec('git pull', function(error, stdout, stderr) {
        console.log('restarting');
        exec('forever restart app.js', function(error, stdout, stderr) {
            console.log('restarted');
        })
    });
});
