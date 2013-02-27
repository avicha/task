Task = require('../index').Task
log = (i,complete)->
    console.log i
    complete 1,0
log_task = new Task 'console.log',5,log
log_task.push 1
log_task.push 2
log_task.pushAll [100..1]
log_task.end (infos)->
    console.log infos
