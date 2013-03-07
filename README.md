task
=======

这是一个控制函数并发执行和定时执行的模块
##安装
<pre>
    npm install yi-task
</pre>
##CLASS
* Task，用于控制任务并发执行。


引入Task类
```javascript
var Task = require('yi-task').Task;
```

初始化一个任务，例如处理用户登录，但我们控制同时处理数为100

```javascript
var login_task = new Task('handle the user login',100,function(username,password,complete){
    //handle the login logic
    ...
    //表示成功完成了1个任务，失败了0个任务
    complete(1,0);
});
```

添加任务

```javascript
//Avicha is the username param and 123456 is the password param.
login_task.push('Avicha','123456');

//batch push user
login_task.pushAll([['Avicha','123456'],['Yi','654321'],['other_user','their_password']]);
```

结束任务，当所有任务执行完毕后执行回调函数

```javascript
login_task.end(function(infos){
    console.log(infos);
    process.exit(0);
});
```
* Crontab，这是一个类似于crontab的模块，用于定时某个时候执行一个指定的函数。

引入Crontab类

```javascript
var Crontab = require('yi-task').Crontab;
```

初始化

```javascript
var crontab = new Crontab();
//var crontab = new Crontab(1000*60); 默认至少每60s监听一次
```

设置定时任务,格式跟crontab一致

```javascript
//每逢星期一三五的每两个小时执行一次更新用户信息这个函数操作
crontab.set('0','*/2','*','*','1,3,5',function(){
    update_user_info();
});
```

启动crontab

```javascript
crontab.run();
//crontab.run(1000*60*60*24);  只监听1天，默认一直监听
```

停止crontab并退出进程

```javascript
crontab.stop();
```
