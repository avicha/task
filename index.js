// Generated by CoffeeScript 1.4.0
(function() {
  var Crontab, EventEmitter, Task, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  EventEmitter = require('events').EventEmitter;

  _ = require('underscore');

  /**
   * forEachLimit的动态版，可以并发地执行函数todo
  */


  Task = (function(_super) {

    __extends(Task, _super);

    Task.prototype.info = function(is_log) {
      var infos, self, _ref;
      self = this;
      self.endTime = Date.now();
      self.sumTime = self.endTime - self.startTime;
      self.avgTime = self.sumTime / ((_ref = self.completeNum) != null ? _ref : self.completeNum = 1);
      infos = {
        '任务名称': self.name,
        '任务总数': self.sumNum,
        '队列长度': self.queue.length,
        '并发任务个数': self.runningNum,
        '完成任务总数': self.completeNum,
        '成功数': self.successNum,
        '失败数': self.failNum,
        '使用总时间': self.sumTime + 'ms',
        '平均使用时间': self.avgTime + 'ms'
      };
      if (is_log) {
        _.each(infos, function(value, key, obj) {
          return console.log("" + key + " : " + value);
        });
      }
      return {
        name: self.name,
        sumNum: self.sumNum,
        successNum: self.successNum,
        failNum: self.failNum,
        sumTime: self.sumTime,
        avgTime: self.avgTime
      };
    };

    function Task(name, limit, todo) {
      var self;
      self = this;
      if (!todo) {
        if (_.isFunction(limit)) {
          todo = limit;
          limit = name;
          name = '';
        } else {
          todo = name;
          limit = 0;
          name = '';
        }
      }
      this.queue = [];
      this.name = name;
      this.limit = limit;
      this.sumNum = 0;
      this.runningNum = 0;
      this.completeNum = 0;
      this.successNum = 0;
      this.failNum = 0;
      this.ended = false;
      this.todo = todo || this.info;
      this.startTime = Date.now();
      this.endTime = Date.now();
      this.sumTime = 0;
      this.avgTime = 0;
      this.endedFunc = this.info;
      self.on('do', function() {
        var argvs, curlength;
        if (curlength = self.queue.length && ((self.runningNum < self.limit) || !self.limit)) {
          argvs = self.queue.shift();
          self.runningNum++;
          if (!_.isArray(argvs)) {
            argvs = [argvs];
          }
          argvs.push(function() {
            return self.complete.apply(self, arguments);
          });
          return self.todo.apply(self, argvs);
        }
      });
      self;

    }

    Task.prototype.push = function() {
      var argvs, self;
      argvs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      self = this;
      self.queue.push(argvs);
      self.sumNum++;
      self.emit('do');
      return self;
    };

    Task.prototype.pushAll = function(vals) {
      var self;
      self = this;
      self.queue = self.queue.concat(vals);
      self.sumNum += vals.length;
      vals.forEach(function(val) {
        return self.emit('do');
      });
      return self;
    };

    Task.prototype.complete = function(success, error) {
      var self;
      if (success == null) {
        success = 1;
      }
      if (error == null) {
        error = 0;
      }
      self = this;
      self.completeNum++;
      self.runningNum--;
      self.failNum += error;
      self.successNum += success;
      if (self.ended && (self.completeNum === self.sumNum)) {
        self.endedFunc(self.info);
      } else {
        self.emit('do');
      }
      return self;
    };

    Task.prototype.end = function(func) {
      var self;
      self = this;
      if (_.isFunction(func)) {
        self.endedFunc = func;
      }
      self.ended = true;
      if (self.sumNum === self.completeNum) {
        self.endedFunc(self.info);
      }
      return self;
    };

    return Task;

  })(EventEmitter);

  module.exports.Task = Task;

  Crontab = (function() {

    function Crontab(interval) {
      this._tasks = [];
      this._pastTime = 0;
      this._interval = interval || 1000 * 60;
      if (this.interval < 1000 * 60) {
        this.interval = 1000 * 60;
      }
      this.runTime = 0;
      this;

    }

    Crontab.prototype.set = function(minute, hour, date, month, day, func) {
      this._tasks.push({
        minute: String(minute),
        hour: String(hour),
        date: String(date),
        month: String(month),
        day: String(day),
        func: func
      });
      return this;
    };

    Crontab.prototype.checkTask = function() {
      var now, self;
      self = this;
      self._pastTime += self._interval;
      if (self.runTime && self._pastTime >= self.runTime) {
        return self.stop();
      } else {
        now = {
          minute: new Date().getMinutes(),
          hour: new Date().getHours(),
          date: new Date().getDate(),
          month: new Date().getMonth() + 1,
          day: new Date().getDay()
        };
        return self._tasks.forEach(function(task) {
          var execute;
          execute = true;
          _.each(now, function(val, key, obj) {
            var from, interval, range, to;
            if (task[key] !== '*') {
              if ((/^\D+$/.test(task[key])) && now[key] !== parseInt(task[key])) {
                console.log('aaaaaaa');
                execute = false;
              }
              if (/^\*\/(\d+)$/.test(task[key])) {
                interval = parseInt(task[key].match(/^\*\/(\d+)$/)[1]);
                if (now[key] % interval !== 0) {
                  execute = false;
                }
              }
              if (/^(\d+)-(\d+)$/.test(task[key])) {
                from = parseInt(task[key].match(/^(\d+)-(\d+)$/)[1]);
                to = parseInt(task[key].match(/^(\d+)-(\d+)$/)[2]);
                if (now[key] < from || now[key] > to) {
                  execute = false;
                }
              }
              if (/^(\d+)-(\d+)\/(\d+)$/.test(task[key])) {
                from = parseInt(task[key].match(/^(\d+)-(\d+)\/(\d+)$/)[1]);
                to = parseInt(task[key].match(/^(\d+)-(\d+)\/(\d+)$/)[2]);
                interval = parseInt(task[key].match(/^(\d+)-(\d+)\/(\d+)$/)[3]);
                if ((now[key] < from) || (now[key] > to) || (now[key] % interval !== 0)) {
                  execute = false;
                }
              }
              if (/^\d+,{1,}/.test(task[key])) {
                range = task[key].split(',').map(function(time) {
                  return Number(time);
                });
                if (!_.include(range, now[key])) {
                  return execute = false;
                }
              }
            }
          });
          if (execute) {
            console.log(now);
            return task.func();
          }
        });
      }
    };

    Crontab.prototype.run = function(runtime) {
      var self;
      self = this;
      if (runtime) {
        self.runTime = runtime;
      }
      self._checktick = setInterval(function() {
        return self.checkTask.apply(self);
      }, self._interval);
      console.log("" + self._tasks.length + "个任务正在被监听。");
      return process.on('uncaughtException', function(err) {
        console.log('系统发现未知错误：');
        return console.error(err.stack);
      });
    };

    Crontab.prototype.stop = function() {
      var self;
      self = this;
      clearInterval(self._checktick);
      return process.exit(0);
    };

    return Crontab;

  })();

  module.exports.Crontab = Crontab;

}).call(this);
