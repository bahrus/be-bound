import numpy as np
x = np.array([ [1, 2], [3,4], [5,6], [-2,3]])
y = divmod(np.argmin(x), x.shape[1])
print(y)