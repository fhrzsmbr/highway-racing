export const Sound={vol:.5,ctx:null,
 start(){if(this.ctx)return;const c=this.ctx=new AudioContext();this.o=c.createOscillator();this.o.type='sawtooth';this.g=c.createGain();this.g.gain.value=0;this.o.connect(this.g).connect(c.destination);this.o.start();},
 engine(v,on){if(!this.ctx)return;this.o.frequency.value=40+v*3;this.g.gain.value=on?this.vol*.08:0;},
 crash(){if(!this.ctx)return;const c=this.ctx,b=c.createBuffer(1,c.sampleRate*.3,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=c.createBufferSource(),g=c.createGain();g.gain.value=this.vol*.5;s.buffer=b;s.connect(g).connect(c.destination);s.start();}};
