# DieselBoosterClient

This is the application acompanying the DieselBooster module, see the Arduino code and schematic at https://github.com/ligius-/DieselTuningBox

The application is written using the Ionic2 platform, so it's essentially a cross-platform web application written in Javascript (TypeScript). I have only tested the Android version.

There are some unused pages in the application that I haven't decided yet on how to implement - for example the the graphicap tuning page.

This is my first Ionic(2) app and have essentially used this project as an excuse to get started with the platform. This means you might see strange/wrong design patterns as is still a learning process.

There are also some strange workarounds in the code because Ionic2 is currently (Aug 2016) still in beta and some things are either not properly documented or not working. Same thing about Angular2 as well.

# Concept

The application connectes to the module using the Bluetooth Serial stack to send commands and receive results on status updates.

# Architecture

The application is split into several pages which handle the presentation part as well as some user input logic:
- home : shows the paired Bluetooth devices and allows to scan and pair new ones
- basic : allows adjusting of the most frequently used module values
- device : shows the raw status of the tuning module
- tuning : shows a graphical representation of the values and allows editing on the chart directly
- about : displays some basic help and FAQ

The BluetoothWrapperService class wraps the existing BluetoothSerial Cordova provider to make portability easier in the future in case I decide to switch to a different communication method or protocol. My goal was to switch to BT 4.0 because of reduced power consumption and improved communication patterns.
The wrapper service also mocks the Bluetooth connection with some hardcoded strings for testing in the browser.

TuningModuleService handles the tuning module commands and status updates, by talking to the BT wrapper above.

Any component in the can subscribe to some application-wide events by implementing these interfaces:
- ITuningModuleStatusListener: provides TuningModuleStatus updates
- IBluetoothStatusListener: provides BluetoothStatus updates
 
TuningModuleStatus, as the name suggests, will contain the current status of the tuning module - whether it's enabled or not, the input (ADC) and output (DAC) values as well as a log of the SPP communication.

BluetoothStatus provides the status of whether the module is a connected or connecting state or whether we are scanning. This information can be used to display spinners ("loading" icons) or make certain elements available or not.

# Building
I haven't tested this yet, but I assume the steps to get it working are the same as the one listed in the official Ionic2 getting started tutorial: http://ionicframework.com/docs/v2/getting-started/installation/
