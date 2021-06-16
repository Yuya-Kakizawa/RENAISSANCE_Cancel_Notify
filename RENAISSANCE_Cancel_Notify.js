// これらのコードを GAS に貼り付ける
let LINE_TOKEN = 'hogehoge';

// LINE notifyで送信
function sendLine(message){
   
  //Lineに送信するためのトークン
  let options =
   {
     "method"  : "post",
     "payload" : "message=" + message,
     "headers" : {"Authorization" : "Bearer "+ LINE_TOKEN}
   };
 
   UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
}


// is:unread の条件は起動していない，ただし，'from:rol-noreply@s-re.jp subject:キャンセル発生お知らせ'を全件取得
// 参考サイト：
function searchMail(searchText, option) {
  // optionの初期値セットアップ
  if(!option) { option = {} }
  if(!option.startThreadIndex) { option.startThreadIndex = 0 }
  if(!option.maxThreadCount) { option.maxThreadCount = 10 }
  
  // Gメールから検索
  const threads = GmailApp.search(searchText, option.startThreadIndex, option.maxThreadCount);
  const messages = GmailApp.getMessagesForThreads(threads);

  // スレッドを展開、同一IDの除去
  var messageMap = {};
  for(var i=0;i<messages.length;i++){
    for(var j=0;j<messages[i].length;j++){
      // メールが未読かどうかの判定
      // line 送る前に既読にしてしまった場合の対処は別途対応
      if(messages[i][j].isUnread()){
        messageMap[messages[i][j].getId()] = messages[i][j]
      }
    }
  }  
  return Object.keys(messageMap)
    .map(function(id) { return messageMap[id] })
    .sort(function(a, b) { return a.getDate().getTime() - b.getDate().getTime()})// 昇順
}


function searchAndSend() {
  // 検索条件の指定 → 検索演算子については以下参照
  // https://support.google.com/mail/answer/7190?hl=ja
  let query = '(is:unread from:rol-noreply@s-re.jp subject:キャンセル発生お知らせ)';

  //取得
  let threads = searchMail(query);

  var messages = [];

  for(var i = 0; i < threads.length; i++){
    let message = threads[i];

    messages[i] = "\n【date】: " + message.getDate()
                 + "\n【Subject】: " + message.getSubject()
                 + "\n【Body】: \n" + message.getPlainBody();
    
    message.markRead(); //メッセージを既読にする
    message.moveToTrash();
  }

  return messages;
}

function main() {
 new_messages = searchAndSend()
 if(new_messages.length > 0){
   for(var i = 0; i < new_messages.length; i++){
    sendLine(new_messages[i]);
    // console.log('send message!');
   }
 }
}
