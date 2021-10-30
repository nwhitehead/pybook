# PyBook

To test:

    python server/serve.py

Then go to http://localhost:8001/src/pybook.html

## Unit Testing

Unit testing requires Jest. Using ES6 modules, so you need a recent node (I have v14.18).

Do:

    npm install jest --global

To run tests in `src/` do:

    NODE_OPTIONS='--experimental-vm-modules' jest

## Demo

    import matplotlib
    matplotlib.use('svg')
    import numpy as np
    import matplotlib.pyplot as plt
    import pybook

    fig, ax = plt.subplots()
    fig.set_size_inches(6, 4)
    ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
    plt.savefig('test.svg')
    with open('test.svg') as f:
        pybook.output_text_content('image/svg+xml', f.read())
