loadAPI(16);

const REMOTE_CONTROL_HI = 7;
const REMOTE_CONTROL_LO = 0;

const REMOTE_PAGE_PREVIOUS = 10;
const REMOTE_PAGE_NEXT = 11;
const REMOTE_REQUEST_UPDATE = 12;

host.setShouldFailOnDeprecatedUse(true);

host.defineController("Generic", "TouchOSC", "0.1", "b1c0c6dd-bbcf-4008-b84f-7faa3823dfdd", "decurus");

host.defineMidiPorts(1, 1);

function init() {
   println("initializing");
   transport = host.createTransport();
   host.getMidiInPort(0).setMidiCallback(onMidi0);


   cursorTrack = host.createCursorTrack(0,0);
   cursorDevice = cursorTrack.createCursorDevice();
   remoteControls = cursorDevice.createCursorRemoteControlsPage(8);


   userControls = host.createUserControls(REMOTE_CONTROL_HI - REMOTE_CONTROL_LO + 1);

   for(let i = REMOTE_CONTROL_LO; i <= REMOTE_CONTROL_HI; i++){
      userControls.getControl(i-REMOTE_CONTROL_LO).setLabel(`CC${i}`);
   }

   for(let index = 0; index < 8; index ++){
      remoteControls.getParameter(index).value().markInterested();
      remoteControls.getParameter(index).name().markInterested();
      remoteControls.pageNames().markInterested();
      remoteControls.selectedPageIndex().markInterested();
      println(remoteControls.getParameter(index).value().addValueObserver(128, function(value){
         onParameter(index, value);
      }.bind(index)));

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
      }else {
         if (data1 === REMOTE_PAGE_NEXT && data2 === 127) {
            remoteControls.selectNextPage(true);
         } else if (data1 === REMOTE_PAGE_PREVIOUS && data2 === 127) {
            remoteControls.selectPreviousPage(true);
         } else if((data1 === REMOTE_PAGE_NEXT || data1 === REMOTE_PAGE_PREVIOUS) && data2 === 0) {
            for (let i = 0; i<8; i++){
               sendParameterName(i + REMOTE_CONTROL_LO);
               let currentPageIndex = remoteControls.selectedPageIndex().get();
               let currentPageName = remoteControls.pageNames().get(currentPageIndex);
               //println(remoteControls.pageNames().get(remoteControls.selectedPageIndex().get()).get());
               host.getMidiOutPort(0).sendSysex(`f0${REMOTE_REQUEST_UPDATE}${getHex(currentPageName)}f7`);
            }
         }
      }
   }
}

function onParameter(parameter, value){
   println(`on Parameter: ${parameter} new value:  ${value}`);
   host.getMidiOutPort(0).sendMidi(176, REMOTE_CONTROL_LO + parameter, value);
   sendParameterName(parameter);
}

function sendParameterName(parameter){
   let parametername = remoteControls.getParameter(parameter).name().get();
   let parhex = getHex(parametername);
   if(parhex === "")return;
   let indhex = parameter.toString(16);
   if(indhex.length%2!==0)indhex='0'+indhex;
   let sysexmessage = `f0${indhex}${parhex}f7`;
   host.getMidiOutPort(0).sendSysex(sysexmessage);
   //host.getMidiOutPort(0).sendSysex('f0410134f7');
}

function getHex(inputString){
   if(inputString===null || inputString === "")return"";
   let output = '';
   for (let i = 0; i<inputString.length; i++){
      output += inputString.charCodeAt(i).toString(16);
   }
   return output;
}

function onKnob(index, value){
   remoteControls.getParameter(index).set(value, 128);
}


function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}