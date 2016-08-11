export class BluetoothStatus {

  constructor(public connected:boolean,
              public connecting:boolean,
              public scanning:boolean,
              public rssi:number) {
  }
}
