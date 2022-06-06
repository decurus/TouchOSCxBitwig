# TouchOSCxBitwig
A little script that makes Bitwig communicate with TouchOSC and vis versa.
This is a hobby project, so it may or may not recieve updates

# Features
- All remote controls of the currently selected Bitwig device are automatically mapped to the TouchOSC knobs
- Names of all parameters are displayed
- Change remote pages via TouchOSC
- No extra software or hardware required

# Installation
- Install Bitwig ... duh... i mean...why else would you want that script.
- Install TouchOSC on the hardware device of your liking. I tested it on an iPad, works great
- Connect your hardware device such that it is recognized as a Midi device (see steps below)
- But the TouchOSC Layout onto your hardware device.
- Create a folder in your Controller Scripts folder (for Mac thats ~/Documents/Bitwig Studio/Controller Scripts) called TouchOSC
- Copy the script TouchOSC.control.js into that folder
- In Bitwig: open the control preferences and add a new controller (generic->TouchOSC)
- ???
- Profit
