import {NavController, NavParams, Platform, Alert} from "ionic-angular";
import {Component, ApplicationRef, OnInit, OnDestroy} from "@angular/core";
import {BluetoothServiceWrapper} from "../../services/BluetoothServiceWrapper";
import {BluetoothDevice} from "../../models/BluetoothDevice";
import {IBluetoothStatusListener} from "../../models/IBluetoothStatusListener";
import {BluetoothStatus} from "../../models/BluetoothStatus";
import {TuningModuleService} from "../../services/TuningModuleService";
import {ITuningModuleStatusListener} from "../../models/ITuningModuleStatusListener";
import {TuningModuleStatus} from "../../models/TuningModuleStatus";
import {TuningModuleSettingsStorage} from "../../models/TuningModuleSettingsStorage";
import {SettingSpinnerComponent} from "../../components/SettingSpinnerComponent";
import {Debouncer} from "ionic-angular/util/Debouncer";
import {Clipboard, Transfer} from "ionic-native";
import {TimerWrapper} from "@angular/core/src/facade/async";

@Component({
  templateUrl: 'build/pages/basic/basic.html',
  directives: [SettingSpinnerComponent]
})

export class BasicPage implements OnInit, OnDestroy, IBluetoothStatusListener, ITuningModuleStatusListener {
  private nav: NavController;
  private navParams: NavParams;
  private platform: Platform;

  private device: BluetoothDevice;
  private serialData: string;
  private applicationRef: ApplicationRef;
  private bluetoothServiceWrapper: BluetoothServiceWrapper;
  private tuningModuleService: TuningModuleService;
  private tuningModuleStatus: TuningModuleStatus;
  private activeSettingsStorage: TuningModuleSettingsStorage;
  private pendingSettingsStorage: TuningModuleSettingsStorage;

  private connecting: boolean;
  private isConnected: boolean;
  private shouldApplyImmediately: boolean;
  private applyEnabled: boolean;
  private isApplyPending: boolean = false;
  private rawSettingsDisplayed: boolean = false;
  private rawModuleDisplayed: boolean = true;
  private advancedOptionsDisplayed: boolean = false;

  private applyDebouncer: Debouncer = new Debouncer(1000);

  constructor(navParams: NavParams, nav: NavController, applicationRef: ApplicationRef, bluetoothServiceWrapper: BluetoothServiceWrapper, tuningModuleService: TuningModuleService, platform: Platform) {
    this.nav = nav;
    this.navParams = navParams;
    this.platform = platform;

    this.device = this.navParams.get('device');
    this.applicationRef = applicationRef;
    this.bluetoothServiceWrapper = bluetoothServiceWrapper;
    this.tuningModuleService = tuningModuleService;
    this.tuningModuleService.addServiceStatusListener(this);

    this.tuningModuleStatus = this.tuningModuleService.getModuleStatus();

    // set the default settings until the real settings are loaded
    this.activeSettingsStorage = TuningModuleSettingsStorage.DEFAULT();
    this.pendingSettingsStorage = TuningModuleSettingsStorage.DEFAULT();

    // force update
    this.onBluetoothStatusChange(this.bluetoothServiceWrapper.getServiceStatus());
  }

  onData(payload) {
    console.debug(payload);
    this.serialData += '\n' + payload;
    // TODO: why does this get deleted?
    this.applicationRef && this.applicationRef.tick();
  }

  connect(device: BluetoothDevice) {
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

  onBluetoothStatusChange(bluetoothStatus: BluetoothStatus) {
    let oldConnected = this.isConnected;
    this.isConnected = bluetoothStatus.connected;
    this.connecting = bluetoothStatus.connecting;

    if (!oldConnected && this.isConnected) {
      console.log('!!!!!! just got connected');
      // if we were disconnected and just got connected load the settings
      this.loadSettingsSlot(-1);
    }
  }

  onTuningModuleStatusChange(tuningModuleStatus: TuningModuleStatus) {
    // FIXME
    this.tuningModuleStatus = tuningModuleStatus;
    // console.log(tuningModuleStatus.logBuffer);
  }

  onSettingsChanged() {
    // TODO: use angular2 change detectors
    this.applyEnabled = !(TuningModuleSettingsStorage.equals(this.pendingSettingsStorage, this.activeSettingsStorage));
    if (this.shouldApplyImmediately) {
      this.applySettings();
    }
  }

  _applySettingsNow() {
    this.isApplyPending = false;
    console.log(this.pendingSettingsStorage);
    if (this.applyEnabled) {
      this.tuningModuleService.writeCommand('s' + this.pendingSettingsStorage.toString());
      // set active settings to the new values
      // TODO: perhaps read directly from module with 'rc'
      this.activeSettingsStorage = this.pendingSettingsStorage.clone();
      this.applyEnabled = false;
    }
  }

  applySettings() {
    this.isApplyPending = true;
    this.applyDebouncer.debounce(() => this._applySettingsNow());
  }

  saveToClipboard() {
    Clipboard.copy(JSON.stringify(this.tuningModuleStatus)).then(() => this.showInfoText('The current settings and logs were saved to clipboard as a JSON.')).catch((err) => this.showInfoText(err.toString()));
  }

  loadSettingsSlot(slotId: number) {
    this.tuningModuleService.getSettingsStoragePromise(slotId).then(storage => {
      console.log('!!!! received storage', storage);
      this.activeSettingsStorage = storage.clone();
      this.pendingSettingsStorage = storage.clone();
    }).catch(e => console.error(e));
  }

  showInfoText(str: string) {
    let alert = Alert.create({title: 'Information', message: str, buttons: ['OK']});
    this.nav.present(alert);
  }

  saveSettingSlot(slotId: number) {
    this.tuningModuleService.writeCommand('S' + slotId);
  }

  loadSettingsNow(slotId: number) {
    // TODO: nicer
    this.tuningModuleService.writeCommand('L' + slotId);
    TimerWrapper.setTimeout(()=> {
      this.tuningModuleService.getSettingsStoragePromise(-1).then(storage => {
        this.activeSettingsStorage = storage.clone();
        this.pendingSettingsStorage = storage.clone();
      });
    }, 2000);
  }

  addToCurvePoint(i: number, delta: number) {
    this.pendingSettingsStorage.curve[i] += delta;
    this.onSettingsChanged();
  }

  saveLogToFile() {
    // TODO: implement see https://forum.ionicframework.com/t/ionic-2-native-file-api-what-is-the-base-folder-path/53896/2
    this.platform.ready().then(() => {
      const fileTransfer = new Transfer();
    });
  }

  toggleEnabled() {
    this.tuningModuleService.setEnabled(!this.tuningModuleStatus.enabled);
  }


  // this is just silly; https://github.com/angular/angular/issues/4402
  customTrackBy(index: number, obj: any): any {
    return index;
  }
}
