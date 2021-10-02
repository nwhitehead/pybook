# PyBook

To test:

    python serve.py

Then go to http://localhost:8001/src/pybook.html

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
