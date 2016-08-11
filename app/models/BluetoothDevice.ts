/**
 * Example devices:
 * {"name":"linvor","address":"00:12:11:07:17:37","id":"00:12:11:07:17:37","class":7936}- SPP
 * {"name":"OBDII","address":"AA:BB:CC:11:22:33","id":"AA:BB:CC:11:22:33","class":7936} - SPP
 * {"name":"YET-M1","address":"00:20:22:96:07:A3","id":"00:20:22:96:07:A3","class":1028} - BT media + call
 * {"name":"VEHO 360bt","address":"00:15:83:46:6F:01","id":"00:15:83:46:6F:01","class":1044} - BT media
 */
export class BluetoothDevice {

  constructor(public name:string,
              public address:string,
              public id:string,
              public classCode:number,
              public paired:boolean) {
  }
}
