import _ from 'lodash'

export default class Equalizer {
  private biquadFilterGroup: BiquadFilterNode[] = [];
  private len: number;
  private outputGainNode: GainNode;
  private inputGainNode: GainNode;
  public input: GainNode;
  public output: GainNode;
  public update:(frequencies: number[], gains: number[], quality: number)=>void;

  constructor(baseAudioContext: AudioContext,frequencies: number[],gains: number[],quality: number,type: BiquadFilterType = 'peaking') {
    this.update = _.debounce(this._update.bind(this), 100);
    this.biquadFilterGroup = [];
    this.len = frequencies.length;
    this.outputGainNode = baseAudioContext.createGain();
    this.inputGainNode = baseAudioContext.createGain();
    this.outputGainNode.gain.value = 1;
    this.inputGainNode.gain.value = 1;

    for (let i = 0; i < frequencies.length; i++) {
      const biquadFilter = baseAudioContext.createBiquadFilter();
      biquadFilter.frequency.value = frequencies[i];
      biquadFilter.gain.value = gains[i];
      biquadFilter.Q.value = quality;
      biquadFilter.type = type;
      this.biquadFilterGroup.push(biquadFilter);
    }

    for (let i = 0; i < this.len - 1; i++) {
      this.biquadFilterGroup[i].connect(this.biquadFilterGroup[i + 1]);
    }

    this.inputGainNode.connect(this.biquadFilterGroup[0]);
    this.biquadFilterGroup[this.len - 1].connect(this.outputGainNode);
    this.input = this.inputGainNode;
    this.output = this.outputGainNode;
  }

  public connect(node:AudioNode){
    this.output.connect(node)
  }

  public setInputGain(value: number = 1){
    this.inputGainNode.gain.value = value;
    return this
  }

  public setOutputGain(value: number = 1) {
    this.outputGainNode.gain.value = value;
    return this
  }

  public enable() {
    this.inputGainNode.disconnect();
    this.biquadFilterGroup[this.len - 1].disconnect();
    this.inputGainNode.connect(this.biquadFilterGroup[0]);
    this.biquadFilterGroup[this.len - 1].connect(this.outputGainNode);
    return this
  }

  public disable() {
    this.inputGainNode.disconnect();
    this.biquadFilterGroup[this.len - 1].disconnect();
    this.inputGainNode.connect(this.outputGainNode);
    return this
  }

  _update(frequencies: number[], gains: number[], quality: number): BiquadFilterNode[] {
    frequencies = frequencies.slice(0, this.biquadFilterGroup.length);
    gains = gains.slice(0, this.biquadFilterGroup.length);

    for (let i = 0; i < this.biquadFilterGroup.length; i++) {
      this.biquadFilterGroup[i].frequency.value = +frequencies[i];
      this.biquadFilterGroup[i].gain.value = +gains[i];
      this.biquadFilterGroup[i].Q.value = +quality;
    }

    return this.biquadFilterGroup;
  }
}