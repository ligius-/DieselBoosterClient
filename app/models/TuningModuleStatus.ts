export class TuningModuleStatus {

  constructor(public sensorValue: number, // the ADC value from the car sensor
              public outputValue: number, // the ADC value after the module
              public writtenValue: number, // what actual number was written to the DAC/PWM, should be the same as above
              public activeCurvePoint: number, // onto which curve point we are activating now
              public enabled: boolean) // whether the module is enabled or not
  {
  }

  static DEFAULT(): TuningModuleStatus {
    return new TuningModuleStatus(-1, -1, -1, -1, false);
  }

  logBuffer: LogBufferEntry[] = [];

  pushLogData(logBufferEntry: LogBufferEntry) {
    this.logBuffer.push(logBufferEntry);

    // TODO: nicer handling of buffer/memory overflow and limits
    const MAX_BUFFER_SIZE: number = 5000;
    if (this.logBuffer.length > MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  clearLogData() {
    this.logBuffer = [];
  }
}

export class LogBufferEntry {
  constructor(public time: Date, public rx: string, public tx: string) {
  }
}
