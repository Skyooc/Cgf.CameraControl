import { JoyStickValue } from "./JoyStickValue";
import { IGamePad, IGamepadEvents } from "./IGamePad";
import { EventEmitter } from "events";
import StrictEventEmitter from "strict-event-emitter-types";

const Gamepad = require("node-gamepad");
const interpolate = require("everpolate").linear;

export class logitechF310 implements IGamePad {
  private pad: any;
  private readonly moveInterpolation: number[][] = [
    [0, 63, 31, 127, 128, 160, 172, 255],
    [255, 70, 20, 0, 0, -20, -70, -255],
  ];

  keypadEvents$: StrictEventEmitter<
    EventEmitter,
    IGamepadEvents
  > = new EventEmitter();

  constructor(padSerialNumber?: string) {
    if (!(padSerialNumber === undefined)) {
      throw new Error(
        "Unfortunately identification of controllers by serial number is not yet supported"
      );
    }
    this.pad = new Gamepad("logitech/gamepadf310");
    this.pad.connect();

    this.pad.on("left:move", (value: JoyStickValue) => {
      let pan = interpolate(
        value.x,
        this.moveInterpolation[0],
        this.moveInterpolation[1]
      )[0];
      this.keypadEvents$.emit("pan", Math.round(pan));
      let tilt = -interpolate(
        value.y,
        this.moveInterpolation[0],
        this.moveInterpolation[1]
      )[0];
      this.keypadEvents$.emit("tilt", Math.round(tilt));
    });

    this.pad.on("right:move", (value: JoyStickValue) => {
      this.keypadEvents$.emit("zoom", Math.round((-value.y + 127) / 16));
      this.keypadEvents$.emit("focus", Math.round((value.x - 127) / 200));
    });

    this.pad.on("dpadLeft:press", () => {
      this.keypadEvents$.emit("inputChange", -1);
    });

    this.pad.on("dpadUp:press", () => {
      this.keypadEvents$.emit("inputChange", -4);
    });

    this.pad.on("dpadRight:press", () => {
      this.keypadEvents$.emit("inputChange", 1);
    });

    this.pad.on("dpadDown:press", () => {
      this.keypadEvents$.emit("inputChange", 4);
    });

    this.pad.on("RB:press", () => {
      this.keypadEvents$.emit("cut");
    });

    this.pad.on("RT:press", () => {
      this.keypadEvents$.emit("auto");
    });

    this.pad.on("A:press", () => {
      this.keypadEvents$.emit("keyToggle", 0);
    });

    this.pad.on("B:press", () => {
      this.keypadEvents$.emit("keyToggle", 1);
    });
  }

  rumble(): void {
    // This Gamepad does not provide rumbling - hence left empty
  }
}
