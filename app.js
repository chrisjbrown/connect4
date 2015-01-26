(function($){

  var socket = io.connect();

  var connect4 = (function(){

    //private
    var tokensPerCol = 5,
      numCols = 6,
      numTokens = 0,
      maxTokens = 42,
      colHeight = 250;
      tokenHeight = 50,
      $h2 = $('h2'),
      moves = [],
      columns = [
        [],
        [],
        [],
        [],
        [],
        [],
        []
      ];

    //public
    var playing = false,
      playerId = '',
      currentTurn = 'p1';

    $h2.text('Player 1'+"'s" + ' turn');

    //private fn's
    var logData = function() {
      console.log('columns: ' + JSON.stringify(columns));
      console.log('moves: ' + JSON.stringify(moves));
    };

    //public fn's
    var winCheck = function(player) {
      // check length in each direction
      // probably more efficient way to do this but hey it works!
      var l = 1,
        i = 1,
        lastMove = moves[moves.length-1];

      // top to bottom
      while( ((lastMove.y - i) >= 0)
        && (columns[ lastMove.x ][ lastMove.y - i ] === player) ) {
        l += 1; i += 1;
      };

      i = 1;
      while( ((lastMove.y + i) <= tokensPerCol)
        && (columns[ lastMove.x ][ lastMove.y + i ] === player) ) {
          l += 1; i += 1;
      };

      if ( l >= 4 ) {
        return true;
      }

      // left to right
      l = 1;
      while( ((lastMove.x - i) >= 0)
        && (columns[ lastMove.x - i][ lastMove.y ] === player) ) {
          l += 1; i += 1;
      };

      i = 1;
      while( ((lastMove.x + i) <= numCols)
        && (columns[ lastMove.x + i][ lastMove.y ] === player) ) {
          l += 1; i += 1;
      };

      if ( l >= 4 ) {
        return true;
      }

      // top-left -> bottom-right
      l = 1;
      while( ((lastMove.x - i) >= 0)
        && (columns[ lastMove.x - i][ lastMove.y + i] === player) ) {
        l += 1; i += 1;
      };

      i = 1;
      while( ((lastMove.x + i) <= numCols)
        && (columns[ lastMove.x + i][ lastMove.y - i] === player) ) {
        l += 1; i += 1;
      };

      if ( l >= 4 ) {
        return true;
      }

      // top-right -> bottom-left
      l = 1;
      while( ((lastMove.x + i) <= numCols)
        && (columns[ lastMove.x + i][ lastMove.y + i] === player) ) {
        l += 1; i += 1;
      };

      i = 1;
      while( ((lastMove.x - i) >= 0)
        && (columns[ lastMove.x - i][ lastMove.y - i] === player) ) {
        l += 1; i += 1;
      };

      if ( l >= 4 ) {
        return true;
      }
      return false;
    }

    var winner = function(player) {
      this.playing = false;
      $h2.text('Player '+ (this.currentTurn==='p1'?'1':'2') + ' wins!');
    }

    var toggleTurn = function(player) {
      if(!this.playing) {
        return;
      }
      this.currentTurn = player === 'p1'?'p2':'p1';
      $h2.text('Player '+ (this.currentTurn==='p1'?'1':'2') + "'s" + ' turn');
    };

    var playToken = function(col) {
      var $col = $('body').find( '.column:eq('+col+')' )

      console.log('before playToken');
      logData();

      var tokensInCol = $col.children().length;

      if (tokensInCol > tokensPerCol || numTokens >= maxTokens) {
        return false;
      }

      var player = numTokens%2===0?'p1':'p2'

      moves.push({x: $col.index(), y: tokensInCol, player: player});

      //add to dom
      $col.append('<li class='+player+' style="bottom:'+colHeight+'px"></li>');
      $col.find('li').last().animate({bottom:tokenHeight*columns[$col.index()].length},1000);

      //add to array
      columns[$col.index()].push(player);
      numTokens++;

      console.log('after playToken');
      logData();
    };

    var getMoves = function() {
      return JSON.stringify(moves);
    };

    var reset = function() {

      $h2.text('Player 1'+"'s" + ' turn');
      this.playing = true,
      numTokens = 0,
      moves = [],
      columns = [
        [],
        [],
        [],
        [],
        [],
        [],
        []
      ];

      $('.game-area').find('li').remove();
    };

    var undo = function() {
      if(!this.playing) {
        return;
      }

      if(moves.length === 0) {
        return;
      }

      console.log('before undo');
      logData();

      $('.game-area').find('.column:nth-child('+(moves[moves.length-1].x+1)+')').find('li').last().remove();
      columns[moves[moves.length-1].x].splice(columns[moves[moves.length-1].x],1);
      moves.splice(moves.length-1,1);

      numTokens--;
      this.toggleTurn(this.currentTurn);

      console.log('after undo');
      logData();
    };

    return {
      playToken: playToken,
      undo: undo,
      getMoves: getMoves,
      reset: reset,
      winner: winner,
      winCheck: winCheck,
      currentTurn: currentTurn,
      playing: playing,
      playerId: playerId,
      toggleTurn: toggleTurn
    };
  })();

  $('.column').click(function() {
    if(!connect4.playing || connect4.currentTurn !== connect4.playerId){
      return;
    }
    var idx = $(this).index();
    console.log('column clicked: ' + idx);
    connect4.playToken(idx);
    socket.emit('message', {event: 'playToken', data: idx});

    if(connect4.winCheck(connect4.playerId)) {
      connect4.winner(connect4.playerId);
      socket.emit('message', {event: 'winner', data: connect4.playerId});
      return;
    }else {
      connect4.toggleTurn(connect4.playerId);

      socket.emit('message', {event: 'toggleTurn', data: connect4.playerId});
    }
  });

  $('.reset').click(function() {
    connect4.reset();
    socket.emit('message', {event: 'reset'});
  });

  $('.view-moves').click(function() {
    alert(connect4.getMoves());
  });

  $('.undo').click(function() {
    if(connect4.playerId !== connect4.currentTurn) {
      connect4.undo();
      socket.emit('message', {event: 'undo'});
    }
  });

  //events

  socket.on('message', function(msg) {
    if(msg.event === 'reset') {
      connect4.reset();
    }
    if(msg.event === 'playToken') {
      connect4.playToken(msg.data);
    }
    if(msg.event === 'undo') {
      connect4.undo();
    }
    if(msg.event === 'toggleTurn') {
      connect4.toggleTurn(msg.data);
    }
    if(msg.event === 'winner') {
      connect4.winner(msg.data);
    }
  });

  socket.on('joined', function() {
    connect4.playerId = 'p2';
  })
  socket.on('created', function() {
    connect4.playerId = 'p1';
  })
  socket.on('start', function() {
    connect4.playing = true;
  })
})(jQuery);
