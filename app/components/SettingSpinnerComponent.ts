import {Component, Input, Output, EventEmitter} from "@angular/core";
import {TuningModuleSettingsStorage} from "../models/TuningModuleSettingsStorage";
// import {Toast} from 'ionic-native'; // toast does not work with ionic serve (in browser)
import {Alert, NavController} from 'ionic-angular';

@Component({
  selector: "setting-spinner-component",
  templateUrl: 'build/components/SettingSpinnerComponent.html',
})
export class SettingSpinnerComponent {
  @Input() title: string;
  @Input('property') propertyName: string;
  @Input('pendingsettings') pendingSettings: TuningModuleSettingsStorage;
  @Input('activesettings') activeSettings: TuningModuleSettingsStorage;
  @Input('suffixtext') suffixText: string;
  @Input('infotext') infoText: string;
  @Output() change = new EventEmitter<boolean>();
  // private toast: Toast;

  private nav:NavController;

  constructor(nav: NavController) {
    // this.toast = toast;
    this.nav = nav;
  }

  addValue(increment: number) {
    this.pendingSettings[this.propertyName] += increment;
    this.change.emit(true);
  }

  showInfoText() {
    if (this.infoText) {
      try {
        //Toast.show(this.infoText, "long", "bottom").subscribe(toast => console.log(toast));
        let alert = Alert.create({title: 'Information', message: this.infoText, buttons: ['OK']});
        this.nav.present(alert);
      } catch (e) {
        // probably running in browser, no cordova, avoid killing the app
        console.error(e);
      }
    }
  }
}
