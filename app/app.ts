import {Component} from '@angular/core';
import {Platform, ionicBootstrap} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import {TabsPage} from './pages/tabs/tabs';
import {BluetoothServiceWrapper} from "./services/BluetoothServiceWrapper";
import {TuningModuleService} from "./services/TuningModuleService";


@Component({
  template: '<ion-nav [root]="rootPage"></ion-nav>',
  providers: [BluetoothServiceWrapper]
})
export class MyApp {

  private rootPage:any;

  constructor(private platform:Platform, bluetoothServiceWrapper:BluetoothServiceWrapper, tuningModuleService:TuningModuleService) {
    this.rootPage = TabsPage;

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
    });
  }
}

ionicBootstrap(MyApp, [BluetoothServiceWrapper, TuningModuleService]);
