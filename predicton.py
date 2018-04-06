
import sys
from keras.models import Sequential
import pandas as pd
from keras.optimizers import Adam,SGD
from keras.layers import Input, Add,Dense, Conv2D, MaxPooling2D, AveragePooling2D, ZeroPadding2D, Dropout, Flatten, merge, Reshape, Activation
from keras.layers.normalization import BatchNormalization
from keras.models import load_model,Model
import h5py
from keras.initializers import glorot_uniform
from keras.applications.inception_resnet_v2 import InceptionResNetV2
import cv2
import numpy as np
from keras.callbacks import Callback

import os
os.environ['PF_CPP_MIN_LOG_LEVEL']='2'

def inceptionresv2(num_classes):
	my_model=InceptionResNetV2(include_top=True, weights=sys.argv[3], input_tensor=None, input_shape=None, pooling=None, classes=num_classes)
	return my_model


# Load our model
num_classes=int (sys.argv[4])

model =inceptionresv2(num_classes)


print(sys.argv[1])
#Prediction on a single test image
path=sys.argv[1]

im = cv2.imread(path)
b,g,r = cv2.split(im)
im = cv2.merge([r,g,b])
im = cv2.resize(im,(299,299))
im = np.asarray(im)
im = im.reshape((1,299,299,3))
im = im/255


predict = (np.asarray(model.predict(im)))
t=predict[0]
t = t.argmax()
d = {"age":[t]}
df=pd.DataFrame(data=d)
print(sys.argv[2])


df.to_csv(sys.argv[2],index=False)

