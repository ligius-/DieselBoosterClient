import {Injectable, OnDestroy, OnChanges, Output} from '@angular/core';
import {Platform} from 'ionic-angular';
import {Observable} from 'rxjs/Observable';
import {BluetoothSerial} from 'ionic-native';
import {TimerWrapper} from '@angular/core/src/facade/async';
import {BluetoothDevice} from "../models/BluetoothDevice";
import {BluetoothStatus} from "../models/BluetoothStatus";
import {IBluetoothStatusListener} from "../models/IBluetoothStatusListener";

const RSSI_INTERVAL = 1000,
  RSSI_ENABLED = false; // not supported

@Injectable()
export class BluetoothServiceWrapper implements OnDestroy, OnChanges {
  private disconnectFn: any;
  private serialData: string;
  private isEmulated: boolean = true;
  // private isConnectedObservable:Observable<BluetoothStatus>;
  // private isConnectedObserver:any;
  private pairedDevices: BluetoothDevice[];
  private unpairedDevices: BluetoothDevice[];
  private statusListeners: Set<IBluetoothStatusListener>;

  private bluetoothMockObserver: Iterator<any>;

  @Output() bluetoothStatus: BluetoothStatus;
  public connectedDevice: BluetoothDevice;

  constructor(platform: Platform) {
    this.statusListeners = new Set<IBluetoothStatusListener>();
    console.debug('bt service wrapper constructor');

    platform.ready().then(() => {
      this.isEmulated = !platform.is('cordova');
    });

    this.bluetoothStatus = new BluetoothStatus(false, false, false, 0);

    // this.isConnectedObservable = Observable.create(observer => {
    //   this.isConnectedObserver = observer;
    //   this.notifyStatusChange();
    // });

  }

  connect(device: BluetoothDevice) {
    return Observable.create(observer => {
      let rssiIntervalId;

      if (RSSI_ENABLED) {
        rssiIntervalId = TimerWrapper.setInterval(() => {
          if (this.bluetoothStatus.connected) {
            this.readRSSI().then((rssi) => {
              this.bluetoothStatus.rssi = rssi;
              this.notifyStatusChange();
            })
          }
        }, RSSI_INTERVAL);
      }

      // this.characteristics = [];
      this.serialData = '';
      this.bluetoothStatus.connecting = true;
      this.notifyStatusChange();
      this.disconnect();
      if (!this.isEmulated) {
        console.debug('connecting real ' + device.id);

        var connectionSubscription = BluetoothSerial.connect(device.id).subscribe(status => {
            console.debug('connected ' + status);
            this.connectedDevice = device;

            this.bluetoothStatus.connecting = false;
            this.bluetoothStatus.connected = true;
            this.notifyStatusChange();

            BluetoothSerial.subscribe('\n').subscribe((payload) => {
              try {
                //onData(payload)
                observer.next(payload);
              } catch (e) {
                console.error(e);
              }
            });
          }
          , (error) => {
            this.bluetoothStatus.connecting = false;
            this.notifyStatusChange();
            console.debug('error connecting');
            //onError(error);
            observer.error(error);
          }
        );
        this.disconnectFn = function () {
          this.connectedDevice = undefined;
          this.bluetoothStatus.connected = false;
          this.notifyStatusChange();
          TimerWrapper.clearInterval(rssiIntervalId);
          connectionSubscription.unsubscribe();
        };

      } else {
        //
        // EMULATED
        //

        console.debug('connecting emulated ' + device.id);
        this.bluetoothMockObserver = observer;
        TimerWrapper.setTimeout(() => {
          this.connectedDevice = device;
          this.bluetoothStatus.connected = true;
          this.bluetoothStatus.connecting = false;
          this.notifyStatusChange();

          // push fake data
          let sensorValue = 200;
          let dir = 1;

          let intervalId = TimerWrapper.setInterval(() => {
            sensorValue += 15 * dir;
            if ((sensorValue >= 750 && dir === 1) || (sensorValue <= 200 && dir === -1)) {
              dir *= -1;
            }

            let fakeEnabled = Math.random() > 0.7 ? 1 : 0;

            let str = `*i:${sensorValue} i2:${sensorValue + 50 - Math.random() * 25} o:${sensorValue + 50 - Math.random() * 25} p:3  en:${fakeEnabled}`;
            try {
              observer.next(str);
            } catch (e) {
              console.error(e);
            }
          }, 1000);

          //onData(new Date().toString());

          this.disconnectFn = function () {
            this.connectedDevice = undefined;
            this.bluetoothStatus.connected = false;
            this.notifyStatusChange();
            TimerWrapper.clearInterval(rssiIntervalId);
            TimerWrapper.clearInterval(intervalId);
          }
        }, 1500);
      }
    });

  }

  public disconnect() {
    console.debug('disconnect request');
    if (this.disconnectFn) {
      this.disconnectFn();
    }
  }


  public getDeviceList(): Promise<BluetoothDevice[]> {
    return new Promise((resolve, reject) => {

      console.log('Listing paired devices');
      this.pairedDevices = [];
      this.bluetoothStatus.scanning = true;
      this.notifyStatusChange();
      if (!this.isEmulated) {
        BluetoothSerial.list().then(devices => {
          this.pairedDevices = devices.map(device => {
            //noinspection TypeScriptUnresolvedVariable
            return new BluetoothDevice(device.name, device.address, device.id, device.class, true)
          });
          this.bluetoothStatus.scanning = false;
          this.notifyStatusChange();
          console.log('Paired devices:' + JSON.stringify(devices));
          resolve(this.pairedDevices);
        }).catch(error => reject);
      } else {
        this.bluetoothStatus.scanning = false;
        this.notifyStatusChange();
        resolve([
          {name: 'mock1', id: 'mockid1', codeClass: 0, address: '', paired: true},
          {name: 'mock2', id: 'mockid2', codeClass: 0, address: '', paired: true},
          {name: 'mock3', id: 'mockid3', codeClass: 0, address: '', paired: true},
          {name: 'mock4', id: 'mockid4', codeClass: 0, address: '', paired: true}
        ]);
      }
    });
  }

  discoverUnpaired(): Promise<BluetoothDevice[]> {
    return new Promise((resolve, reject) => {
      // TODO: handle multiple entries/clicks while not finished
      console.log('Scanning started');
      this.bluetoothStatus.scanning = true;
      this.notifyStatusChange();
      if (!this.isEmulated) {
        BluetoothSerial.discoverUnpaired().then(devices => {
          console.log('Scanning stopped');
          this.unpairedDevices = devices.map(device => {
            //noinspection TypeScriptUnresolvedVariable
            return new BluetoothDevice(device.name, device.address, device.id, device.class, false);
          });
          console.log('Unpaired devices:' + JSON.stringify(devices));
          this.bluetoothStatus.scanning = false;
          this.notifyStatusChange();
          resolve(this.unpairedDevices);
        }).catch(error => reject);
      } else {
        TimerWrapper.setTimeout(() => {
          console.log('Scanning stopped');
          this.bluetoothStatus.scanning = false;
          this.notifyStatusChange();
          resolve([
            {name: 'unpairedmock1', id: 'unpairedmockid1', codeClass: 0, address: '', paired: false},
            {name: 'unpairedmock1', id: 'unpairedmockid2', codeClass: 0, address: '', paired: false}
          ]);
        }, 5000);
      }
    });
  }

  // getServiceStatus():Observable<BluetoothStatus> {
  //   return this.isConnectedObservable;
  // }

  addServiceStatusListener(listener: IBluetoothStatusListener) {
    this.statusListeners.add(listener);
  }

  removeServiceStatusListener(listener: IBluetoothStatusListener) {
    this.statusListeners.delete(listener);
  }

  getServiceStatus() {
    return this.bluetoothStatus;
  }

  readRSSI() {
    return new Promise<number>((resolve, reject) => {
      if (!this.isEmulated) {
        BluetoothSerial.readRSSI().then(resolve).catch(reject);
      } else {
        resolve(-Math.random() * 100);
      }
    });
  }

  write(data: any): Promise<any> {
    // TODO: why is isEmulated not defined here but works above?
    if (!this.isEmulated) {
      return BluetoothSerial.write(data);
    } else {
      return new Promise((resolve, reject) => {
        TimerWrapper.setTimeout(() => {
          resolve();
          if (data.startsWith('rc')) {
            this.bluetoothMockObserver.next('{sXdb2m200M750G94F170C107,107,105,99,90,85,85,85,85,85,90,93,95,97,99}');
          }else if (data.startsWith('O0')){
            this.bluetoothMockObserver.next('{sXdb2m200M750G100F128C100,100,100,100,100,100,85,85,85,85,90,93,95,97,99}');
          }
        }, 500);
      });
    }
  }

  ngOnDestroy() {
    console.debug('bt service wrapper destroyed');
    this.disconnect();
  }

  private notifyStatusChange() {
    // TODO: perhaps there is a way to watch on the variable
    // this.isConnectedObserver.next(this.bluetoothStatus);
    this.statusListeners.forEach(listener => listener.onBluetoothStatusChange(this.bluetoothStatus));
  }

  ngOnChanges() {
    console.debug('ngonchange');
    this.notifyStatusChange();
  }
}
