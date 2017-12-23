var pins, states, dies=[], tries, moves
/**********************************************************
 * Player aus pindex ermitteln
 *********************************************************/
getPlayer=i=>Math.floor(i/4)
/**********************************************************
 * Ermittle die Position der Spielfigur auf dem Track
 *********************************************************/
function trackPosition(player, pos) {
  if (pos<1||pos>40) return -1
  else return (10*player+pos-1)%40
}
/**********************************************************
 * Ermittlung der Track-Positionen aller Spielfiguren
 *********************************************************/
function getTrackPositions() {
  return pins.map((e, i)=>trackPosition(getPlayer(i), e))
}
/*************************************************************
* mögliche Züge ermitteln
**************************************************************/
function getMoves(player) {
  let steps=dies[player]
  moves.fill(-1)
  beats.fill(-1)
  for (let pin=0; pin<4; pin++) {
    let to=newPosition(player, pin, steps)
    moves[pin]=to
    if (to!=-1&&to<=40)
      beats[pin]=getTrackPositions().indexOf(trackPosition(player, to))
  }
  /*************************************************************
  * Startfeld frei machen
  **************************************************************/
  if (moves.some(e=>e==1+steps)) {
    for (let pin=0; pin<4; pin++)
      if (pins[4*player+pin]!=1)
        moves[pin]=-1
    return
  }
  /*************************************************************
  * Rausziehen
  **************************************************************/
  if (moves.some(e=>e==1)) {
    for (let pin=0; pin<4; pin++)
      if (moves[pin]>0&&moves[pin]!=1)
        moves[pin]=-1
    return
  }
  /*************************************************************
  * Schlagen
  **************************************************************/
  if (beats.some(e=>e>-1)) {
    for (let pin=0; pin<4; pin++)
      if (moves[pin]>0&&beats[pin]==-1)
        moves[pin]=-1
    return
  }
}
/***********************************************************
* Neue Position ermitteln
***********************************************************/
function newPosition(player, pin, steps) {
  let from=pins[4*player+pin], to
  if (from==0 && steps!=6) return -1
  if (from==0 && steps==6) to=1
  else to=from+steps
  if (to<=40) {
    for (let i=0; i<4; i++)
      if (pins[4*player+i]==to) return -1
    return to
  }
  if (to>44) return -1
  if (to>40)
    for (let i=4*player; i<4*player+4; i++)
      if (pins[i]>40 && pins[i]>from && pins[i]<=to) return -1
  return to
}
/***********************************************************
* Stellt fest, ob der Spieler eine 6 würfeln muss
***********************************************************/
function needSix(player) {
  for (var pin=0; pin<4; pin++)
    if (newPosition(player, pin, 1)>-1) return false
  return true
}
/***********************************************************
* Startspieler auswürfeln
***********************************************************/
function score(player) {
  states[player]='wait'
  if (states.indexOf('score')==-1) {
    var max=dies.reduce((a, b)=>a>b?a:b),
        cnt=dies.reduce((a, b)=>b==max?a+1:a,0)
    if (cnt==1)
      startWith(dies.indexOf(max))
    else
      for (var i=0; i<4; i++)
        if (dies[i]==max) states[i]='score'
    dies.fill(0)
  }
}
/***********************************************************
* wenn der Spieler ziehen kann
***********************************************************/
function canMove(player) {
  var steps=dies[player]
  getMoves(player, dies[player])
  if (moves.some(e=>e>-1)) {
    states[player]='move'
    return true
  }
  return false;
}
/***********************************************************
* wenn der Spieler noch einen Versuchh hat
***********************************************************/
function nextTry(player) {
  tries--
  if (tries>0) {
    message(`Spieler ${player} muss noch einmal würfeln`)
    return true
  }
  else return false
}
/***********************************************************
* wenn der Spieler nicht ziehen kann
***********************************************************/
function cantMove(player) {
  message(`Spieler ${player} kann nicht ziehen`)
  nextPlayer(player)  
}
/***********************************************************
* Wenn ein Spieler würfelt
***********************************************************/
function rollDie(player) {
  let res=Math.floor(6*Math.random())+1
  switch (states[player]) {
    case 'score':
      dies[player]=res
      updateDie(player, res)
      score(player)
      break
    case 'roll':
      dies[player]=res
      updateDie(player, res)
      canMove(player)||nextTry(player)||cantMove(player)
      break
    default:
      message(`Spieler ${player} darf jetzt nicht würfeln`)
  }
  updateState()
}
/*************************************************************
* Spielfigur ziehen.
**************************************************************/
function movePin(player, pin) {
  if (states[player]=='end')
    message('Das Spiel ist beenet')
  else if (states[player]=='score')
    message('Erst den Startspieler auswürfeln')
  else if (states[player]=='move') {
    if (moves[pin]==-1)
      message('Spielfigur darf nicht gezogen werden')
    else {
      if (beats[pin]>-1) resetPin(getPlayer(beats[pin]), beats[pin]%4)
      setPin(player, pin, moves[pin])
      if (pins.slice(4*player, 4*player+1).every(e=>e>40))
        finish(player)
      else if (dies[player]!=6)
        nextPlayer(player)
      else
        rollAgain(player)
    }
  }
  else message(`Spieler ${player} ist nicht am Zug`)
  updateState()
}
/***********************************************************
* Spiel initialisieren
***********************************************************/
function init() {
  pins=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  dies=[1, 1, 1, 1]
  states=['score', 'score', 'score', 'score']
  for (let i=0; i<4; i++)
    updateDie(i, 1)
  for (let i=0; i<16; i++)
    updatePin(i)
  moves=[-1, -1, -1, -1]
  beats=[-1, -1, -1, -1]
  updateState()
}
/***********************************************************
* Startspieler festlegen
***********************************************************/
function startWith(player) {
  states.fill('wait')
  states[player]='roll'
  tries=3;
  message(`Spieler ${player} beginnt`)
}
/***********************************************************
* nächster Spieler
***********************************************************/
function nextPlayer(player) {
  states[player]='wait'
  var np=(player+1)%4
  if (needSix(np)) {
    tries=3
    message(`Spieler ${np} ist am Zug und hat 3 Versuche`)
  } else {
    tries=1
    message(`Spieler ${np} ist am Zug`)
  }
  states[np]='roll'
}
/*************************************************************
* noch einmal Würfeln
**************************************************************/
function rollAgain(player) {
  states[player]='roll'
  message(`Spieler ${player} noch einmal würfeln`)
}
/*************************************************************
* Spielfigur rauswerfen.
**************************************************************/
function resetPin(player, pin) {
  setPin(player, pin, 0)
}
/*************************************************************
* Spielfigur setzen.
**************************************************************/
function setPin(player, pin, pos) {
  pins[4*player+pin]=pos
  updatePin(4*player+pin)
}
/*************************************************************
* Spiel beenden
**************************************************************/
function finish(player) {
  states.fill('end')
  states[player]='winner'
  message(`Spieler ${player} hat gewonnen`)
}
/*************************************************************
* Nachricht ausgeben
**************************************************************/
function message(text) {
  console.log(text)
}
/***********************************************************
* Würfelergebnis anzeigen
***********************************************************/
function updateDie(player) {
  document.getElementById("w"+player).innerHTML=dies[player]
//  console.log(`Spieler ${player} würfelt eine ${score}`)
}
/***********************************************************
* Pinposition aktualisiere
***********************************************************/
function updatePin(p) {
  let player=getPlayer(p),
      pos=pins[p],
      pin=document.getElementById("p"+p)
  if (pos==0)
    document.getElementById("h"+p).appendChild(pin)
  else if (pos<=40)
    document.getElementById("f"+((pos+10*player-1)%40)).appendChild(pin)
  else
    document.getElementById("z"+(4*player+pos-41)).appendChild(pin)
}
/***********************************************************
* Stauts aktualisieren
***********************************************************/
function updateState() {
  for (let player=0; player<4; player++) {
    if (states[player]=='roll'||states[player]=='score') {
      document.getElementById('w'+player).classList.add('ok')
      for (let pin=0; pin<4; pin++) {
        document.getElementById('p'+(4*player+pin)).classList.remove('ok')
        document.getElementById('p'+(4*player+pin)).classList.remove('nok')
      } 
    }
    else if (states[player]=='move') {
      document.getElementById('w'+player).classList.remove('ok')
      for (let pin=0; pin<4; pin++) {
        document.getElementById('p'+(4*player+pin)).classList.add(moves[pin]>-1?'ok':'nok')
      } 
    }
    else {
      document.getElementById('w'+player).classList.remove('ok')
      for (let pin=0; pin<4; pin++) {
        document.getElementById('p'+(4*player+pin)).classList.remove('ok')
        document.getElementById('p'+(4*player+pin)).classList.remove('nok')
      } 
    }
  }
}
/***********************************************************
* durch das Spiel gehen
***********************************************************/
function next() {
  for (let i=0; i<4; i++) {
    if (states[i]=='score' || states[i]=='roll') {
      rollDie(i)
      return
    } 
    else if (states[i]=='move') {
      movePin(i, moves.findIndex(e=>e!=-1))
      return
    }
  }
}
