import {Injectable, OnDestroy, ApplicationRef, OnChanges, Output, EventEmitter} from '@angular/core';
import {Platform} from 'ionic-angular';
import {Observable} from 'rxjs';
import {BluetoothSerial} from 'ionic-native';
import {TimerWrapper} from '@angular/core/src/facade/async';
import {BluetoothDevice} from "../models/BluetoothDevice";
import {BluetoothStatus} from "../models/BluetoothStatus";
import {IBluetoothStatusListener} from "../models/IBluetoothStatusListener";
import {ITuningModuleStatusListener} from "../models/ITuningModuleStatusListener";
import {TuningModuleStatus, LogBufferEntry} from "../models/TuningModuleStatus";
import {TuningModuleSettingsStorage} from "../models/TuningModuleSettingsStorage";

@Injectable()
export class TuningModuleService implements OnDestroy {
  private statusListeners: Set<ITuningModuleStatusListener>;
  private moduleStatus: TuningModuleStatus;
  private statusIntervalId: number;
  outputToSerialFn: any;
  applicationRef: ApplicationRef;
  //settingStoragePromise:Promise<TuningModuleSettingsStorage>;
  commandOutputEmitter: EventEmitter<any>;

  constructor(applicationRef: ApplicationRef, platform: Platform) {
    this.statusListeners = new Set<ITuningModuleStatusListener>();
    this.moduleStatus = TuningModuleStatus.DEFAULT();
    this.applicationRef = applicationRef;

    this.commandOutputEmitter = new EventEmitter<any>();

    // default (mock) output function
    this.outputToSerialFn = function (data) {
      return new Promise((resolve, reject) => {
        console.log('Mock BT OUT', data);
        // FIXME: why is this throwing "zone.js:461 Unhandled Promise rejection: Illegal invocation ; Zone: angular ; Task: Promise.then ; Value'?
      })
    };
    // FIXME: removeme FAKE only
    // {
    //   let dir = 1;
    //   this.statusIntervalId = TimerWrapper.setInterval(() => {
    //     this.moduleStatus.sensorValue += 5 * dir;
    //     if ((this.moduleStatus.sensorValue >= 750 && dir === 1) || (this.moduleStatus.sensorValue <= 200 && dir === -1)) {
    //       dir *= -1;
    //     }
    //     this.notifyStatusChange();
    //   }, 75);
    // }
  }

  /**
   * Called when bluetooth (raw) data is received
   */
  onData(data: string) {
    this.moduleStatus.pushLogData(new LogBufferEntry(new Date(), data, ''));
    this.parseData(data);
    //this.notifyStatusChange();
  }

  parseData(str) {
    str = str.trim(); //trim newline
    console.debug(str);

    if (str.startsWith('*')) {
      // status string: `*i1024 i2:978 o:950 p:-1 en:0`;

      str = str.replace('  ', ' '); // workaround for double spaces, to be removed

      let splits = str.split(' ');
      this.moduleStatus.sensorValue = parseInt(splits[0].split(':')[1]);
      this.moduleStatus.outputValue = parseInt(splits[1].split(':')[1]);
      this.moduleStatus.writtenValue = parseInt(splits[2].split(':')[1]);
      this.moduleStatus.activeCurvePoint = parseInt(splits[3].split(':')[1]);
      this.moduleStatus.enabled = splits[4].split(':')[1] == 1 ? true : false;
      // console.log(this.moduleStatus);
      this.notifyStatusChange();
      this.applicationRef.tick();

    } else if (str.startsWith('{')) {
      // settings string {sXdb2m200M750G94F128C100,100,100,100,100,100,100,100,100,100,100,100,100,100,100}
      str = str.substring(2, str.length - 1); // => Xdb2m200M750G94F128C100,100,100,100,100,100,100,100,100,100,100,100,100,100,100
      // this.lastReceivedStorage = TuningModuleSettingsStorage.fromString(str);
      console.log('!!! emitting storage');
      this.commandOutputEmitter.emit(TuningModuleSettingsStorage.fromString(str));
    } else if (str.startsWith('>')) {
      this.commandOutputEmitter.emit(str.substring(1));
    } else {
      this.commandOutputEmitter.emit(str);
    }
  }

  getModuleStatus() {
    return this.moduleStatus;
  }

  setOutputFunction(outputToSerialFn: any) {
    this.outputToSerialFn = outputToSerialFn;
  }

  writeCommand(str: string) {
    console.debug('Writing BT command:' + str);
    this.moduleStatus.pushLogData(new LogBufferEntry(new Date(), '', str));
    this.outputToSerialFn(str + '\n').then(() => console.log('BT written ok')).catch(e => console.error(e));//TODO
  }

  setEnabled(enabled: boolean) {
    if (this.moduleStatus.enabled !== enabled) {
      this.writeCommand(enabled ? 'e' : 'd');
    }
  }

  //
  // STATUS LISTENER METHODS
  //

  addServiceStatusListener(listener: ITuningModuleStatusListener) {
    this.statusListeners.add(listener);
  }

  removeServiceStatusListener(listener: ITuningModuleStatusListener) {
    this.statusListeners.delete(listener);
  }

  private notifyStatusChange() {
    // TODO: perhaps there is a way to watch on the variable
    // this.isConnectedObserver.next(this.bluetoothStatus);
    this.statusListeners.forEach(listener => listener.onTuningModuleStatusChange(this.moduleStatus));
  }


  //
  // SETTING STORAGE LISTENER METHODS
  //
  /**
   * Retrieve the setting from EEPROM with the given slot number (0-9). Defaults to -1 which means current settings
   */
  getSettingsStoragePromise(slotId: number = -1): Promise<TuningModuleSettingsStorage> {
    return new Promise((resolve, reject) => {
      if (slotId !== -1) {
        this.writeCommand('O' + slotId);
      } else {
        this.writeCommand('rc');
      }
      let subscription = this.commandOutputEmitter.subscribe((data) => {
        console.log('!!! received command emitter');
        if (data instanceof TuningModuleSettingsStorage) {
          console.log('!!! received command emitter storage');
          resolve(data);
          subscription.unsubscribe();
        } else {
          // reject(data);
        }
      }, (err) => reject);
    });
  }

  readAllSettings() {
    let promiseArray = [];
    for (let i = 0; i < 10; i++) {
      // TODO: there should be a delay
      promiseArray.push(this.getSettingsStoragePromise(i));
    }
    //Promise.all(promiseArray).then()
  }

  //
  // ANGULAR METHODS
  //
  ngOnDestroy() {
    TimerWrapper.clearInterval(this.statusIntervalId);
  }


}
