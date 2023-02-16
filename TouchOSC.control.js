loadAPI(16);

const REMOTE_CONTROL_HI = 7;
const REMOTE_CONTROL_LO = 0;

const REMOTE_FADER_LO=20;
const REMOTE_FADER_HI = 26;

const REMOTE_MUTE_LO = 30;
const REMOTE_MUTE_HI = 36;

const REMOTE_PAGE_PREVIOUS = 10;
const REMOTE_PAGE_NEXT = 11;
const REMOTE_REQUEST_UPDATE = 12;
const REMOTE_DEVICE_NEXT = 13;
const REMOTE_DEVICE_PREVIOUS = 14;
const REMOTE_TRACK_NAME = 15;
const REMOTE_TRACK_NEXT = 16;
const REMOTE_TRACK_PREVIOUS = 17;

const REMOTE_FADER_NAME_START = 40;

host.setShouldFailOnDeprecatedUse(true);

host.defineController("Generic", "TouchOSC", "0.1", "b1c0c6dd-bbcf-4008-b84f-7faa3823dfdd", "decurus");

host.defineMidiPorts(1, 1);

function init() {
   println("initializing");
   transport = host.createTransport();
   host.getMidiInPort(0).setMidiCallback(onMidi0);


   //create cursor
   cursorTrack = host.createCursorTrack(0,0);
   cursorDevice = cursorTrack.createCursorDevice();
   remoteControls = cursorDevice.createCursorRemoteControlsPage(8);
   userControls = host.createUserControls(REMOTE_CONTROL_HI - REMOTE_CONTROL_LO);

   //create Trackabank
   trackBank = host.createTrackBank(REMOTE_FADER_HI - REMOTE_FADER_LO, 0,0);

   //mark interests
   remoteControls.pageNames().markInterested();
   remoteControls.selectedPageIndex().markInterested();
   remoteControls.selectedPageIndex().addValueObserver(sendDevicePageLabel);
   cursorTrack.name().markInterested();
   cursorTrack.name().addValueObserver(sendTrackLabel);
   cursorDevice.channel().name().markInterested();

   for(let i = REMOTE_FADER_LO; i< REMOTE_FADER_HI; i++){
      trackBank.getItemAt(i-REMOTE_FADER_LO).trackType().markInterested();
      trackBank.getItemAt(i-REMOTE_FADER_LO).name().markInterested();
   }

   for(let i = REMOTE_CONTROL_LO; i < REMOTE_CONTROL_HI; i++){
      userControls.getControl(i-REMOTE_CONTROL_LO).setLabel(`CC${i}`);
   }

   for(let index = 0; index < 8; index ++){
      remoteControls.getParameter(index).value().markInterested();
      remoteControls.getParameter(index).name().markInterested();
      remoteControls.getParameter(index).value().addValueObserver(128, function(value){
         onParameter(index, value);
         sendParameterLabels();
      }.bind(index));

   }

   for(let index = 0; index<(REMOTE_FADER_HI - REMOTE_FADER_LO); index++){
      trackBank.getItemAt(index).volume().value().markInterested();
      trackBank.getItemAt(index).volume().value().addValueObserver(128, function(value){
         onFader(index, value);
         sendFaderNames();
      }.bind(index));
      trackBank.getItemAt(index).name().markInterested();
      trackBank.getItemAt(index).name().addValueObserver(function(value){
         sendFaderNames();
      })
   }

   for(let index = 0; index<REMOTE_MUTE_HI - REMOTE_MUTE_LO; index++){
      trackBank.getItemAt(index).mute().markInterested();
      trackBank.getItemAt(index).mute().addValueObserver(function(value){
         onMute(index, value);
      }.bind(index));
   }



   println("initialization done");

   // TODO: Perform further initialization here.
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {

   //println(`status: ${status}, data1: ${data1}, data2: ${data2}`);
   if (isChannelController(status)){
      if(data1 >= REMOTE_CONTROL_LO && data1 <= REMOTE_CONTROL_HI){
         let index = data1 - REMOTE_CONTROL_LO;
         onKnob(index, data2);
      }else if(data1 >= REMOTE_FADER_LO && data1<= REMOTE_FADER_HI){
         let index = data1 - REMOTE_FADER_LO;
         onLevelFader(index, data2);
      }else if(data1 >= REMOTE_MUTE_LO && data1<= REMOTE_MUTE_HI){
         let index = data1 - REMOTE_MUTE_LO;
         onMuteButton(index, data2);
      }
      else{
         if (data1 === REMOTE_PAGE_NEXT && data2 === 127) {
            remoteControls.selectNextPage(true);
         } else if (data1 === REMOTE_PAGE_PREVIOUS && data2 === 127) {
            remoteControls.selectPreviousPage(true);
         }else if(data1===REMOTE_DEVICE_NEXT && data2 === 127){
            cursorDevice.selectNext();
         }else if(data1 === REMOTE_DEVICE_PREVIOUS && data2 === 127){
            cursorDevice.selectPrevious();
         }else if(data1 === REMOTE_TRACK_NEXT && data2 === 127){
            trackBank.scrollForwards();
         }else if(data1 === REMOTE_TRACK_PREVIOUS && data2 === 127){
            trackBank.scrollBackwards();
         } else if((data1 === REMOTE_PAGE_NEXT || data1 === REMOTE_PAGE_PREVIOUS || data1 === REMOTE_TRACK_PREVIOUS || data1 === REMOTE_TRACK_NEXT) && data2 === 0) {
         }
      }
   }
}

function sendParameterLabels(){
   for (let i = 0; i<8; i++){
      sendParameterName(i + REMOTE_CONTROL_LO);
   }
   //---send page name---
}

function sendDevicePageLabel(){
   try {
      let currentPageIndex = remoteControls.selectedPageIndex().get();
      let currentPageName = remoteControls.pageNames().get(currentPageIndex);
      sendCustomSysex(REMOTE_REQUEST_UPDATE, currentPageName);
   }catch(err){
      println(err);
   }
}

function sendTrackLabel(){
   try{
      let trackname = cursorDevice.channel().name().get();
      sendCustomSysex(REMOTE_TRACK_NAME, trackname);
   }catch(err){
      println(err);
   }
}

function onParameter(parameter, value){
   println(`on Parameter: ${parameter} new value:  ${value}`);
   host.getMidiOutPort(0).sendMidi(176, REMOTE_CONTROL_LO + parameter, value);
}

function onFader(index, value){
   host.getMidiOutPort(0).sendMidi(176, REMOTE_FADER_LO + index, value);
}

function onMute(index, value){
   host.getMidiOutPort(0).sendMidi(176, REMOTE_MUTE_LO + index, value===true?127:0);
}

function sendParameterName(parameter){
   let parametername = remoteControls.getParameter(parameter).name().get();
   let parhex = getHex(parametername);
   if(parhex === "")return;
   let indhex = parameter.toString(16);
   if(indhex.length%2!==0)indhex='0'+indhex;
   sendCustomSysex(indhex, parametername);
   //let sysexmessage = `f0${indhex}${parhex}f7`;
   //host.getMidiOutPort(0).sendSysex(sysexmessage);
   //host.getMidiOutPort(0).sendSysex('f0410134f7');
}

function sendFaderNames(){
   for(let i = 0; i<REMOTE_FADER_HI-REMOTE_FADER_LO; i++){
      let trackName = trackBank.getItemAt(i).name().get();
      let trackNameHex = getHex(trackName);
      if(trackNameHex === "")return;
      let faderIndex = i + REMOTE_FADER_NAME_START;
      let indhex = faderIndex.toString(16);
      if (indhex.length%2!==0)indhex='0'+indhex;
      sendCustomSysex(indhex, trackName);
   }
}

function getHex(inputString){
   if(inputString===null || inputString === "")return"";
   let output = '';
   for (let i = 0; i<inputString.length; i++){
      output += inputString.charCodeAt(i).toString(16);
   }
   return output;
}

function sendCustomSysex(channel, message){
   host.getMidiOutPort(0).sendSysex(`f0${channel}${getHex(message)}f7`);
}

function onKnob(index, value){
   remoteControls.getParameter(index).set(value, 128);
}

function onLevelFader(index, value){
   trackBank.getItemAt(index).volume().set(value, 128);
   //trackBank.getItemAt(index).volume.set(value, 128);
}

function onMuteButton(index, value){
   trackBank.getItemAt(index).mute().set(value === 127);
}

function isNotInstrument(index){
   let tType = trackBank.getItemAt(index).trackType().get();
   if (tType === 'Effect' || tType ==='Master')return true; // skip FX and Master
   return false;
}


function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}