#%

import wave
import struct
import math

sampleRate = 44100.0 # hertz
duration = 4.0 # seconds
frequency = 120.0 # hertz
phase_delta = 1.0 / sampleRate * frequency * math.tau
phase = 0.0
feedback = 0.8
N = int(sampleRate * duration)
obj = wave.open('sound.wav','wb')
obj.setnchannels(1) # mono
obj.setsampwidth(2)
obj.setframerate(sampleRate)
output = 0
for i in range(N):
    phase += phase_delta
    ramp = (N - i) / N
    output = math.sin(phase + 10 * ramp * math.sin(phase) + ramp * feedback * output)
    obj.writeframesraw(struct.pack('<h', int(output * 32767.0)))
obj.close()

import pybook
data = open('sound.wav', 'rb').read()
pybook.output_content('audio/wav', data)