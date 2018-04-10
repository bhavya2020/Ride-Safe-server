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
import itertools

import os
os.environ['PF_CPP_MIN_LOG_LEVEL']='2'


def sensor_model(path):
    model = load_model(path)
    return model

model = sensor_model(sys.argv[1])   #argv[1] ---path of model
df=pd.read_csv(sys.argv[2]) #argv[2] --- path of input csv file

records=[]
for time in df['time'].unique():
    new=[]
    time_list=[]
    try:
        new.append(list(df.loc[(df['time']==time) & (df['sensorType']=='accelerometer'),['x','y','z']].iloc[0]))
        new.append(list(df.loc[(df['time']==time) & (df['sensorType']=='linearAcceleration'),['x','y','z']].iloc[0]))
        new.append(list(df.loc[(df['time']==time) & (df['sensorType']=='gyroscope'),['x','y','z']].iloc[0]))
    except:
        continue
    time_list.append(time)
    new.append(time_list)
    records.append(new)

flat_list=[]
for item in records:
    flat_list.append(list(itertools.chain(*item)))

df_final = pd.DataFrame.from_records(flat_list,columns=['ax','ay','az','lx','ly','lz','gx','gy','gz','time'])

Y = df_final['time']
df_final.drop(['time'],axis=1,inplace=True)

preds = model.predict(df_final)

df_ret = pd.DataFrame()

df_ret['class']=np.argmax(preds,axis=1)
df_ret['time']=Y

df_ret.to_csv(sys.argv[3],index=False)