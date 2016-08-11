import {Component, OnInit, OnDestroy} from '@angular/core';
import {NavController} from 'ionic-angular';
import {BluetoothServiceWrapper} from "../../services/BluetoothServiceWrapper";
import {BluetoothStatus} from "../../models/BluetoothStatus";
import {IBluetoothStatusListener} from "../../models/IBluetoothStatusListener";
import {Platform} from 'ionic-angular';
import {ITuningModuleStatusListener} from "../../models/ITuningModuleStatusListener";
import {TuningModuleStatus} from "../../models/TuningModuleStatus";
import {TuningModuleService} from "../../services/TuningModuleService";

@Component({
  templateUrl: 'build/pages/tuning/tuning.html'
})

// const CURVE_POINTS = 15;
// const  MIN_ABS = 102;
// const MAX_ABS = 1024;

export class TuningPage implements OnInit, OnDestroy, IBluetoothStatusListener, ITuningModuleStatusListener {
  private tuningModuleService:TuningModuleService;
  bluetoothServiceWrapper:BluetoothServiceWrapper;
  platform:Platform;

  curve:number[];
  curveModels:any[];
  minRange:number;
  maxRange:number;
  barWidth:number;
  maxWidth:number;
  graphOptions:any;
  tuningModuleStatus:TuningModuleStatus;
  private adjustRange = 0.50; //0.5 = 50% would allow a range between 50% and 150%
  minAdjust:number = 100 * (1 - this.adjustRange);
  maxAdjust:number = 100 * (1 + this.adjustRange);
  liveEngineLineX:number;
  serialMockOutData:string;

  constructor(private navController:NavController, bluetoothServiceWrapper:BluetoothServiceWrapper, platform:Platform, tuningModuleService:TuningModuleService) {
    this.bluetoothServiceWrapper = bluetoothServiceWrapper;
    this.platform = platform;
    this.tuningModuleService = tuningModuleService;

    this.curve = [107, 107, 105, 99, 90, 85, 85, 85, 85, 85, 90, 93, 95, 97, 99];
    this.curveModels = this.curve.map(item => {
      return {value: item}
    });
    this.minRange = 200;
    this.maxRange = 750;
    this.graphOptions = {padding: 12};

    // TODO: use some specific resize events, when the documentation is updated
    {
      window.document.addEventListener('resize', () => {
        this.onResize();
      });
      this.onResize();
    }

    this.bluetoothServiceWrapper.addServiceStatusListener(this);
    this.tuningModuleService.addServiceStatusListener(this);
  }

  onResize() {
    this.graphOptions.maxWidth = this.platform.width();
    // leave some space to allow the user to scroll and do other stuff; TODO: figure out a way to do this better
    this.graphOptions.maxHeight = Math.min(this.platform.height(), this.platform.height());
    this.graphOptions.maxHeight = Math.min(150, this.graphOptions.maxHeight);
    this.graphOptions.barWidth = this.graphOptions.maxWidth / this.curve.length;
    // this.graphOptions.viewBoxStr =
    //   `${this.graphOptions.padding} ${this.graphOptions.padding}
    //   ${this.graphOptions.maxWidth - this.graphOptions.padding * 2} 150`;
    this.graphOptions.viewBoxStr = `0 0 ${this.graphOptions.maxWidth} ${this.graphOptions.maxHeight}`;
    this.graphOptions.midPoint = 50; // FIXME: this should be computer from maxWidth, minAdjust and maxAdjust
    console.log(this.barWidth);
  }

  private firstTouch:boolean = false;
  private lastElementId:string = '';
  private startX:number;
  private startY:number;

  dragStart(elementId, pointId) {
    console.debug('drag start' + elementId);
    //let selectedElement = evt.target;
    let selectedElement = document.getElementById(elementId);
    // let currentX = evt.clientX;
    // let currentY = evt.clientY;
    let currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7, -1).split(' ');

    // for (var i = 0; i < currentMatrix.length; i++) {
    //   currentMatrix[i] = parseFloat(currentMatrix[i]);
    // }

    // selectedElement.setAttributeNS(null, "onmousemove", "moveElement(evt)");

    // if (elementId !== this.lastElementId){
    //   this.firstTouch = true;
    //   this.lastElementId = elementId;
    // }

    // selectedElement.ontouchmove = function(dragMove){
    //   if(e.touches.length == 1){ // Only deal with one finger
    //     var touch = e.touches[0]; // Get the information for finger #1
    //     let node:any = touch.target; // Find the node the drag started from
    //     node.style.position = "absolute";
    //     node.style.left = touch.pageX + "px";
    //     node.style.top = touch.pageY + "px";
    //     console.debug(node.style);
    //   }
    // }
    let firstTouch = true;
    let startY = -1;
    let initialValue = this.curveModels[pointId].value;

    function setDelta(delta) {
      var newValue = Math.round(initialValue - delta / 2);
      newValue = Math.min(newValue, this.maxAdjust);
      newValue = Math.max(newValue, this.minAdjust);
      this.curveModels[pointId].value = newValue;
    }

    selectedElement.addEventListener('touchmove', event => {
      // console.log('move',event);
      event.preventDefault();
      if (firstTouch) {
        startY = event.touches[0].clientY;
        firstTouch = false;
      } else {
        var delta = event.touches[0].clientY - startY;
        setDelta.bind(this)(delta);
      }
    });

    selectedElement.addEventListener('mousemove', event => {
      // console.log('move',event);
      event.preventDefault();
      if (firstTouch) {
        startY = event.clientY;
        firstTouch = false;

      } else {
        var delta = event.clientY - startY;
        setDelta.bind(this)(delta);
      }
    });

    selectedElement.addEventListener('touchend', event => {
      firstTouch = true;
      console.log('end', event);
    });

    selectedElement.addEventListener('mouseup', event => {
      firstTouch = true;
      console.log('end', event);
    });
  }

  // dragMove(elementId){
  //   if (elementId !== this.lastElementId){
  //     this.firstTouch = true;
  //     this.startX =
  //     this.lastElementId = elementId;
  //   }
  // }


  ngOnInit() {
  }

  ngOnDestroy() {
    // TODO: remove listeners
  }

  onBluetoothStatusChange(bluetoothStatus:BluetoothStatus) {
  }

  setModuleEnabled(event) {
    this.tuningModuleService.setEnabled(event._checked);
  }

  sendSerialString(string) {
    this.tuningModuleService.onData(string + '\n');
  }

  readMockSetting(id) {
    this.tuningModuleService.getSettingsStoragePromise(id).then((data) => {
      console.log(data)
    }, (error) => {
      console.error(error)
    });
  }

  onTuningModuleStatusChange(tuningModuleStatus:TuningModuleStatus) {
    this.tuningModuleStatus = tuningModuleStatus;
    this.liveEngineLineX = this.graphOptions.maxWidth * (this.tuningModuleStatus.sensorValue - this.minRange) / (this.maxRange - this.minRange);

    // FIXME: this is dummy
    // let binSize = (this.maxRange - this.minRange) / this.curve.length;
    // this.tuningModuleStatus.activeCurvePoint =  Math.round((this.tuningModuleStatus.sensorValue - this.minRange - binSize /2) / binSize);
  }
}
