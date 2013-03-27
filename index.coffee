EventEmitter = require('events').EventEmitter
_ = require 'underscore'
###*
 * forEachLimit的动态版，可以并发地执行函数todo
###
class Task extends EventEmitter
    info : (is_log)->
        self = @
        self.endTime = Date.now()
        self.sumTime = self.endTime - self.startTime
        self.avgTime = self.sumTime / (self.completeNum?=1)
        infos = 
            '任务名称' : self.name
            '任务总数' : self.sumNum
            '队列长度' : self.queue.length
            '并发任务个数' : self.runningNum
            '完成任务总数' : self.completeNum
            '成功数' : self.successNum
            '失败数' : self.failNum
            '使用总时间' : self.sumTime+'ms'
            '平均使用时间' : self.avgTime+'ms'
        if is_log
            _.each infos,(value,key,obj)->
                console.log "#{key} : #{value}"
        {
            name:self.name
            sumNum:self.sumNum
            successNum:self.successNum
            failNum:self.failNum
            sumTime:self.sumTime
            avgTime:self.avgTime
        }
    constructor:(name,limit,todo)->
        self = @
        if !todo
            if _.isFunction limit
                todo = limit
                limit = name
                name = ''
            else
                todo = name
                limit = 0
                name = ''
        @queue = []
        @name = name
        @limit = limit
        @sumNum = 0
        @runningNum = 0
        @completeNum = 0
        @successNum = 0
        @failNum = 0
        @ended = false
        @todo = todo || @info 
        @startTime = Date.now()
        @endTime = Date.now()
        @sumTime = 0
        @avgTime = 0
        @endedFunc = @info
        self.on 'do',()->
            if curlength = self.queue.length&&((self.runningNum < self.limit) || !self.limit)
                argvs = self.queue.shift()
                self.runningNum++
                if !_.isArray argvs
                    argvs = [argvs]
                argvs.push ()->
                    self.complete.apply self,arguments
                self.todo.apply self,argvs
        self
    push:(argvs...)->
        self = @
        self.queue.push argvs
        self.sumNum++
        self.emit 'do'
        self
    pushAll:(vals)->
        self = @
        self.queue = self.queue.concat vals
        self.sumNum += vals.length
        vals.forEach (val)->
            self.emit 'do'
        self
    complete:(success=1,error=0)->
        self = @
        self.completeNum++
        self.runningNum--
        self.failNum += error
        self.successNum += success
        if self.ended&&(self.completeNum == self.sumNum)
            self.endedFunc self.info()
        else
            self.emit 'do'
        self
    end:(func)-> 
        self = @
        if _.isFunction func
            self.endedFunc = func
        self.ended = true
        if self.sumNum ==self.completeNum
            self.endedFunc self.info()
        self
module.exports.Task = Task
#定时运行任务控制，类似于crontab，但更加灵活，可以运行不同的函数
class Crontab 
    constructor : (interval)->
        #任务列表
        @_tasks = []
        #已经监听时间
        @_pastTime = 0
        #监听间隔
        @_interval = interval||1000 * 60
        if @interval < 1000 * 60
            @interval = 1000 * 60
        #监听限制时间
        @runTime = 0
        @
    #设置任务的运行时间,分，小时，日，月，星期，运行函数
    set : (minute, hour, date, month, day, func) ->
        @_tasks.push
            minute:String minute
            hour:String hour
            date:String date
            month:String month
            day:String day
            func:func
        @
    #检查是否有任务要执行
    checkTask : () ->
        self = @
        self._pastTime += self._interval
        if self.runTime&&self._pastTime>=self.runTime
            self.stop()
        else
            now = 
                minute:new Date().getMinutes()
                hour:new Date().getHours()
                date:new Date().getDate()
                month:new Date().getMonth() + 1
                day:new Date().getDay()
            self._tasks.forEach (task) ->
                execute = true
                #每个参数暂时可能是*，0，*/2,9-22,9-22/8,  2,3,6这几种
                _.each now,(val,key,obj)->
                    #如果单纯数字
                    if task[key] != '*'
                        if (/^\d+$/.test task[key]) && now[key] != parseInt(task[key]) 
                            execute = false
                        #如果每隔num个时间段
                        if /^\*\/(\d+)$/.test task[key]
                            interval = parseInt task[key].match(/^\*\/(\d+)$/)[1]
                            if now[key] % interval != 0
                                execute = false
                        #如果在from-to这个区间
                        if /^(\d+)-(\d+)$/.test task[key]
                            from = parseInt task[key].match(/^(\d+)-(\d+)$/)[1]
                            to = parseInt task[key].match(/^(\d+)-(\d+)$/)[2]
                            if now[key] < from || now[key] > to
                                execute = false
                        #如果在from-to这个区间每隔num个时间段
                        if /^(\d+)-(\d+)\/(\d+)$/.test task[key]
                            from = parseInt task[key].match(/^(\d+)-(\d+)\/(\d+)$/)[1]
                            to = parseInt task[key].match(/^(\d+)-(\d+)\/(\d+)$/)[2]
                            interval = parseInt task[key].match(/^(\d+)-(\d+)\/(\d+)$/)[3]
                            if (now[key] < from) || (now[key] > to) || (now[key] % interval != 0)
                                execute = false
                        #如果是指定时间，以逗号分隔
                        if /^\d+,{1,}/.test task[key]
                            range = task[key].split(',').map (time)->Number time
                            if !_.include range, now[key]
                                execute = false
                #如果符合条件则执行任务
                if execute
                    console.log now
                    task.func()
    run : (runtime)->
        self = @
        self.runTime = runtime if runtime
        self._checktick = setInterval ()->
            self.checkTask.apply self
        , self._interval
        console.log "#{self._tasks.length}个任务正在被监听。"
        process.on 'uncaughtException', (err) ->
            console.log  '系统发现未知错误：'
            console.error err.stack
    stop : ()->
        self = @
        clearInterval self._checktick
        process.exit 0
module.exports.Crontab = Crontab