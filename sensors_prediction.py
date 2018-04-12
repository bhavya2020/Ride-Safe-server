
# coding: utf-8

# In[1]:


import sys
import pandas as pd
from keras.models import load_model,Model
import h5py
import numpy as np
import itertools

import os
os.environ['PF_CPP_MIN_LOG_LEVEL']='2'


# In[2]:


def sensor_model(path):
    model = load_model(path)
    return model


# In[6]:


model1 = sensor_model(sys.argv[1])   #argv[1] ---path of model
model2 = sensor_model(sys.argv[2])   #argv[2] ---path of model


# In[4]:


df=pd.read_csv(sys.argv[3]) #argv[2] --- path of input csv file


# In[6]:


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
    time_list.append(df.loc[(df['time']==time),'latitude'].iloc[0])
    time_list.append(df.loc[(df['time']==time),'longitude'].iloc[0])
    new.append(time_list)
    records.append(new)


# In[7]:


flat_list=[]
for item in records:
    flat_list.append(list(itertools.chain(*item)))


# In[8]:


df_final = pd.DataFrame.from_records(flat_list,columns=['ax','ay','az','lx','ly','lz','gx','gy','gz','time','latitude','longitude'])


# In[9]:


Y = df_final[['time','latitude','longitude']]
df_final.drop(['time','latitude','longitude'],axis=1,inplace=True)


# In[10]:


preds = model1.predict(df_final)


# In[11]:


preds = np.argmax(preds,axis=1)


# In[12]:


df_ret = pd.DataFrame(columns=['time','latitude','longitude'])
df_ret[['time','latitude','longitude']]=Y[preds==1]
df_ret['class']=4  #nonagg


# In[14]:


df_final = df_final[preds==0]
df_final.reset_index(drop=True,inplace=True)
Y = Y[preds==0]
Y.reset_index(drop=True,inplace=True)


# In[15]:


preds = model2.predict(df_final)
preds = np.argmax(preds,axis=1)


# In[16]:


df_ret2 = pd.DataFrame()


# In[17]:


df_ret2[['time','latitude','longitude']]=Y
df_ret2['class']=preds


# In[18]:


df_ret = pd.concat([df_ret,df_ret2])


# In[19]:


df_ret = pd.DataFrame.sort_values(df_ret,by='time')


# In[ ]:


df_ret.to_csv(sys.argv[4],index=False)

