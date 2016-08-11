import {Page, NavController,NavParams} from 'ionic-angular';
import {BLE} from 'ionic-native';

@Page({
  templateUrl: 'build/pages/device/device.html'
})

export class CharacteristicPage {

  static get parameters() {
    return [[NavParams],[NavController]];
  }

  constructor(navParams,nav) {
  }
}
