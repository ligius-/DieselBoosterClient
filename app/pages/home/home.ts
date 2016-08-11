import {TimerWrapper} from "@angular/core/src/facade/async";
import {Component, OnInit, OnDestroy} from "@angular/core";
import {NavController, Platform} from "ionic-angular";
import {DevicePage} from "../device/device";
import {BluetoothServiceWrapper} from "../../services/BluetoothServiceWrapper";
import {BluetoothDevice} from "../../models/BluetoothDevice";
import {BluetoothStatus} from "../../models/BluetoothStatus";
import {IBluetoothStatusListener} from "../../models/IBluetoothStatusListener";
import {TuningModuleService} from "../../services/TuningModuleService";
import {TabsPage} from "../tabs/tabs";

@Component({
  templateUrl: 'build/pages/home/home.html'
})
export class HomePage implements OnInit, OnDestroy, IBluetoothStatusListener {
  nav: NavController;
  devices: BluetoothDevice[];
  unpairedDevices: BluetoothDevice[];
  isScanning: boolean;
  isConnected: boolean;
  isEmulated: boolean;
  isConnecting: boolean;
  selectedDevice: BluetoothDevice;
  bluetoothServiceWrapper: BluetoothServiceWrapper;
  tuningModuleService: TuningModuleService;

  constructor(nav: NavController, platform: Platform, bluetoothServiceWrapper: BluetoothServiceWrapper, tuningModuleService: TuningModuleService) {
    platform.ready().then(() => {
      this.isEmulated = !platform.is('cordova');
    });

    console.log('home construct');
    this.nav = nav;
    this.devices = [];
    this.unpairedDevices = [];
    this.isScanning = false;
    this.isConnected = false;
    this.bluetoothServiceWrapper = bluetoothServiceWrapper;
    this.tuningModuleService = tuningModuleService;


    this.bluetoothServiceWrapper.getDeviceList().then(devices => {
      this.devices = devices;
    }).catch(error => console.error);

  }

  startScanning() {
    // redo the scan for paired devices just in case we have paired a new one
    this.bluetoothServiceWrapper.getDeviceList().then(devices => {
      this.devices = devices;

      // scan unpaired devices
      this.bluetoothServiceWrapper.discoverUnpaired().then(devices => {
        this.unpairedDevices = devices;
      }).catch(error => console.error(error));
    }).catch(error => console.error);
  }

  goToDeviceDetailPage(device) {
    console.log('Connect To Device');
    console.log(JSON.stringify(device));
    this.selectedDevice = device;
    this.nav.push(DevicePage, {
      device: device
    });
  }

  switchToTab(tab: string) {
    TabsPage.selectTab(tab);
  }

  connectDevice(device) {
    // TODO: handle reconnections
    if (!this.isConnected && (!this.isConnecting)) {
      this.bluetoothServiceWrapper.connect(device).subscribe(data => this.tuningModuleService.onData(data), console.error);
      this.tuningModuleService.setOutputFunction(this.bluetoothServiceWrapper.write.bind(this.bluetoothServiceWrapper));
    }
  }

  ngOnInit() {
    this.bluetoothServiceWrapper.addServiceStatusListener(this);
  }

  ngOnDestroy() {
    console.log('home destroyed');
    this.bluetoothServiceWrapper.removeServiceStatusListener(this);
  }

  onBluetoothStatusChange(bluetoothStatus: BluetoothStatus) {
    // if we just got connected switch to the settings page
    if (!this.isConnected && bluetoothStatus.connected) {
      TimerWrapper.setTimeout(() => this.switchToTab('basic'), 0);
    }

    this.isScanning = bluetoothStatus.scanning;
    this.isConnecting = bluetoothStatus.connecting;
    this.isConnected = bluetoothStatus.connected;

  }

}
