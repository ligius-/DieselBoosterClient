import {NavController, NavParams} from 'ionic-angular';
import {Component, ApplicationRef, OnInit, OnDestroy} from '@angular/core';
import {BluetoothServiceWrapper} from "../../services/BluetoothServiceWrapper";
import {BluetoothDevice} from "../../models/BluetoothDevice";
import {IBluetoothStatusListener} from "../../models/IBluetoothStatusListener";
import {BluetoothStatus} from "../../models/BluetoothStatus";
import {TuningModuleService} from "../../services/TuningModuleService";
import {ITuningModuleStatusListener} from "../../models/ITuningModuleStatusListener";
import {TuningModuleStatus} from "../../models/TuningModuleStatus";

@Component({
  templateUrl: 'build/pages/device/device.html'
})

export class DevicePage implements OnInit, OnDestroy, IBluetoothStatusListener, ITuningModuleStatusListener {
  nav:NavController;
  navParams:NavParams;
  device:BluetoothDevice;
  connecting:boolean;
  isConnected:boolean;
  rssi:number;
  // disconnectFn:any;
  serialData:string;
  private applicationRef:ApplicationRef;
  private bluetoothServiceWrapper:BluetoothServiceWrapper;
  tuningModuleService:TuningModuleService;
  tuningModuleStatus:TuningModuleStatus;

  constructor(navParams:NavParams, nav:NavController, applicationRef:ApplicationRef, bluetoothServiceWrapper:BluetoothServiceWrapper, tuningModuleService:TuningModuleService) {
    this.nav = nav;
    this.navParams = navParams;
    this.device = this.navParams.get('device');
    this.applicationRef = applicationRef;
    this.bluetoothServiceWrapper = bluetoothServiceWrapper;
    this.tuningModuleService = tuningModuleService;
    this.tuningModuleService.addServiceStatusListener(this);
  }

  onData(payload) {
    console.debug(payload);
    this.serialData += '\n' + payload;
    // TODO: why does this get deleted?
    this.applicationRef && this.applicationRef.tick();
  }

  connect(device:BluetoothDevice) {
    this.serialData = '';
    this.connecting = true;

    // FIXME: this should start all underlying services
    this.bluetoothServiceWrapper.connect(device).subscribe(data => this.onData(data), console.error);
  }

  disconnect() {
    this.bluetoothServiceWrapper.disconnect();
  }

  ngOnDestroy() {
    console.debug('device page destroyed');
    this.bluetoothServiceWrapper.removeServiceStatusListener(this);
    // this.disconnect();
  }

  ngOnInit() {
    console.debug('device page initialized');
    this.bluetoothServiceWrapper.addServiceStatusListener(this);
  }

  onBluetoothStatusChange(bluetoothStatus:BluetoothStatus) {
    this.isConnected = bluetoothStatus.connected;
    this.connecting = bluetoothStatus.connecting;
    this.rssi = bluetoothStatus.rssi;
  }

  onTuningModuleStatusChange(tuningModuleStatus:TuningModuleStatus) {
    this.tuningModuleStatus = tuningModuleStatus;
  }
}
