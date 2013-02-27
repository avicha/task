Crontab = require('../index').Crontab
crontab_root = new Crontab()
#每个月的20-30号每隔两天，正好是二四六的话，1点钟每隔2分钟去执行函数f
crontab_root.set '*/2','1','20-30/2','*','2,4,6',()->
    console.log new Date().toISOString()
crontab_root.set '10','10-22/2','*','*','*',()->
    process.nextTick ()->
        console.log 'I am doing the thing.'
crontab_root.run()