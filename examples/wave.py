#m> # Sound Generation Example
#m>
#m> Using some math formulas we can generate audio waveforms directly. It turns out with some experimentation it is possible
#m> to generate entire compositions in very few characters. This is called [Bytebeat](http://canonical.org/~kragen/bytebeat/).
#m>
#m> The basic idea is to literally write a formula that takes `t` as input and returns an integer value representing the
#m> audio sample value at that point in time. In classic bytebeat, `t` is an integer that increments from 0 at 8000 increments
#m> a second and the function returns a value that is interpreted as an unsigned 8-bit value for a monophonic audio sample.
#m>
#m> In Python we can generate WAV files using the `wave` standard library module. To hear the output, we can use `pybook`
#m> function `output_content` to get a player.
#m>

import io
import wave
import math

samplerate = 8000 # 8 kHz
duration = 10 # seconds
buffer = io.BytesIO()
obj = wave.open(buffer,'wb')
obj.setnchannels(1) # mono
obj.setsampwidth(1) # 8-bit
obj.setframerate(samplerate)
for t in range(samplerate * duration):
    # The song itself
    o = ((t<<1)^((t<<1)+(t>>7)&t>>12))|t>>(4-(1^7&(t>>19)))|t>>7
    # "Crowd" by
    obj.writeframesraw(bytearray([o & 0xff]))
obj.close()

import pybook
pybook.output_content('audio/wav', buffer.getvalue())

