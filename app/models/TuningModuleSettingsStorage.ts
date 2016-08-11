// struct SettingsStorage {
//   char version[4];
//   uint16_t minRange, maxRange;
//   byte curve[CURVE_POINTS]; // 100 means 100%
//   byte globalGain; // applies to all values to correct output impedance; 100 means 100%
//   byte globalOffset; // applies to all values to correct output impedance; 0 means -128 (OFFSET_MIDPOINT), 255 means +127
// } settings {
//   CONFIG_VERSION,
//     VALUE_5V0, VALUE_5V0,
//   {100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100},
//     100,
//     OFFSET_MIDPOINT
// };
import set = Reflect.set;
export class TuningModuleSettingsStorage {
  static DEFAULT_VERSION: string = 'db2';

  constructor(public version: string,
              public minRange: number,
              public maxRange: number,
              public curve: number[],
              public globalGain: number,
              public globalOffset: number) {
  }

  static DEFAULT(): TuningModuleSettingsStorage {

    let version = TuningModuleSettingsStorage.DEFAULT_VERSION;
    let minRange = 1024;
    let maxRange = 1024;
    let curve = [];
    for (let i = 0; i < 15; i++) {
      curve.push(100);
    }
    let globalGain = 100;
    let globalOffset = 128;
    return new TuningModuleSettingsStorage(version, minRange, maxRange, curve, globalGain, globalOffset);
  }

  /**
   *
   * @param str - example Xdb2m200M750G94F128C100,100,100,100,100,100,100,100,100,100,100,100,100,100,100
   * @returns {TuningModuleSettingsStorage}
   */
  static fromString(str): TuningModuleSettingsStorage {
    const VERSION: string = TuningModuleSettingsStorage.DEFAULT_VERSION; // TODO: get the version string from somewhere

    str = str.substr(1); // trim 'X'

    if (str.substr(0, 3) === VERSION) {
      str = str.substr(3); // m200M750G94F128C100,100,100,100,100,100,100,100,100,100,100,100,100,100,100

      let posMin = str.indexOf('m');
      let posMax = str.indexOf('M');
      let posGain = str.indexOf('G');
      let posOffset = str.indexOf('F');
      let posCurve = str.indexOf('C');

      let minRange = parseInt(str.substring(posMin + 1, posMax));
      let maxRange = parseInt(str.substring(posMax + 1, posGain));
      let globalGain = parseInt(str.substring(posGain + 1, posOffset));
      let globalOffset = parseInt(str.substring(posOffset + 1, posCurve));
      let curvePointSplit = str.substring(posCurve + 1).split(',');
      let curvePoints = [];
      for (let i = 0; i < curvePointSplit.length; i++) { // TODO: use some map() stuff
        curvePoints.push(parseInt(curvePointSplit[i]));
      }

      return new TuningModuleSettingsStorage(VERSION, minRange, maxRange, curvePoints, globalGain, globalOffset);

    } else {
      console.error(`wrong configuration format/version, expecting ${VERSION} after sX`);
      return null;
    }
  }

  static toString(setting: TuningModuleSettingsStorage): string {
    let result: string = `X${setting.version}m${setting.minRange}M${setting.maxRange}G${setting.globalGain}F${setting.globalOffset}C`;
    result += setting.curve.join(',');
    return result;
  }

  toString(){
    return TuningModuleSettingsStorage.toString(this);
  }

  static equals(setting1: TuningModuleSettingsStorage, setting2:TuningModuleSettingsStorage){
    return JSON.stringify(setting1) === JSON.stringify(setting2);
  }

  public clone(): TuningModuleSettingsStorage {
    let clone = Object.assign(TuningModuleSettingsStorage.DEFAULT(), this);
    clone.curve = Object.assign([], this.curve);
    return clone;
  }
}
