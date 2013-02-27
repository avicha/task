Task = require('../index').Task
validate_login = (username,password,complete)->
    console.log username
    console.log password
    if username == 'Avicha'&&password == '123456'||username == 'Yi'&&password == '654321'
        process.nextTick ()->
            complete 1,0
    else
        process.nextTick ()->
            complete 0,1
login_task = new Task 'handle the user login',100,validate_login
login_task.push 'Avicha','123456'
login_task.pushAll [['Avicha','123456'],['Yi','654321'],['other_user','their_password']]
login_task.end ()->
    process.exit 0
