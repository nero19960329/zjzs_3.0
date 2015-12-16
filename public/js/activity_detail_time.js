/*时间格式处理*/
//
//function show_time(t)//输入一个毫秒数，转成文字，用作倒计时
//{
//    if (t<0) t=0;
//    var f=Math.floor;
//    var d=f(t/86400000);
//    var h=f(t%86400000/3600000);
//    var m=f(t%3600000/60000);
//    var s=f(t%60000/1000);
//    //var ms=f(t%1000);
//    //s=s+'.'+f(ms/100);
//    if (d)
//        return d+'天'+h+'小时'+m+'分';
//    if (h)
//        return h+'小时'+m+'分'+s+'秒';
//    if (m)
//        return m+'分'+s+'秒';
//    return s+'秒';
//}

function combine_time(t1, t2) {
  var date1 = new Date(t1);
  var date2 = new Date(t2);

  return (date1.getMonth() + 1) + '月' + (date1.getDate()) + '日' + date1.getHours() +
    ':' + ((date1.getMinutes() < 10)? '0': '') + date1.getMinutes() +
    ' - ' + ((date2.getDate() != date1.getDate())? ((date2.getMonth() + 1) + '月' + (date2.getDate()) + '日'): '') +
    date2.getHours() + ':' + ((date2.getMinutes() < 10)? '0': '') + date2.getMinutes();
}

/*初始化倒计时*/
//var time_left = (!activity_ticket_status?activity_book_ticket_time_raw:(activity_book_ticket_end_time_raw))-time_server;
